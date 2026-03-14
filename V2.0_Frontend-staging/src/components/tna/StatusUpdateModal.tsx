'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface Task {
  id: string
  name: string
  status: string
  plan_start: string | null
  plan_end: string | null
  actual_date: string | null
  assignee_name: string | null
}

interface StatusUpdateModalProps {
  task: Task
  onClose: () => void
  onUpdated: () => void
}

const STATUS_OPTIONS = [
  { value: 'NOT_PLANNED', label: 'Not Planned' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PASS', label: 'Pass' },
  { value: 'FAIL', label: 'Fail' },
  { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
]

export default function StatusUpdateModal({ task, onClose, onUpdated }: StatusUpdateModalProps) {
  const [status, setStatus] = useState(task.status)
  const [actualDate, setActualDate] = useState(task.actual_date || '')
  const [remark, setRemark] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/workflow/tasks/${task.id}/`, {
        status,
        actual_date: actualDate || null,
      })

      // Add comment if remark provided
      if (remark.trim()) {
        await api.post('/comments/', {
          entity_type: 'task',
          entity_id: task.id,
          text: remark.trim(),
        })
      }

      toast.success('Task updated')
      onUpdated()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Update Status</h2>
            <p className="text-xs text-text-muted mt-0.5">{task.name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Actual Date */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Actual Date</label>
            <input
              type="date"
              value={actualDate}
              onChange={(e) => setActualDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Remark */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Remark (optional)</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add a note about this update..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border text-text-muted rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
