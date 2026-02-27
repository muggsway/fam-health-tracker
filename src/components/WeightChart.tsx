'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeightEntry {
  id: string;
  profile_id: string;
  weight_kg: number;
  recorded_at: string;
}

interface WeightChartProps {
  profileId: string;
  refreshKey?: number;
}

export default function WeightChart({ profileId, refreshKey }: WeightChartProps) {
  const [history, setHistory] = useState<WeightEntry[]>([]);

  useEffect(() => {
    fetch(`/api/weight/${profileId}`)
      .then(r => r.json())
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [profileId, refreshKey]);

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Weight</p>
        <p className="text-xs text-gray-400">No weight data yet. Update weight in the profile header to start tracking.</p>
      </div>
    );
  }

  // Deduplicate by calendar date — keep the last entry per day (API returns ASC order)
  const byDate = new Map<string, WeightEntry>();
  for (const entry of history) {
    const dateKey = entry.recorded_at.slice(0, 10); // YYYY-MM-DD
    byDate.set(dateKey, entry);
  }
  const dedupedHistory = Array.from(byDate.values());

  const chartData = dedupedHistory.map(e => ({
    timestamp: new Date(e.recorded_at).getTime(),
    label: new Date(e.recorded_at).toLocaleDateString('default', { day: 'numeric', month: 'short', year: '2-digit' }),
    weight: e.weight_kg,
  }));

  const latest = dedupedHistory[dedupedHistory.length - 1];
  const weights = dedupedHistory.map(e => e.weight_kg);
  const minW = Math.floor(Math.min(...weights) - 2);
  const maxW = Math.ceil(Math.max(...weights) + 2);
  const timestamps = chartData.map(d => d.timestamp);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">Weight</p>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold text-gray-900">{latest.weight_kg}</span>
          <span className="text-xs text-gray-500">kg</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            dataKey="timestamp"
            scale="time"
            domain={['dataMin', 'dataMax']}
            ticks={timestamps}
            tickFormatter={(ts: number) => {
              const d = new Date(ts);
              return d.toLocaleDateString('default', { day: 'numeric', month: 'short' });
            }}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[minW, maxW]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickCount={4}
            tickFormatter={(v: number) => v.toFixed(0)}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            labelFormatter={(ts) => new Date(ts as number).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}
            formatter={(val) => [`${val} kg`, 'Weight']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ r: 4, fill: '#6366f1' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
