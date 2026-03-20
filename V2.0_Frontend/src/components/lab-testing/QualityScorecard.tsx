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
    <div className="bg-white rounded-xl border border-border p-3 h-full flex flex-col overflow-hidden">
      <h3 className="text-[10px] font-bold text-text-primary mb-2 uppercase tracking-tight flex-shrink-0">Quality Scorecard</h3>

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Donut Chart */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          {hasData ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius="90%"
                    innerRadius="65%"
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
                <span className="text-lg font-bold text-text-primary">{percentage}%</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-[10px] text-text-muted">No data</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-1 mb-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.passed }} />
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Passed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.failed }} />
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Failed</span>
          </div>
        </div>

        {/* Breakdown rows */}
        <div className="space-y-1.5 flex-shrink-0 border-t border-gray-50 pt-2">
          {breakdownItems.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{item.label}</span>
                <span className="text-[9px] font-bold text-text-primary">{item.value}%</span>
              </div>
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
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
    </div>
  )
}
