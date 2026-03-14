'use client'

import { TrendingDown } from 'lucide-react'

interface DefectRateBarsProps {
  data?: { name: string; rate: number }[]
}

export default function DefectRateBars({ data }: DefectRateBarsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="text-base font-semibold text-text-primary mb-4">
          Inspection Defect Rate
        </h3>
        <div className="flex flex-col items-center justify-center h-36 text-gray-400">
          <TrendingDown size={36} className="mb-2 opacity-30" />
          <p className="text-sm text-center">No defect data yet. Data will appear once inspections are logged.</p>
        </div>
      </div>
    )
  }

  const maxRate = Math.max(...data.map((d) => d.rate), 1)

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h3 className="text-base font-semibold text-text-primary mb-4">
        Inspection Defect Rate
      </h3>

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-text-primary">{item.name}</span>
              <span className="text-sm font-semibold text-text-primary">
                {item.rate.toFixed(2)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(item.rate / maxRate) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
