'use client'

import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Check, X, Minus, Plus, CheckCircle2, Circle, Camera } from 'lucide-react'

// ── AQL lookup (ISO 2859-1 / ANSI Z1.4, Normal Level II) ─────────────────────

const _AQL_LOT: [number, number][] = [
  [8, 2], [15, 3], [25, 5], [50, 8], [90, 13], [150, 20],
  [280, 32], [500, 50], [1200, 80], [3200, 125], [10000, 200], [Infinity, 315],
]
const _AQL_AR: Record<string, Record<number, [number, number] | null>> = {
  '0.65': {2:null,3:null,5:null,8:[0,1],13:[0,1],20:[0,1],32:[0,1],50:[1,2],80:[1,2],125:[2,3],200:[3,4],315:[5,6]},
  '1.0':  {2:null,3:null,5:null,8:[0,1],13:[0,1],20:[0,1],32:[1,2],50:[1,2],80:[2,3],125:[3,4],200:[5,6],315:[7,8]},
  '1.5':  {2:null,3:null,5:[0,1],8:[0,1],13:[0,1],20:[1,2],32:[1,2],50:[2,3],80:[3,4],125:[5,6],200:[7,8],315:[10,11]},
  '2.5':  {2:null,3:[0,1],5:[0,1],8:[0,1],13:[1,2],20:[1,2],32:[2,3],50:[3,4],80:[5,6],125:[7,8],200:[10,11],315:[14,15]},
  '4.0':  {2:[0,1],3:[0,1],5:[0,1],8:[1,2],13:[1,2],20:[2,3],32:[3,4],50:[5,6],80:[7,8],125:[10,11],200:[14,15],315:[21,22]},
  '6.5':  {2:[0,1],3:[0,1],5:[1,2],8:[1,2],13:[2,3],20:[3,4],32:[5,6],50:[7,8],80:[10,11],125:[14,15],200:[21,22],315:[21,22]},
  '10.0': {2:[0,1],3:[1,2],5:[1,2],8:[2,3],13:[3,4],20:[5,6],32:[7,8],50:[10,11],80:[14,15],125:[21,22],200:[21,22],315:[21,22]},
}

