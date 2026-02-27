import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';
import type { Profile, HealthReport, HealthMetric, MetricWithHistory, MetricsByCategory } from '@/types';
import { getCategoryForKey } from './metrics-config';

// ─── Connection ────────────────────────────────────────────────────────────

let _sql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not configured.');
  _sql = neon(url);
  return _sql;
}

// ─── Schema ────────────────────────────────────────────────────────────────

async function migrateMetricKeys(): Promise<void> {
  const sql = getSql();

  // Fix metrics stored under wrong keys due to normalizeMetricKey ordering bug.
  // Use display_name as the ground truth since it was always correctly set by Claude.

  // 'hdl' or any non-standard key whose display_name is HDL (not non-HDL)
  await sql`
    UPDATE health_metrics
    SET metric_key = 'hdl_cholesterol', category = 'lipid'
    WHERE LOWER(TRIM(display_name)) = 'hdl cholesterol'
      AND metric_key <> 'hdl_cholesterol'
  `;

  // Any display_name containing non+hdl → non_hdl_cholesterol
  await sql`
    UPDATE health_metrics
    SET metric_key = 'non_hdl_cholesterol', category = 'lipid'
    WHERE LOWER(display_name) LIKE '%non%hdl%'
      AND metric_key <> 'non_hdl_cholesterol'
  `;

  // Remove duplicate (report_id, metric_key) rows — keep the one with the lowest id
  await sql`
    DELETE FROM health_metrics
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY report_id, metric_key ORDER BY id) AS rn
        FROM health_metrics
      ) t
      WHERE rn > 1
    )
  `;
}

