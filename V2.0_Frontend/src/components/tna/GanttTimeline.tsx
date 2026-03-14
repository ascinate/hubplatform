'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  name: string
  status: string
  plan_start: string | null
  plan_end: string | null
  actual_date: string | null
}

interface Stage {
  id: string
  name: string
  sort_order: number
  tasks: Task[]
}

interface GanttTimelineProps {
  stages: Stage[]
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'planned', label: 'Planned' },
  { key: 'not_planned', label: 'Not Planned' },
  { key: 'done', label: 'Done' },
]

function getMonthsBetween(start: Date, end: Date) {
  const months: { year: number; month: number; label: string; days: number }[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  while (current <= end) {
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
    months.push({
      year: current.getFullYear(),
      month: current.getMonth(),
      label: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      days: daysInMonth,
    })
    current.setMonth(current.getMonth() + 1)
  }
  return months
}

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export default function GanttTimeline({ stages }: GanttTimelineProps) {
  const [filter, setFilter] = useState('all')
  const today = new Date().toISOString().split('T')[0]

  // Compute timeline range
  const { timelineStart, timelineEnd, totalDays, months } = useMemo(() => {
    let minDate = new Date()
    let maxDate = new Date()
    let hasDate = false

    for (const stage of stages) {
      for (const task of stage.tasks) {
        if (task.plan_start) {
          const d = new Date(task.plan_start)
          if (!hasDate || d < minDate) minDate = new Date(d)
          hasDate = true
        }
        if (task.plan_end) {
          const d = new Date(task.plan_end)
          if (!hasDate || d > maxDate) maxDate = new Date(d)
          hasDate = true
        }
      }
    }

    // Add buffer
    const start = new Date(minDate)
    start.setDate(start.getDate() - 7)
    const end = new Date(maxDate)
    end.setDate(end.getDate() + 14)

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: daysBetween(start, end),
      months: getMonthsBetween(start, end),
    }
  }, [stages])

  const getBarPosition = (startDate: string, endDate: string) => {
    const start = daysBetween(timelineStart, new Date(startDate))
    const end = daysBetween(timelineStart, new Date(endDate))
    const left = (start / totalDays) * 100
    const width = Math.max(((end - start) / totalDays) * 100, 0.5)
    return { left: `${left}%`, width: `${width}%` }
  }

  const todayPosition = useMemo(() => {
    const days = daysBetween(timelineStart, new Date())
    return `${(days / totalDays) * 100}%`
  }, [timelineStart, totalDays])

  // Filter tasks
  const filteredStages = useMemo(() => {
    return stages.map((stage) => ({
      ...stage,
      tasks: stage.tasks.filter((task) => {
        if (filter === 'all') return true
        if (filter === 'done') return ['APPROVED', 'PASS'].includes(task.status)
        if (filter === 'overdue') return task.plan_end && task.plan_end < today && !['APPROVED', 'PASS', 'NOT_APPLICABLE'].includes(task.status)
        if (filter === 'upcoming') return task.plan_end && task.plan_end >= today && task.plan_end <= new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
        if (filter === 'planned') return task.status === 'PLANNED'
        if (filter === 'not_planned') return task.status === 'NOT_PLANNED'
        return true
      }),
    })).filter((s) => s.tasks.length > 0)
  }, [stages, filter, today])

  const stageColors = ['#E67E22', '#2E86C1', '#27AE60', '#E74C3C', '#9B59B6', '#1ABC9C', '#F39C12']

  return (
    <div className="space-y-3">
      {/* Filter row */}
      <div className="flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1 text-xs rounded-full border transition-colors',
              filter === f.key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-text-muted border-border hover:border-primary/30'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Gantt chart */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="flex">
          {/* Left column: task names */}
          <div className="w-48 flex-shrink-0 border-r border-border bg-gray-50">
            {/* Month header placeholder */}
            <div className="h-8 border-b border-border" />

            {filteredStages.map((stage, si) => (
              <div key={stage.id}>
                {/* Stage label */}
                <div className="px-3 py-1.5 bg-gray-100 border-b border-border">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {stage.name}
                  </span>
                </div>
                {/* Task labels */}
                {stage.tasks.map((task) => (
                  <div key={task.id} className="px-3 py-2 border-b border-border">
                    <span className="text-xs text-text-primary truncate block">{task.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Right column: timeline */}
          <div className="flex-1 overflow-x-auto">
            {/* Month headers */}
            <div className="flex h-8 border-b border-border">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="border-r border-border text-center text-[10px] font-medium text-text-muted flex items-center justify-center"
                  style={{ minWidth: `${m.days * 3}px` }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Task bars */}
            <div className="relative">
              {/* Today line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-primary z-10"
                style={{ left: todayPosition }}
              >
                <div className="absolute -top-0 -left-2 bg-primary text-white text-[8px] px-1 rounded-b">
                  Today
                </div>
              </div>

              {filteredStages.map((stage, si) => (
                <div key={stage.id}>
                  {/* Stage spacer */}
                  <div className="h-[30px] bg-gray-50 border-b border-border" />

                  {/* Task rows */}
                  {stage.tasks.map((task) => {
                    const color = stageColors[si % stageColors.length]
                    const isOverdue = task.plan_end && task.plan_end < today && !['APPROVED', 'PASS', 'NOT_APPLICABLE'].includes(task.status)
                    const isDone = ['APPROVED', 'PASS'].includes(task.status)

                    return (
                      <div
                        key={task.id}
                        className="relative h-[33px] border-b border-border"
                        style={{ minWidth: `${totalDays * 3}px` }}
                      >
                        {task.plan_start && task.plan_end && (
                          <div
                            className={cn(
                              'absolute top-[8px] h-[17px] rounded-full',
                              isDone ? 'opacity-60' : ''
                            )}
                            style={{
                              ...getBarPosition(task.plan_start, task.plan_end),
                              backgroundColor: isOverdue ? '#E74C3C' : color,
                            }}
                            title={`${task.name}: ${task.plan_start} → ${task.plan_end}`}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
