'use client'

import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Defect, SEVERITY_CONFIG, DEFECT_TYPE_STYLES, PROCESS_STAGES, PRODUCT_CATEGORIES } from './defects-data'
import StageCheckTimeline from './StageCheckTimeline'

interface DefectCardProps {
  defect: Defect
  expanded: boolean
  onToggle: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function DefectCard({ defect, expanded, onToggle, onEdit, onDelete }: DefectCardProps) {
  const sevConfig = SEVERITY_CONFIG[defect.severity]
  const typeStyle = DEFECT_TYPE_STYLES[defect.type]

  const activeStageCount = PROCESS_STAGES.filter(s => defect.stage_checks[s.key].active).length

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Collapsed Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors text-left"
      >
        {/* Severity dot */}
        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', sevConfig.dot)} title={defect.severity} />

        {/* Code */}
        <span className="text-xs font-mono text-text-muted w-16 shrink-0">{defect.code}</span>

        {/* Name */}
        <span className="text-sm font-medium text-text-primary flex-1 min-w-0 truncate">{defect.name}</span>

        {/* Type badge */}
        <span className={cn(
          'hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-medium border shrink-0',
          typeStyle.bg, typeStyle.text, typeStyle.border
        )}>
          {defect.type}
        </span>

        {/* AQL pill */}
        <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-text-muted border border-gray-200 shrink-0">
          AQL {defect.aql_class}
        </span>

        {/* Stage dots */}
        <div className="hidden lg:flex items-center gap-0.5 shrink-0" title={`${activeStageCount}/10 stages active`}>
          {PROCESS_STAGES.map((stage) => (
            <div
              key={stage.key}
              title={stage.label}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                defect.stage_checks[stage.key].active ? sevConfig.dot : 'bg-gray-200'
              )}
            />
          ))}
        </div>

        {/* Custom defect actions */}
        {defect.custom ? (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] font-medium text-text-muted bg-gray-100 px-1.5 py-0.5 rounded">Custom</span>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit() }}
                className="p-1 text-text-muted hover:text-primary transition-colors"
                title="Edit defect"
              >
                <Pencil size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="p-1 text-text-muted hover:text-danger transition-colors"
                title="Delete defect"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ) : (
          <span className="hidden xl:inline-flex text-[9px] font-medium text-text-muted bg-gray-50 px-1.5 py-0.5 rounded shrink-0">
            Built-in
          </span>
        )}

        {/* Chevron */}
        {expanded
          ? <ChevronUp size={16} className="text-text-muted shrink-0" />
          : <ChevronDown size={16} className="text-text-muted shrink-0" />
        }
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-5">
          {/* Section A: Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Description + Root Cause */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-text-primary mb-1">Description</h4>
                <p className="text-xs text-text-muted leading-relaxed">{defect.description}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-primary mb-1">Root Cause</h4>
                <p className="text-xs text-text-muted leading-relaxed">{defect.root_cause}</p>
              </div>
            </div>

            {/* Right: Metadata */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-text-primary mb-1">Products Affected</h4>
                <p className="text-xs text-text-muted">{defect.products_affected.join(', ')}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-primary mb-1.5">Applies To</h4>
                <div className="flex flex-wrap gap-1">
                  {defect.applies_to.map((catId) => {
                    const cat = PRODUCT_CATEGORIES.find(c => c.id === catId)
                    return (
                      <span key={catId} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-text-muted border border-gray-200">
                        {cat?.label || catId}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-primary mb-1.5">Test Standards</h4>
                <div className="flex flex-wrap gap-1">
                  {defect.test_standards.map((std) => (
                    <span key={std} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {std}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[10px] text-text-muted">Severity: </span>
                  <span className={cn('text-xs font-bold', sevConfig.text)}>{defect.severity}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted">AQL: </span>
                  <span className="text-xs font-bold text-text-primary">{defect.aql_class}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted">Trend Risk: </span>
                  <span className="text-xs font-bold text-text-primary">{defect.trend_risk}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Stage Checks */}
          <div>
            <h4 className="text-xs font-semibold text-text-primary mb-3">
              Stage Checks ({activeStageCount}/10 active)
            </h4>
            <StageCheckTimeline stageChecks={defect.stage_checks} severity={defect.severity} />
          </div>
        </div>
      )}
    </div>
  )
}
