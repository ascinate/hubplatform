'use client'

import { Camera, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

interface IssuePanelProps {
  className?: string
}

const activityTimeline = [
  {
    id: '1',
    color: 'bg-danger',
    text: 'Issue flagged by QC Inspector Meera Patel',
    time: '2h ago',
  },
  {
    id: '2',
    color: 'bg-warning',
    text: 'Assigned to Robert Chen for resolution',
    time: '1h 45m ago',
  },
  {
    id: '3',
    color: 'bg-primary',
    text: 'Root cause analysis initiated on Line 4',
    time: '58m ago',
  },
]

export default function IssuePanel({ className }: IssuePanelProps) {
  return (
    <div className={cn('flex flex-col bg-white overflow-y-auto', className)}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wide">
          Linked Primary Issue
        </h3>
      </div>

      {/* Issue card */}
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-text-primary leading-snug">
              Stitching Issue: Side Pockets
            </h4>
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-danger/10 text-danger flex-shrink-0">
              Critical Priority
            </span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Uneven stitch alignment detected on left side pocket across 142 units from Line 4.
            Seam allowance deviation of 3mm beyond tolerance.
          </p>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Status:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/10 text-warning">
              <Clock size={10} />
              In Progress
            </span>
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Assignee:</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-semibold">
                {getInitials('Robert Chen')}
              </div>
              <span className="text-xs font-medium text-text-primary">Robert Chen</span>
            </div>
          </div>
        </div>

        {/* Evidence Photos */}
        <div>
          <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wide mb-3">
            Evidence Photos
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-gray-100 border border-border flex items-center justify-center"
              >
                <Camera size={20} className="text-text-muted/40" />
              </div>
            ))}
          </div>
        </div>

        {/* Execution Activity */}
        <div>
          <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wide mb-3">
            Execution Activity
          </h4>
          <div className="space-y-3">
            {activityTimeline.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1', entry.color)} />
                  {entry.id !== '3' && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-xs text-text-primary leading-relaxed">
                    {entry.text}
                  </p>
                  <span className="text-[10px] text-text-muted">{entry.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resolve button */}
        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-success hover:bg-success/90 text-white text-sm font-medium rounded-lg transition-colors">
          <CheckCircle size={16} />
          Resolve Issue
        </button>
      </div>
    </div>
  )
}
