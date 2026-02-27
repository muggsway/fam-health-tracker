'use client';

import type { MetricsByCategory, MetricWithHistory, MetricDataPoint } from '@/types';
import type { MetricMetadataRow } from '@/lib/db';
import { CATEGORY_LABELS, CATEGORY_ORDER, METRIC_DESCRIPTIONS, METRIC_ANALYSIS, METRIC_REF_OVERRIDES } from '@/lib/metrics-config';
import MethodWarningBadge from './MethodWarningBadge';
import Tooltip from './Tooltip';

interface MetricsTableProps {
  metricsByCategory: MetricsByCategory;
  metricMetadata?: Record<string, MetricMetadataRow>;
}

function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(year, month - 1).toLocaleString('default', { month: 'short' }) + " '" + String(year).slice(2);
}

// Both high and low are red
function cellBg(status: string | null): string {
  if (status === 'high' || status === 'low') return 'bg-red-50';
  return '';
}

function cellText(status: string | null): string {
  if (status === 'high' || status === 'low') return 'text-red-700 font-semibold';
  return 'text-gray-700';
}

function refRangeStr(dp: { ref_range_text: string | null; ref_range_low: number | null; ref_range_high: number | null; unit?: string | null } | undefined): string {
  if (!dp) return '';
  const unitSuffix = dp.unit ? ` ${dp.unit}` : '';
  if (dp.ref_range_text) return dp.ref_range_text + unitSuffix;
  if (dp.ref_range_low != null && dp.ref_range_high != null) return `${dp.ref_range_low}–${dp.ref_range_high}${unitSuffix}`;
  if (dp.ref_range_high != null) return `<${dp.ref_range_high}${unitSuffix}`;
  if (dp.ref_range_low != null) return `>${dp.ref_range_low}${unitSuffix}`;
  return '';
}

// Recompute status against a given reference range (ignores stored status)
function computeStatus(value: number | null, refLow: number | null, refHigh: number | null): 'high' | 'low' | 'normal' | null {
  if (value == null) return null;
  if (refHigh != null && value > refHigh) return 'high';
  if (refLow != null && value < refLow) return 'low';
  if (refLow != null || refHigh != null) return 'normal';
  return null;
}

function buildTrigHdlRatioRow(metricsByCategory: MetricsByCategory): MetricWithHistory | null {
  const lipids = metricsByCategory['lipid'] ?? [];
  const trigMetric = lipids.find(m => m.metric_key === 'triglycerides');
  const hdlMetric = lipids.find(m => m.metric_key === 'hdl_cholesterol');
  if (!trigMetric || !hdlMetric) return null;

  const hdlByDate = new Map(hdlMetric.dataPoints.map(d => [d.report_date, d.value]));
  const dataPoints: MetricDataPoint[] = trigMetric.dataPoints
    .filter(d => d.value != null && hdlByDate.get(d.report_date) != null)
    .map(d => {
      const ratio = Math.round(((d.value as number) / (hdlByDate.get(d.report_date) as number)) * 100) / 100;
      return {
        report_date: d.report_date,
        report_id: d.report_id,
        lab_name: d.lab_name,
        value: ratio,
        unit: null,
        ref_range_low: null,
        ref_range_high: 2,
        ref_range_text: '<2',
        status: ratio > 2 ? 'high' : 'normal',
        method: null,
        advice: ratio > 2
          ? `Trig/HDL ratio of ${ratio} is above the ideal of <2, indicating insulin resistance and elevated cardiovascular risk.`
          : null,
      };
    });

  if (dataPoints.length === 0) return null;
  const sorted = [...dataPoints].sort((a, b) => a.report_date.localeCompare(b.report_date));
  return {
    metric_key: 'trig_hdl_ratio',
    display_name: 'Trig / HDL Ratio',
    category: 'lipid',
    unit: null,
    dataPoints: sorted,
    latest: sorted[sorted.length - 1],
    previous: sorted.length > 1 ? sorted[sorted.length - 2] : null,
    methodChanged: false,
  };
}

// Category-aware fallback descriptions for metrics not in METRIC_DESCRIPTIONS
const CATEGORY_FALLBACK: Record<string, string> = {
  diabetes:     'A blood sugar or metabolic marker.',
  liver:        'A liver function marker.',
  kidney:       'A kidney function marker.',
  lipid:        'A cholesterol or lipid marker.',
  thyroid:      'A thyroid function marker.',
  vitamins:     'A vitamin or mineral level.',
  blood:        'A blood count marker.',
  inflammation: 'An inflammation or immune marker.',
  hormones:     'A hormonal marker.',
  urine:        'A urinary analysis marker.',
};

