'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type Defect, type SeverityLevel, type DefectType, type ProductCategoryId, type StageKey,
  DEFECTS, SEVERITY_CONFIG,
} from './defects-data'
import DefectFilterBar from './DefectFilterBar'
import DefectCard from './DefectCard'
import AddDefectModal from './AddDefectModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useConfirm } from '@/hooks/useConfirm'

const STORAGE_KEY = 'defects-library'

export default function DefectLibrary() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTypes, setActiveTypes] = useState<DefectType[]>([])
  const [activeSeverities, setActiveSeverities] = useState<SeverityLevel[]>([])
  const [activeCategories, setActiveCategories] = useState<ProductCategoryId[]>([])
  const [activeStage, setActiveStage] = useState<StageKey | null>(null)
  const [expandedDefects, setExpandedDefects] = useState<Set<string>>(new Set())
  const [customDefects, setCustomDefects] = useState<Defect[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDefect, setEditingDefect] = useState<Defect | null>(null)
  const { confirm, modalProps } = useConfirm()

  // Load custom defects from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setCustomDefects(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const saveCustomDefects = useCallback((defects: Defect[]) => {
    setCustomDefects(defects)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defects))
  }, [])

  const handleAddDefect = useCallback((defect: Defect) => {
    if (editingDefect) {
      // Update existing
      saveCustomDefects(customDefects.map(d => d.id === defect.id ? defect : d))
    } else {
      // Add new
      saveCustomDefects([...customDefects, defect])
    }
    setEditingDefect(null)
  }, [customDefects, editingDefect, saveCustomDefects])

  const handleDeleteDefect = useCallback(async (defectId: string) => {
    const ok = await confirm({
      title: 'Delete Defect',
      message: 'Are you sure you want to delete this custom defect?',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    saveCustomDefects(customDefects.filter(d => d.id !== defectId))
  }, [customDefects, saveCustomDefects, confirm])

  const handleEditDefect = useCallback((defect: Defect) => {
    setEditingDefect(defect)
    setShowAddModal(true)
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpandedDefects(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Merge built-in + custom
  const allDefects = useMemo(() => [...DEFECTS, ...customDefects], [customDefects])

  // Filter
  const filteredDefects = useMemo(() => {
    return allDefects.filter(d => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!d.name.toLowerCase().includes(q) && !d.code.toLowerCase().includes(q)) return false
      }
      // Type
      if (activeTypes.length > 0 && !activeTypes.includes(d.type)) return false
      // Severity
      if (activeSeverities.length > 0 && !activeSeverities.includes(d.severity)) return false
      // Category
      if (activeCategories.length > 0 && !activeCategories.some(c => d.applies_to.includes(c))) return false
      // Stage
      if (activeStage && !d.stage_checks[activeStage]?.active) return false
      return true
    })
  }, [allDefects, searchQuery, activeTypes, activeSeverities, activeCategories, activeStage])

  // Summary counts
  const severityCounts = useMemo(() => {
    const counts = { CRITICAL: 0, MAJOR: 0, MINOR: 0, COSMETIC: 0 }
    filteredDefects.forEach(d => { counts[d.severity]++ })
    return counts
  }, [filteredDefects])

  const toggleExpandAll = () => {
    if (expandedDefects.size === filteredDefects.length) {
      setExpandedDefects(new Set())
    } else {
      setExpandedDefects(new Set(filteredDefects.map(d => d.id)))
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Defect Library</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {filteredDefects.length} defect{filteredDefects.length !== 1 ? 's' : ''}
            {filteredDefects.length !== allDefects.length && ` of ${allDefects.length} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleExpandAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary border border-gray-200 rounded-lg transition-colors"
          >
            <ChevronsUpDown size={14} />
            {expandedDefects.size === filteredDefects.length ? 'Collapse All' : 'Expand All'}
          </button>
          <button
            onClick={() => { setEditingDefect(null); setShowAddModal(true) }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add Defect
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {(['CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC'] as SeverityLevel[]).map((level) => {
          const config = SEVERITY_CONFIG[level]
          const count = severityCounts[level]
          return (
            <div key={level} className={cn('rounded-lg border p-3', config.bg, config.border)}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={cn('w-2 h-2 rounded-full', config.dot)} />
                <span className={cn('text-xs font-semibold', config.text)}>{config.label}</span>
              </div>
              <div className="text-lg font-bold text-text-primary">{count}</div>
              <div className="text-[10px] text-text-muted">AQL {config.aql}</div>
            </div>
          )
        })}
      </div>

      {/* Filter Bar */}
      <DefectFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTypes={activeTypes}
        setActiveTypes={setActiveTypes}
        activeSeverities={activeSeverities}
        setActiveSeverities={setActiveSeverities}
        activeCategories={activeCategories}
        setActiveCategories={setActiveCategories}
        activeStage={activeStage}
        setActiveStage={setActiveStage}
      />

      {/* Defect List */}
      {filteredDefects.length > 0 ? (
        <div className="space-y-2">
          {filteredDefects.map((defect) => (
            <DefectCard
              key={defect.id}
              defect={defect}
              expanded={expandedDefects.has(defect.id)}
              onToggle={() => toggleExpand(defect.id)}
              onEdit={defect.custom ? () => handleEditDefect(defect) : undefined}
              onDelete={defect.custom ? () => handleDeleteDefect(defect.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <p className="text-sm font-medium text-text-primary mb-1">No defects found</p>
          <p className="text-xs text-text-muted">Try adjusting your filters or search query.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddDefectModal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingDefect(null) }}
        onSave={handleAddDefect}
        editDefect={editingDefect}
        allDefects={allDefects}
      />

      <ConfirmModal {...modalProps} />
    </div>
  )
}
