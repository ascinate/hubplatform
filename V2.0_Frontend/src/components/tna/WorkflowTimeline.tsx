'use client'

import { useState } from 'react'
import {
  CheckCircle2, Circle, XCircle, Clock, Minus, Building2, User,
  Calendar, MessageSquare, Filter,
} from 'lucide-react'

interface Stage {
  id: string
  name: string
  status: string
  status_display: string
  stage_code: string
  sequence_number: number
  department_name: string
  department_code: string
  assigned_to_name: string
  approver_name: string
  planned_start_date: string | null
  planned_end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  is_delayed: boolean
  delay_days: number
  is_required: boolean
  comment_count: number
}

interface Props {
  stages: Stage[]
  onStageClick?: (stage: Stage) => void
}

const STATUS_BORDER: Record<string, string> = {
  approved: 'border-l-green-500',
  in_progress: 'border-l-blue-500',
  submitted: 'border-l-amber-500',
  rejected: 'border-l-red-500',
  skipped: 'border-l-gray-200',
  pending: 'border-l-gray-300',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  approved: <CheckCircle2 size={16} className="text-green-500" />,
  in_progress: <Clock size={16} className="text-blue-500" />,
  submitted: <Circle size={16} className="text-amber-500 fill-amber-200" />,
  rejected: <XCircle size={16} className="text-red-500" />,
  skipped: <Minus size={16} className="text-gray-300" />,
  pending: <Circle size={16} className="text-gray-300" />,
}

export default function WorkflowTimeline({ stages, onStageClick }: Props) {
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const departments = Array.from(new Set(stages.map(s => s.department_name).filter(Boolean)))
  const statuses = ['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'skipped']

  const filtered = stages
    .filter(s => !filterDept || s.department_name === filterDept)
    .filter(s => !filterStatus || s.status === filterStatus)
    .sort((a, b) => a.sequence_number - b.sequence_number)

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Filter size={14} className="text-text-muted" />
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
        <span className="text-xs text-text-muted">{filtered.length} stages</span>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {filtered.map((stage) => (
          <div
            key={stage.id}
            className={`
              relative pl-8 pb-4 border-l-[3px] ml-3
              ${STATUS_BORDER[stage.status] || STATUS_BORDER.pending}
              ${!stage.is_required ? 'opacity-50' : ''}
              cursor-pointer hover:bg-gray-50/50 transition-colors rounded-r-lg
            `}
            onClick={() => onStageClick?.(stage)}
          >
            {/* Timeline dot */}
            <div className="absolute -left-[11px] top-1 bg-white p-0.5">
              {STATUS_ICON[stage.status] || STATUS_ICON.pending}
            </div>

            {/* Card */}
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-text-muted">#{stage.sequence_number}</span>
                  <span className="text-sm font-semibold text-text-primary">{stage.name}</span>
                  {stage.is_delayed && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">
                      {stage.delay_days}d late
                    </span>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  stage.status === 'approved' ? 'bg-green-100 text-green-700' :
                  stage.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  stage.status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                  stage.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {stage.status_display || stage.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-1.5 text-xs text-text-muted">
                {stage.department_name && (
                  <span className="flex items-center gap-1">
                    <Building2 size={10} /> {stage.department_name}
                  </span>
                )}
                {stage.assigned_to_name && (
                  <span className="flex items-center gap-1">
                    <User size={10} /> {stage.assigned_to_name}
                  </span>
                )}
                {(stage.planned_start_date || stage.planned_end_date) && (
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {stage.planned_start_date || '?'} → {stage.planned_end_date || '?'}
                  </span>
                )}
                {stage.comment_count > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare size={10} /> {stage.comment_count}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