export default function MetricsTable({ metricsByCategory, metricMetadata = {} }: MetricsTableProps) {
  function getDescription(metricKey: string, category: string | null): string {
    // 1. AI-generated from DB
    if (metricMetadata[metricKey]?.description) return metricMetadata[metricKey].description!;
    // 2. Hardcoded config
    if (METRIC_DESCRIPTIONS[metricKey]) return METRIC_DESCRIPTIONS[metricKey];
    // 3. Category fallback
    const base = CATEGORY_FALLBACK[category ?? ''] ?? 'A health marker.';
    return `${base} Values outside the reference range should be discussed with your doctor.`;
  }

  function analysisText(metricKey: string, status: string | null, valueAdvice?: string | null): string {
    if (!status || status === 'normal') return '';
    // 1. AI-generated value-specific advice (stored per metric reading at upload time)
    if (valueAdvice) return valueAdvice;
    // 2. Hardcoded config
    const info = METRIC_ANALYSIS[metricKey];
    if (info) return status === 'high' ? info.high : info.low;
    // 3. Generic fallback
    return status === 'high'
      ? 'Value is above the reference range. Consult your doctor for guidance.'
      : 'Value is below the reference range. Consult your doctor for guidance.';
  }

  // Collect all unique report dates, sorted ascending (oldest first, latest rightmost)
  const allDates = Array.from(new Set(
    Object.values(metricsByCategory).flat()
      .flatMap(m => m.dataPoints.map(dp => dp.report_date))
  )).sort();

  if (allDates.length === 0) return null;

  const latestDate = allDates[allDates.length - 1];

  const categories = [
    ...CATEGORY_ORDER.filter(c => metricsByCategory[c]),
    ...Object.keys(metricsByCategory).filter(c => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <div className="space-y-6">
      {categories.map(cat => {
        let metrics = metricsByCategory[cat];
        if (!metrics?.length) return null;

        // Inject computed Trig/HDL ratio row into Lipid Profile
        if (cat === 'lipid') {
          const ratioRow = buildTrigHdlRatioRow(metricsByCategory);
          if (ratioRow) {
            const trigIdx = metrics.findIndex(m => m.metric_key === 'triglycerides');
            metrics = trigIdx >= 0
              ? [...metrics.slice(0, trigIdx + 1), ratioRow, ...metrics.slice(trigIdx + 1)]
              : [...metrics, ratioRow];
          }
        }

        return (
          <div key={cat}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {CATEGORY_LABELS[cat] ?? cat}
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 sticky left-0 z-10 bg-gray-50 min-w-[180px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      Metric
                    </th>
                    {allDates.map(date => (
                      <th key={date} className={`text-right px-4 py-2.5 font-medium whitespace-nowrap ${date === latestDate ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>
                        {formatDate(date)}
                        {date === latestDate && <span className="ml-1 text-xs font-normal opacity-70">latest</span>}
                      </th>
                    ))}
                    <th className="text-right px-4 py-2.5 font-normal text-gray-400 text-xs whitespace-nowrap">
                      Ref Range
                    </th>
                    <th className="text-left px-4 py-2.5 font-normal text-gray-400 text-xs min-w-[200px] max-w-[280px]">
                      Analysis
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {metrics.map(metric => {
                    const dpByDate = new Map(metric.dataPoints.map(dp => [dp.report_date, dp]));
                    const latestDp = dpByDate.get(latestDate);

                    // Always use the latest available ref range to evaluate all historical cells
                    const refDp = [...metric.dataPoints].reverse().find(
                      dp => dp.ref_range_low != null || dp.ref_range_high != null
                    );
                    const override = METRIC_REF_OVERRIDES[metric.metric_key];
                    const refLow = override?.refLow ?? refDp?.ref_range_low ?? null;
                    const refHigh = override?.refHigh ?? refDp?.ref_range_high ?? null;

                    const latestStatus = computeStatus(latestDp?.value ?? null, refLow, refHigh);
                    const analysis = analysisText(metric.metric_key, latestStatus, latestDp?.advice);
                    const metricDesc = getDescription(metric.metric_key, metric.category);

                    return (
                      <tr key={metric.metric_key} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-2.5 sticky left-0 z-10 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Tooltip content={metricDesc} position="above-left">
                              <span className="font-medium text-gray-800 cursor-help underline decoration-dotted decoration-gray-400 underline-offset-2">
                                {metric.display_name}
                              </span>
                            </Tooltip>
                            {metric.methodChanged && (() => {
                              // Deduplicate case-insensitively (handles 'ECLIA' vs 'eclia ')
                              const seen = new Map<string, string>();
                              for (const dp of metric.dataPoints) {
                                if (dp.method) {
                                  const key = dp.method.trim().toLowerCase();
                                  if (!seen.has(key)) seen.set(key, dp.method.trim());
                                }
                              }
                              const allMethods = Array.from(seen.values());
                              return allMethods.length > 1
                                ? <MethodWarningBadge methods={allMethods} />
                                : null;
                            })()}
                          </div>
                        </td>
                        {allDates.map(date => {
                          const dp = dpByDate.get(date);
                          const isLatest = date === latestDate;
                          if (!dp || dp.value == null) {
                            return (
                              <td key={date} className={`px-4 py-2.5 text-right text-gray-300 ${isLatest ? 'bg-blue-50/30' : ''}`}>
                                —
                              </td>
                            );
                          }
                          // Recompute status using the latest reference range
                          const cellStatus = computeStatus(dp.value, refLow, refHigh);
                          const cellContent = (
                            <>
                              <span className={cellText(cellStatus)}>{dp.value}</span>
                              {cellStatus === 'high' && <span className="ml-1 text-red-500 text-xs">▲</span>}
                              {cellStatus === 'low' && <span className="ml-1 text-red-500 text-xs">▼</span>}
                            </>
                          );
                          return (
                            <td
                              key={date}
                              className={`px-4 py-2.5 text-right ${cellBg(cellStatus)} ${isLatest ? 'ring-1 ring-inset ring-blue-100' : ''}`}
                            >
                              {dp.method ? (
                                <Tooltip content={`Method: ${dp.method}`} position="above-center">
                                  {cellContent}
                                </Tooltip>
                              ) : cellContent}
                            </td>
                          );
                        })}
                        <td className="px-4 py-2.5 text-right text-xs text-gray-400 whitespace-nowrap">
                          {override
                            ? refRangeStr({ ref_range_low: refLow, ref_range_high: refHigh, ref_range_text: null, unit: refDp?.unit })
                            : refRangeStr(refDp)}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 min-w-[200px] max-w-[280px]">
                          {analysis ? (
                            <span className="text-red-600">{analysis}</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
