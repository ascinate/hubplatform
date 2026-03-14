'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, XCircle, Clock, Minus, Lock } from 'lucide-react'

interface Stage {
  id: string
  name: string
  status: string
  sequence_number: number
  department_name: string
  approver_name: string
  planned_start_date: string | null
  planned_end_date: string | null
  is_required: boolean
  is_delayed: boolean
  delay_days: number
}

interface Props {
  stages: Stage[]
  progressPercent: number
  progressColor: string
  onStageClick?: (stage: Stage) => void
}

function getStatusIcon(status: string, size: number = 14) {
  switch (status) {
    case 'approved': return <CheckCircle2 size={size} className="text-green-500" />
    case 'in_progress': return <Clock size={size} className="text-blue-500 animate-pulse" />
    case 'submitted': return <Circle size={size} className="text-amber-500 fill-amber-200" />
    case 'rejected': return <XCircle size={size} className="text-red-500" />
    case 'skipped': return <Minus size={size} className="text-gray-300" />
    default: return <Circle size={size} className="text-gray-300" />
  }
}

function getStatusDotColor(status: string) {
  switch (status) {
    case 'approved': return 'bg-green-500 border-green-200'
    case 'in_progress': return 'bg-blue-500 border-blue-200 animate-pulse'
    case 'submitted': return 'bg-amber-500 border-amber-200'
    case 'rejected': return 'bg-red-500 border-red-200'
    case 'skipped': return 'bg-gray-200 border-gray-100'
    default: return 'bg-gray-300 border-gray-100'
  }
}

export default function WorkflowProgressBar({ stages, progressPercent, progressColor, onStageClick }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const sortedStages = [...stages].sort((a, b) => a.sequence_number - b.sequence_number)
  const approvedCount = sortedStages.filter(s => s.status === 'approved').length
  const totalCount = sortedStages.filter(s => s.status !== 'skipped').length

  // Find the current active index (first non-approved, non-skipped)
  const currentIdx = sortedStages.findIndex(s => s.status !== 'approved' && s.status !== 'skipped')

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      {/* Progress bar with dots */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-200" />
        {/* Filled line */}
        <div
          className="absolute top-3 left-3 h-0.5 transition-all duration-500"
          style={{
            width: `${Math.min(progressPercent, 100)}%`,
            backgroundColor: progressColor,
          }}
        />

        {/* Stage dots */}
        <div className="relative flex justify-between">
          {sortedStages.map((stage, idx) => {
            const isClickable = stage.status === 'approved' || stage.status === 'in_progress' || stage.status === 'submitted' || stage.status === 'rejected'
            const isFuture = stage.status === 'pending' && (currentIdx === -1 || idx > currentIdx)

            return (
              <div
                key={stage.id}
                className="relative flex flex-col items-center"
                style={{ width: `${100 / sortedStages.length}%` }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Dot */}
                <button
                  onClick={() => isClickable && onStageClick?.(stage)}
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 bg-white
                    ${getStatusDotColor(stage.status)}
                    ${isClickable ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
                    ${isFuture ? 'cursor-not-allowed opacity-60' : ''}
                  `}
                  disabled={!isClickable}
                >
                  {isFuture && <Lock size={8} className="text-gray-400" />}
                </button>

                {/* Stage number (only show every few) */}
                {(idx % Math.ceil(sortedStages.length / 10) === 0 || idx === sortedStages.length - 1) && (
                  <span className="text-[10px] text-text-muted mt-1 truncate max-w-[60px] text-center">
                    {stage.sequence_number}
                  </span>
                )}

                {/* Tooltip */}
                {hoveredIdx === idx && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg p-2.5 whitespace-nowrap z-50 shadow-lg">
                    <p className="font-semibold">{stage.name}</p>
                    <p className="text-gray-300 mt-0.5">
                      Dept: {stage.department_name || 'Unassigned'}
                    </p>
                    <p className="text-gray-300">
                      Status: <span className="capitalize">{stage.status.replace('_', ' ')}</span>
                    </p>
                    {stage.approver_name && (
                      <p className="text-gray-300">Approver: {stage.approver_name}</p>
                    )}
                    {stage.planned_end_date && (
                      <p className="text-gray-300">Due: {stage.planned_end_date}</p>
                    )}
                    {stage.is_delayed && (
                      <p className="text-red-400 font-medium mt-0.5">
                        Delayed by {stage.delay_days} day(s)
                      </p>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">
            <span className="font-semibold text-text-primary">{approvedCount}</span> of {totalCount} stages approved
          </span>
          <span
            className="text-sm font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: progressColor + '20', color: progressColor }}
          >
            {progressPercent}% complete
          </span>
        </div>

        {/* Status legend */}
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">{getStatusIcon('approved', 12)} Approved</span>
          <span className="flex items-center gap-1">{getStatusIcon('in_progress', 12)} Active</span>
          <span className="flex items-center gap-1">{getStatusIcon('submitted', 12)} Submitted</span>
          <span className="flex items-center gap-1">{getStatusIcon('rejected', 12)} Rejected</span>
          <span className="flex items-center gap-1">{getStatusIcon('pending', 12)} Pending</span>
        </div>
      </div>
    </div>
  )
}
