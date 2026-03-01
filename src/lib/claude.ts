import Anthropic from '@anthropic-ai/sdk';
import type { ParsedReportData, HealthMetric, Profile } from '@/types';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Add it to .env.local to enable AI features.');
  }
  return new Anthropic({ apiKey });
}

// ─── PDF Parsing ───────────────────────────────────────────────────────────

export async function parsePDFReport(pdfText: string): Promise<ParsedReportData> {
  const client = getClient();

  const prompt = `You are a medical lab report parser. Extract all health metrics from the following lab report text and return them as structured JSON.

INSTRUCTIONS:
1. Extract every measurable lab value you find (blood tests, urine tests, hormones, vitamins, etc.)
2. For each metric, determine the canonical metric_key (snake_case, lowercase). Use standard names like: hba1c, fasting_glucose, alt_sgpt, ast_sgot, tsh, vitamin_d, vitamin_b12, hemoglobin, triglycerides, total_cholesterol, hdl_cholesterol, ldl_cholesterol, creatinine, etc.

   CRITICAL — HOMA IR Panel: These metrics share the word "insulin" but must be mapped to DISTINCT keys:
   - "Insulin, Serum, Fasting" / "Fasting Insulin" / "Insulin (Fasting)" → metric_key: "insulin_fasting"  (the actual serum insulin concentration, unit µU/mL or uU/mL)
   - "Insulin Sensitivity (%S)" / "Insulin Sensitivity" → metric_key: "insulin_sensitivity"  (percentage, unit %)
   - "Beta Cell Function (%B)" / "Beta Cell Function" → metric_key: "beta_cell_function"  (percentage, unit %)
   - "HOMA IR" / "HOMA IR Index" / "Insulin Resistance Index" → metric_key: "homa_ir_index"  (dimensionless index)
   Do NOT use "insulin_fasting" for sensitivity, beta-cell function, or HOMA IR index metrics.

   CRITICAL — Ratio vs Component metrics: Do NOT reuse the same metric_key for a ratio and the component it is derived from:
   - "Apolipoprotein B / Apolipoprotein A1 Ratio" → metric_key: "apo_b_a1_ratio"  (NOT "apo_b")
   - "De Ritis Ratio" / "AST/ALT Ratio" / "SGOT/SGPT Ratio" → metric_key: "ast_alt_ratio"  (NOT "alt_sgpt")
   - "Cholesterol / HDL Ratio" → metric_key: "cholesterol_hdl_ratio"  (NOT "hdl_cholesterol")
   - "LDL / HDL Ratio" → metric_key: "ldl_hdl_ratio"  (NOT "ldl_cholesterol")
   - "Estimated Average Glucose (eAG)" → metric_key: "estimated_avg_glucose"  (NOT "hba1c")

   CRITICAL — Cholesterol sub-fractions: These share "cholesterol" and partial letter overlap — use the EXACT key:
   - "VLDL Cholesterol" → metric_key: "vldl_cholesterol"  (NOT "ldl_cholesterol" — "vldl" contains "ldl" as a substring)
   - "LDL Cholesterol" / "LDL Cholesterol (Calculated)" → metric_key: "ldl_cholesterol"
   - "HDL Cholesterol" → metric_key: "hdl_cholesterol"
   - "Non-HDL Cholesterol" → metric_key: "non_hdl_cholesterol"

   CRITICAL — Albumin vs Microalbumin:
   - "Albumin" (serum protein, g/dL or g/L) → metric_key: "albumin"
   - "Microalbumin (Urine)" / "Urine Microalbumin" → metric_key: "urine_microalbumin"  (NOT "albumin")

   CRITICAL — eGFR / GFR: Always use metric_key: "egfr" for any Estimated Glomerular Filtration Rate metric, regardless of how the lab labels it ("GFR Estimated", "eGFR", "Glomerular Filtration Rate (eGFR)", etc.)

   CRITICAL — WBC / TLC: "Total Leukocyte Count (TLC)" and "Total Leucocyte Count (WBC)" → metric_key: "wbc"

   CRITICAL — CBC sub-metrics: Each CBC parameter is a DISTINCT metric with its own key. NEVER use the parent metric key for a derived sub-metric:
   - "Hemoglobin" (g/dL) → metric_key: "hemoglobin"
   - "Mean Corpuscular Hemoglobin (MCH)" / "MCH" (pg) → metric_key: "mch"  (NOT "hemoglobin" — MCH is a derived index, not the hemoglobin concentration)
   - "Mean Corpuscular Hemoglobin Concentration (MCHC)" (g/dL) → metric_key: "mchc"  (NOT "hemoglobin")
   - "Mean Corpuscular Volume (MCV)" (fL) → metric_key: "mcv"
   - "Red Cell Distribution Width (RDW-CV)" / "RDW" (%) → metric_key: "rdw"
   - "Red Cell Distribution Width - SD (RDW-SD)" (fL) → metric_key: "rdw_sd"  (NOT "rdw" — different unit and measurement)
   - "Red Cell Distribution Width Index (RDWI)" → metric_key: "rdwi"  (NOT "rdw")
   - "Platelet Distribution Width (PDW)" → metric_key: "pdw"  (NOT "platelet_count")
   - "Platelet to Large Cell Ratio (PLCR)" / "P-LCR" → metric_key: "plcr"  (NOT "platelet_count")
   - "Nucleated Red Blood Cells %" / "NRBC%" → metric_key: "nrbc_percent"  (NOT "rbc_count")
   - "Nucleated Red Blood Cells (Absolute)" / "NRBC" (count) → metric_key: "nrbc"  (NOT "rbc_count")
   - "Mean Platelet Volume (MPV)" → metric_key: "mpv"  (NOT "platelet_count")

   CRITICAL — Bilirubin fractions: Use the EXACT key for each fraction:
   - "Bilirubin (Direct)" / "Direct Bilirubin" → metric_key: "bilirubin_direct"
   - "Bilirubin (Indirect)" / "Indirect Bilirubin" → metric_key: "bilirubin_indirect"  (NOT "bilirubin_direct")
   - "Bilirubin (Total)" / "Total Bilirubin" → metric_key: "bilirubin_total"

   CRITICAL — Kidney function ratios: Do NOT use the base metric key for a derived ratio:
   - "BUN/Creatinine Ratio" / "BUN/Sr. Creatinine Ratio" → metric_key: "bun_creatinine_ratio"  (NOT "bun")
   - "Urea/Creatinine Ratio" / "Urea/Sr. Creatinine Ratio" → metric_key: "urea_creatinine_ratio"  (NOT "urea")

   CRITICAL — Protein ratios: Do NOT use the component key for a ratio:
   - "Albumin/Globulin Ratio" / "Serum ALB/Globulin Ratio" / "A/G Ratio" → metric_key: "ag_ratio"  (NOT "albumin" or "globulin")

   CRITICAL — Lipid ratios (extending the ratio rule above):
   - "Triglyceride/HDL Ratio" / "Trig/HDL Ratio" → metric_key: "trig_hdl_ratio"  (NOT "triglycerides")
   - "LDL/HDL Ratio" → metric_key: "ldl_hdl_ratio"  (NOT "ldl_cholesterol" or "hdl_cholesterol")
   - "HDL/LDL Ratio" → metric_key: "hdl_ldl_ratio"  (NOT "hdl_cholesterol" or "ldl_cholesterol")

   CRITICAL — Trace elements and miscellaneous: Each element/compound has its own key; NEVER reuse a clinical chemistry key:
   - "Cobalt" → metric_key: "cobalt"  (NOT "alt_sgpt" or any liver marker)
   - "Chromium" → metric_key: "chromium"
   - "Selenium" → metric_key: "selenium"
   - "Manganese" → metric_key: "manganese"

3. Determine status: 'high' if value > ref_range_high, 'low' if value < ref_range_low, 'normal' otherwise. Set to null if no reference range.
   CRITICAL: ref_range_low and ref_range_high must always be in the same units as the value field. If the lab report states the reference range in different units (e.g., value is in mg/dL but range is in g/L), convert the range to match the value's unit before outputting.
4. For report_date: extract year and month and return as YYYY-MM format. If you cannot determine the date, set report_date to null and needs_date to true.
5. Extract the lab/hospital name as lab_name.
6. Extract the patient name as patient_name.
7. Extract the patient's date of birth as date_of_birth in YYYY-MM-DD format. Set to null if not found in the report.
8. For category, use one of: diabetes, liver, kidney, lipid, thyroid, vitamins, blood, inflammation, hormones, urine, other

Return ONLY valid JSON with this exact structure:
{
  "lab_name": "string or null",
  "report_date": "YYYY-MM or null",
  "patient_name": "string or null",
  "date_of_birth": "YYYY-MM-DD or null",
  "needs_date": false,
  "metrics": [
    {
      "metric_key": "hba1c",
      "display_name": "HbA1c",
      "value": 5.7,
      "unit": "%",
      "ref_range_low": null,
      "ref_range_high": 5.6,
      "ref_range_text": "<5.7%",
      "status": "high",
      "category": "diabetes",
      "method": "HPLC or null",
      "notes": "any relevant notes or null"
    }
  ]
}

LAB REPORT TEXT:
${pdfText}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });

  if (message.stop_reason === 'max_tokens') {
    throw new Error('Claude response was truncated (max_tokens limit hit). The report may have too many metrics.');
  }

  const responseText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Extract JSON from the response (may be wrapped in markdown code blocks)
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    responseText.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response');
  }

  const parsed = JSON.parse(jsonMatch[1]) as ParsedReportData;
  return parsed;
}

// ─── Metric Annotations (descriptions + advice) ────────────────────────────

type MetricInput = {
  metric_key: string;
  display_name: string;
  value: number | null;
  unit: string | null;
  status: string | null;
};

type MetricAnnotation = {
  description: string | null;
  advice: string | null;
};

export async function generateMetricAnnotations(
  metrics: MetricInput[]
): Promise<Record<string, MetricAnnotation>> {
  const client = getClient();

  const metricsText = metrics
    .map((m) => `${m.metric_key} | ${m.display_name} | ${m.value ?? 'N/A'} ${m.unit ?? ''} | ${m.status ?? 'unknown'}`)
    .join('\n');

  const prompt = `You are a medical assistant writing plain-English explanations for lab results shown to patients.

For each metric below, provide:
- description: 1 sentence (≤15 words) explaining what this marker measures — for ALL metrics
- advice: 1-2 sentences of actionable, value-aware guidance — ONLY for "high" or "low" status; null for "normal" or "unknown"

Return ONLY a valid JSON array (no markdown, no code block):
[{"metric_key":"hba1c","description":"Measures average blood sugar over the past 2–3 months.","advice":"HbA1c of 5.7% is just above normal — early diet changes can reverse prediabetes."},...]

Metrics (key | display name | value | status):
${metricsText}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    responseText.match(/(\[[\s\S]*\])/);

  if (!jsonMatch) return {};

  const annotations = JSON.parse(jsonMatch[1]) as Array<{
    metric_key: string;
    description: string | null;
    advice: string | null;
  }>;

  return Object.fromEntries(
    annotations.map((a) => [a.metric_key, { description: a.description ?? null, advice: a.advice ?? null }])
  );
}

