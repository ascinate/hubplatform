'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface QualityScorecardProps {
  passed: number
  total: number
}

const COLORS = {
  passed: '#27AE60',
  failed: '#E74C3C',
}

export default function QualityScorecard({ passed, total }: QualityScorecardProps) {
  const failed = total - passed
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0

  const chartData = [
    { name: 'Passed', value: passed || 0 },
    { name: 'Failed', value: failed || 0 },
  ]

  // Avoid rendering empty chart when there is no data
  const hasData = total > 0

  const breakdownItems = [
    { label: 'Material Integrity', value: 98 },
    { label: 'Chemical Composition', value: 85 },
  ]

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h3 className="text-base font-semibold text-text-primary mb-4">Quality Scorecard</h3>

      {/* Donut Chart */}
      <div className="relative h-[200px]">
        {hasData ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={55}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  <Cell fill={COLORS.passed} />
                  <Cell fill={COLORS.failed} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-text-primary">{percentage}%</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-muted">No data available</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-2 mb-5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.passed }} />
          <span className="text-xs text-text-muted">Passed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.failed }} />
          <span className="text-xs text-text-muted">Failed</span>
        </div>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-3">
        {breakdownItems.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text-muted">{item.label}</span>
              <span className="text-sm font-medium text-text-primary">{item.value}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: item.value >= 90 ? COLORS.passed : '#E67E22',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
