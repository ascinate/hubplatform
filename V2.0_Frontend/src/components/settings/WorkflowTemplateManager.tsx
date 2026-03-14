'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import {
  GitBranch, Plus, ChevronDown, ChevronRight, Pencil, Trash2, Save, X,
  ArrowUp, ArrowDown, RotateCcw, CheckCircle2, CircleDot,
} from 'lucide-react'
import DepartmentManager from './DepartmentManager'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useConfirm } from '@/hooks/useConfirm'

interface Department {
  id: string
  name: string
  code: string
}

interface TemplateStage {
  id: string
  template: string
  stage_name: string
  stage_code: string
  sequence_number: number
  department: string | null
  department_name: string
  department_code: string
  approver_role: string
  is_required: boolean
  typical_duration_days: number
  description: string
  on_fail_go_to_seq: number | null
}

interface WorkflowTemplate {
  id: string
  name: string
  product_category: string
  is_default: boolean
  template_stages: TemplateStage[]
  stage_count: number
  created_at: string
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'garments', label: 'Garments' },
  { value: 'gloves', label: 'Gloves' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'headwear', label: 'Headwear' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'bags', label: 'Bags' },
]

const CATEGORY_COLORS: Record<string, string> = {
  garments: 'bg-blue-100 text-blue-700',
  gloves: 'bg-purple-100 text-purple-700',
  footwear: 'bg-amber-100 text-amber-700',
  headwear: 'bg-teal-100 text-teal-700',
  accessories: 'bg-pink-100 text-pink-700',
  bags: 'bg-orange-100 text-orange-700',
  '': 'bg-gray-100 text-gray-700',
}

