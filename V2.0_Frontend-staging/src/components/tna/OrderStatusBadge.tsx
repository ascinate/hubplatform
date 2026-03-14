'use client'

import { AlertTriangle, TrendingUp, Clock } from 'lucide-react'

interface Props {
  statusLabel: string
  progressPercent: number
  progressColor: string
  dueDate?: string | null
  isDelayed?: boolean
  delayDays?: number
}

export default function OrderStatusBadge({
  statusLabel,
  progressPercent,
  progressColor,
  dueDate,
  isDelayed,
  delayDays,
}: Props) {
  const daysToShip = dueDate
    ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Status label */}
      <span
        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full"
        style={{ backgroundColor: progressColor + '15', color: progressColor }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: progressColor }}
        />
        {statusLabel}
      </span>

      {/* Progress percent */}
      <span className="text-sm text-text-muted flex items-center gap-1">
        <TrendingUp size={14} />
        {progressPercent}% complete
      </span>

      {/* Days to ship */}
      {daysToShip !== null && !isDelayed && (
        <span className={`text-sm flex items-center gap-1 ${
          daysToShip <= 7 ? 'text-amber-600 font-medium' : 'text-text-muted'
        }`}>
          <Clock size={14} />
          {daysToShip > 0 ? `${daysToShip} days to ship` : 'Due today'}
        </span>
      )}

      {/* Delay warning */}
      {isDelayed && (
        <span className="text-sm text-red-600 font-medium flex items-center gap-1 bg-red-50 px-2.5 py-0.5 rounded-full">
          <AlertTriangle size={14} />
          DELAYED — {delayDays || 0} day(s) behind
        </span>
      )}
    </div>
  )
}
