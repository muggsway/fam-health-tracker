'use client';

import type { MetricWithHistory } from '@/types';
import MethodWarningBadge from './MethodWarningBadge';

interface MetricCardProps {
  metric: MetricWithHistory;
}

const METRIC_DESCRIPTIONS: Record<string, string> = {
  hba1c: 'Average blood sugar over 2-3 months. Above 5.7% indicates prediabetes; above 6.5% indicates diabetes.',
  fasting_glucose: 'Blood sugar after at least 8 hours of fasting. Elevated levels indicate diabetes risk.',
  hscrp: 'High-sensitivity C-reactive protein measures inflammation. Elevated levels increase cardiovascular risk.',
  insulin_fasting: 'Fasting insulin levels. Elevated levels indicate insulin resistance, a precursor to diabetes.',
  vitamin_d: 'Vitamin D is critical for bone health, immunity, and mood. Below 20 ng/mL is deficient.',
  alt_sgpt: 'Liver enzyme. Significantly elevated levels indicate liver stress, fatty liver, or damage.',
  ast_sgot: 'Liver enzyme. Elevated with ALT indicates liver damage.',
  hemoglobin: 'Protein in red blood cells that carries oxygen. Low levels indicate anaemia.',
  triglycerides: 'Blood fats. Elevated levels (>150 mg/dL) increase cardiovascular disease risk.',
  total_cholesterol: 'Total cholesterol in blood. Part of cardiovascular risk assessment.',
  hdl_cholesterol: 'Good cholesterol. Higher is better — low levels increase heart disease risk.',
  ldl_cholesterol: 'Bad cholesterol. Elevated levels increase risk of heart disease and stroke.',
  apo_b: 'Apolipoprotein B is present in every LDL particle. A better predictor of cardiovascular risk than LDL.',
  tsh: 'Thyroid-stimulating hormone regulates thyroid function. Abnormal values indicate hypo- or hyperthyroidism.',
  creatinine: 'Waste product filtered by kidneys. Elevated levels indicate impaired kidney function.',
  egfr: 'Estimated Glomerular Filtration Rate. Measures how well kidneys filter blood. Lower is worse.',
  uric_acid: 'Elevated uric acid can cause gout and may indicate kidney issues.',
  homocysteine: 'Elevated homocysteine is a risk factor for cardiovascular disease and stroke.',
  ferritin: 'Protein that stores iron. Low ferritin indicates iron deficiency.',
  vitamin_b12: 'Essential for nerve function and red blood cell production. Deficiency causes fatigue and neurological issues.',
};

function getTrendInfo(metric: MetricWithHistory): { arrow: string; color: string; label: string } | null {
  if (!metric.latest || !metric.previous || metric.latest.value == null || metric.previous.value == null) {
    return null;
  }
  const diff = metric.latest.value - metric.previous.value;
  if (Math.abs(diff) < 0.001) return null;

  const isUp = diff > 0;
  const arrow = isUp ? '↑' : '↓';
  const prevVal = metric.previous.value;
  const label = `${arrow} from ${prevVal} ${metric.unit ?? ''}`.trim();

  // Determine if the trend is good or bad
  // For metrics where higher is worse (most), up = bad
  // We can check status of latest to infer
  let color = 'text-gray-500';
  if (metric.latest.status === 'high' && isUp) color = 'text-red-500';
  else if (metric.latest.status === 'low' && !isUp) color = 'text-red-500';
  else if (metric.latest.status === 'normal') color = 'text-green-600';

  return { arrow, color, label };
}

export default function MetricCard({ metric }: MetricCardProps) {
  const latest = metric.latest;
  if (!latest) return null;

  const isAbnormal = latest.status === 'high' || latest.status === 'low';
  const trend = getTrendInfo(metric);

  const description = METRIC_DESCRIPTIONS[metric.metric_key];

  const refRange = latest.ref_range_text
    ?? (latest.ref_range_low != null && latest.ref_range_high != null
      ? `${latest.ref_range_low}–${latest.ref_range_high}`
      : latest.ref_range_high != null
        ? `<${latest.ref_range_high}`
        : latest.ref_range_low != null
          ? `>${latest.ref_range_low}`
          : null);

  return (
    <div
      className={`rounded-lg border p-3 relative group ${
        isAbnormal
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Tooltip */}
      {description && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
          {description}
          {isAbnormal && (
            <p className="mt-1 text-red-300 font-medium">
              Currently {latest.status}: {latest.status === 'high' ? 'above' : 'below'} normal range.
            </p>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{metric.display_name}</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-lg font-bold ${isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>
              {latest.value ?? '—'}
            </span>
            {latest.unit && (
              <span className="text-xs text-gray-500">{latest.unit}</span>
            )}
          </div>
          {refRange && (
            <p className="text-xs text-gray-400 mt-0.5">Ref: {refRange}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {isAbnormal && (
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              latest.status === 'high'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {latest.status === 'high' ? '▲ HIGH' : '▼ LOW'}
            </span>
          )}
          {trend && (
            <span className={`text-xs font-medium ${trend.color}`} title={trend.label}>
              {trend.arrow} {metric.previous?.value}
            </span>
          )}
        </div>
      </div>

      {metric.methodChanged && (() => {
        const seen = new Map<string, string>();
        for (const dp of metric.dataPoints) {
          if (dp.method) {
            const key = dp.method.trim().toLowerCase();
            if (!seen.has(key)) seen.set(key, dp.method.trim());
          }
        }
        const allMethods = Array.from(seen.values());
        return allMethods.length > 1
          ? <div className="mt-2"><MethodWarningBadge methods={allMethods} /></div>
          : null;
      })()}
    </div>
  );
}
