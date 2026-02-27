import { KEY_METRICS } from '@/lib/metrics-config';
import type { MetricsByCategory } from '@/types';

interface MissingMetricsBannerProps {
  metricsByCategory: MetricsByCategory;
}

export default function MissingMetricsBanner({ metricsByCategory }: MissingMetricsBannerProps) {
  const allKeys = new Set(
    Object.values(metricsByCategory)
      .flat()
      .map((m) => m.metric_key)
  );

  const missing = KEY_METRICS.filter((km) => !allKeys.has(km.key));
  if (missing.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
      <span className="font-medium">Missing from reports: </span>
      {missing.map((m) => m.displayName).join(', ')}
    </div>
  );
}
