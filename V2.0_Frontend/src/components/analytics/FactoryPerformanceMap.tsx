'use client'

import { cn } from '@/lib/utils'
import { Factory } from 'lucide-react'

interface FactoryPerformanceMapProps {
  factories?: { name: string; location: string; score: number }[]
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const avatarColors = [
  'bg-primary text-white',
  'bg-orange-500 text-white',
  'bg-violet-500 text-white',
  'bg-teal-500 text-white',
  'bg-rose-500 text-white',
  'bg-indigo-500 text-white',
]

export default function FactoryPerformanceMap({ factories, className }: FactoryPerformanceMapProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-border p-6 flex flex-col', className)}>
      <h3 className="text-base font-semibold text-text-primary mb-4 shrink-0">
        Factory Performance
      </h3>

      {!factories || factories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[150px] text-gray-400">
          <Factory size={36} className="mb-2 opacity-30" />
          <p className="text-sm text-center">No factory data yet. Performance scores will appear once factories are added.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {factories.map((factory, idx) => {
            const scoreColor =
              factory.score > 80
                ? 'bg-success'
                : factory.score > 60
                  ? 'bg-warning'
                  : 'bg-danger'
            const scoreTextColor =
              factory.score > 80
                ? 'text-success'
                : factory.score > 60
                  ? 'text-warning'
                  : 'text-danger'

            return (
              <div key={factory.name} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    avatarColors[idx % avatarColors.length]
                  )}
                >
                  {getInitials(factory.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {factory.name}
                      </p>
                      <p className="text-xs text-text-muted">{factory.location}</p>
                    </div>
                    <span className={cn('text-sm font-bold ml-3 shrink-0', scoreTextColor)}>
                      {factory.score}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', scoreColor)}
                      style={{ width: `${Math.min(factory.score, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
