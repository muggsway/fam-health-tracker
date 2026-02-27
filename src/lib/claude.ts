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
3. Determine status: 'high' if value > ref_range_high, 'low' if value < ref_range_low, 'normal' otherwise. Set to null if no reference range.
   CRITICAL: ref_range_low and ref_range_high must always be in the same units as the value field. If the lab report states the reference range in different units (e.g., value is in mg/dL but range is in g/L), convert the range to match the value's unit before outputting.
4. For report_date: extract year and month and return as YYYY-MM format. If you cannot determine the date, set report_date to null and needs_date to true.
5. Extract the lab/hospital name as lab_name.
6. Extract the patient name as patient_name.
7. Extract the patient's date of birth as date_of_birth in YYYY-MM-DD format. Set to null if not found in the report.
8. For category, use one of: diabetes, liver, kidney, lipid, thyroid, vitamins, blood, inflammation, hormones, urine, other
9. For each metric, write two plain-English fields for a non-medical audience:
   - description: 1 sentence explaining what this marker measures
   - advice: If the value is outside the reference range, write 1-2 sentences of specific, value-aware interpretation — mention the actual value, how far it deviates, and what it implies clinically. Calibrate severity: a value slightly above range reads differently from one that is 3x the limit. Set to null if the value is within the normal range.

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
      "notes": "any relevant notes or null",
      "description": "Measures average blood sugar over the past 2–3 months.",
      "advice": "HbA1c of 5.7% is just above the normal upper limit of 5.6%, placing it in the prediabetic range — early lifestyle changes like diet and exercise can bring this back to normal."
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
