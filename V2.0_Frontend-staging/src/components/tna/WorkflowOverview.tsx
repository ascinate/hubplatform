'use client'

import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

interface Task {
  id: string
  name: string
  status: string
  plan_start: string | null
  plan_end: string | null
  actual_date: string | null
  assignee_name: string | null
}

interface Stage {
  id: string
  name: string
  sort_order: number
  completed_count: number
  total_count: number
  tasks: Task[]
}

interface WorkflowOverviewProps {
  stages: Stage[]
  dueDate: string | null
}

function getStageColor(index: number) {
  const colors = ['#E67E22', '#2E86C1', '#27AE60', '#E74C3C', '#9B59B6', '#1ABC9C', '#F39C12']
  return colors[index % colors.length]
}

function CircularProgress({ percent, color, size = 48 }: { percent: number; color: string; size?: number }) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  )
}

export default function WorkflowOverview({ stages, dueDate }: WorkflowOverviewProps) {
  const stats = useMemo(() => {
    let totalTasks = 0
    let completedTasks = 0
    let overdueTasks = 0
    const today = new Date().toISOString().split('T')[0]

    for (const stage of stages) {
      for (const task of stage.tasks) {
        totalTasks++
        if (['APPROVED', 'PASS'].includes(task.status)) {
          completedTasks++
        } else if (task.plan_end && task.plan_end < today && !['APPROVED', 'PASS', 'NOT_APPLICABLE'].includes(task.status)) {
          overdueTasks++
        }
      }
    }

    const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    return { totalTasks, completedTasks, overdueTasks, percent }
  }, [stages])

  const daysUntilDelivery = useMemo(() => {
    if (!dueDate) return null
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff
  }, [dueDate])

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Workflow Progress</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-text-muted">
            <span className="font-semibold text-text-primary">{stats.completedTasks}/{stats.totalTasks}</span> tasks ({stats.percent}% done)
          </span>
          {stats.overdueTasks > 0 && (
            <span className="flex items-center gap-1 text-danger font-medium">
              <AlertTriangle size={12} />
              {stats.overdueTasks} overdue
            </span>
          )}
          {daysUntilDelivery !== null && (
            <span className={cn(
              'flex items-center gap-1 font-medium',
              daysUntilDelivery <= 7 ? 'text-danger' : daysUntilDelivery <= 30 ? 'text-warning' : 'text-success'
            )}>
              <Clock size={12} />
              {daysUntilDelivery > 0 ? `${daysUntilDelivery}d to delivery` : 'Past due'}
            </span>
          )}
        </div>
      </div>

      {/* Stage progress indicators */}
      <div className="flex items-center gap-5 overflow-x-auto pb-2">
        {stages.map((stage, i) => {
          const percent = stage.total_count > 0
            ? Math.round((stage.completed_count / stage.total_count) * 100)
            : 0
          const color = getStageColor(i)

          return (
            <div key={stage.id} className="flex flex-col items-center gap-1.5 min-w-[64px]">
              <div className="relative">
                <CircularProgress percent={percent} color={color} size={48} />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-primary">
                  {percent}%
                </span>
              </div>
              <span className="text-[10px] text-text-muted text-center truncate max-w-[72px]" title={stage.name}>
                {stage.name}
              </span>
              <span className="text-[9px] text-text-light">
                {stage.completed_count}/{stage.total_count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
