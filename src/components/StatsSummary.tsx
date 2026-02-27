import type { MetricsByCategory, MetricWithHistory, MetricDataPoint } from '@/types';

interface StatsSummaryProps {
  metricsByCategory: MetricsByCategory;
  lastReportDate: string | null;
  profileId: string;
}

function formatReportDate(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function latestRefRange(dataPoints: MetricDataPoint[]): { refLow: number | null; refHigh: number | null } {
  const refDp = [...dataPoints].reverse().find(
    dp => dp.ref_range_low != null || dp.ref_range_high != null
  );
  return { refLow: refDp?.ref_range_low ?? null, refHigh: refDp?.ref_range_high ?? null };
}

function getStatus(m: MetricWithHistory): 'high' | 'low' | 'normal' | null {
  const v = m.latest?.value ?? null;
  if (v == null) return null;
  const { refLow, refHigh } = latestRefRange(m.dataPoints);
  if (refHigh != null && v > refHigh) return 'high';
  if (refLow != null && v < refLow) return 'low';
  if (refLow != null || refHigh != null) return 'normal';
  return null;
}

// ── Clinical groups ──────────────────────────────────────────────────────────

type ClinicalGroup = {
  keys: string[];
  priority: number; // lower = shown first
  narrative: (high: string[], low: string[]) => string | null;
};

const CLINICAL_GROUPS: ClinicalGroup[] = [
  {
    priority: 1,
    keys: ['hba1c', 'fasting_glucose', 'insulin_fasting', 'homa_ir'],
    narrative(high) {
      if (!high.length) return null;
      if (high.some(n => /hba1c/i.test(n))) {
        return `Blood sugar control deserves attention — HbA1c is in the prediabetic range, indicating elevated long-term glucose levels.`;
      }
      return `Blood sugar markers are elevated, indicating metabolic risk worth following up on.`;
    },
  },
  {
    priority: 2,
    keys: ['ldl_cholesterol', 'hdl_cholesterol', 'triglycerides', 'apo_b',
           'total_cholesterol', 'homocysteine', 'lipoprotein_a', 'non_hdl_cholesterol'],
    narrative(high, low) {
      if (!high.length && !low.length) return null;
      const elevated = high.join(', ');
      const depressed = low.join(', ');
      if (high.length && low.length) {
        return `Cardiovascular risk markers are a concern — ${elevated} ${high.length === 1 ? 'is' : 'are'} elevated while ${depressed} ${low.length === 1 ? 'remains' : 'remain'} low, indicating an unfavourable lipid profile.`;
      }
      if (high.length) {
        return `${elevated} ${high.length === 1 ? 'is' : 'are'} above the normal range, flagging cardiovascular risk.`;
      }
      return `HDL (good) cholesterol is below optimal — a cardiovascular risk factor worth addressing.`;
    },
  },
  {
    priority: 3,
    keys: ['alt_sgpt', 'ast_sgot', 'ggt', 'bilirubin_total', 'bilirubin_direct',
           'alkaline_phosphatase', 'albumin'],
    narrative(high) {
      if (!high.length) return null;
      return `Liver enzymes (${high.join(', ')}) are elevated — this warrants follow-up to rule out liver stress or inflammation.`;
    },
  },
  {
    priority: 4,
    keys: ['hemoglobin', 'mcv', 'mch', 'mchc', 'ferritin',
           'transferrin_saturation', 'tibc', 'serum_iron'],
    narrative(high, low) {
      if (!low.length && !high.length) return null;
      if (low.length >= 2) {
        return `The blood count pattern — low ${low.slice(0, 3).join(', ')}${low.length > 3 ? ' and more' : ''} — is consistent with iron-deficiency anaemia and should be addressed.`;
      }
      if (low.length === 1) {
        return `${low[0]} is below normal, which may reflect early or developing anaemia.`;
      }
      return null;
    },
  },
  {
    priority: 5,
    keys: ['hscrp', 'esr'],
    narrative(high) {
      if (!high.length) return null;
      return `Inflammatory markers (${high.join(', ')}) are above optimal, suggesting low-grade systemic inflammation.`;
    },
  },
  {
    priority: 6,
    keys: ['tsh', 't3_total', 't4_total', 'ft3', 'ft4'],
    narrative(high, low) {
      const all = [...high, ...low];
      if (!all.length) return null;
      return `Thyroid markers (${all.join(', ')}) are outside the normal range and should be reviewed.`;
    },
  },
  {
    priority: 7,
    keys: ['creatinine', 'urea', 'egfr', 'uric_acid', 'blood_urea_nitrogen'],
    narrative(high) {
      if (!high.length) return null;
      return `Kidney markers (${high.join(', ')}) are elevated — hydration and kidney function should be reviewed.`;
    },
  },
  {
    priority: 8,
    keys: ['vitamin_d', 'vitamin_b12', 'folate', 'magnesium', 'calcium', 'phosphorus'],
    narrative(high, low) {
      if (!low.length) return null;
      return `Nutritional levels need attention: ${low.join(', ')} ${low.length === 1 ? 'is' : 'are'} below optimal.`;
    },
  },
];

// Categories we proactively call out as reassuring if all clear
const POSITIVE_GROUPS = [
  { label: 'blood sugar',     keys: ['hba1c', 'fasting_glucose'] },
  { label: 'liver function',  keys: ['alt_sgpt', 'ast_sgot'] },
  { label: 'thyroid',         keys: ['tsh'] },
  { label: 'kidney function', keys: ['creatinine', 'urea'] },
];

function buildSummary(metricsByCategory: MetricsByCategory): string {
  const allMetrics = Object.values(metricsByCategory).flat();
  if (allMetrics.length === 0) return '';

  // Build lookup: key → { displayName, status }
  const info = new Map<string, { display: string; status: 'high' | 'low' | 'normal' | null }>();
  for (const m of allMetrics) {
    info.set(m.metric_key, { display: m.display_name, status: getStatus(m) });
  }

  function namesOf(keys: string[], status: 'high' | 'low') {
    return keys.flatMap(k => {
      const e = info.get(k);
      return e?.status === status ? [e.display] : [];
    });
  }

  // Identify all-clear positive groups to mention
  const positives = POSITIVE_GROUPS
    .filter(g => {
      const present = g.keys.filter(k => info.has(k));
      return present.length > 0 && present.every(k => info.get(k)?.status === 'normal');
    })
    .map(g => g.label);

  // Collect concern narratives, sorted by priority
  const concerns: string[] = CLINICAL_GROUPS
    .sort((a, b) => a.priority - b.priority)
    .map(g => g.narrative(namesOf(g.keys, 'high'), namesOf(g.keys, 'low')))
    .filter((s): s is string => !!s);

  if (concerns.length === 0) {
    return `All key markers are within the normal range — a reassuring overall health picture.`;
  }

  const sentences: string[] = [];

  // Opening: what's all clear
  if (positives.length >= 2) {
    const listed = positives.slice(0, 3);
    const last = listed.pop()!;
    sentences.push(
      `Overall, ${listed.length ? listed.join(', ') + ' and ' : ''}${last} are within the normal range, which is reassuring.`
    );
  } else if (positives.length === 1) {
    sentences.push(`Overall, ${positives[0]} is within the normal range.`);
  }

  // Add up to 2 concern sentences (3 total max)
  const budget = 3 - sentences.length;
  for (let i = 0; i < Math.min(budget, concerns.length); i++) {
    sentences.push(concerns[i]);
  }

  return sentences.join(' ');
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StatsSummary({ metricsByCategory, lastReportDate }: StatsSummaryProps) {
  const allMetrics = Object.values(metricsByCategory).flat();
  if (allMetrics.length === 0) return null;

  const abnormal = allMetrics.filter(m => {
    const s = getStatus(m);
    return s === 'high' || s === 'low';
  }).length;

  const summary = buildSummary(metricsByCategory);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-5 flex-wrap">

        {/* Left: report title */}
        <div className="flex-shrink-0 min-w-[140px]">
          {lastReportDate && (
            <p className="text-lg font-bold text-gray-800 leading-tight">
              {formatReportDate(lastReportDate)}
            </p>
          )}
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mt-0.5">
            Summary
          </p>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-gray-200 flex-shrink-0" />

        {/* Out-of-range stat: big number, label stacked below */}
        <div className="flex-shrink-0 text-center min-w-[72px]">
          <p className={`text-4xl font-bold leading-none tabular-nums ${abnormal > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {abnormal}
          </p>
          <p className="text-xs text-gray-400 mt-1.5 leading-snug">
            out of {allMetrics.length}<br />
            <span>out of range</span>
          </p>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-gray-200 flex-shrink-0" />

        {/* Narrative summary */}
        <div className="flex-1 min-w-0 self-center">
          <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
        </div>

      </div>
    </div>
  );
}
