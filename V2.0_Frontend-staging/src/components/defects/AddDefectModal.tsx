'use client'

import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type Defect, type DefectType, type SeverityLevel, type ProductCategoryId, type StageKey, type StageCheck,
  DEFECT_TYPES, SEVERITY_CONFIG, PRODUCT_CATEGORIES, PROCESS_STAGES,
} from './defects-data'

interface AddDefectModalProps {
  open: boolean
  onClose: () => void
  onSave: (defect: Defect) => void
  editDefect?: Defect | null
  allDefects: Defect[]
}

const CATEGORY_PREFIX: Record<string, string> = {
  mens_outerwear: 'G-C', womens_outerwear: 'G-C',
  footwear: 'FW-C', gloves: 'GL-C',
  headwear: 'HW-C', accessories: 'AC-C',
}

function generateCode(categories: ProductCategoryId[], allDefects: Defect[]): string {
  if (categories.length === 0) return ''
  const prefix = CATEGORY_PREFIX[categories[0]] || 'CUSTOM-'
  const existing = allDefects
    .filter(d => d.code.startsWith(prefix))
    .map(d => parseInt(d.code.replace(prefix, ''), 10))
    .filter(n => !isNaN(n))
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1
  return `${prefix}${String(next).padStart(2, '0')}`
}

const AQL_MAP: Record<SeverityLevel, string> = { CRITICAL: '1.0', MAJOR: '2.5', MINOR: '4.0', COSMETIC: '6.5' }

function emptyStageChecks(): Record<StageKey, StageCheck> {
  const checks = {} as Record<StageKey, StageCheck>
  for (const s of PROCESS_STAGES) {
    checks[s.key] = { active: false, action: '', check: '', responsibility: '', tools_required: [], pass_criteria: '' }
  }
  return checks
}

