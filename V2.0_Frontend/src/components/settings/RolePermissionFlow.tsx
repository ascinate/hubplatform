'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Eye, ArrowDown, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type RoleKey, ROLES, PHASES, PERMISSION_LEVELS, getLevelInfo } from '@/components/qms/qms-data'

const ACCESS_CONFIG = {
  L4: { icon: ShieldCheck, label: 'Full Control', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  L3: { icon: CheckCircle2, label: 'Approve / Reject', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  L2: { icon: ArrowDown, label: 'Submit / Update', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  L1: { icon: Eye, label: 'View Only', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400' },
} as const

export default function RolePermissionFlow() {
  const [selectedRole, setSelectedRole] = useState<RoleKey>('brand')
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {}
    PHASES.forEach((p) => { init[p.id] = true })
    return init
  })

  const togglePhase = (id: number) => {
    setExpandedPhases((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const role = ROLES.find((r) => r.key === selectedRole)!

  // Compute summary stats for selected role
  const allStages = PHASES.flatMap((p) => p.stages)
  const levelCounts = { L4: 0, L3: 0, L2: 0, L1: 0 }
  allStages.forEach((s) => { levelCounts[s.permissions[selectedRole].level]++ })

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Role Selector Cards */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Select Role</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => setSelectedRole(r.key)}
              className={cn(
                'rounded-xl border p-3 lg:p-4 text-left transition-all duration-200 overflow-hidden',
                selectedRole === r.key
                  ? 'bg-[rgba(201,169,110,0.30)] border-[#C9A96E] shadow-[0_2px_8px_rgba(201,169,110,0.25)]'
                  : 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-[#C9A96E]/40'
              )}
            >
              <div className="text-2xl mb-2">{r.emoji}</div>
              <div className={cn('text-sm font-semibold', selectedRole === r.key ? 'text-[#6B5A3E] font-bold' : 'text-text-primary')}>{r.label}</div>
              <div className={cn('text-xs mt-0.5', selectedRole === r.key ? 'text-[#6B5A3E]/70' : 'text-text-muted')}>
                {(() => {
                  const stages = PHASES.flatMap((p) => p.stages)
                  const l4 = stages.filter((s) => s.permissions[r.key].level === 'L4').length
                  const l3 = stages.filter((s) => s.permissions[r.key].level === 'L3').length
                  if (l4 > 0) return `${l4} full control, ${l3} approve`
                  return `${l3} approve, ${stages.length - l3} other`
                })()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Access Summary Bar */}
      <div className="bg-white rounded-xl border border-border p-4 overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{role.emoji}</span>
          <div>
            <h3 className="text-base font-semibold text-text-primary">{role.label} — Access Summary</h3>
            <p className="text-xs text-text-muted">{allStages.length} total stages across {PHASES.length} phases</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {(['L4', 'L3', 'L2', 'L1'] as const).map((level) => {
            const config = ACCESS_CONFIG[level]
            const count = levelCounts[level]
            const pct = Math.round((count / allStages.length) * 100)
            return (
              <div key={level} className={cn('rounded-lg border p-3', config.bg, config.border)}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={cn('w-2 h-2 rounded-full', config.dot)} />
                  <span className={cn('text-xs font-semibold', config.color)}>{level}</span>
                </div>
                <div className="text-lg font-bold text-text-primary">{count}</div>
                <div className="text-[10px] text-text-muted">{config.label} · {pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Flowchart */}
      <div className="relative">
        {PHASES.map((phase, phaseIdx) => {
          const expanded = expandedPhases[phase.id]
          return (
            <div key={phase.id} className="relative">
              {/* Connector line between phases */}
              {phaseIdx > 0 && (
                <div className="flex justify-center py-1">
                  <div className="w-0.5 h-6 bg-gray-200" />
                </div>
              )}

              {/* Phase Card */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Phase Header */}
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-5 py-3 lg:py-4 hover:bg-gray-50/50 transition-colors overflow-hidden"
                >
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">
                    PHASE {String(phase.id).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-semibold text-text-primary flex-1 text-left">{phase.title}</span>
                  <div className="hidden lg:flex items-center gap-1.5 mr-2">
                    {(['L4', 'L3', 'L2', 'L1'] as const).map((level) => {
                      const count = phase.stages.filter((s) => s.permissions[selectedRole].level === level).length
                      if (count === 0) return null
                      const config = ACCESS_CONFIG[level]
                      return (
                        <span key={level} className={cn('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border', config.bg, config.color, config.border)}>
                          {count}×{level}
                        </span>
                      )
                    })}
                  </div>
                  {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                </button>

                {/* Stage Rows */}
                {expanded && (
                  <div className="border-t border-border divide-y divide-border-light">
                    {phase.stages.map((stage, stageIdx) => {
                      const perm = stage.permissions[selectedRole]
                      const config = ACCESS_CONFIG[perm.level]
                      const Icon = config.icon
                      return (
                        <div key={stage.id} className="flex items-center gap-2 lg:gap-4 px-3 lg:px-5 py-3 hover:bg-gray-50/30 transition-colors overflow-hidden">
                          {/* Flow indicator */}
                          <div className="relative flex flex-col items-center w-6 shrink-0">
                            {stageIdx > 0 && <div className="absolute -top-3 w-0.5 h-3 bg-gray-200" />}
                            <div className={cn('w-3 h-3 rounded-full border-2 z-10', config.border, config.bg)} />
                            {stageIdx < phase.stages.length - 1 && <div className="absolute -bottom-3 w-0.5 h-3 bg-gray-200" />}
                          </div>

                          {/* Stage info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-text-muted">{stage.id}</span>
                              <span className="text-sm font-medium text-text-primary">{stage.name}</span>
                            </div>
                            <span className="text-[11px] text-text-muted">{stage.subLabel}</span>
                          </div>

                          {/* Permission badge */}
                          <div className={cn('flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border shrink-0', config.bg, config.border)}>
                            <Icon size={14} className={cn(config.color, 'shrink-0')} />
                            <div className="text-right">
                              <div className={cn('text-[10px] lg:text-xs font-semibold whitespace-nowrap', config.color)}>{perm.level}<span className="hidden sm:inline"> — {perm.label}</span></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-xl border border-border p-4">
        <h4 className="text-xs font-semibold text-text-muted uppercase mb-3">Permission Level Legend</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PERMISSION_LEVELS.map((l) => {
            const config = ACCESS_CONFIG[l.level]
            const Icon = config.icon
            return (
              <div key={l.level} className="flex items-start gap-2">
                <Icon size={14} className={cn(config.color, 'mt-0.5 shrink-0')} />
                <div>
                  <div className={cn('text-xs font-semibold', config.color)}>{l.level} — {l.label}</div>
                  <div className="text-[10px] text-text-muted">{l.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
