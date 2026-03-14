'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type SeverityLevel, type DefectType, type ProductCategoryId, type StageKey,
  SEVERITY_CONFIG, DEFECT_TYPES, DEFECT_TYPE_STYLES, PRODUCT_CATEGORIES, PROCESS_STAGES,
} from './defects-data'

interface DefectFilterBarProps {
  searchQuery: string
  setSearchQuery: (q: string) => void
  activeTypes: DefectType[]
  setActiveTypes: (t: DefectType[]) => void
  activeSeverities: SeverityLevel[]
  setActiveSeverities: (s: SeverityLevel[]) => void
  activeCategories: ProductCategoryId[]
  setActiveCategories: (c: ProductCategoryId[]) => void
  activeStage: StageKey | null
  setActiveStage: (s: StageKey | null) => void
}

function toggleInArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
}

export default function DefectFilterBar({
  searchQuery, setSearchQuery,
  activeTypes, setActiveTypes,
  activeSeverities, setActiveSeverities,
  activeCategories, setActiveCategories,
  activeStage, setActiveStage,
}: DefectFilterBarProps) {
  const activeFilterCount =
    activeTypes.length + activeSeverities.length + activeCategories.length + (activeStage ? 1 : 0)

  const clearAll = () => {
    setActiveTypes([])
    setActiveSeverities([])
    setActiveCategories([])
    setActiveStage(null)
    setSearchQuery('')
  }

  return (
    <div className="space-y-3 bg-white rounded-xl border border-border p-4">
      {/* Row 1: Type pills + Search */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mr-1">Type</span>
        {DEFECT_TYPES.map((type) => {
          const active = activeTypes.includes(type)
          const style = DEFECT_TYPE_STYLES[type]
          return (
            <button
              key={type}
              onClick={() => setActiveTypes(toggleInArray(activeTypes, type))}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                active
                  ? `${style.bg} ${style.text} ${style.border}`
                  : 'bg-white text-text-muted border-gray-200 hover:border-gray-300'
              )}
            >
              {type}
            </button>
          )
        })}

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-full sm:w-48">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search defects..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Row 2: Severity pills + Stage dropdown */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mr-1">Severity</span>
        {(['CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC'] as SeverityLevel[]).map((sev) => {
          const active = activeSeverities.includes(sev)
          const config = SEVERITY_CONFIG[sev]
          return (
            <button
              key={sev}
              onClick={() => setActiveSeverities(toggleInArray(activeSeverities, sev))}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                active
                  ? `${config.bg} ${config.text} ${config.border}`
                  : 'bg-white text-text-muted border-gray-200 hover:border-gray-300'
              )}
            >
              {config.label}
            </button>
          )
        })}

        <div className="flex-1" />

        {/* Stage dropdown */}
        <select
          value={activeStage || ''}
          onChange={(e) => setActiveStage(e.target.value ? e.target.value as StageKey : null)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Stages</option>
          {PROCESS_STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.code} — {s.label}</option>
          ))}
        </select>
      </div>

      {/* Row 3: Product category pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mr-1">Category</span>
        {PRODUCT_CATEGORIES.map((cat) => {
          const active = activeCategories.includes(cat.id)
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategories(toggleInArray(activeCategories, cat.id))}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                active
                  ? 'bg-sky-50 text-sky-700 border-sky-300'
                  : 'bg-white text-text-muted border-gray-200 hover:border-gray-300'
              )}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Active filter indicator */}
      {(activeFilterCount > 0 || searchQuery) && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] text-text-muted">
            {activeFilterCount + (searchQuery ? 1 : 0)} filter{activeFilterCount + (searchQuery ? 1 : 0) !== 1 ? 's' : ''} active
          </span>
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <X size={10} />
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
