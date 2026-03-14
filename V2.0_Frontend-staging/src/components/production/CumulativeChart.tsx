'use client'

import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { formatNumber } from '@/lib/utils'

interface ProductionDay {
  id: string
  date: string
  actual_lines: number
  actual_pieces_per_line: number
  packed_pieces: number
  actual_pieces: number
}

interface ProductionPlan {
  planned_lines: number
  daily_pieces_per_line: number
  total_planned: number
  days: ProductionDay[]
}

interface CumulativeChartProps {
  plan: ProductionPlan
  orderQuantity: number
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CumulativeChart({ plan, orderQuantity }: CumulativeChartProps) {
  const [mode, setMode] = useState<'days' | 'weeks'>('days')

  const dailyPlanned = plan.planned_lines * plan.daily_pieces_per_line

  const chartData = useMemo(() => {
    let cumulativePlanned = 0
    let cumulativeActual = 0
    let cumulativePacked = 0

    const dailyData = plan.days.map((day) => {
      cumulativePlanned += dailyPlanned
      const actual = day.actual_lines * day.actual_pieces_per_line
      cumulativeActual += actual
      cumulativePacked += day.packed_pieces

      return {
        date: day.date,
        label: formatDateLabel(day.date),
        planned: cumulativePlanned,
        actual: cumulativeActual > 0 ? cumulativeActual : null,
        packed: cumulativePacked > 0 ? cumulativePacked : null,
      }
    })

    if (mode === 'weeks') {
      // Aggregate by week (take last day of each week)
      const weekMap: Record<string, typeof dailyData[0]> = {}
      for (const d of dailyData) {
        const date = new Date(d.date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const key = weekStart.toISOString().split('T')[0]
        weekMap[key] = { ...d, label: `W${formatDateLabel(d.date)}` }
      }
      return Object.values(weekMap)
    }

    return dailyData
  }, [plan.days, dailyPlanned, mode])

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Cumulative Progress</h3>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setMode('days')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              mode === 'days' ? 'bg-white shadow text-text-primary font-medium' : 'text-text-muted'
            }`}
          >
            Days
          </button>
          <button
            onClick={() => setMode('weeks')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              mode === 'weeks' ? 'bg-white shadow text-text-primary font-medium' : 'text-text-muted'
            }`}
          >
            Weeks
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              interval={mode === 'days' ? Math.max(0, Math.floor(chartData.length / 10)) : 0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(value: any, name?: string) => [formatNumber(value ?? 0), name ?? '']}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="plainline"
              wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
            />

            {/* Order quantity target line */}
            <ReferenceLine
              y={orderQuantity}
              stroke="#E67E22"
              strokeDasharray="8 4"
              label={{
                value: `Target: ${formatNumber(orderQuantity)}`,
                position: 'right',
                fill: '#E67E22',
                fontSize: 11,
              }}
            />

            {/* Planned line (gray dashed) */}
            <Line
              type="monotone"
              dataKey="planned"
              name="Planned"
              stroke="#9CA3AF"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              connectNulls
            />

            {/* Actual line (green solid) */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#27AE60"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#27AE60' }}
              activeDot={{ r: 5 }}
              connectNulls
            />

            {/* Packed line (blue solid) */}
            <Line
              type="monotone"
              dataKey="packed"
              name="Packed"
              stroke="#2E86C1"
              strokeWidth={2}
              dot={{ r: 3, fill: '#2E86C1' }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
