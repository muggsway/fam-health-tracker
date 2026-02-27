import { PRIORITY_METRICS } from '@/lib/metrics-config';
import type { MetricsByCategory } from '@/types';
import PriorityChart from './PriorityChart';
import WeightChart from './WeightChart';

interface PriorityChartsSectionProps {
  metricsByCategory: MetricsByCategory;
  profileId: string;
  weightRefreshKey?: number;
}

export default function PriorityChartsSection({ metricsByCategory, profileId, weightRefreshKey }: PriorityChartsSectionProps) {
  const allMetrics = Object.values(metricsByCategory).flat();
  const byKey = new Map(allMetrics.map((m) => [m.metric_key, m]));

  const chartsWithData = PRIORITY_METRICS.filter((cfg) => {
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
          const metric = byKey.get(cfg.key);
          return (
            <PriorityChart
              key={cfg.key}
              config={cfg}
              dataPoints={metric?.dataPoints ?? []}
            />
          );
        })}
      </div>
    </div>
  );
}
