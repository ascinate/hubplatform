'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import {
  X, Send, CheckCircle2, XCircle, Clock, Building2, User, Calendar,
  MessageSquare, AlertTriangle, ChevronDown,
} from 'lucide-react'

interface StageData {
  id: string
  name: string
  status: string
  stage_code: string
  sequence_number: number
  department_name: string
  assigned_to: string | null
  assigned_to_name: string
  approver: string | null
  approver_name: string
  planned_start_date: string | null
  planned_end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  is_delayed: boolean
  delay_days: number
  is_required: boolean
  tasks: any[]
  comment_count: number
}

interface StageComment {
  id: string
  user_name: string
  user_email: string
  comment_type: string
  text: string
  created_at: string
}

interface Props {
  orderId: string
  stage: StageData
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

const COMMENT_TYPE_COLORS: Record<string, string> = {
  submission_note: 'bg-blue-100 text-blue-700',
  approval_note: 'bg-green-100 text-green-700',
  rejection_reason: 'bg-red-100 text-red-700',
  challenge: 'bg-orange-100 text-orange-700',
  feedback: 'bg-purple-100 text-purple-700',
  delay_reason: 'bg-amber-100 text-amber-700',
  general: 'bg-gray-100 text-gray-700',
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Pending' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  submitted: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Submitted' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  skipped: { bg: 'bg-gray-50', text: 'text-gray-400', label: 'Skipped' },
}

export default function StageDrawer({ orderId, stage, open, onClose, onUpdate }: Props) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState<StageComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentType, setCommentType] = useState('general')
  const [submitting, setSubmitting] = useState(false)
  const [transitionText, setTransitionText] = useState('')

  useEffect(() => {
    if (open && stage) {
      fetchComments()
      setTransitionText('')
      setCommentText('')
    }
  }, [open, stage?.id])

  const fetchComments = async () => {
    setLoadingComments(true)
    try {
      const res = await api.get(`/orders/${orderId}/workflow/${stage.id}/comments/`)
      setComments(res.data)
    } catch {} finally {
      setLoadingComments(false)
    }
  }

  const handleTransition = async (action: 'submit' | 'approve' | 'reject') => {
    const minChars = action === 'reject' ? 20 : 10
    if (transitionText.trim().length < minChars) {
      toast.error(`Comment must be at least ${minChars} characters`)
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/orders/${orderId}/workflow/${stage.id}/${action}/`, {
        comment_text: transitionText.trim(),
      })
      toast.success(action === 'submit' ? 'Submitted for approval' : action === 'approve' ? 'Stage approved' : 'Stage rejected')
      setTransitionText('')
      onUpdate()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || `Failed to ${action}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddComment = async () => {
    if (commentText.trim().length < 5) {
      toast.error('Comment must be at least 5 characters')
      return
    }
    try {
      await api.post(`/orders/${orderId}/workflow/${stage.id}/comments/`, {
        comment_type: commentType,
        text: commentText.trim(),
      })
      setCommentText('')
      fetchComments()
      toast.success('Comment added')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to add comment')
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  if (!open) return null

  const statusCfg = STATUS_CONFIG[stage.status] || STATUS_CONFIG.pending
  const isAssignee = user?.id === stage.assigned_to
  const isApprover = user?.id === stage.approver
  const isAdmin = user?.role === 'admin' || user?.role === 'org_admin'
  const canSubmit = (isAssignee || isAdmin) && stage.status === 'in_progress'
  const canApprove = (isApprover || isAdmin) && stage.status === 'submitted'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-text-muted">#{stage.sequence_number}</span>
              <h3 className="font-semibold text-text-primary">{stage.name}</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.bg} ${statusCfg.text}`}>
              {statusCfg.label}
            </span>
            {stage.department_name && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                <Building2 size={10} /> {stage.department_name}
              </span>
            )}
            {stage.is_delayed && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                <AlertTriangle size={10} /> Delayed {stage.delay_days}d
              </span>
            )}
          </div>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* People */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-gray-50 rounded-lg">
              <p className="text-[10px] uppercase text-text-muted font-medium">Assigned To</p>
              <p className="text-sm text-text-primary mt-0.5 flex items-center gap-1">
                <User size={12} /> {stage.assigned_to_name || 'Unassigned'}
              </p>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg">
              <p className="text-[10px] uppercase text-text-muted font-medium">Approver</p>
              <p className="text-sm text-text-primary mt-0.5 flex items-center gap-1">
                <User size={12} /> {stage.approver_name || 'Unassigned'}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-gray-50 rounded-lg">
              <p className="text-[10px] uppercase text-text-muted font-medium">Planned</p>
              <p className="text-sm text-text-primary mt-0.5 flex items-center gap-1">
                <Calendar size={12} />
                {stage.planned_start_date || '—'} → {stage.planned_end_date || '—'}
              </p>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg">
              <p className="text-[10px] uppercase text-text-muted font-medium">Actual</p>
              <p className="text-sm text-text-primary mt-0.5 flex items-center gap-1">
                <Calendar size={12} />
                {stage.actual_start_date || '—'} → {stage.actual_end_date || '—'}
              </p>
            </div>
          </div>

          {/* Tasks */}
          {stage.tasks && stage.tasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase mb-2">Tasks</p>
              <div className="space-y-1.5">
                {stage.tasks.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={task.is_completed || task.status === 'APPROVED' || task.status === 'PASS'}
                      readOnly
                      className="w-4 h-4 rounded border-gray-300 text-primary"
                    />
                    <span className={`text-sm ${task.is_completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {task.name}
                    </span>
                    <span className="ml-auto text-xs text-text-muted">{task.status_display}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase mb-2 flex items-center gap-1">
              <MessageSquare size={12} /> Comments ({comments.length})
            </p>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {loadingComments ? (
                <p className="text-xs text-text-muted">Loading...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-text-muted py-2">No comments yet</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-text-primary">{c.user_name || c.user_email}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${COMMENT_TYPE_COLORS[c.comment_type] || COMMENT_TYPE_COLORS.general}`}>
                        {c.comment_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-text-muted ml-auto">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-text-primary">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add comment */}
            <div className="mt-2 flex gap-2">
              <select
                value={commentType}
                onChange={e => setCommentType(e.target.value)}
                className="px-2 py-1.5 border border-border rounded-lg text-xs"
              >
                <option value="general">General</option>
                <option value="challenge">Challenge</option>
                <option value="feedback">Feedback</option>
                <option value="delay_reason">Delay Reason</option>
              </select>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm"
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                disabled={commentText.trim().length < 5}
                className="px-3 py-1.5 bg-gray-100 text-text-primary rounded-lg hover:bg-gray-200 disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {(canSubmit || canApprove) && (
          <div className="p-4 border-t border-border space-y-3">
            <textarea
              value={transitionText}
              onChange={e => setTransitionText(e.target.value)}
              placeholder={canApprove
                ? 'Add approval/rejection note (min 10 chars, rejection needs 20)...'
                : 'Add submission note (min 10 characters)...'
              }
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
            />
            <div className="flex gap-2">
              {canSubmit && (
                <button
                  onClick={() => handleTransition('submit')}
                  disabled={submitting || transitionText.trim().length < 10}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-40"
                >
                  <Send size={14} /> Submit for Approval
                </button>
              )}
              {canApprove && (
                <>
                  <button
                    onClick={() => handleTransition('approve')}
                    disabled={submitting || transitionText.trim().length < 10}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-40"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleTransition('reject')}
                    disabled={submitting || transitionText.trim().length < 20}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-40"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </>
              )}
            </div>
            <p className="text-[10px] text-text-muted">
              {transitionText.trim().length} chars
              {canSubmit && ' (min 10 to submit)'}
              {canApprove && ' (min 10 to approve, min 20 to reject)'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
