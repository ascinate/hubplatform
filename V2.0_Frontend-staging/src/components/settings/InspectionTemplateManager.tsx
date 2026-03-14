'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import {
  ChevronDown, ChevronRight, Plus, Pencil, Trash2, Save, X, Loader2,
  Palette, ShoppingCart, Wrench, Factory, ClipboardCheck, Truck,
  BarChart3, Shield, FileText, Package, CheckSquare, Database,
  Paperclip, ArrowRightCircle, ShieldCheck, Sparkles,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────── */

interface TemplateField {
  id: string
  label: string
  field_key: string
  field_type: string
  is_required: boolean
  sort_order: number
  options: string[]
  default_value: string
  placeholder: string
  help_text: string
  auto_fill_source: string
}

interface TemplateSection {
  id: string
  block_type: string
  name: string
  sort_order: number
  is_visible: boolean
  fields: TemplateField[]
  field_count: number
}

interface InspectionTemplate {
  id: string
  name: string
  code: string
  phase: string
  phase_sequence: number
  department: string | null
  department_name: string
  department_code: string
  product_category: string
  submitted_by_role: string
  reviewed_by_role: string
  approved_by_role: string
  next_template_code: string
  is_builtin: boolean
  is_active: boolean
  version: number
  description: string
  field_count: number
  sections?: TemplateSection[]
}

/* ── Constants ─────────────────────────────────────────────────────── */

const PHASES: Record<string, { label: string; color: string; bg: string; icon: typeof Palette }> = {
  product_development: { label: 'Product Development', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Palette },
  order_management: { label: 'Order Management', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: ShoppingCart },
  production_prep: { label: 'Production Preparation', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Wrench },
  production_execution: { label: 'Production Execution', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: Factory },
  quality_control: { label: 'Quality Control', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: ClipboardCheck },
  logistics: { label: 'Logistics', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: Truck },
  combined_operational: { label: 'Combined Operational', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: BarChart3 },
  quality_system: { label: 'Quality System', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: Shield },
}

const BLOCK_ICONS: Record<string, typeof FileText> = {
  header: FileText, context: Package, tasks: CheckSquare,
  data: Database, attachments: Paperclip, output: ArrowRightCircle, approval: ShieldCheck,
}

const FIELD_TYPE_COLORS: Record<string, string> = {
  checkbox: 'bg-green-100 text-green-700',
  text: 'bg-blue-100 text-blue-700',
  number: 'bg-purple-100 text-purple-700',
  decimal: 'bg-purple-100 text-purple-700',
  dropdown: 'bg-amber-100 text-amber-700',
  date: 'bg-teal-100 text-teal-700',
  file: 'bg-pink-100 text-pink-700',
  textarea: 'bg-blue-100 text-blue-700',
  signature: 'bg-red-100 text-red-700',
  table: 'bg-gray-100 text-gray-700',
}

const FIELD_TYPES = ['checkbox', 'text', 'number', 'decimal', 'dropdown', 'date', 'file', 'textarea', 'signature', 'table']

/* ── Component ─────────────────────────────────────────────────────── */

