'use client'

import { useState, useEffect } from 'react'
import { X, Clock, AlertTriangle, CheckCircle, User, Building2, FileText, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { cn, formatDate } from '@/lib/utils'
import { Task, TaskActivity, STATUS_COLORS, PRIORITY_COLORS, CAN_CREATE_TASK } from '@/types/task'

interface TaskDetailPanelProps {
  task: Task
  onClose: () => void
  onUpdated: () => void
}

export default function TaskDetailPanel({ task, onClose, onUpdated }: TaskDetailPanelProps) {
  const { user } = useAuthStore()
  const [activities, setActivities] = useState<TaskActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [updating, setUpdating] = useState(false)

  const isAdmin = CAN_CREATE_TASK.includes(user?.role || '')
  const isAssignee = user?.id === task.assigned_to
  const isCreator = user?.id === task.created_by
  const isOverdue = task.status === 'overdue' || (task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.due_date) < new Date())

  useEffect(() => {
    loadActivities()
  }, [task.id])

  const loadActivities = async () => {
    setLoadingActivities(true)
    try {
      const { data } = await api.get(`/tasks/${task.id}/activities/`)
      setActivities(data)
    } catch {
      // silently fail
    } finally {
      setLoadingActivities(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      await api.patch(`/tasks/${task.id}/status/`, { status: newStatus })
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`)
      onUpdated()
    } catch {
      toast.error('Failed to update task status')
    } finally {
      setUpdating(false)
    }
  }

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      created: 'Created task',
      status_changed: 'Changed status',
      assigned: 'Reassigned',
      attachment_added: 'Added attachment',
    }
    return map[action] || action
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-[460px] bg-white shadow-xl overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase', STATUS_COLORS[task.status])}>
                  {task.status_display}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-500 uppercase">
                  <span className={cn('w-2 h-2 rounded-full', PRIORITY_COLORS[task.priority])} />
                  {task.priority_display}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">{task.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{task.task_type_display}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Assignment */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Assigned to</p>
              <p className="text-sm font-medium text-gray-900">{task.assigned_to_name_display || 'Unassigned'}</p>
              {task.assigned_to_email && (
                <p className="text-xs text-gray-400">{task.assigned_to_email}</p>
              )}
            </div>
          </div>

          {/* Due date */}
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', isOverdue ? 'bg-red-50' : 'bg-gray-100')}>
              <CalendarDays size={16} className={isOverdue ? 'text-red-500' : 'text-gray-500'} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Due date</p>
              <p className={cn('text-sm font-medium', isOverdue ? 'text-red-600' : 'text-gray-900')}>
                {formatDate(task.due_date)}
                {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
              </p>
            </div>
          </div>

          {/* Linked entities */}
          {task.order_po_number && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Order</p>
                <p className="text-sm font-medium text-gray-900">{task.order_po_number}</p>
              </div>
            </div>
          )}

          {task.factory_name && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Factory</p>
                <p className="text-sm font-medium text-gray-900">{task.factory_name}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Creator */}
          <div className="text-xs text-gray-400">
            Created by {task.created_by_name} on {formatDate(task.created_at)}
          </div>

          {/* Action buttons */}
          {task.status !== 'completed' && task.status !== 'cancelled' && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {(task.status === 'open') && (isAssignee || isAdmin) && (
                <button
                  onClick={() => updateStatus('in_progress')}
                  disabled={updating}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Clock size={16} /> Start Working
                </button>
              )}

              {(task.status === 'in_progress' || task.status === 'overdue') && (isAssignee || isAdmin) && (
                <button
                  onClick={() => updateStatus('completed')}
                  disabled={updating}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Mark Complete
                </button>
              )}

              {(isCreator || isAdmin) && (
                <button
                  onClick={() => updateStatus('cancelled')}
                  disabled={updating}
                  className="w-full py-2.5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <X size={16} /> Cancel Task
                </button>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Activity</h4>
            {loadingActivities ? (
              <div className="flex justify-center py-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{activity.user_name || 'System'}</span>{' '}
                        {actionLabel(activity.action)}
                        {activity.old_value && activity.new_value && (
                          <span className="text-gray-500"> from {activity.old_value} to {activity.new_value}</span>
                        )}
                        {!activity.old_value && activity.new_value && (
                          <span className="text-gray-500">: {activity.new_value}</span>
                        )}
                      </p>
                      {activity.note && <p className="text-xs text-gray-500 mt-0.5">{activity.note}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(activity.created_at, 'long')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
