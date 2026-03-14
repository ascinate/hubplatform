'use client'

import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Phase, type RoleKey, type PermissionLevel, type StagePermission } from './qms-data'
import PermissionTable from './PermissionTable'

interface PhaseSectionProps {
  phase: Phase
  index: number
  activeRoles: RoleKey[]
  activeLevels: PermissionLevel[]
  searchQuery: string
  editMode: boolean
  onPermissionChange?: (stageId: string, role: RoleKey, level: PermissionLevel) => void
  customPermissions?: Record<string, Record<RoleKey, StagePermission>>
}

export default function PhaseSection({
  phase,
  index,
  activeRoles,
  activeLevels,
  searchQuery,
  editMode,
  onPermissionChange,
  customPermissions,
}: PhaseSectionProps) {
  const isReversed = index % 2 === 1

  const textSide = (
    <div className="lg:w-[320px] shrink-0 space-y-4">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-200">
        PHASE {String(phase.id).padStart(2, '0')}
      </span>
      <h2 className="text-xl font-bold text-gray-900">{phase.title}</h2>
      <p className="text-sm text-gray-500 leading-relaxed">{phase.description}</p>
      <ul className="space-y-2.5">
        {phase.highlights.map((h, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
            <span className="text-sm text-gray-600">{h}</span>
          </li>
        ))}
      </ul>
      <div className="text-xs text-gray-400 pt-1">
        {phase.stages.length} stage{phase.stages.length !== 1 ? 's' : ''} in this phase
      </div>
    </div>
  )

  const tableSide = (
    <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <PermissionTable
        stages={phase.stages}
        activeRoles={activeRoles}
        activeLevels={activeLevels}
        searchQuery={searchQuery}
        editMode={editMode}
        onPermissionChange={onPermissionChange}
        customPermissions={customPermissions}
      />
    </div>
  )

  return (
    <section className={cn('py-10 px-6', index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
      <div className={cn('flex flex-col lg:flex-row gap-8 max-w-[1100px] mx-auto', isReversed && 'lg:flex-row-reverse')}>
        {textSide}
        {tableSide}
      </div>
    </section>
  )
}