export default function InspectionTemplateManager() {
  const [templates, setTemplates] = useState<InspectionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [filterPhase, setFilterPhase] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [templateDetail, setTemplateDetail] = useState<InspectionTemplate | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editFieldData, setEditFieldData] = useState<Partial<TemplateField>>({})
  const [addingFieldSection, setAddingFieldSection] = useState<string | null>(null)
  const [newFieldData, setNewFieldData] = useState({ label: '', field_key: '', field_type: 'text', is_required: false })

  // Fetch templates list
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterPhase) params.append('phase', filterPhase)
      if (filterCategory) params.append('category', filterCategory)
      const { data } = await api.get(`/inspection-templates/?${params}`)
      setTemplates(data.results || data)
    } catch {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [filterPhase, filterCategory])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  // Fetch template detail (lazy)
  const fetchDetail = async (id: string) => {
    try {
      setLoadingDetail(true)
      const { data } = await api.get(`/inspection-templates/${id}/`)
      setTemplateDetail(data)
    } catch {
      toast.error('Failed to load template details')
    } finally {
      setLoadingDetail(false)
    }
  }

  // Seed defaults
  const handleSeed = async () => {
    try {
      setSeeding(true)
      await api.post('/inspection-templates/seed/')
      toast.success('Default templates seeded successfully')
      fetchTemplates()
    } catch {
      toast.error('Failed to seed templates')
    } finally {
      setSeeding(false)
    }
  }

  // Toggle template expand
  const toggleTemplate = (id: string) => {
    if (expandedTemplateId === id) {
      setExpandedTemplateId(null)
      setTemplateDetail(null)
      setExpandedSection(null)
    } else {
      setExpandedTemplateId(id)
      setExpandedSection(null)
      setEditingFieldId(null)
      fetchDetail(id)
    }
  }

  // Toggle phase expand
  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(phase)) next.delete(phase)
      else next.add(phase)
      return next
    })
  }

  // Field CRUD
  const handleAddField = async (templateId: string, sectionId: string) => {
    if (!newFieldData.label || !newFieldData.field_key) {
      toast.error('Label and Key are required')
      return
    }
    try {
      await api.post(`/inspection-templates/${templateId}/sections/${sectionId}/fields/`, newFieldData)
      toast.success('Field added')
      setAddingFieldSection(null)
      setNewFieldData({ label: '', field_key: '', field_type: 'text', is_required: false })
      fetchDetail(templateId)
    } catch {
      toast.error('Failed to add field')
    }
  }

  const handleUpdateField = async (templateId: string, sectionId: string, fieldId: string) => {
    try {
      await api.put(`/inspection-templates/${templateId}/sections/${sectionId}/fields/${fieldId}/`, editFieldData)
      toast.success('Field updated')
      setEditingFieldId(null)
      fetchDetail(templateId)
    } catch {
      toast.error('Failed to update field')
    }
  }

  const handleDeleteField = async (templateId: string, sectionId: string, fieldId: string) => {
    try {
      await api.delete(`/inspection-templates/${templateId}/sections/${sectionId}/fields/${fieldId}/`)
      toast.success('Field deleted')
      fetchDetail(templateId)
    } catch {
      toast.error('Failed to delete field')
    }
  }

  // Update template metadata
  const handleUpdateTemplate = async (id: string, data: Partial<InspectionTemplate>) => {
    try {
      await api.patch(`/inspection-templates/${id}/`, data)
      toast.success('Template updated')
      fetchTemplates()
      if (expandedTemplateId === id) fetchDetail(id)
    } catch {
      toast.error('Failed to update template')
    }
  }

  // Group templates by phase
  const grouped = templates.reduce<Record<string, InspectionTemplate[]>>((acc, t) => {
    if (!acc[t.phase]) acc[t.phase] = []
    acc[t.phase].push(t)
    return acc
  }, {})

  const phaseOrder = ['product_development', 'order_management', 'production_prep', 'production_execution', 'quality_control', 'logistics', 'combined_operational', 'quality_system']

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Template Engine</h2>
          <p className="text-sm text-text-muted">{templates.length} templates across {Object.keys(grouped).length} phases</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Phase filter */}
          <select
            value={filterPhase}
            onChange={e => setFilterPhase(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">All Phases</option>
            {phaseOrder.map(p => (
              <option key={p} value={p}>{PHASES[p]?.label || p}</option>
            ))}
          </select>
          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">All Categories</option>
            {['garments', 'gloves', 'footwear', 'headwear', 'accessories', 'bags'].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          {templates.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Seed Defaults
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && templates.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Shield className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-lg font-semibold text-text-primary">No Templates Found</p>
          <p className="text-sm text-text-muted mt-1">Click &quot;Seed Defaults&quot; to create 35 standard QMS templates.</p>
        </div>
      )}

      {/* Phase groups */}
      {!loading && phaseOrder.filter(p => grouped[p]).map(phase => {
        const phaseConfig = PHASES[phase]
        const PhaseIcon = phaseConfig?.icon || Shield
        const phaseTemplates = grouped[phase] || []
        const isExpanded = expandedPhases.has(phase)

        return (
          <div key={phase} className={`rounded-xl border ${phaseConfig?.bg || 'bg-gray-50 border-gray-200'}`}>
            {/* Phase header */}
            <button
              onClick={() => togglePhase(phase)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2.5">
                <PhaseIcon className={`w-5 h-5 ${phaseConfig?.color || 'text-gray-600'}`} />
                <span className={`font-semibold text-sm ${phaseConfig?.color || 'text-gray-700'}`}>
                  {phaseConfig?.label || phase}
                </span>
                <span className="text-xs text-text-muted bg-white/70 px-2 py-0.5 rounded-full">
                  {phaseTemplates.length} template{phaseTemplates.length !== 1 ? 's' : ''}
                </span>
              </div>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
            </button>

            {/* Template cards */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2">
                {phaseTemplates.map(tpl => {
                  const isSelected = expandedTemplateId === tpl.id

                  return (
                    <div key={tpl.id} className="bg-white rounded-lg border border-border overflow-hidden">
                      {/* Template row */}
                      <button
                        onClick={() => toggleTemplate(tpl.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex-shrink-0 text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {tpl.code}
                        </span>
                        <span className="font-medium text-sm text-text-primary flex-1 truncate">
                          {tpl.name}
                        </span>
                        {tpl.department_name && (
                          <span className="text-xs text-text-muted bg-gray-100 px-2 py-0.5 rounded hidden sm:inline">
                            {tpl.department_name}
                          </span>
                        )}
                        <span className="text-xs text-text-muted">
                          {tpl.field_count} fields
                        </span>
                        {!tpl.is_active && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Inactive</span>
                        )}
                        {isSelected
                          ? <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />}
                      </button>

                      {/* Expanded detail */}
                      {isSelected && (
                        <div className="border-t border-border">
                          {loadingDetail ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                          ) : templateDetail ? (
                            <div className="p-4 space-y-4">
                              {/* Approval chain */}
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">Approval Chain</p>
                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div>
                                    <span className="text-text-muted">Submit: </span>
                                    <span className="font-medium">{templateDetail.submitted_by_role || '—'}</span>
                                  </div>
                                  <span className="text-text-muted">→</span>
                                  <div>
                                    <span className="text-text-muted">Review: </span>
                                    <span className="font-medium">{templateDetail.reviewed_by_role || '—'}</span>
                                  </div>
                                  <span className="text-text-muted">→</span>
                                  <div>
                                    <span className="text-text-muted">Approve: </span>
                                    <span className="font-medium">{templateDetail.approved_by_role || '—'}</span>
                                  </div>
                                  {templateDetail.next_template_code && (
                                    <>
                                      <span className="text-text-muted">→</span>
                                      <div>
                                        <span className="text-text-muted">Next: </span>
                                        <span className="font-medium text-primary">{templateDetail.next_template_code}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Description */}
                              {templateDetail.description && (
                                <p className="text-sm text-text-muted italic">{templateDetail.description}</p>
                              )}

                              {/* Sections */}
                              <div className="space-y-1">
                                {(templateDetail.sections || []).map(section => {
                                  const SectionIcon = BLOCK_ICONS[section.block_type] || FileText
                                  const isSectionExpanded = expandedSection === section.id
                                  return (
                                    <div key={section.id} className="border border-border rounded-lg overflow-hidden">
                                      {/* Section header */}
                                      <button
                                        onClick={() => setExpandedSection(isSectionExpanded ? null : section.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                                      >
                                        <SectionIcon className="w-4 h-4 text-text-muted flex-shrink-0" />
                                        <span className="text-sm font-medium text-text-primary flex-1">{section.name}</span>
                                        <span className="text-xs text-text-muted">{section.field_count}</span>
                                        {isSectionExpanded
                                          ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                                          : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
                                      </button>

                                      {/* Fields */}
                                      {isSectionExpanded && (
                                        <div className="p-2">
                                          {section.fields.length === 0 ? (
                                            <p className="text-xs text-text-muted text-center py-2">No fields in this section</p>
                                          ) : (
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-xs">
                                                <thead>
                                                  <tr className="text-text-muted border-b border-border">
                                                    <th className="text-left py-1.5 px-2 font-medium w-8">#</th>
                                                    <th className="text-left py-1.5 px-2 font-medium">Label</th>
                                                    <th className="text-left py-1.5 px-2 font-medium hidden lg:table-cell">Key</th>
                                                    <th className="text-left py-1.5 px-2 font-medium w-20">Type</th>
                                                    <th className="text-center py-1.5 px-2 font-medium w-12">Req</th>
                                                    <th className="text-right py-1.5 px-2 font-medium w-20">Actions</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {section.fields.map((field, idx) => (
                                                    <tr key={field.id} className="border-b border-border/50 last:border-0 hover:bg-gray-50">
                                                      {editingFieldId === field.id ? (
                                                        <>
                                                          <td className="py-1.5 px-2 text-text-muted">{idx + 1}</td>
                                                          <td className="py-1.5 px-2">
                                                            <input
                                                              value={editFieldData.label || ''}
                                                              onChange={e => setEditFieldData(d => ({ ...d, label: e.target.value }))}
                                                              className="w-full border border-border rounded px-2 py-1 text-xs"
                                                            />
                                                          </td>
                                                          <td className="py-1.5 px-2 hidden lg:table-cell">
                                                            <input
                                                              value={editFieldData.field_key || ''}
                                                              onChange={e => setEditFieldData(d => ({ ...d, field_key: e.target.value }))}
                                                              className="w-full border border-border rounded px-2 py-1 text-xs"
                                                            />
                                                          </td>
                                                          <td className="py-1.5 px-2">
                                                            <select
                                                              value={editFieldData.field_type || 'text'}
                                                              onChange={e => setEditFieldData(d => ({ ...d, field_type: e.target.value }))}
                                                              className="border border-border rounded px-1 py-1 text-xs"
                                                            >
                                                              {FIELD_TYPES.map(ft => (
                                                                <option key={ft} value={ft}>{ft}</option>
                                                              ))}
                                                            </select>
                                                          </td>
                                                          <td className="py-1.5 px-2 text-center">
                                                            <input
                                                              type="checkbox"
                                                              checked={editFieldData.is_required || false}
                                                              onChange={e => setEditFieldData(d => ({ ...d, is_required: e.target.checked }))}
                                                            />
                                                          </td>
                                                          <td className="py-1.5 px-2 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                              <button
                                                                onClick={() => handleUpdateField(tpl.id, section.id, field.id)}
                                                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                              >
                                                                <Save className="w-3.5 h-3.5" />
                                                              </button>
                                                              <button
                                                                onClick={() => setEditingFieldId(null)}
                                                                className="p-1 text-text-muted hover:bg-gray-100 rounded"
                                                              >
                                                                <X className="w-3.5 h-3.5" />
                                                              </button>
                                                            </div>
                                                          </td>
                                                        </>
                                                      ) : (
                                                        <>
                                                          <td className="py-1.5 px-2 text-text-muted">{idx + 1}</td>
                                                          <td className="py-1.5 px-2 font-medium text-text-primary">{field.label}</td>
                                                          <td className="py-1.5 px-2 text-text-muted font-mono hidden lg:table-cell">{field.field_key}</td>
                                                          <td className="py-1.5 px-2">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${FIELD_TYPE_COLORS[field.field_type] || 'bg-gray-100 text-gray-700'}`}>
                                                              {field.field_type}
                                                            </span>
                                                          </td>
                                                          <td className="py-1.5 px-2 text-center">
                                                            {field.is_required && <span className="text-primary font-bold">✓</span>}
                                                          </td>
                                                          <td className="py-1.5 px-2 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                              <button
                                                                onClick={() => {
                                                                  setEditingFieldId(field.id)
                                                                  setEditFieldData({
                                                                    label: field.label,
                                                                    field_key: field.field_key,
                                                                    field_type: field.field_type,
                                                                    is_required: field.is_required,
                                                                    options: field.options,
                                                                    default_value: field.default_value,
                                                                    sort_order: field.sort_order,
                                                                  })
                                                                }}
                                                                className="p-1 text-text-muted hover:text-primary hover:bg-primary-light rounded"
                                                              >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                              </button>
                                                              <button
                                                                onClick={() => handleDeleteField(tpl.id, section.id, field.id)}
                                                                className="p-1 text-text-muted hover:text-red-600 hover:bg-red-50 rounded"
                                                              >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                              </button>
                                                            </div>
                                                          </td>
                                                        </>
                                                      )}
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}

                                          {/* Add field */}
                                          {addingFieldSection === section.id ? (
                                            <div className="mt-2 p-2 bg-primary-light/50 rounded-lg border border-primary/20">
                                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <input
                                                  placeholder="Label"
                                                  value={newFieldData.label}
                                                  onChange={e => setNewFieldData(d => ({ ...d, label: e.target.value }))}
                                                  className="border border-border rounded px-2 py-1.5 text-xs col-span-2 sm:col-span-1"
                                                />
                                                <input
                                                  placeholder="field_key"
                                                  value={newFieldData.field_key}
                                                  onChange={e => setNewFieldData(d => ({ ...d, field_key: e.target.value }))}
                                                  className="border border-border rounded px-2 py-1.5 text-xs font-mono"
                                                />
                                                <select
                                                  value={newFieldData.field_type}
                                                  onChange={e => setNewFieldData(d => ({ ...d, field_type: e.target.value }))}
                                                  className="border border-border rounded px-2 py-1.5 text-xs"
                                                >
                                                  {FIELD_TYPES.map(ft => (
                                                    <option key={ft} value={ft}>{ft}</option>
                                                  ))}
                                                </select>
                                                <div className="flex items-center gap-2">
                                                  <label className="flex items-center gap-1 text-xs">
                                                    <input
                                                      type="checkbox"
                                                      checked={newFieldData.is_required}
                                                      onChange={e => setNewFieldData(d => ({ ...d, is_required: e.target.checked }))}
                                                    />
                                                    Required
                                                  </label>
                                                </div>
                                              </div>
                                              <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                  onClick={() => setAddingFieldSection(null)}
                                                  className="px-3 py-1 text-xs text-text-muted hover:bg-gray-100 rounded"
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  onClick={() => handleAddField(tpl.id, section.id)}
                                                  className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-hover"
                                                >
                                                  Add Field
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                setAddingFieldSection(section.id)
                                                setNewFieldData({ label: '', field_key: '', field_type: 'text', is_required: false })
                                              }}
                                              className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary-hover px-2 py-1"
                                            >
                                              <Plus className="w-3.5 h-3.5" /> Add Field
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
