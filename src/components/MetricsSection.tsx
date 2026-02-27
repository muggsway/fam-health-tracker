import type { MetricsByCategory } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/metrics-config';
import MetricCard from './MetricCard';

interface MetricsSectionProps {
  metricsByCategory: MetricsByCategory;
}

export default function MetricsSection({ metricsByCategory }: MetricsSectionProps) {
  const categories = [
    ...CATEGORY_ORDER.filter((c) => metricsByCategory[c]),
    ...Object.keys(metricsByCategory).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  if (categories.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        No metrics found. Upload a health report to see data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {CATEGORY_LABELS[cat] ?? cat}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {metricsByCategory[cat].map((metric) => (
              <MetricCard key={metric.metric_key} metric={metric} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
