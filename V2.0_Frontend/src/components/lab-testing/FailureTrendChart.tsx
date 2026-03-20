'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface FailureTrendChartProps {
  data?: { name: string; value: number }[]
  title?: string
}

const BAR_COLOR = '#E67E22'

export default function FailureTrendChart({ data, title = 'Trend Analytics' }: FailureTrendChartProps) {
  const hasData = data && data.length > 0

  return (
    <div className="bg-white rounded-xl border border-border p-4 h-full flex flex-col">
      <h3 className="text-xs font-bold text-text-primary mb-3 uppercase tracking-tight flex-shrink-0">{title}</h3>

      {hasData ? (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                cursor={{ fill: 'rgba(230, 126, 34, 0.08)' }}
              />
              <Bar
                dataKey="value"
                fill={BAR_COLOR}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-muted text-sm">No lab test data yet.</p>
            <p className="text-text-light text-xs mt-1">Submit your first sample to see failure trends.</p>
          </div>
        </div>
      )}
    </div>
  )
}
