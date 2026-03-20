'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { BarChart3, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductionTrendChartProps {
  data?: { month: string; actual: number; target: number }[]
  className?: string
}

export default function ProductionTrendChart({ data, className }: ProductionTrendChartProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-border p-6 flex flex-col', className)}>
      <h3 className="text-base font-semibold text-text-primary mb-4 shrink-0">
        Production Completion Trend
      </h3>
      {!data || data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-gray-400">
          <BarChart3 size={36} className="mb-2 opacity-30" />
          <p className="text-sm text-center">No trend data yet. Data will appear once orders are processed.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => `${value}%`}
              />
              <Legend
                iconType="line"
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="#27AE60"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#27AE60' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke="#ABB2B9"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#ABB2B9' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
