'use client'

import { cn } from '@/lib/utils'
import { type StageCheck, type StageKey, type SeverityLevel, PROCESS_STAGES, SEVERITY_CONFIG } from './defects-data'

interface StageCheckTimelineProps {
  stageChecks: Record<StageKey, StageCheck>
  severity: SeverityLevel
}

const PHASE_GROUPS = [
  { label: 'Pre-Production', stages: ['development_samples', 'size_set', 'pp_samples', 'material'] },
  { label: 'Production', stages: ['cutting', 'sewing_stitching', 'assembly'] },
  { label: 'QC', stages: ['inline_inspection', 'final_inspection', 'packing'] },
] as const

export default function StageCheckTimeline({ stageChecks, severity }: StageCheckTimelineProps) {
  const config = SEVERITY_CONFIG[severity]

  return (
    <div className="space-y-4">
      {PHASE_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
            {group.label}
          </div>
          <div className="space-y-0">
            {group.stages.map((stageKey) => {
              const stage = PROCESS_STAGES.find(s => s.key === stageKey)!
              const check = stageChecks[stageKey]
              const isActive = check.active

              return (
                <div key={stageKey} className="flex gap-3">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center w-5 shrink-0">
                    <div className={cn(
                      'w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 border-2',
                      isActive
                        ? `${config.dot} border-transparent`
                        : 'bg-white border-gray-300'
                    )} />
                    <div className={cn(
                      'w-0.5 flex-1 min-h-[8px]',
                      isActive ? config.bg : 'bg-gray-100'
                    )} />
                  </div>

                  {/* Content */}
                  <div className={cn(
                    'flex-1 pb-3 min-w-0',
                    !isActive && 'opacity-40'
                  )}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono font-bold text-text-muted">{stage.code}</span>
                      <span className="text-xs font-medium text-text-primary">{stage.label}</span>
                      {isActive && (
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border',
                          config.bg, config.text, config.border
                        )}>
                          {check.action}
                        </span>
                      )}
                    </div>

                    {isActive ? (
                      <div className="space-y-1.5 mt-1">
                        <p className="text-xs text-text-muted leading-relaxed">{check.check}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                          <span className="text-text-muted">
                            <span className="font-semibold text-text-primary">Who:</span> {check.responsibility}
                          </span>
                          {check.tools_required.length > 0 && (
                            <span className="text-text-muted">
                              <span className="font-semibold text-text-primary">Tools:</span>{' '}
                              {check.tools_required.join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          <span className="font-semibold text-text-primary">Pass:</span> {check.pass_criteria}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-text-muted">N/A</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