function aqlSS(lot: number): number {
  for (const [max, ss] of _AQL_LOT) if (lot <= max) return ss
  return 315
}
function aqlAR(ss: number, aql: string): [number, number] {
  const t = _AQL_AR[aql] ?? _AQL_AR['2.5']
  if (t[ss] !== undefined && t[ss] !== null) return t[ss]!
  for (const k of Object.keys(t).map(Number).sort((a, b) => a - b)) {
    if (k >= ss && t[k]) return t[k]!
  }
  return [0, 1]
}
function cleanAql(raw: string): string {
  const n = (raw || '').replace(/[^0-9.]/g, '')
  return ['0.65','1.0','1.5','2.5','4.0','6.5','10.0'].includes(n) ? n : '2.5'
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface TemplateField {
  id: string
  label: string
  field_key: string
  field_type: 'text'|'number'|'decimal'|'date'|'dropdown'|'textarea'
    |'checkbox'|'boolean'|'file'|'signature'|'table'
  is_required: boolean
  sort_order: number
  options: string[] | null
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
}

interface TemplateDefinition {
  id: string
  name: string
  code: string
  sections: TemplateSection[]
}

export interface ExistingItem {
  label: string
  type: string
  actual_value: string
  result: string
  comment: string
}

export interface ExistingSection {
  name: string
  sort_order: number
  items: ExistingItem[]
}

interface Props {
  inspectionId: string
  templateId: string
  existingSections: ExistingSection[]
  autoFillData?: Record<string, string>
  onSaved?: () => void
  onValidationChange?: (complete: boolean) => void
}

export interface InspectionFormHandle {
  validate: () => string[]
  save: () => Promise<void>
}

interface DefectRow {
  group: string
  defect_name: string
  minor: number
  major: number
  critical: number
  remark: string
  photo_url?: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BLOCK_LABELS: Record<string, string> = {
  header:      'Template Header',
  context:     'Order Details',
  tasks:       'Department Tasks',
  data:        'Physical Testing',
  attachments: 'Evidence & Photos',
  output:      'Department Output',
  approval:    'Approval & Signatures',
}

// ── Main Component ────────────────────────────────────────────────────────────

const InspectionForm = forwardRef<InspectionFormHandle, Props>(
  ({ inspectionId, templateId, existingSections, autoFillData = {}, onSaved, onValidationChange }, ref) => {
    const [template, setTemplate] = useState<TemplateDefinition | null>(null)
    const [loadingTemplate, setLoadingTemplate] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeSection, setActiveSection] = useState<string>('')
    const [formValues, setFormValues] = useState<Record<string, string>>({})
    const [formResults, setFormResults] = useState<Record<string, string>>({})

    const isDirty = useRef(false)
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

    useEffect(() => {
      api.get(`/inspection-templates/${templateId}/`)
        .then(({ data }) => {
          setTemplate(data)
          const vals: Record<string, string> = {}
          const ress: Record<string, string> = {}
          for (const sec of data.sections as TemplateSection[]) {
            const existing = existingSections.find(s => s.name === sec.name)
            for (const field of sec.fields) {
              if (existing) {
                const item = existing.items.find(i => i.label === field.label)
                if (item) {
                  vals[field.field_key] = item.actual_value || ''
                  ress[field.field_key] = item.result || 'pending'
                  continue
                }
              }
              if (field.auto_fill_source && autoFillData[field.auto_fill_source]) {
                vals[field.field_key] = autoFillData[field.auto_fill_source]
              }
            }
          }
          setFormValues(vals)
          setFormResults(ress)
          const visible = data.sections.filter(
            (s: TemplateSection) => s.is_visible && s.fields.length > 0 && s.block_type !== 'header'
          )
          if (visible.length > 0) setActiveSection(visible[0].id)
        })
        .catch(() => toast.error('Failed to load template fields'))
        .finally(() => setLoadingTemplate(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateId])

    useEffect(() => {
      if (!template) return
      const els = Object.values(sectionRefs.current).filter(Boolean) as HTMLDivElement[]
      if (!els.length) return
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.find(e => e.isIntersecting)
          if (visible) setActiveSection(visible.target.id.replace('section-', ''))
        },
        { rootMargin: '-15% 0px -70% 0px' },
      )
      els.forEach(el => observer.observe(el))
      return () => observer.disconnect()
    }, [template])

    const validate = useCallback((): string[] => {
      if (!template) return []
      const missing: string[] = []
      for (const sec of template.sections) {
        for (const field of sec.fields) {
          if (!field.is_required || field.auto_fill_source) continue
          const isPF = field.field_type === 'checkbox' || field.field_type === 'boolean'
          if (isPF) {
            if ((formResults[field.field_key] || 'pending') === 'pending') missing.push(field.label)
          } else if (field.field_type !== 'file' && field.field_type !== 'signature') {
            if ((formValues[field.field_key] || '').trim() === '') missing.push(field.label)
          }
        }
      }
      return missing
    }, [template, formValues, formResults])

    useEffect(() => {
      if (!template || loadingTemplate) return
      onValidationChange?.(validate().length === 0)
    }, [formValues, formResults, template, loadingTemplate, validate, onValidationChange])

    const buildPayload = useCallback(() => {
      if (!template) return []
      return template.sections
        .filter(sec => sec.is_visible && sec.fields.length > 0)
        .map((sec, idx) => ({
          name: sec.name,
          sort_order: sec.sort_order || idx + 1,
          items: sec.fields.map(field => ({
            label: field.label,
            type: field.field_type,
            actual_value: formValues[field.field_key] || '',
            result: formResults[field.field_key] || 'pending',
            comment: '',
          })),
        }))
    }, [template, formValues, formResults])

    const save = useCallback(async () => {
      if (!template || saving) return
      setSaving(true)
      try {
        await api.post(`/inspections/${inspectionId}/save-form/`, { sections: buildPayload() })
        isDirty.current = false
        onSaved?.()
      } catch {
        toast.error('Auto-save failed')
      } finally {
        setSaving(false)
      }
    }, [template, saving, inspectionId, buildPayload, onSaved])

    useImperativeHandle(ref, () => ({ validate, save }), [validate, save])

    const triggerAutoSave = useCallback(() => {
      isDirty.current = true
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => { if (isDirty.current) save() }, 30000)
    }, [save])

    useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }, [])

    const setValue = (key: string, val: string) => {
      setFormValues(prev => ({ ...prev, [key]: val }))
      triggerAutoSave()
    }
    const setResult = (key: string, res: string) => {
      setFormResults(prev => ({ ...prev, [key]: res }))
      triggerAutoSave()
    }
    const handleBlur = () => { if (isDirty.current) save() }

    const isSectionComplete = useCallback((section: TemplateSection) => {
      for (const field of section.fields) {
        if (!field.is_required || field.auto_fill_source) continue
        const isPF = field.field_type === 'checkbox' || field.field_type === 'boolean'
        if (isPF) {
          if ((formResults[field.field_key] || 'pending') === 'pending') return false
        } else if (field.field_type !== 'file' && field.field_type !== 'signature') {
          if ((formValues[field.field_key] || '').trim() === '') return false
        }
      }
      return true
    }, [formValues, formResults])

    // Live PASS/FAIL badge — derived from defect table entries + AQL
    const liveResult = useMemo((): 'pass' | 'fail' | 'pending' => {
      if (!template) return 'pending'
      let minor = 0, major = 0, critical = 0
      for (const sec of template.sections) {
        for (const field of sec.fields) {
          if (field.field_type !== 'table') continue
          try {
            const rows: DefectRow[] = JSON.parse(formValues[field.field_key] || '[]')
            for (const r of rows) {
              minor += r.minor || 0
              major += r.major || 0
              critical += r.critical || 0
            }
          } catch { /* ignore parse errors */ }
        }
      }
      if (minor === 0 && major === 0 && critical === 0) return 'pending'
      const aql = cleanAql(autoFillData.aql_level || '2.5')
      const lot = parseInt(autoFillData.quantity_inspected || '0') || 1
      const ss = aqlSS(lot)
      const ar = aqlAR(ss, aql)
      if (critical > 0) return 'fail'
      if (major > ar[0]) return 'fail'
      return 'pass'
    }, [template, formValues, autoFillData])

    // ── Render ────────────────────────────────────────────────────────────────

    if (loadingTemplate) {
      return (
        <div className="flex items-center gap-2 py-6 text-sm text-text-muted">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading template fields…
        </div>
      )
    }

    const visibleSections = template?.sections
      .filter(s => s.is_visible && s.fields.length > 0 && s.block_type !== 'header')
      .sort((a, b) => a.sort_order - b.sort_order) ?? []

    if (!template || visibleSections.length === 0) {
      return (
        <div className="py-6 text-center text-sm text-text-muted">
          No form fields defined for this template yet.
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Header Card */}
        <InspectionHeaderCard autoFillData={autoFillData} liveResult={liveResult} saving={saving} />

        {/* Sidebar + sections */}
        <div className="flex gap-6 items-start">
          <aside className="hidden lg:block w-44 shrink-0">
            <div className="sticky top-20">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2 px-2">
                Sections
              </p>
              <nav className="space-y-0.5">
                {visibleSections.map(section => {
                  const hasRequired = section.fields.some(f => f.is_required && !f.auto_fill_source)
                  const complete = isSectionComplete(section)
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() =>
                        sectionRefs.current[section.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors',
                        activeSection === section.id
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-text-muted hover:bg-gray-100 hover:text-text-primary',
                      )}
                    >
                      <span className="flex-1 leading-tight">{BLOCK_LABELS[section.block_type] || section.name}</span>
                      {hasRequired && (
                        complete
                          ? <CheckCircle2 size={11} className="shrink-0 text-green-500" />
                          : <Circle size={11} className="shrink-0 text-gray-300" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          <div className="flex-1 space-y-6 min-w-0">
            {visibleSections.map(section => (
              <div
                key={section.id}
                id={`section-${section.id}`}
                ref={el => { sectionRefs.current[section.id] = el }}
                className="border border-border rounded-xl overflow-hidden scroll-mt-6"
              >
                <div className="bg-gray-50 px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {BLOCK_LABELS[section.block_type] || section.name}
                  </h3>
                  {isSectionComplete(section) && section.fields.some(f => f.is_required && !f.auto_fill_source) && (
                    <CheckCircle2 size={14} className="text-green-500" />
                  )}
                </div>
                <div className="p-4">
                  {section.block_type === 'context' ? (
                    <OrderContextSection
                      fields={[...section.fields].sort((a, b) => a.sort_order - b.sort_order)}
                      formValues={formValues}
                      setValue={setValue}
                      autoFillData={autoFillData}
                      onBlur={handleBlur}
                    />
                  ) : section.block_type === 'data' ? (
                    <PhysicalTestingSection
                      fields={[...section.fields].sort((a, b) => a.sort_order - b.sort_order)}
                      formValues={formValues}
                      formResults={formResults}
                      setValue={setValue}
                      setResult={setResult}
                      autoFillData={autoFillData}
                      onBlur={handleBlur}
                    />
                  ) : section.block_type === 'attachments' ? (
                    <AppearancePhotosSection
                      fields={[...section.fields].sort((a, b) => a.sort_order - b.sort_order)}
                      formValues={formValues}
                      setValue={setValue}
                      autoFillData={autoFillData}
                      onBlur={handleBlur}
                    />
                  ) : section.block_type === 'approval' ? (
                    <ApprovalSection
                      fields={[...section.fields].sort((a, b) => a.sort_order - b.sort_order)}
                      formValues={formValues}
                      formResults={formResults}
                      setValue={setValue}
                      setResult={setResult}
                      autoFillData={autoFillData}
                      onBlur={handleBlur}
                    />
                  ) : (
                    <FieldGrid
                      fields={[...section.fields].sort((a, b) => a.sort_order - b.sort_order)}
                      formValues={formValues}
                      formResults={formResults}
                      setValue={setValue}
                      setResult={setResult}
                      autoFillData={autoFillData}
                      onBlur={handleBlur}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
)

InspectionForm.displayName = 'InspectionForm'
export default InspectionForm

// ── InspectionHeaderCard ──────────────────────────────────────────────────────

function InspectionHeaderCard({
  autoFillData,
  liveResult,
  saving,
}: {
  autoFillData: Record<string, string>
  liveResult: 'pass' | 'fail' | 'pending'
  saving: boolean
}) {
  const badge = {
    pass:    { label: '✓ PASS',    cls: 'bg-green-500 text-white' },
    fail:    { label: '✗ FAIL',    cls: 'bg-red-500 text-white' },
    pending: { label: '● PENDING', cls: 'bg-gray-500 text-white' },
  }[liveResult]

  const templateLabel = autoFillData.template_code
    ? `${autoFillData.template_code} — ${autoFillData.template_name || ''}`
    : (autoFillData.template_name || '—')

  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-[#1a2940]">
      <div className="bg-[#1a2940] px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-white">

          {/* Col 1: Logo + badge */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-base font-bold leading-none tracking-tight">SankalpHub</p>
              <p className="text-[10px] text-blue-300 mt-0.5 uppercase tracking-wider">Quality Inspection Management</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('px-3 py-1 rounded text-xs font-bold tracking-wide', badge.cls)}>
                {badge.label}
              </span>
              {saving && (
                <span className="text-[10px] text-blue-300 flex items-center gap-1">
                  <div className="w-2.5 h-2.5 border border-blue-300 border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              )}
            </div>
          </div>

          {/* Col 2: Inspection meta */}
          <div className="space-y-1.5">
            <HRow label="Type"     value={autoFillData.inspection_type || '—'} />
            <HRow label="Date"     value={autoFillData.inspection_date || '—'} />
            <HRow label="No."      value={autoFillData.inspection_no || '—'} />
            <HRow label="Template" value={templateLabel} />
          </div>

          {/* Col 3: Inspector info */}
          <div className="space-y-1.5">
            <HRow label="Inspector"   value={autoFillData.auditor_name || autoFillData.inspector || '—'} />
            <HRow label="AQL Level"   value={autoFillData.aql_level || '—'} />
            <HRow label="Qty / Sample" value={autoFillData.quantity_inspected ? `${autoFillData.quantity_inspected} pcs` : '—'} />
            <HRow label="Status"      value={autoFillData.status || '—'} />
          </div>

          {/* Col 4: Order/PO info */}
          <div className="space-y-1.5">
            <HRow label="PO Number" value={autoFillData.production_order_number || '—'} />
            <HRow label="Factory"   value={autoFillData.factory_name || autoFillData.factory || '—'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function HRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-[10px] text-blue-300 uppercase tracking-wide font-semibold shrink-0 w-20 leading-relaxed">{label}:</span>
      <span className="text-xs text-white font-medium leading-relaxed">{value}</span>
    </div>
  )
}

// ── Shared grid props ─────────────────────────────────────────────────────────

interface GridProps {
  fields: TemplateField[]
  formValues: Record<string, string>
  formResults: Record<string, string>
  setValue: (k: string, v: string) => void
  setResult: (k: string, r: string) => void
  autoFillData: Record<string, string>
  onBlur: () => void
}

// ── OrderContextSection — 2-column key-value table layout ─────────────────────

function OrderContextSection({
  fields, formValues, setValue, autoFillData, onBlur,
}: {
  fields: TemplateField[]
  formValues: Record<string, string>
  setValue: (k: string, v: string) => void
  autoFillData: Record<string, string>
  onBlur: () => void
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="divide-y divide-gray-200">
        {fields.map((field, idx) => {
          const isAutoFill = !!field.auto_fill_source
          const value = isAutoFill
            ? (formValues[field.field_key] || autoFillData[field.auto_fill_source] || '—')
            : (formValues[field.field_key] || '')

          return (
            <div key={field.id} className={cn('flex', idx % 2 === 0 ? '' : '')}>
              <div className="bg-gray-50 px-3 py-2.5 w-40 shrink-0 border-r border-gray-200 flex items-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 leading-tight">
                  {field.label}
                  {field.is_required && !isAutoFill && <span className="text-red-400 ml-0.5">*</span>}
                </p>
              </div>
              <div className="flex-1 px-3 py-2 flex items-center">
                {isAutoFill ? (
                  <p className="text-xs font-medium text-text-primary">{value}</p>
                ) : field.field_type === 'dropdown' ? (
                  <select
                    value={value}
                    onChange={e => setValue(field.field_key, e.target.value)}
                    onBlur={onBlur}
                    className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30 rounded"
                  >
                    <option value="">Select…</option>
                    {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.field_type === 'date' ? (
                  <input
                    type="date"
                    value={value}
                    onChange={e => setValue(field.field_key, e.target.value)}
                    onBlur={onBlur}
                    className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30 rounded"
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={e => setValue(field.field_key, e.target.value)}
                    onBlur={onBlur}
                    placeholder={field.placeholder || '—'}
                    className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30 rounded placeholder:text-gray-300"
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── PhysicalTestingSection — 4-col alpha-labelled pass/fail grid ──────────────

function PhysicalTestingSection({ fields, formValues, formResults, setValue, setResult, autoFillData, onBlur }: GridProps) {
  const pfFields = fields.filter(f => f.field_type === 'checkbox' || f.field_type === 'boolean')
  const others    = fields.filter(f => f.field_type !== 'checkbox' && f.field_type !== 'boolean')

  return (
    <div className="space-y-4">
      {others.length > 0 && (
        <FieldGrid
          fields={others}
          formValues={formValues}
          formResults={formResults}
          setValue={setValue}
          setResult={setResult}
          autoFillData={autoFillData}
          onBlur={onBlur}
        />
      )}
      {pfFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {pfFields.map((field, idx) => {
            const letter = String.fromCharCode(65 + idx)
            const result = formResults[field.field_key] || 'pending'
            return (
              <div
                key={field.id}
                className={cn(
                  'border rounded-lg p-3 transition-colors',
                  result === 'pass' ? 'border-green-200 bg-green-50/60' :
                  result === 'fail' ? 'border-red-200 bg-red-50/60' :
                  result === 'na'   ? 'border-gray-200 bg-gray-50' :
                                      'border-gray-200 bg-white',
                )}
              >
                <div className="flex items-start gap-2 mb-2.5">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 shrink-0 leading-tight">
                    {letter}
                  </span>
                  <p className="text-[11px] font-medium text-text-primary leading-tight">
                    {field.label}
                    {field.is_required && <span className="text-red-400 ml-0.5">*</span>}
                  </p>
                </div>
                <div className="flex gap-1">
                  {(['pass', 'fail', 'na'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setResult(field.field_key, result === opt ? 'pending' : opt)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-0.5 py-1.5 rounded text-[10px] font-semibold border transition-all',
                        opt === 'pass' && result === 'pass' ? 'bg-green-500 text-white border-green-500 shadow-sm' :
                        opt === 'fail' && result === 'fail' ? 'bg-red-500 text-white border-red-500 shadow-sm' :
                        opt === 'na'   && result === 'na'   ? 'bg-gray-400 text-white border-gray-400 shadow-sm' :
                        opt === 'pass' ? 'bg-white text-gray-400 border-gray-200 hover:border-green-300 hover:text-green-600' :
                        opt === 'fail' ? 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-600' :
                                        'bg-white text-gray-400 border-gray-200 hover:border-gray-400',
                      )}
                    >
                      {opt === 'pass' ? <Check size={9} /> : opt === 'fail' ? <X size={9} /> : <Minus size={9} />}
                      <span>{opt === 'na' ? 'N/A' : opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── AppearancePhotosSection — 4-col labelled photo grid ───────────────────────

function AppearancePhotosSection({
  fields, formValues, setValue, autoFillData, onBlur,
}: {
  fields: TemplateField[]
  formValues: Record<string, string>
  setValue: (k: string, v: string) => void
  autoFillData: Record<string, string>
  onBlur: () => void
}) {
  const fileFields  = fields.filter(f => f.field_type === 'file')
  const otherFields = fields.filter(f => f.field_type !== 'file')

  return (
    <div className="space-y-4">
      {fileFields.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {fileFields.map(field => (
            <PhotoSlot
              key={field.id}
              label={field.label}
              required={field.is_required}
              value={formValues[field.field_key] || ''}
              onChange={v => { setValue(field.field_key, v); onBlur() }}
            />
          ))}
        </div>
      )}
      {otherFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {otherFields.map(field => {
            if (field.auto_fill_source) {
              return (
                <AutoFillCard
                  key={field.id}
                  field={field}
                  value={formValues[field.field_key] || autoFillData[field.auto_fill_source] || '—'}
                />
              )
            }
            return (
              <InputCard
                key={field.id}
                field={field}
                value={formValues[field.field_key] || ''}
                onChange={v => setValue(field.field_key, v)}
                onBlur={onBlur}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function PhotoSlot({
  label, required, value, onChange,
}: {
  label: string
  required: boolean
  value: string
  onChange: (v: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => onChange(e.target?.result as string || '')
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold text-center text-text-muted">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file?.type.startsWith('image/')) handleFile(file)
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative rounded-lg overflow-hidden border-2 aspect-square cursor-pointer transition-colors',
          dragging ? 'border-primary bg-primary/5' :
          value    ? 'border-gray-200' :
                     'border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5',
        )}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
              <Camera size={18} className="text-white" />
              <span className="text-[10px] text-white font-medium">Replace</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <Camera size={20} className={dragging ? 'text-primary' : 'text-gray-300'} />
            <span className="text-[10px] text-gray-400">Click or drop</span>
          </div>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onChange('') }}
          className="text-[10px] text-red-400 hover:text-red-600 text-center transition-colors"
        >
          Remove
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

// ── FieldGrid — default 4-column responsive grid ──────────────────────────────

function FieldGrid({ fields, formValues, formResults, setValue, setResult, autoFillData, onBlur }: GridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {fields.map(field => {
        const isFullWidth = field.field_type === 'table' || field.field_type === 'textarea'
        const isAutoFill  = !!field.auto_fill_source
        const isPassFail  = field.field_type === 'checkbox' || field.field_type === 'boolean'
        const fillVal = isAutoFill
          ? (formValues[field.field_key] || autoFillData[field.auto_fill_source] || '—')
          : ''

        return (
          <div
            key={field.id}
            className={cn(isFullWidth && 'col-span-full sm:col-span-2 lg:col-span-4')}
          >
            {field.field_type === 'table' ? (
              <DefectTable
                field={field}
                value={formValues[field.field_key] || ''}
                onChange={v => setValue(field.field_key, v)}
                onBlur={onBlur}
              />
            ) : isAutoFill ? (
              <AutoFillCard field={field} value={fillVal} />
            ) : isPassFail ? (
              <PassFailCard
                field={field}
                result={formResults[field.field_key] || 'pending'}
                onChange={r => setResult(field.field_key, r)}
              />
            ) : (
              <InputCard
                field={field}
                value={formValues[field.field_key] || ''}
                onChange={v => setValue(field.field_key, v)}
                onBlur={onBlur}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── AutoFillCard ──────────────────────────────────────────────────────────────

function AutoFillCard({ field, value }: { field: TemplateField; value: string }) {
  return (
    <div className="rounded-lg bg-[#f5f5f5] border border-gray-200 p-3 h-full">
      <p className="text-[11px] font-medium text-gray-500 mb-1 leading-tight">{field.label}</p>
      <p className="text-sm font-medium text-gray-700 truncate" title={value}>{value}</p>
    </div>
  )
}

// ── PassFailCard ──────────────────────────────────────────────────────────────

function PassFailCard({ field, result, onChange }: {
  field: TemplateField
  result: string
  onChange: (r: string) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <p className="text-[11px] font-medium text-text-muted mb-2 leading-tight flex items-start gap-0.5">
        <span>{field.label}</span>
        {field.is_required && <span className="text-red-400 mt-px shrink-0">*</span>}
      </p>
      <div className="flex gap-1">
        {(['pass', 'fail', 'na'] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(result === opt ? 'pending' : opt)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-semibold border transition-all',
              opt === 'pass' && result === 'pass' ? 'bg-green-500 text-white border-green-500 shadow-sm' :
              opt === 'fail' && result === 'fail' ? 'bg-red-500 text-white border-red-500 shadow-sm' :
              opt === 'na'   && result === 'na'   ? 'bg-gray-400 text-white border-gray-400 shadow-sm' :
              opt === 'pass' ? 'bg-white text-gray-400 border-gray-200 hover:border-green-300 hover:text-green-600' :
              opt === 'fail' ? 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-600' :
                               'bg-white text-gray-400 border-gray-200 hover:border-gray-400',
            )}
          >
            {opt === 'pass' ? <Check size={10} /> : opt === 'fail' ? <X size={10} /> : <Minus size={10} />}
            {opt === 'na' ? 'N/A' : opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── InputCard ─────────────────────────────────────────────────────────────────

function InputCard({ field, value, onChange, onBlur }: {
  field: TemplateField
  value: string
  onChange: (v: string) => void
  onBlur: () => void
}) {
  const base = 'w-full px-2.5 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white'

  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <p className="text-[11px] font-medium text-text-muted mb-1.5 leading-tight flex items-start gap-0.5">
        <span>{field.label}</span>
        {field.is_required && <span className="text-red-400 mt-px shrink-0">*</span>}
      </p>
      {field.field_type === 'textarea' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder}
          rows={3}
          className={cn(base, 'resize-none')}
        />
      ) : field.field_type === 'dropdown' ? (
        <select value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} className={base}>
          <option value="">Select…</option>
          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : field.field_type === 'date' ? (
        <input type="date" value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} className={base} />
      ) : field.field_type === 'number' || field.field_type === 'decimal' ? (
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder}
          step={field.field_type === 'decimal' ? '0.01' : '1'}
          className={base}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder || (field.field_type === 'signature' ? 'Signatory name' : '')}
          className={base}
        />
      )}
      {field.help_text && (
        <p className="text-[10px] text-text-muted mt-1">{field.help_text}</p>
      )}
    </div>
  )
}

// ── DefectTable — full-width table with Evidence photo column ─────────────────

function DefectTable({ field, value, onChange, onBlur }: {
  field: TemplateField
  value: string
  onChange: (v: string) => void
  onBlur: () => void
}) {
  const rows: DefectRow[] = (() => {
    try {
      const p = JSON.parse(value)
      return Array.isArray(p) ? p : []
    } catch { return [] }
  })()

  const evidenceRefs = useRef<(HTMLInputElement | null)[]>([])

  const update = (newRows: DefectRow[]) => onChange(JSON.stringify(newRows))

  const addRow = () => {
    update([...rows, { group: '', defect_name: '', minor: 0, major: 0, critical: 0, remark: '', photo_url: '' }])
    onBlur()
  }

  const setCell = (idx: number, key: keyof DefectRow, val: string | number) =>
    update(rows.map((r, i) => i === idx ? { ...r, [key]: val } : r))

  const removeRow = (idx: number) => { update(rows.filter((_, i) => i !== idx)); onBlur() }

  const handleEvidence = (idx: number, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => { setCell(idx, 'photo_url', e.target?.result as string || ''); onBlur() }
    reader.readAsDataURL(file)
  }

  const cell = 'w-full px-1.5 py-1 text-xs bg-transparent border border-transparent rounded hover:border-border focus:border-border focus:outline-none focus:ring-1 focus:ring-primary/20'

  return (
    <div>
      <p className="text-[11px] font-medium text-text-muted mb-2 flex items-center gap-0.5">
        {field.label}
        {field.is_required && <span className="text-red-400">*</span>}
      </p>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-muted w-7">#</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-muted w-28">Group</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-muted">Defect Name</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-muted w-28">Remark</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-yellow-600 w-14">Minor</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-orange-600 w-14">Major</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-red-600 w-16">Critical</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-text-muted w-16">Evidence</th>
                <th className="w-7" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-5 text-center text-xs text-text-muted italic">
                    No defects recorded — click &quot;Add Defect&quot; to begin.
                  </td>
                </tr>
              ) : rows.map((row, idx) => (
                <tr key={idx} className="border-b border-border last:border-0 hover:bg-gray-50/50 group">
                  <td className="px-2 py-1 text-xs text-text-muted">{idx + 1}</td>
                  <td className="px-1 py-1">
                    <input value={row.group} onChange={e => setCell(idx, 'group', e.target.value)} onBlur={onBlur} placeholder="Stitching" className={cell} />
                  </td>
                  <td className="px-1 py-1">
                    <input value={row.defect_name} onChange={e => setCell(idx, 'defect_name', e.target.value)} onBlur={onBlur} placeholder="Loose thread" className={cell} />
                  </td>
                  <td className="px-1 py-1">
                    <input value={row.remark} onChange={e => setCell(idx, 'remark', e.target.value)} onBlur={onBlur} placeholder="Notes…" className={cell} />
                  </td>
                  <td className="px-1 py-1">
                    <input type="number" min="0" value={row.minor} onChange={e => setCell(idx, 'minor', parseInt(e.target.value) || 0)} onBlur={onBlur} className={cn(cell, 'text-center')} />
                  </td>
                  <td className="px-1 py-1">
                    <input type="number" min="0" value={row.major} onChange={e => setCell(idx, 'major', parseInt(e.target.value) || 0)} onBlur={onBlur} className={cn(cell, 'text-center')} />
                  </td>
                  <td className="px-1 py-1">
                    <input type="number" min="0" value={row.critical} onChange={e => setCell(idx, 'critical', parseInt(e.target.value) || 0)} onBlur={onBlur} className={cn(cell, 'text-center')} />
                  </td>
                  <td className="px-1 py-1 text-center">
                    {row.photo_url ? (
                      <div
                        className="relative inline-block cursor-pointer group/ev"
                        onClick={() => evidenceRefs.current[idx]?.click()}
                      >
                        <img
                          src={row.photo_url}
                          alt="evidence"
                          className="w-8 h-8 object-cover rounded border border-gray-200 mx-auto"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded opacity-0 group-hover/ev:opacity-100 flex items-center justify-center transition-opacity">
                          <Camera size={10} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => evidenceRefs.current[idx]?.click()}
                        className="p-1.5 border border-dashed border-gray-300 rounded text-gray-400 hover:text-primary hover:border-primary/50 transition-colors mx-auto flex"
                      >
                        <Camera size={11} />
                      </button>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={el => { evidenceRefs.current[idx] = el }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleEvidence(idx, f) }}
                    />
                  </td>
                  <td className="px-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                    >
                      <X size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 bg-gray-50 border-t border-border">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus size={13} />
            Add Defect
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ApprovalSection ───────────────────────────────────────────────────────────

function ApprovalSection({ fields, formValues, formResults, setValue, setResult, autoFillData, onBlur }: GridProps) {
  const sigFields   = fields.filter(f => f.field_type === 'signature')
  const otherFields = fields.filter(f => f.field_type !== 'signature')

  const padded: (TemplateField | null)[] = [...sigFields]
  while (padded.length % 3 !== 0 && padded.length > 0) padded.push(null)

  return (
    <div className="space-y-4">
      {otherFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {otherFields.map(field => {
            if (field.auto_fill_source) {
              return (
                <AutoFillCard
                  key={field.id}
                  field={field}
                  value={formValues[field.field_key] || autoFillData[field.auto_fill_source] || '—'}
                />
              )
            }
            if (field.field_type === 'checkbox' || field.field_type === 'boolean') {
              return (
                <PassFailCard
                  key={field.id}
                  field={field}
                  result={formResults[field.field_key] || 'pending'}
                  onChange={r => setResult(field.field_key, r)}
                />
              )
            }
            return (
              <InputCard
                key={field.id}
                field={field}
                value={formValues[field.field_key] || ''}
                onChange={v => setValue(field.field_key, v)}
                onBlur={onBlur}
              />
            )
          })}
        </div>
      )}
      {sigFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {padded.map((field, idx) =>
            !field ? (
              <div key={`pad-${idx}`} className="border border-dashed border-gray-200 rounded-xl" />
            ) : (
              <SignatureBlock
                key={field.id}
                field={field}
                value={
                  formValues[field.field_key] ||
                  (field.auto_fill_source ? autoFillData[field.auto_fill_source] : '') ||
                  ''
                }
                onChange={v => setValue(field.field_key, v)}
                onBlur={onBlur}
                readOnly={!!field.auto_fill_source}
              />
            ),
          )}
        </div>
      )}
    </div>
  )
}

// ── SignatureBlock ─────────────────────────────────────────────────────────────

function SignatureBlock({ field, value, onChange, onBlur, readOnly }: {
  field: TemplateField
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  readOnly: boolean
}) {
  const inputBase = 'w-full px-2.5 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-semibold text-text-primary">
        {field.label}
        {field.is_required && !readOnly && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      <div className={cn(
        'border border-dashed rounded-lg h-20 flex items-center justify-center',
        readOnly ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white',
      )}>
        {value ? (
          <p className="text-base italic font-medium text-text-primary px-3 text-center">{value}</p>
        ) : (
          <p className="text-xs text-text-muted">{readOnly ? '—' : 'Type name below'}</p>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        readOnly={readOnly}
        placeholder={readOnly ? '' : 'Full name'}
        className={cn(inputBase, readOnly && 'bg-gray-50 text-gray-500 cursor-default')}
      />
      <input
        type="date"
        defaultValue={new Date().toISOString().split('T')[0]}
        readOnly={readOnly}
        className={cn(inputBase, readOnly && 'bg-gray-50 text-gray-500 cursor-default')}
      />
    </div>
  )
}
