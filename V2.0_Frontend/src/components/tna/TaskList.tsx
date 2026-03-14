'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronRight,
  User,
  CalendarDays,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

interface Task {
  id: string
  name: string
  status: string
  status_display: string
  plan_start: string | null
  plan_end: string | null
  actual_date: string | null
  assignee: string | null
  assignee_name: string | null
  sort_order: number
}

interface Stage {
  id: string
  name: string
  sort_order: number
  completed_count: number
  total_count: number
  tasks: Task[]
}

interface TaskListProps {
  stages: Stage[]
  onTaskClick: (task: Task) => void
  onStatusUpdate: (task: Task) => void
}

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  NOT_PLANNED: { color: 'text-gray-500', bg: 'bg-gray-100', icon: Clock },
  PLANNED: { color: 'text-blue-600', bg: 'bg-blue-50', icon: CalendarDays },
  SUBMITTED: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  APPROVED: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  REJECTED: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  PASS: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  FAIL: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  NOT_APPLICABLE: { color: 'text-gray-400', bg: 'bg-gray-50', icon: Clock },
}

function isOverdue(task: Task) {
  if (!task.plan_end) return false
  if (['APPROVED', 'PASS', 'NOT_APPLICABLE'].includes(task.status)) return false
  return task.plan_end < new Date().toISOString().split('T')[0]
}

export default function TaskList({ stages, onTaskClick, onStatusUpdate }: TaskListProps) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set(stages.map((s) => s.id))
  )

  const toggleStage = (id: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const stageColors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-teal-500', 'bg-yellow-500']

  return (
    <div className="space-y-3">
      {stages.map((stage, stageIndex) => {
        const isExpanded = expandedStages.has(stage.id)
        const stageColor = stageColors[stageIndex % stageColors.length]

        return (
          <div key={stage.id} className="border border-border rounded-xl overflow-hidden">
            {/* Stage header */}
            <button
              onClick={() => toggleStage(stage.id)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div className={cn('w-1 h-8 rounded-full', stageColor)} />
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="font-semibold text-sm text-text-primary flex-1">{stage.name}</span>
              <span className="text-xs text-text-muted">
                {stage.completed_count}/{stage.total_count} done
              </span>
              {/* Mini progress bar */}
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', stageColor)}
                  style={{ width: `${stage.total_count > 0 ? (stage.completed_count / stage.total_count) * 100 : 0}%` }}
                />
              </div>
            </button>

            {/* Tasks */}
            {isExpanded && (
              <div className="divide-y divide-border">
                {stage.tasks.map((task) => {
                  const config = statusConfig[task.status] || statusConfig.NOT_PLANNED
                  const StatusIcon = config.icon
                  const overdue = isOverdue(task)

                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors',
                        overdue && 'bg-red-50/30'
                      )}
                    >
                      {/* Task name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-primary truncate">{task.name}</span>
                          {overdue && (
                            <AlertTriangle size={12} className="text-danger flex-shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Plan dates */}
                      <div className="text-xs text-text-muted w-32 text-center">
                        {task.plan_start && task.plan_end ? (
                          <span className={cn(overdue && 'text-danger')}>
                            {formatDate(task.plan_start)} - {formatDate(task.plan_end)}
                          </span>
                        ) : (
                          <span className="text-text-light">No dates</span>
                        )}
                      </div>

                      {/* Assignee */}
                      <div className="w-28 text-center">
                        {task.assignee_name ? (
                          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                            <User size={11} />
                            <span className="truncate max-w-[80px]">{task.assignee_name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-text-light">Unassigned</span>
                        )}
                      </div>

                      {/* Status badge */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onStatusUpdate(task)
                        }}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                          config.bg, config.color
                        )}
                      >
                        <StatusIcon size={11} />
                        {task.status_display || task.status.replace('_', ' ')}
                      </button>
                    </div>
                  )
                })}

                {stage.tasks.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-text-light">
                    No tasks in this stage
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
