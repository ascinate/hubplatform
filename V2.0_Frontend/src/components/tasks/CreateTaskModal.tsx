'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Calendar, User, Mail, Upload, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

interface OrgUser {
  id: string
  full_name: string
  email: string
  role: string
}

interface Factory {
  id: string
  name: string
}

interface Order {
  id: string
  po_number: string
  style_name?: string
}

const TASK_TYPES = [
  { value: 'inspection', label: 'Inspection' },
  { value: 'lab_test', label: 'Lab Test' },
  { value: 'audit', label: 'Audit' },
  { value: 'document_submission', label: 'Document Submission' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'other', label: 'Other' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low', dot: 'bg-gray-400' },
  { value: 'medium', label: 'Medium', dot: 'bg-blue-500' },
  { value: 'high', label: 'High', dot: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', dot: 'bg-red-500' },
]

const REMINDER_OPTIONS = [
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '7 days before' },
]

export default function CreateTaskModal({ isOpen, onClose, onCreated }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [taskType, setTaskType] = useState('inspection')
  const [priority, setPriority] = useState('medium')
  const [description, setDescription] = useState('')
  const [assignMode, setAssignMode] = useState<'platform' | 'external'>('platform')
  const [assignedTo, setAssignedTo] = useState('')
  const [externalName, setExternalName] = useState('')
  const [externalEmail, setExternalEmail] = useState('')
  const [ccInput, setCcInput] = useState('')
  const [ccEmails, setCcEmails] = useState<string[]>([])
  const [orderId, setOrderId] = useState('')
  const [factoryId, setFactoryId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [reminderDays, setReminderDays] = useState(1)
  const [notifyAssignee, setNotifyAssignee] = useState(true)
  const [notifyCreator, setNotifyCreator] = useState(true)
  const [notifyOverdue, setNotifyOverdue] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [users, setUsers] = useState<OrgUser[]>([])
  const [factories, setFactories] = useState<Factory[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (isOpen) {
      loadOptions()
    }
  }, [isOpen])

  const loadOptions = async () => {
    try {
      const [usersRes, factoriesRes, ordersRes] = await Promise.allSettled([
        api.get('/auth/users/'),
        api.get('/factories/'),
        api.get('/production-orders/'),
      ])
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.results || usersRes.value.data || [])
      if (factoriesRes.status === 'fulfilled') setFactories(factoriesRes.value.data.results || factoriesRes.value.data || [])
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data.results || ordersRes.value.data || [])
    } catch {
      // Options may partially fail
    }
  }

  const handleAddCc = () => {
    const email = ccInput.trim()
    if (email && email.includes('@') && !ccEmails.includes(email)) {
      setCcEmails([...ccEmails, email])
      setCcInput('')
    }
  }

  const removeCc = (email: string) => {
    setCcEmails(ccEmails.filter(e => e !== email))
  }

  const resetForm = () => {
    setTitle('')
    setTaskType('inspection')
    setPriority('medium')
    setDescription('')
    setAssignMode('platform')
    setAssignedTo('')
    setExternalName('')
    setExternalEmail('')
    setCcInput('')
    setCcEmails([])
    setOrderId('')
    setFactoryId('')
    setDueDate('')
    setReminderDays(1)
    setNotifyAssignee(true)
    setNotifyCreator(true)
    setNotifyOverdue(true)
  }

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!dueDate) { toast.error('Due date is required'); return }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        task_type: taskType,
        priority,
        description,
        due_date: dueDate,
        reminder_days: reminderDays,
        notify_assignee: notifyAssignee,
        notify_creator: notifyCreator,
        notify_on_overdue: notifyOverdue,
        cc_emails: ccEmails,
      }

      if (assignMode === 'platform' && assignedTo) {
        payload.assigned_to = assignedTo
      } else if (assignMode === 'external') {
        payload.assigned_to_name = externalName
        payload.assigned_to_email = externalEmail
      }

      if (orderId) payload.order = orderId
      if (factoryId) payload.factory = factoryId

      await api.post('/tasks/', payload)
      toast.success('Task created successfully')
      resetForm()
      onCreated()
      onClose()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; detail?: string } } }
      toast.error(error.response?.data?.error || error.response?.data?.detail || 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
  const selectClass = cn(inputClass, 'appearance-none pr-10 transition-all cursor-pointer bg-white')
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">Create New Task</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Section 1: Task Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Task Details</h3>
            <div>
              <label className={labelClass}>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Final inspection at Factory X" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Task Type *</label>
                <div className="relative group">
                  <select value={taskType} onChange={e => setTaskType(e.target.value)} className={selectClass}>
                    {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-hover:text-primary" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Priority *</label>
                <div className="relative group">
                  <select value={priority} onChange={e => setPriority(e.target.value)} className={selectClass}>
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-hover:text-primary" />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className={cn(inputClass, 'h-20 resize-none')} placeholder="Optional details..." />
            </div>
          </div>

          {/* Section 2: Assignment */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Assignment</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAssignMode('platform')}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', assignMode === 'platform' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600')}
              >
                <User size={14} /> Platform User
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('external')}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', assignMode === 'external' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600')}
              >
                <Mail size={14} /> External / Guest
              </button>
            </div>

            {assignMode === 'platform' ? (
              <div>
                <label className={labelClass}>Assign To</label>
                <div className="relative group">
                  <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className={selectClass}>
                    <option value="">Select a user...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role})</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-hover:text-primary" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Name</label>
                  <input value={externalName} onChange={e => setExternalName(e.target.value)} className={inputClass} placeholder="External name" />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={externalEmail} onChange={e => setExternalEmail(e.target.value)} className={inputClass} placeholder="email@example.com" />
                </div>
              </div>
            )}

            {/* CC Emails */}
            <div>
              <label className={labelClass}>CC Emails</label>
              <div className="flex gap-2">
                <input
                  value={ccInput}
                  onChange={e => setCcInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCc())}
                  className={cn(inputClass, 'flex-1')}
                  placeholder="Add CC email and press Enter"
                />
                <button type="button" onClick={handleAddCc} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              {ccEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {ccEmails.map(email => (
                    <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {email}
                      <button onClick={() => removeCc(email)} className="hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Link to Work */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Link to Work</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Order No</label>
                <div className="relative group">
                  <select value={orderId} onChange={e => setOrderId(e.target.value)} className={selectClass}>
                    <option value="">None</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.po_number}{o.style_name ? ` — ${o.style_name}` : ''}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-hover:text-primary" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Factory</label>
                <div className="relative group">
                  <select value={factoryId} onChange={e => setFactoryId(e.target.value)} className={selectClass}>
                    <option value="">None</option>
                    {factories.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-hover:text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Schedule */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Due Date *</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={cn(inputClass, 'pl-10')} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Reminder</label>
                <div className="relative group">
                  <select value={reminderDays} onChange={e => setReminderDays(Number(e.target.value))} className={selectClass}>
                    {REMINDER_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-hover:text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Notifications */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notifications</h3>
            <div className="space-y-2">
              <Toggle label="Notify assignee" checked={notifyAssignee} onChange={setNotifyAssignee} />
              <Toggle label="Notify me on completion" checked={notifyCreator} onChange={setNotifyCreator} />
              <Toggle label="Alert if overdue" checked={notifyOverdue} onChange={setNotifyOverdue} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Create Task
          </button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-gray-300'
        )}
      >
        <span className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5'
        )} />
      </button>
    </label>
  )
}