export default function WorkflowTemplateManager() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [editingStage, setEditingStage] = useState<TemplateStage | null>(null)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({ name: '', product_category: '' })
  const { confirm, modalProps } = useConfirm()

  useEffect(() => {
    fetchTemplates()
    fetchDepartments()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/workflow-templates/')
      setTemplates(res.data.results || res.data)
    } catch {
      toast.error('Failed to load workflow templates')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments/')
      setDepartments(res.data.results || res.data)
    } catch {}
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name) {
      toast.error('Template name is required')
      return
    }
    try {
      await api.post('/workflow-templates/', newTemplate)
      toast.success('Template created')
      setShowCreateTemplate(false)
      setNewTemplate({ name: '', product_category: '' })
      fetchTemplates()
    } catch {
      toast.error('Failed to create template')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Template',
      message: 'This will delete the template and all its stages. This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/workflow-templates/${id}/`)
      toast.success('Template deleted')
      if (expandedId === id) setExpandedId(null)
      fetchTemplates()
    } catch {
      toast.error('Failed to delete template')
    }
  }

  const handleUpdateStage = async (templateId: string, stage: TemplateStage) => {
    try {
      await api.put(`/workflow-templates/${templateId}/stages/${stage.id}/`, {
        stage_name: stage.stage_name,
        stage_code: stage.stage_code,
        sequence_number: stage.sequence_number,
        department: stage.department || null,
        approver_role: stage.approver_role,
        is_required: stage.is_required,
        typical_duration_days: stage.typical_duration_days,
        on_fail_go_to_seq: stage.on_fail_go_to_seq,
        description: stage.description,
      })
      toast.success('Stage updated')
      setEditingStage(null)
      fetchTemplates()
    } catch {
      toast.error('Failed to update stage')
    }
  }

  const handleAddStage = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    const maxSeq = template?.template_stages.reduce((max, s) => Math.max(max, s.sequence_number), 0) || 0
    try {
      await api.post(`/workflow-templates/${templateId}/stages/`, {
        template: templateId,
        stage_name: 'New Stage',
        stage_code: 'NEW_STAGE',
        sequence_number: maxSeq + 1,
        typical_duration_days: 3,
        is_required: true,
        approver_role: '',
      })
      toast.success('Stage added')
      fetchTemplates()
    } catch {
      toast.error('Failed to add stage')
    }
  }

  const handleDeleteStage = async (templateId: string, stageId: string) => {
    try {
      await api.delete(`/workflow-templates/${templateId}/stages/${stageId}/`)
      toast.success('Stage removed')
      fetchTemplates()
    } catch {
      toast.error('Failed to remove stage')
    }
  }

  const filteredTemplates = filterCategory
    ? templates.filter(t => t.product_category === filterCategory)
    : templates

  return (
    <div className="space-y-6">
      {/* Department Manager */}
      <DepartmentManager />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <span className="text-sm text-text-muted">{filteredTemplates.length} template(s)</span>
        </div>
        <button
          onClick={() => setShowCreateTemplate(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
        >
          <Plus size={14} /> Create Template
        </button>
      </div>

      {/* Create template form */}
      {showCreateTemplate && (
        <div className="bg-white rounded-xl border border-primary/30 p-4 space-y-3">
          <p className="text-sm font-semibold text-text-primary">New Workflow Template</p>
          <div className="flex flex-col gap-3 lg:flex-row">
            <input
              placeholder="Template Name"
              value={newTemplate.name}
              onChange={e => setNewTemplate(f => ({ ...f, name: e.target.value }))}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"
            />
            <select
              value={newTemplate.product_category}
              onChange={e => setNewTemplate(f => ({ ...f, product_category: e.target.value }))}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label || 'All Categories'}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={handleCreateTemplate} className="flex-1 lg:flex-none px-4 py-2 bg-primary text-white text-sm rounded-lg">
                Create
              </button>
              <button onClick={() => setShowCreateTemplate(false)} className="flex-1 lg:flex-none px-4 py-2 text-sm text-text-muted hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template list */}
      {loading ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-text-muted">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <GitBranch size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-text-primary mb-1">No workflow templates</p>
          <p className="text-sm text-text-muted">Seed defaults or create a new template to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTemplates.map(template => {
            const isExpanded = expandedId === template.id
            return (
              <div key={template.id} className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Template header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : template.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isExpanded ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                    <GitBranch size={18} className="text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-text-primary truncate">{template.name}</span>
                        {template.is_default && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>
                        )}
                        {template.product_category && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[template.product_category] || ''}`}>
                            {template.product_category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{template.stage_count} stages</p>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteTemplate(template.id) }}
                    className="p-1.5 hover:bg-red-50 rounded text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Expanded stage editor */}
                {isExpanded && (
                  <div className="border-t border-border overflow-x-auto">
                    {/* Stage table header */}
                    <div className="grid grid-cols-[50px_60px_1fr_150px_150px_70px_70px_70px_40px] gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-text-muted min-w-[700px]">
                      <span>Seq</span>
                      <span>Code</span>
                      <span>Stage Name</span>
                      <span>Department</span>
                      <span>Approver Role</span>
                      <span>Days</span>
                      <span>Fail→</span>
                      <span>Req</span>
                      <span></span>
                    </div>

                    {/* Stage rows */}
                    {template.template_stages
                      .sort((a, b) => a.sequence_number - b.sequence_number)
                      .map(stage => {
                        const isEditing = editingStage?.id === stage.id
                        const s = isEditing ? editingStage! : stage

                        return (
                          <div
                            key={stage.id}
                            className={`grid grid-cols-[50px_60px_1fr_150px_150px_70px_70px_70px_40px] gap-2 px-4 py-2 border-b border-border/50 items-center text-sm min-w-[700px] ${
                              !stage.is_required ? 'opacity-50 bg-gray-50/50' : ''
                            } ${isEditing ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                          >
                            <span className="text-xs font-mono text-text-muted">{s.sequence_number}</span>

                            {isEditing ? (
                              <>
                                <input
                                  value={s.stage_code}
                                  onChange={e => setEditingStage({ ...s, stage_code: e.target.value })}
                                  className="px-1.5 py-1 border border-border rounded text-xs font-mono w-full"
                                />
                                <input
                                  value={s.stage_name}
                                  onChange={e => setEditingStage({ ...s, stage_name: e.target.value })}
                                  className="px-2 py-1 border border-border rounded text-sm w-full"
                                />
                                <select
                                  value={s.department || ''}
                                  onChange={e => setEditingStage({ ...s, department: e.target.value || null })}
                                  className="px-1.5 py-1 border border-border rounded text-xs w-full"
                                >
                                  <option value="">None</option>
                                  {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </select>
                                <input
                                  value={s.approver_role}
                                  onChange={e => setEditingStage({ ...s, approver_role: e.target.value })}
                                  className="px-2 py-1 border border-border rounded text-xs w-full"
                                />
                                <input
                                  type="number"
                                  value={s.typical_duration_days}
                                  onChange={e => setEditingStage({ ...s, typical_duration_days: parseInt(e.target.value) || 1 })}
                                  className="px-1.5 py-1 border border-border rounded text-xs w-full"
                                />
                                <input
                                  type="number"
                                  value={s.on_fail_go_to_seq ?? ''}
                                  onChange={e => setEditingStage({ ...s, on_fail_go_to_seq: e.target.value ? parseInt(e.target.value) : null })}
                                  className="px-1.5 py-1 border border-border rounded text-xs w-full"
                                  placeholder="—"
                                />
                                <label className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={s.is_required}
                                    onChange={e => setEditingStage({ ...s, is_required: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-primary"
                                  />
                                </label>
                                <div className="flex gap-0.5">
                                  <button
                                    onClick={() => handleUpdateStage(template.id, s)}
                                    className="p-1 hover:bg-green-50 rounded text-green-600"
                                  >
                                    <Save size={13} />
                                  </button>
                                  <button
                                    onClick={() => setEditingStage(null)}
                                    className="p-1 hover:bg-gray-100 rounded text-text-muted"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-mono text-text-muted truncate">{stage.stage_code}</span>
                                <span className="text-sm text-text-primary">{stage.stage_name}</span>
                                <span className="text-xs text-text-muted">{stage.department_name || '—'}</span>
                                <span className="text-xs text-text-muted">{stage.approver_role || '—'}</span>
                                <span className="text-xs text-text-muted">{stage.typical_duration_days}d</span>
                                <span className="text-xs text-text-muted">
                                  {stage.on_fail_go_to_seq ? (
                                    <span className="flex items-center gap-0.5">
                                      <RotateCcw size={10} /> {stage.on_fail_go_to_seq}
                                    </span>
                                  ) : '—'}
                                </span>
                                <span className="flex justify-center">
                                  {stage.is_required ? (
                                    <CheckCircle2 size={14} className="text-green-500" />
                                  ) : (
                                    <CircleDot size={14} className="text-gray-300" />
                                  )}
                                </span>
                                <div className="flex gap-0.5">
                                  <button
                                    onClick={() => setEditingStage({ ...stage })}
                                    className="p-1 hover:bg-gray-100 rounded text-text-muted"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStage(template.id, stage.id)}
                                    className="p-1 hover:bg-red-50 rounded text-red-400"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}

                    {/* Add stage button */}
                    <div className="px-4 py-3">
                      <button
                        onClick={() => handleAddStage(template.id)}
                        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
                      >
                        <Plus size={14} /> Add Stage
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal {...modalProps} />
    </div>
  )
}
