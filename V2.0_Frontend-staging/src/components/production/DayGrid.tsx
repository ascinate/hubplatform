'use client'

import { useState, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn, formatNumber } from '@/lib/utils'

interface ProductionDay {
  id: string
  date: string
  actual_lines: number
  actual_pieces_per_line: number
  packed_pieces: number
  actual_pieces: number
}

interface ProductionPlan {
  id: string
  start_date: string
  end_date: string
  planned_lines: number
  daily_pieces_per_line: number
  production_days: number
  total_planned: number
  days: ProductionDay[]
}

interface DayGridProps {
  plan: ProductionPlan
  onDayUpdated: () => void
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDayName(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function getWeekNumber(dateStr: string) {
  const d = new Date(dateStr)
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().split('T')[0]
}

export default function DayGrid({ plan, onDayUpdated }: DayGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [editingCell, setEditingCell] = useState<{ dayId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  const dailyPlanned = plan.planned_lines * plan.daily_pieces_per_line

  // Group days by week
  const weekGroups: { week: number; days: ProductionDay[] }[] = []
  let currentWeek = -1
  for (const day of plan.days) {
    const wk = getWeekNumber(day.date)
    if (wk !== currentWeek) {
      weekGroups.push({ week: wk, days: [] })
      currentWeek = wk
    }
    weekGroups[weekGroups.length - 1].days.push(day)
  }

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth',
      })
    }
  }, [])

  const startEdit = (dayId: string, field: string, currentValue: number) => {
    setEditingCell({ dayId, field })
    setEditValue(String(currentValue))
  }

  const saveEdit = async () => {
    if (!editingCell) return
    const value = parseInt(editValue) || 0
    try {
      await api.put(`/production/days/${editingCell.dayId}/`, {
        [editingCell.field]: value,
      })
      onDayUpdated()
    } catch {
      toast.error('Failed to update')
    }
    setEditingCell(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') setEditingCell(null)
  }

  return (
    <div className="space-y-3">
      {/* Plan summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-muted">
            <span className="font-medium text-text-primary">{plan.planned_lines}</span> lines
          </span>
          <span className="text-text-muted">
            <span className="font-medium text-text-primary">{formatNumber(plan.daily_pieces_per_line)}</span> pcs/line/day
          </span>
          <span className="text-text-muted">
            <span className="font-medium text-text-primary">{plan.production_days}</span> days
          </span>
          <span className="text-text-muted">
            Target: <span className="font-bold text-primary">{formatNumber(plan.total_planned)}</span> pcs
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div ref={scrollRef} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {/* Week headers */}
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 border-r border-border w-32 px-3 py-2 text-left text-xs font-medium text-text-muted">
                  Section
                </th>
                {weekGroups.map((wg) => (
                  <th
                    key={wg.week}
                    colSpan={wg.days.length}
                    className="border-r border-border px-2 py-1.5 text-center text-xs font-semibold text-text-muted"
                  >
                    Week {wg.week}
                  </th>
                ))}
              </tr>
              {/* Day headers */}
              <tr className="bg-gray-50 border-t border-border">
                <th className="sticky left-0 z-10 bg-gray-50 border-r border-border w-32 px-3 py-2 text-left text-xs font-medium text-text-muted">
                  Date
                </th>
                {plan.days.map((day) => (
                  <th
                    key={day.id}
                    className={cn(
                      'border-r border-border px-1.5 py-2 text-center min-w-[70px]',
                      isToday(day.date) && 'bg-primary/5'
                    )}
                  >
                    <div className="text-[10px] text-text-light">{getDayName(day.date)}</div>
                    <div className={cn('text-xs font-medium', isToday(day.date) ? 'text-primary' : 'text-text-muted')}>
                      {formatDateShort(day.date)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* PLANNED row (read-only) */}
              <tr className="border-t border-border">
                <td className="sticky left-0 z-10 bg-blue-50 border-r border-border px-3 py-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Planned
                </td>
                {plan.days.map((day) => (
                  <td
                    key={day.id}
                    className={cn(
                      'border-r border-border px-1.5 py-2 text-center text-xs text-text-muted bg-blue-50/30',
                      isToday(day.date) && 'bg-primary/5'
                    )}
                  >
                    {formatNumber(dailyPlanned)}
                  </td>
                ))}
              </tr>

              {/* ACTUAL row (editable) */}
              <tr className="border-t border-border">
                <td className="sticky left-0 z-10 bg-green-50 border-r border-border px-3 py-2 text-xs font-semibold text-green-700 uppercase tracking-wider">
                  Actual
                </td>
                {plan.days.map((day) => {
                  const isEditing = editingCell?.dayId === day.id && editingCell?.field === 'actual_pieces_per_line'
                  const value = day.actual_lines * day.actual_pieces_per_line
                  const belowPlan = value > 0 && value < dailyPlanned
                  const meetsPlan = value >= dailyPlanned && value > 0

                  return (
                    <td
                      key={day.id}
                      className={cn(
                        'border-r border-border px-1 py-1 text-center min-w-[70px]',
                        isToday(day.date) && 'bg-primary/5',
                        belowPlan && 'bg-red-50',
                        meetsPlan && 'bg-green-50'
                      )}
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 text-xs text-center border border-primary rounded focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(day.id, 'actual_pieces_per_line', day.actual_pieces_per_line)}
                          className="w-full px-1 py-0.5 text-xs rounded hover:bg-gray-100 transition-colors group"
                        >
                          {value > 0 ? (
                            <span className={cn('font-medium', belowPlan ? 'text-danger' : 'text-success')}>
                              {formatNumber(value)}
                            </span>
                          ) : (
                            <span className="text-text-light group-hover:text-primary">
                              <Pencil size={10} className="inline" />
                            </span>
                          )}
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>

              {/* PACKED row (editable) */}
              <tr className="border-t border-border">
                <td className="sticky left-0 z-10 bg-purple-50 border-r border-border px-3 py-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
                  Packed
                </td>
                {plan.days.map((day) => {
                  const isEditing = editingCell?.dayId === day.id && editingCell?.field === 'packed_pieces'

                  return (
                    <td
                      key={day.id}
                      className={cn(
                        'border-r border-border px-1 py-1 text-center min-w-[70px]',
                        isToday(day.date) && 'bg-primary/5'
                      )}
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 text-xs text-center border border-primary rounded focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(day.id, 'packed_pieces', day.packed_pieces)}
                          className="w-full px-1 py-0.5 text-xs rounded hover:bg-gray-100 transition-colors group"
                        >
                          {day.packed_pieces > 0 ? (
                            <span className="font-medium text-purple-600">
                              {formatNumber(day.packed_pieces)}
                            </span>
                          ) : (
                            <span className="text-text-light group-hover:text-primary">
                              <Pencil size={10} className="inline" />
                            </span>
                          )}
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-50 border border-green-200" />
          <span>Meets plan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
          <span>Below plan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/10 border border-primary/20" />
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}
