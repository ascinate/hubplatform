import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface Factory {
  id: string
  name: string
}

interface Template {
  id: string
  name: string
  code: string
  phase: string
}

const PHASE_LABELS: Record<string, string> = {
  product_development: 'Product Development',
  order_management: 'Order Management',
  production_prep: 'Production Prep',
  production_execution: 'Production Execution',
  quality_control: 'Quality Control',
  logistics: 'Logistics',
  combined_operational: 'Combined Operational',
  quality_system: 'Quality System',
}

interface NewInspectionModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function NewInspectionModal({ open, onClose, onCreated }: NewInspectionModalProps) {
  const [factories, setFactories] = useState<Factory[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingFactories, setLoadingFactories] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [factory, setFactory] = useState('')
  const [inspectionType, setInspectionType] = useState('')
  const [template, setTemplate] = useState('')
  const [inspectionDate, setInspectionDate] = useState(() => new Date().toISOString().split('T')[0])
  const [auditorName, setAuditorName] = useState('')
  const [status, setStatus] = useState('draft')

  useEffect(() => {
    if (open) {
      loadFactories()
      loadTemplates()
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setFactory('')
    setInspectionType('')
    setTemplate('')
    setInspectionDate(new Date().toISOString().split('T')[0])
    setAuditorName('')
    setStatus('draft')
  }

  const loadFactories = async () => {
    setLoadingFactories(true)
    try {
      const { data } = await api.get('/factories/', { params: { is_active: true } })
      setFactories(data.results || data)
    } catch {
      toast.error('Failed to load factories')
    } finally {
      setLoadingFactories(false)
    }
  }

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const { data } = await api.get('/inspection-templates/', { params: { is_active: true } })
      setTemplates(data.results || data)
    } catch {
      toast.error('Failed to load templates')
    } finally {
      setLoadingTemplates(false)
    }
  }

  if (!open) return null

  // Group templates by phase
  const templatesByPhase: Record<string, Template[]> = {}
  templates.forEach((t) => {
    if (!templatesByPhase[t.phase]) templatesByPhase[t.phase] = []
    templatesByPhase[t.phase].push(t)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!factory || !inspectionType || !inspectionDate || !auditorName) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        factory: factory,
        inspection_type: inspectionType,
        inspection_date: inspectionDate,
        auditor_name: auditorName.trim(),
        status: status,
        result: 'pending',
      }

      if (template) {
        payload.template = template
      }

      await api.post('/inspections/', payload)
      toast.success('Inspection created successfully')
      onCreated()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create inspection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">New Inspection</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="overflow-y-auto max-h-[70vh] p-4 sm:p-6 space-y-4">
            {/* Factory */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Factory <span className="text-danger">*</span>
              </label>
              <select
                value={factory}
                onChange={(e) => setFactory(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">
                  {loadingFactories ? 'Loading factories...' : 'Select a factory'}
                </option>
                {factories.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Inspection Type */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Inspection Type <span className="text-danger">*</span>
              </label>
              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Select inspection type</option>
                <option value="pre_production">Pre-Production</option>
                <option value="inline">Inline Inspection</option>
                <option value="final">Final Inspection</option>
                <option value="lab_test">Lab Test</option>
                <option value="fri">FRI</option>
                <option value="dupro">Dupro</option>
                <option value="pre_final">Pre-Final</option>
              </select>
            </div>

            {/* Inspection Template */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Inspection Template
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">
                  {loadingTemplates ? 'Loading templates...' : 'Select a template (optional)'}
                </option>
                {Object.entries(templatesByPhase).map(([phase, tpls]) => (
                  <optgroup key={phase} label={PHASE_LABELS[phase] || phase}>
                    {tpls.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} — {t.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Inspection Date */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Inspection Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Auditor Name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Auditor Name <span className="text-danger">*</span>
              </label>
              <select
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Select auditor type</option>
                <option value="Brand Auditor">Brand Auditor</option>
                <option value="3rd Party Auditor">3rd Party Auditor</option>
                <option value="Factory QC Auditor">Factory QC Auditor</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Status <span className="text-danger">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-5 border-t border-border">
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
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