// ─── Health Summary ────────────────────────────────────────────────────────

export async function generateHealthSummary(
  metrics: HealthMetric[],
  profile: Profile
): Promise<string> {
  const client = getClient();

  // Build a focused summary of the most relevant metrics
  const abnormal = metrics.filter((m) => m.status === 'high' || m.status === 'low');
  const metricsText = metrics
    .slice(0, 40) // limit context size
    .map((m) => {
      const range = m.ref_range_text ?? (m.ref_range_low != null || m.ref_range_high != null
        ? `${m.ref_range_low ?? ''}-${m.ref_range_high ?? ''}`
        : 'N/A');
      return `${m.display_name}: ${m.value ?? 'N/A'} ${m.unit ?? ''} (ref: ${range}) [${m.status ?? 'unknown'}]`;
    })
    .join('\n');

  const age = profile.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  const prompt = `You are a health advisor providing a brief, plain-language summary of a person's lab results.

Person: ${profile.name}${age ? `, ${age} years old` : ''}${profile.blood_group ? `, Blood group: ${profile.blood_group}` : ''}
Abnormal results: ${abnormal.length}

Lab metrics:
${metricsText}

Write a 2-3 sentence health summary for a non-medical audience. Be direct about concerns without being alarmist. Focus on the most important findings. Do not use markdown or bullet points — write in plain prose.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}