async function initSchema(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      date_of_birth TEXT,
      blood_group   TEXT,
      height_cm     REAL,
      weight_kg     REAL,
      weight_updated_at TEXT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS health_reports (
      id          TEXT PRIMARY KEY,
      profile_id  TEXT NOT NULL,
      report_date TEXT NOT NULL,
      lab_name    TEXT,
      file_name   TEXT,
      uploaded_at TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS health_metrics (
      id              TEXT PRIMARY KEY,
      report_id       TEXT NOT NULL,
      metric_key      TEXT NOT NULL,
      display_name    TEXT NOT NULL,
      value           REAL,
      unit            TEXT,
      ref_range_low   REAL,
      ref_range_high  REAL,
      ref_range_text  TEXT,
      status          TEXT,
      category        TEXT,
      method          TEXT,
      notes           TEXT,
      advice          TEXT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS weight_history (
      id          TEXT PRIMARY KEY,
      profile_id  TEXT NOT NULL,
      weight_kg   REAL NOT NULL,
      recorded_at TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS metric_metadata (
      metric_key  TEXT PRIMARY KEY,
      description TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_reports_profile ON health_reports(profile_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_metrics_report ON health_metrics(report_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_metrics_key ON health_metrics(metric_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_weight_profile ON weight_history(profile_id)`;

  await migrateMetricKeys();
}

let _initPromise: Promise<void> | null = null;

export async function ensureDB(): Promise<void> {
  if (!_initPromise) _initPromise = initSchema();
  return _initPromise;
}

// ─── Profile queries ───────────────────────────────────────────────────────

export async function getAllProfiles(): Promise<Profile[]> {
  const sql = getSql();
  return await sql`SELECT * FROM profiles ORDER BY name` as Profile[];
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM profiles WHERE id = ${id}` as Profile[];
  return rows[0] ?? null;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string; name: string }): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO profiles (id, name, date_of_birth, blood_group, height_cm, weight_kg, weight_updated_at)
    VALUES (
      ${profile.id}, ${profile.name}, ${profile.date_of_birth ?? null},
      ${profile.blood_group ?? null}, ${profile.height_cm ?? null},
      ${profile.weight_kg ?? null}, ${profile.weight_updated_at ?? null}
    )
    ON CONFLICT(id) DO NOTHING
  `;
}

export async function updateProfile(
  id: string,
  updates: Partial<Omit<Profile, 'id'>>
): Promise<void> {
  const sql = getSql();
  const current = await getProfileById(id);
  if (!current) return;
  const p = { ...current, ...updates };
  await sql`
    UPDATE profiles SET
      name              = ${p.name},
      date_of_birth     = ${p.date_of_birth},
      blood_group       = ${p.blood_group},
      height_cm         = ${p.height_cm},
      weight_kg         = ${p.weight_kg},
      weight_updated_at = ${p.weight_updated_at}
    WHERE id = ${id}
  `;
}

// ─── Report queries ────────────────────────────────────────────────────────

export async function getReportsByProfile(profileId: string): Promise<HealthReport[]> {
  const sql = getSql();
  return await sql`
    SELECT * FROM health_reports WHERE profile_id = ${profileId} ORDER BY report_date DESC
  ` as HealthReport[];
}

export async function createReport(
  report: Omit<HealthReport, 'uploaded_at'> & { uploaded_at?: string }
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO health_reports (id, profile_id, report_date, lab_name, file_name, uploaded_at)
    VALUES (
      ${report.id}, ${report.profile_id}, ${report.report_date},
      ${report.lab_name ?? null}, ${report.file_name ?? null},
      ${report.uploaded_at ?? new Date().toISOString()}
    )
  `;
}

export async function deleteReport(reportId: string): Promise<void> {
  const sql = getSql();
  await sql.transaction([
    sql`DELETE FROM health_metrics WHERE report_id = ${reportId}`,
    sql`DELETE FROM health_reports WHERE id = ${reportId}`,
  ]);
}

// ─── Metric queries ────────────────────────────────────────────────────────

export async function createMetrics(metrics: HealthMetric[]): Promise<void> {
  const sql = getSql();
  if (metrics.length === 0) return;
  // Batch in chunks to stay within request limits
  const chunkSize = 50;
  for (let i = 0; i < metrics.length; i += chunkSize) {
    const chunk = metrics.slice(i, i + chunkSize);
    await sql.transaction(chunk.map(m => sql`
      INSERT INTO health_metrics
        (id, report_id, metric_key, display_name, value, unit,
         ref_range_low, ref_range_high, ref_range_text,
         status, category, method, notes, advice)
      VALUES (
        ${m.id}, ${m.report_id}, ${m.metric_key}, ${m.display_name},
        ${m.value}, ${m.unit}, ${m.ref_range_low}, ${m.ref_range_high},
        ${m.ref_range_text}, ${m.status}, ${m.category},
        ${m.method}, ${m.notes}, ${m.advice}
      )
    `));
  }
}

export async function getMetricsByProfile(profileId: string): Promise<MetricsByCategory> {
  const sql = getSql();

  const rows = await sql`
    SELECT
      m.metric_key,
      m.display_name,
      m.category,
      m.value,
      m.unit,
      m.ref_range_low,
      m.ref_range_high,
      m.ref_range_text,
      m.status,
      m.method,
      m.notes,
      m.advice,
      r.id       AS report_id,
      r.report_date,
      r.lab_name
    FROM health_metrics m
    JOIN health_reports r ON m.report_id = r.id
    WHERE r.profile_id = ${profileId}
    ORDER BY m.metric_key, r.report_date ASC
  ` as Array<{
    metric_key: string;
    display_name: string;
    category: string | null;
    value: number | null;
    unit: string | null;
    ref_range_low: number | null;
    ref_range_high: number | null;
    ref_range_text: string | null;
    status: 'normal' | 'high' | 'low' | null;
    method: string | null;
    notes: string | null;
    advice: string | null;
    report_id: string;
    report_date: string;
    lab_name: string | null;
  }>;

  // Group by metric_key
  const byKey = new Map<string, MetricWithHistory>();

  for (const row of rows) {
    if (!byKey.has(row.metric_key)) {
      byKey.set(row.metric_key, {
        metric_key: row.metric_key,
        display_name: row.display_name,
        category: row.category ?? getCategoryForKey(row.metric_key),
        unit: null,
        dataPoints: [],
        latest: null,
        previous: null,
        methodChanged: false,
      });
    }
    const entry = byKey.get(row.metric_key)!;
    entry.dataPoints.push({
      report_date: row.report_date,
      report_id: row.report_id,
      lab_name: row.lab_name,
      value: row.value,
      unit: row.unit,
      ref_range_low: row.ref_range_low,
      ref_range_high: row.ref_range_high,
      ref_range_text: row.ref_range_text,
      status: row.status,
      method: row.method,
      advice: row.advice,
    });
  }

  // Compute latest, previous, methodChanged, unit
  for (const [, entry] of byKey) {
    const pts = entry.dataPoints;
    if (pts.length > 0) {
      entry.latest = pts[pts.length - 1];
      entry.unit = entry.latest.unit;
    }
    if (pts.length > 1) {
      entry.previous = pts[pts.length - 2];
      const distinctMethods = new Set(
        pts.map(p => p.method?.trim().toLowerCase()).filter(Boolean)
      );
      if (distinctMethods.size > 1) entry.methodChanged = true;
    }
  }

  // Group by category
  const result: MetricsByCategory = {};
  for (const [, entry] of byKey) {
    const cat = entry.category ?? 'other';
    if (!result[cat]) result[cat] = [];
    result[cat].push(entry);
  }
  for (const cat of Object.keys(result)) {
    result[cat].sort((a, b) => a.display_name.localeCompare(b.display_name));
  }
  return result;
}

export async function reportDateExistsForProfile(
  profileId: string,
  reportDate: string
): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    SELECT id FROM health_reports WHERE profile_id = ${profileId} AND report_date = ${reportDate}
  ` as { id: string }[];
  return rows.length > 0;
}

export async function getLatestMetricsForProfile(profileId: string): Promise<HealthMetric[]> {
  const sql = getSql();
  const reports = await sql`
    SELECT id FROM health_reports WHERE profile_id = ${profileId}
    ORDER BY report_date DESC LIMIT 1
  ` as { id: string }[];
  if (reports.length === 0) return [];
  return await sql`
    SELECT * FROM health_metrics WHERE report_id = ${reports[0].id}
  ` as HealthMetric[];
}

// ─── Weight history ────────────────────────────────────────────────────────

export async function addWeightEntry(
  profileId: string,
  weightKg: number,
  recordedAt?: string
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO weight_history (id, profile_id, weight_kg, recorded_at)
    VALUES (${uuidv4()}, ${profileId}, ${weightKg}, ${recordedAt ?? new Date().toISOString()})
  `;
}

export async function getWeightHistory(
  profileId: string
): Promise<Array<{ id: string; profile_id: string; weight_kg: number; recorded_at: string }>> {
  const sql = getSql();
  return await sql`
    SELECT * FROM weight_history WHERE profile_id = ${profileId} ORDER BY recorded_at ASC
  ` as Array<{ id: string; profile_id: string; weight_kg: number; recorded_at: string }>;
}

// ─── Metric metadata ───────────────────────────────────────────────────────

export interface MetricMetadataRow {
  metric_key: string;
  description: string | null;
}

export async function upsertMetricMetadata(entries: MetricMetadataRow[]): Promise<void> {
  const sql = getSql();
  if (entries.length === 0) return;
  await sql.transaction(entries.map(e => sql`
    INSERT INTO metric_metadata (metric_key, description)
    VALUES (${e.metric_key}, ${e.description})
    ON CONFLICT(metric_key) DO NOTHING
  `));
}

export async function getAllMetricMetadata(): Promise<Record<string, MetricMetadataRow>> {
  const sql = getSql();
  const rows = await sql`
    SELECT metric_key, description FROM metric_metadata
  ` as MetricMetadataRow[];
  const result: Record<string, MetricMetadataRow> = {};
  for (const row of rows) result[row.metric_key] = row;
  return result;
}
