import { PRIORITY_METRICS } from '@/lib/metrics-config';
import type { MetricsByCategory, MetricDataPoint } from '@/types';
import PriorityChart from './PriorityChart';
import WeightChart from './WeightChart';

interface PriorityChartsSectionProps {
  metricsByCategory: MetricsByCategory;
  profileId: string;
  weightRefreshKey?: number;
}

function computeTrigHdlRatio(
  trigPoints: MetricDataPoint[],
  hdlPoints: MetricDataPoint[]
): MetricDataPoint[] {
  const hdlByDate = new Map(hdlPoints.map((d) => [d.report_date, d.value]));
  return trigPoints
    .filter((d) => d.value != null && hdlByDate.get(d.report_date) != null)
    .map((d) => {
      const ratio = Math.round(((d.value as number) / (hdlByDate.get(d.report_date) as number)) * 100) / 100;
      return {
        report_date: d.report_date,
        report_id: d.report_id,
        lab_name: d.lab_name,
        value: ratio,
        unit: '',
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
}

export default function PriorityChartsSection({ metricsByCategory, profileId, weightRefreshKey }: PriorityChartsSectionProps) {
  const allMetrics = Object.values(metricsByCategory).flat();
  const byKey = new Map(allMetrics.map((m) => [m.metric_key, m]));

  const chartsWithData = PRIORITY_METRICS.filter((cfg) => {
    if (cfg.key === 'trig_hdl_ratio') {
      const trig = byKey.get('triglycerides');
      const hdl = byKey.get('hdl_cholesterol');
      return trig && hdl && computeTrigHdlRatio(trig.dataPoints, hdl.dataPoints).length > 0;
    }
    const m = byKey.get(cfg.key);
    return m && m.dataPoints.some((d) => d.value != null);
  });

  if (chartsWithData.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Priority Metrics — Trends
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Weight chart always first */}
        <WeightChart profileId={profileId} refreshKey={weightRefreshKey} />

        {PRIORITY_METRICS.map((cfg) => {
          let dataPoints: MetricDataPoint[];
          if (cfg.key === 'trig_hdl_ratio') {
            const trig = byKey.get('triglycerides');
            const hdl = byKey.get('hdl_cholesterol');
            dataPoints = trig && hdl ? computeTrigHdlRatio(trig.dataPoints, hdl.dataPoints) : [];
          } else {
            dataPoints = byKey.get(cfg.key)?.dataPoints ?? [];
          }
          return (
            <PriorityChart
              key={cfg.key}
              config={cfg}
              dataPoints={dataPoints}
            />
          );
        })}
      </div>
    </div>
  );
}
