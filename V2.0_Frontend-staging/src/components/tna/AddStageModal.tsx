'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface AddStageModalProps {
  orderId: string
  onClose: () => void
  onCreated: () => void
}

const DEFAULT_STAGES = [
  'COLOR',
  'FABRIC',
  'SAMPLING',
  'PP MEETING',
  'PRODUCTION',
  'QUALITY',
  'CERTIFICATIONS',
]

export default function AddStageModal({ orderId, onClose, onCreated }: AddStageModalProps) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedDefaults, setSelectedDefaults] = useState<Set<string>>(new Set())

  const toggleDefault = (stage: string) => {
    setSelectedDefaults((prev) => {
      const next = new Set(prev)
      if (next.has(stage)) next.delete(stage)
      else next.add(stage)
      return next
    })
  }

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await api.post(`/orders/${orderId}/workflow/`, { name: name.trim() })
      toast.success('Stage added')
      onCreated()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to add stage')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAdd = async () => {
    if (selectedDefaults.size === 0) return
    setSaving(true)
    try {
      for (const stageName of DEFAULT_STAGES) {
        if (selectedDefaults.has(stageName)) {
          await api.post(`/orders/${orderId}/workflow/`, { name: stageName })
        }
      }
      toast.success(`Added ${selectedDefaults.size} stages`)
      onCreated()
    } catch (err: any) {
      toast.error('Failed to add stages')
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
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Add Workflow Stage</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setBulkMode(false)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                !bulkMode ? 'bg-primary text-white border-primary' : 'bg-white text-text-muted border-border'
              }`}
            >
              Single Stage
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                bulkMode ? 'bg-primary text-white border-primary' : 'bg-white text-text-muted border-border'
              }`}
            >
              Default Stages
            </button>
          </div>

          {!bulkMode ? (
            <form onSubmit={handleSubmitSingle} className="space-y-4">
              <input
                type="text"
                placeholder="Stage name (e.g., FABRIC, SAMPLING)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="w-full px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Stage'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {DEFAULT_STAGES.map((stage) => (
                  <label
                    key={stage}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDefaults.has(stage)}
                      onChange={() => toggleDefault(stage)}
                      className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                    />
                    <span className="text-sm text-text-primary">{stage}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedDefaults(new Set(DEFAULT_STAGES))}
                  className="text-xs text-primary hover:underline"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedDefaults(new Set())}
                  className="text-xs text-text-muted hover:underline"
                >
                  Clear
                </button>
              </div>
              <button
                onClick={handleBulkAdd}
                disabled={saving || selectedDefaults.size === 0}
                className="w-full px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Adding...' : `Add ${selectedDefaults.size} Stage${selectedDefaults.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
