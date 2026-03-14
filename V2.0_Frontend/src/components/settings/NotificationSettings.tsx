'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface NotifPref {
  in_app: boolean
  email: boolean
}

type Preferences = Record<string, NotifPref>

const NOTIFICATION_TYPES = [
  { key: 'task_assigned', label: 'Task Assigned', description: 'When a task is assigned to you' },
  { key: 'task_reminder', label: 'Task Reminder', description: 'Reminder before a task is due' },
  { key: 'task_overdue', label: 'Task Overdue', description: 'When a task passes its due date' },
  { key: 'task_completed', label: 'Task Completed', description: 'When a task you created is completed' },
  { key: 'task_updated', label: 'Task Updated', description: 'When changes are made to your tasks' },
  { key: 'task_cancelled', label: 'Task Cancelled', description: 'When a task is cancelled' },
  { key: 'stage_submitted', label: 'Stage Submitted', description: 'When a workflow stage is submitted' },
  { key: 'stage_approved', label: 'Stage Approved', description: 'When a workflow stage is approved' },
  { key: 'stage_rejected', label: 'Stage Rejected', description: 'When a workflow stage is rejected' },
  { key: 'delay_alert', label: 'Delay Alert', description: 'When a workflow stage is delayed' },
]

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<Preferences>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPrefs()
  }, [])

  const loadPrefs = async () => {
    try {
      const { data } = await api.get('/auth/notification-preferences/')
      setPrefs(data)
    } catch {
      toast.error('Failed to load notification preferences')
    } finally {
      setLoading(false)
    }
  }

  const togglePref = async (key: string, channel: 'in_app' | 'email') => {
    const current = prefs[key] || { in_app: true, email: false }
    const updated = { ...prefs, [key]: { ...current, [channel]: !current[channel] } }
    setPrefs(updated)

    setSaving(true)
    try {
      await api.patch('/auth/notification-preferences/', updated)
      toast.success('Preference updated')
    } catch {
      // Revert on failure
      setPrefs(prefs)
      toast.error('Failed to save preference')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
            <p className="text-sm text-gray-500">Choose how you want to be notified for each event type.</p>
          </div>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_60px_60px] lg:grid-cols-[1fr_80px_80px] gap-2 lg:gap-4 px-3 lg:px-4 py-2 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase">Notification Type</div>
          <div className="text-xs font-semibold text-gray-500 uppercase text-center flex items-center justify-center gap-1">
            <Smartphone size={12} /> <span className="hidden sm:inline">In-App</span><span className="sm:hidden">App</span>
          </div>
          <div className="text-xs font-semibold text-gray-500 uppercase text-center flex items-center justify-center gap-1">
            <Mail size={12} /> Email
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {NOTIFICATION_TYPES.map(type => {
            const pref = prefs[type.key] || { in_app: true, email: false }
            return (
              <div key={type.key} className="grid grid-cols-[1fr_60px_60px] lg:grid-cols-[1fr_80px_80px] gap-2 lg:gap-4 px-3 lg:px-4 py-3 items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-400 hidden sm:block">{type.description}</p>
                </div>
                <div className="flex justify-center">
                  <ToggleSwitch checked={pref.in_app} onChange={() => togglePref(type.key, 'in_app')} />
                </div>
                <div className="flex justify-center">
                  <ToggleSwitch checked={pref.email} onChange={() => togglePref(type.key, 'email')} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
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
  )
}