export default function AddDefectModal({ open, onClose, onSave, editDefect, allDefects }: AddDefectModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<DefectType>('Material')
  const [severity, setSeverity] = useState<SeverityLevel>('MAJOR')
  const [appliesTo, setAppliesTo] = useState<ProductCategoryId[]>([])
  const [description, setDescription] = useState('')
  const [rootCause, setRootCause] = useState('')
  const [testStandards, setTestStandards] = useState('')
  const [stageChecks, setStageChecks] = useState<Record<StageKey, StageCheck>>(emptyStageChecks)

  useEffect(() => {
    if (editDefect) {
      setName(editDefect.name)
      setType(editDefect.type)
      setSeverity(editDefect.severity)
      setAppliesTo([...editDefect.applies_to])
      setDescription(editDefect.description)
      setRootCause(editDefect.root_cause)
      setTestStandards(editDefect.test_standards.join(', '))
      setStageChecks({ ...editDefect.stage_checks })
    } else {
      setName('')
      setType('Material')
      setSeverity('MAJOR')
      setAppliesTo([])
      setDescription('')
      setRootCause('')
      setTestStandards('')
      setStageChecks(emptyStageChecks())
    }
  }, [editDefect, open])

  // Auto-generate code based on selected category (read-only for editing)
  const code = useMemo(() => {
    if (editDefect) return editDefect.code
    return generateCode(appliesTo, allDefects)
  }, [editDefect, appliesTo, allDefects])

  const toggleCategory = (id: ProductCategoryId) => {
    setAppliesTo(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const updateStageCheck = (key: StageKey, field: keyof StageCheck, value: string | boolean | string[]) => {
    setStageChecks(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  const handleSave = () => {
    if (!code || !name.trim()) return

    const defect: Defect = {
      id: editDefect?.id || `DEF-${code}`,
      code,
      name: name.trim(),
      type,
      applies_to: appliesTo,
      products_affected: [],
      description: description.trim(),
      root_cause: rootCause.trim(),
      severity,
      aql_class: AQL_MAP[severity],
      trend_risk: severity === 'CRITICAL' ? 'CRITICAL' : severity === 'MAJOR' ? 'HIGH' : 'MEDIUM',
      test_standards: testStandards.split(',').map(s => s.trim()).filter(Boolean),
      stage_checks: stageChecks,
      custom: true,
    }
    onSave(defect)
    onClose()
  }

  if (!open) return null

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-start justify-center lg:pt-10 lg:pb-10">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl lg:rounded-xl border border-border shadow-xl w-full lg:max-w-2xl max-h-[90vh] lg:max-h-[85vh] overflow-y-auto lg:mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-text-primary">
            {editDefect ? 'Edit Defect' : 'Add New Defect'}
          </h2>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Code + Name */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Code *</label>
              <input value={code} readOnly disabled className={cn(inputClass, 'bg-gray-100 cursor-not-allowed')} placeholder="Auto-generated" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-primary mb-1">Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Defect name" />
            </div>
          </div>

          {/* Type + Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value as DefectType)} className={inputClass}>
                {DEFECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Severity</label>
              <select value={severity} onChange={e => setSeverity(e.target.value as SeverityLevel)} className={inputClass}>
                {(['CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC'] as SeverityLevel[]).map(s => (
                  <option key={s} value={s}>{SEVERITY_CONFIG[s].label} (AQL {AQL_MAP[s]})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Applies To */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">Applies To</label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                    appliesTo.includes(cat.id)
                      ? 'bg-sky-50 text-sky-700 border-sky-300'
                      : 'bg-white text-text-muted border-gray-200 hover:border-gray-300'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description + Root Cause */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className={cn(inputClass, 'h-16 resize-none')} placeholder="Describe the defect..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Root Cause</label>
            <textarea value={rootCause} onChange={e => setRootCause(e.target.value)} className={cn(inputClass, 'h-16 resize-none')} placeholder="Common root causes..." />
          </div>

          {/* Test Standards */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Test Standards</label>
            <input value={testStandards} onChange={e => setTestStandards(e.target.value)} className={inputClass} placeholder="Comma-separated, e.g. ASTM D903, EN ISO 11339" />
          </div>

          {/* Stage Checks */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-2">Stage Checks</label>
            <div className="space-y-2">
              {PROCESS_STAGES.map((stage) => {
                const check = stageChecks[stage.key]
                return (
                  <div key={stage.key} className={cn('border rounded-lg overflow-hidden', check.active ? 'border-gray-300' : 'border-gray-100')}>
                    <button
                      type="button"
                      onClick={() => updateStageCheck(stage.key, 'active', !check.active)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                        check.active ? 'bg-gray-50' : 'bg-white hover:bg-gray-50/50'
                      )}
                    >
                      <div className={cn(
                        'w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0',
                        check.active ? 'bg-primary border-primary' : 'border-gray-300'
                      )}>
                        {check.active && <span className="text-white text-[8px] font-bold">&#10003;</span>}
                      </div>
                      <span className="text-[10px] font-mono text-text-muted">{stage.code}</span>
                      <span className="text-xs text-text-primary">{stage.label}</span>
                      <span className="text-[9px] text-text-muted ml-auto">{stage.phase}</span>
                    </button>
                    {check.active && (
                      <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-text-muted mb-0.5">Action</label>
                            <input
                              value={check.action}
                              onChange={e => updateStageCheck(stage.key, 'action', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                              placeholder="e.g. TEST, VERIFY"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-text-muted mb-0.5">Responsibility</label>
                            <input
                              value={check.responsibility}
                              onChange={e => updateStageCheck(stage.key, 'responsibility', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                              placeholder="e.g. QC Manager"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-muted mb-0.5">Check</label>
                          <textarea
                            value={check.check}
                            onChange={e => updateStageCheck(stage.key, 'check', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 h-12 resize-none"
                            placeholder="What to check..."
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-muted mb-0.5">Pass Criteria</label>
                          <input
                            value={check.pass_criteria}
                            onChange={e => updateStageCheck(stage.key, 'pass_criteria', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                            placeholder="Pass/fail criteria"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!code || !name.trim()}
            className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {editDefect ? 'Save Changes' : 'Add Defect'}
          </button>
        </div>
      </div>
    </div>
  )
}
