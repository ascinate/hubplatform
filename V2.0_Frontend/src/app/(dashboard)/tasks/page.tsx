'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search,
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  ListChecks,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { cn, formatDate } from '@/lib/utils'
import { Task, TaskStats, CAN_CREATE_TASK, STATUS_COLORS, PRIORITY_COLORS } from '@/types/task'
import CreateTaskModal from '@/components/tasks/CreateTaskModal'
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel'

const STATUS_CARDS = [
  { key: 'open' as const, label: 'Open', icon: ClipboardList, bg: 'bg-blue-50', text: 'text-blue-600' },
  { key: 'in_progress' as const, label: 'In Progress', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600' },
  { key: 'overdue' as const, label: 'Overdue', icon: AlertTriangle, bg: 'bg-red-50', text: 'text-red-600' },
  { key: 'completed' as const, label: 'Completed', icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-600' },
  { key: 'cancelled' as const, label: 'Cancelled', icon: XCircle, bg: 'bg-gray-50', text: 'text-gray-500' },
]

const TASK_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'lab_test', label: 'Lab Test' },
  { value: 'audit', label: 'Audit' },
  { value: 'document_submission', label: 'Document Submission' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'other', label: 'Other' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export default function TasksPage() {
  const { user } = useAuthStore()
  const canCreate = CAN_CREATE_TASK.includes(user?.role || '')

  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats>({ open: 0, in_progress: 0, overdue: 0, completed: 0, cancelled: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      if (typeFilter) params.task_type = typeFilter
      if (search) params.search = search

      const [tasksRes, statsRes] = await Promise.allSettled([
        api.get('/tasks/', { params }),
        api.get('/tasks/stats/'),
      ])

      if (tasksRes.status === 'fulfilled') {
        setTasks(tasksRes.value.data.results || tasksRes.value.data || [])
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data)
      }
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter, typeFilter, search])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleStatusCardClick = (key: string) => {
    setStatusFilter(statusFilter === key ? '' : key)
  }

  const selectClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Tasks</h1>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Create Task
          </button>
        )}
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {STATUS_CARDS.map(card => (
          <button
            key={card.key}
            onClick={() => handleStatusCardClick(card.key)}
            className={cn(
              'flex items-center gap-3 p-3 lg:p-4 rounded-xl border transition-all hover:shadow-sm',
              card.bg,
              statusFilter === card.key ? 'ring-2 ring-primary border-primary' : 'border-gray-200'
            )}
          >
            <card.icon size={20} className={cn(card.text, 'flex-shrink-0')} />
            <div className="text-left">
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats[card.key]}</p>
              <p className="text-[10px] lg:text-xs text-gray-500">{card.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex-1 relative min-w-0 sm:min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className={selectClass}>
          {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selectClass}>
          {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Mobile task cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center">
            <ListChecks size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No tasks yet</p>
            <p className="text-xs text-gray-400 mt-1">
              {canCreate ? 'Tap "Create Task" to get started.' : 'Tasks assigned to you will appear here.'}
            </p>
          </div>
        ) : (
          tasks.map(task => {
            const isDue = task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.due_date) < new Date()
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900 flex-1 mr-2">{task.title}</p>
                  <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0', STATUS_COLORS[task.status])}>
                    {task.status_display}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Type</p>
                    <p className="text-sm text-gray-600">{task.task_type_display}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Priority</p>
                    <span className="flex items-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', PRIORITY_COLORS[task.priority])} />
                      <span className="text-sm text-gray-600">{task.priority_display}</span>
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Assigned To</p>
                    <p className="text-sm text-gray-600 truncate">{task.assigned_to_name_display || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Due Date</p>
                    <p className={cn('text-sm', isDue ? 'text-red-600 font-medium' : 'text-gray-600')}>
                      {formatDate(task.due_date)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop task table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Factory</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <ListChecks size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No tasks yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {canCreate ? 'Click "+ Create Task" to get started.' : 'Tasks assigned to you will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                tasks.map(task => {
                  const isDue = task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.due_date) < new Date()
                  return (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">{task.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{task.task_type_display}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={cn('w-2 h-2 rounded-full', PRIORITY_COLORS[task.priority])} />
                          <span className="text-sm text-gray-600">{task.priority_display}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{task.assigned_to_name_display || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{task.order_po_number || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{task.factory_name || '—'}</td>
                      <td className={cn('px-4 py-3 text-sm', isDue ? 'text-red-600 font-medium' : 'text-gray-600')}>
                        {formatDate(task.due_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLORS[task.status])}>
                          {task.status_display}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadData}
      />

      {/* Detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => {
            setSelectedTask(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}
