'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts';
import type { MetricDataPoint } from '@/types';
import type { PriorityMetricConfig } from '@/lib/metrics-config';

interface PriorityChartProps {
  config: PriorityMetricConfig;
  dataPoints: MetricDataPoint[];
}

function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1);
  return d.toLocaleString('default', { month: 'short' }) + " '" + String(year).slice(2);
}

function dateToTimestamp(dateStr: string): number {
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(year, month - 1).getTime();
}

// Clean Y-axis tick display
function tickFormatter(v: number): string {
  if (v === 0) return '0';
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10}k`;
  if (Math.abs(v) >= 100) return Math.round(v).toString();
  if (Math.abs(v) >= 10) return v.toFixed(1);
  if (Math.abs(v) >= 1) return v.toFixed(1);
  return v.toFixed(2);
}

// Compute a clean domain with rounded boundaries
function cleanDomain(minVal: number, maxVal: number, refLow: number | null, refHigh: number | null): [number, number] {
  const allVals = [minVal, maxVal, refLow ?? minVal, refHigh ?? maxVal].filter(v => v != null && isFinite(v));
  const lo = Math.min(...allVals);
  const hi = Math.max(...allVals);
  const range = hi - lo || 1;
  const pad = range * 0.25;

  const rawMin = Math.max(0, lo - pad);
  const rawMax = hi + pad;
  const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
  const step = magnitude >= 1 ? magnitude : 0.1;

  return [
    Math.floor(rawMin / step) * step,
    Math.ceil(rawMax / step) * step,
  ];
}

// Custom dot: red for out-of-range (both high and low)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  const isAbnormal = payload.isAbnormal;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={4}
      fill={isAbnormal ? '#ef4444' : props.stroke}
      stroke={isAbnormal ? '#dc2626' : props.stroke}
      strokeWidth={isAbnormal ? 2 : 1}
    />
  );
}

function refRangeLabel(refLow: number | null, refHigh: number | null, refText: string | null): string {
  if (refText) return refText;
  if (refLow != null && refHigh != null) return `${refLow}–${refHigh}`;
  if (refHigh != null) return `<${refHigh}`;
  if (refLow != null) return `>${refLow}`;
  return '';
}

// Custom tooltip showing date, value, and method used
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, config }: { active?: boolean; payload?: readonly any[]; config: PriorityMetricConfig }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="text-gray-500 text-xs mb-1">{d.date}</div>
      <div className="font-semibold text-gray-900">{d.value} <span className="font-normal text-gray-500">{config.unit}</span></div>
      {d.method && <div className="text-gray-400 text-xs mt-1">Method: {d.method}</div>}
    </div>
  );
}

export default function PriorityChart({ config, dataPoints }: PriorityChartProps) {
  if (dataPoints.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-1">{config.displayName}</p>
        <p className="text-xs text-gray-400">No data yet</p>
      </div>
    );
  }

  // Determine ref range from the latest data point that has one — used for ALL dots
  const refPoint = [...dataPoints].reverse().find(
    (d) => d.ref_range_low != null || d.ref_range_high != null
  );
  const refLow = refPoint?.ref_range_low ?? null;
  const refHigh = refPoint?.ref_range_high ?? null;
  const refText = refPoint?.ref_range_text ?? null;
  // Unit from the data point (may differ from config, e.g. Vitamin D ng/mL vs nmol/L)
  const displayUnit = refPoint?.unit ?? config.unit;

  const chartData = dataPoints
    .filter((d) => d.value != null)
    .map((d) => {
      const v = d.value as number;
      const abnormal = (refHigh != null && v > refHigh) || (refLow != null && v < refLow);
      return {
        date: formatDate(d.report_date),
        timestamp: dateToTimestamp(d.report_date),
        value: v,
        isAbnormal: abnormal,
        unit: d.unit,
        method: d.method,
      };
    });

  if (chartData.length === 0) return null;

  const values = chartData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const [yMin, yMax] = cleanDomain(minVal, maxVal, refLow, refHigh);

  const latest = chartData[chartData.length - 1];
  const isAbnormal = latest.isAbnormal;
  const rangeLabel = refRangeLabel(refLow, refHigh, refText);

  const timestamps = chartData.map(d => d.timestamp);

  return (
    <div className={`bg-white rounded-xl border p-4 ${isAbnormal ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3 gap-2">
        <p className="text-sm font-semibold text-gray-800 leading-tight">{config.displayName}</p>
        <div className="text-right flex-shrink-0">
          <div className="flex items-baseline gap-1 justify-end">
            <span className={`text-base font-bold ${isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>
              {latest.value}
            </span>
            <span className="text-xs text-gray-500">{displayUnit}</span>
            {isAbnormal && (
              <span className="text-xs font-semibold text-red-500">
                {refHigh != null && latest.value > refHigh ? '▲' : '▼'}
              </span>
            )}
          </div>
          {rangeLabel && (
            <p className="text-xs text-gray-400 mt-0.5">Ideal: {rangeLabel} {displayUnit}</p>
          )}
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
              return d.toLocaleString('default', { month: 'short' }) + " '" + String(d.getFullYear()).slice(2);
            }}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickCount={4}
            tickFormatter={tickFormatter}
          />
          <Tooltip content={(props) => <CustomTooltip {...props} config={config} />} />

          {/* Reference range shaded band */}
          {refLow != null && refHigh != null && (
            <ReferenceArea y1={refLow} y2={refHigh} fill="#dcfce7" fillOpacity={0.5} />
          )}
          {refHigh != null && refLow == null && (
            <ReferenceLine y={refHigh} stroke="#86efac" strokeDasharray="4 4" />
          )}
          {refLow != null && refHigh == null && (
            <ReferenceLine y={refLow} stroke="#86efac" strokeDasharray="4 4" />
          )}

          <Line
            type="monotone"
            dataKey="value"
            stroke={config.chartColor}
            strokeWidth={2}
            dot={<CustomDot stroke={config.chartColor} />}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
