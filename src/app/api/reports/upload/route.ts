export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createReport, createMetrics, reportDateExistsForProfile, getProfileById, updateProfile, upsertMetricMetadata } from '@/lib/db';
import { extractTextFromPDF } from '@/lib/pdf-extractor';
import { parsePDFReport } from '@/lib/claude';
import { normalizeMetricKey, getCategoryForKey } from '@/lib/metrics-config';
import type { HealthMetric } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const profileId = formData.get('profileId') as string | null;
    const overrideDate = formData.get('reportDate') as string | null; // YYYY-MM, from date prompt modal

    if (!file || !profileId) {
      return NextResponse.json({ error: 'file and profileId are required' }, { status: 400 });
    }

    const profile = await getProfileById(profileId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Extract PDF text
    const buffer = Buffer.from(await file.arrayBuffer());
    let pdfText: string;
    try {
      pdfText = await extractTextFromPDF(buffer);
    } catch {
      return NextResponse.json({ error: 'Failed to extract text from PDF. Ensure it is a valid PDF file.' }, { status: 422 });
    }

    // Parse with Claude
    let parsed;
    try {
      parsed = await parsePDFReport(pdfText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json({ error: msg }, { status: 503 });
      }
      return NextResponse.json({ error: `AI parsing failed: ${msg}` }, { status: 502 });
    }

    // Determine report date
    const reportDate = overrideDate ?? parsed.report_date;

    if (!reportDate) {
      // Return parsed data so the UI can ask the user for a date
      return NextResponse.json({ needs_date: true, parsed }, { status: 200 });
    }

    // Check for duplicate
    if (await reportDateExistsForProfile(profileId, reportDate)) {
      return NextResponse.json(
        { error: `A report for ${reportDate} already exists for this profile.` },
        { status: 409 }
      );
    }

    // Save report
    const reportId = uuidv4();
    await createReport({
      id: reportId,
      profile_id: profileId,
      report_date: reportDate,
      lab_name: parsed.lab_name ?? null,
      file_name: file.name,
    });

    // Save metrics
    const metrics: HealthMetric[] = parsed.metrics.map((m) => {
      // Normalize against display_name first (display_name is the literal lab text — always correct).
      // Only fall back to metric_key normalization when display_name normalization returns a bare slug
      // (i.e., nothing in our patterns matched it).
      const slugifyStr = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const keyFromDisplay = normalizeMetricKey(m.display_name);
      const keyFromMetricKey = normalizeMetricKey(m.metric_key);
      const key = keyFromDisplay !== slugifyStr(m.display_name) ? keyFromDisplay : keyFromMetricKey;
      return {
        id: uuidv4(),
        report_id: reportId,
        metric_key: key,
        display_name: m.display_name,
        value: m.value,
        unit: m.unit,
        ref_range_low: m.ref_range_low,
        ref_range_high: m.ref_range_high,
        ref_range_text: m.ref_range_text,
        status: m.status,
        category: m.category ?? getCategoryForKey(key),
        method: m.method,
        notes: m.notes,
        advice: m.advice ?? null,
      };
    });

    await createMetrics(metrics);

    // Upsert AI-generated metric descriptions (stable per metric key, first-write wins)
    const metadataEntries = parsed.metrics
      .filter(m => m.description)
      .map(m => ({
        metric_key: normalizeMetricKey(m.metric_key),
        description: m.description ?? null,
      }));
    if (metadataEntries.length > 0) {
      await upsertMetricMetadata(metadataEntries);
    }

    // Save DOB from report if profile doesn't have one yet
    if (parsed.date_of_birth && !profile.date_of_birth) {
      try {
        await updateProfile(profileId, { date_of_birth: parsed.date_of_birth });
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({
      success: true,
      reportId,
      reportDate,
      lab_name: parsed.lab_name,
      metricsCount: metrics.length,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
