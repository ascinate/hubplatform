'use client'

import { cn } from '@/lib/utils'
import { type Stage, type RoleKey, type PermissionLevel, type StagePermission, ROLES } from './qms-data'
import PermissionBadge from './PermissionBadge'

interface PermissionTableProps {
  stages: Stage[]
  activeRoles: RoleKey[]
  activeLevels: PermissionLevel[]
  searchQuery: string
  editMode: boolean
  onPermissionChange?: (stageId: string, role: RoleKey, level: PermissionLevel) => void
  customPermissions?: Record<string, Record<RoleKey, StagePermission>>
}

export default function PermissionTable({
  stages,
  activeRoles,
  activeLevels,
  searchQuery,
  editMode,
  onPermissionChange,
  customPermissions,
}: PermissionTableProps) {
  const visibleRoles = ROLES.filter((r) => activeRoles.includes(r.key))

  const filteredStages = stages.filter((stage) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!stage.name.toLowerCase().includes(q) && !stage.id.toLowerCase().includes(q) && !stage.subLabel.toLowerCase().includes(q)) {
        return false
      }
    }
    if (activeLevels.length > 0 && activeLevels.length < 4) {
      const hasMatchingLevel = visibleRoles.some((r) => {
        const perm = customPermissions?.[stage.id]?.[r.key] || stage.permissions[r.key]
        return activeLevels.includes(perm.level)
      })
      if (!hasMatchingLevel) return false
    }
    return true
  })

  if (filteredStages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-8 text-center text-text-muted text-sm">
        No stages match the current filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase w-[60px]">
              ID
            </th>
            <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase min-w-[160px]">
              Stage
            </th>
            {visibleRoles.map((role) => (
              <th key={role.key} className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase min-w-[140px]">
                <span className="mr-1">{role.emoji}</span> {role.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filteredStages.map((stage) => (
            <tr key={stage.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-3 py-2.5 text-xs font-mono text-gray-400">
                {stage.id}
              </td>
              <td className="px-3 py-2.5">
                <div className="text-sm font-medium text-gray-900">{stage.name}</div>
                <div className="text-[11px] text-gray-400">{stage.subLabel}</div>
              </td>
              {visibleRoles.map((role) => {
                const perm = customPermissions?.[stage.id]?.[role.key] || stage.permissions[role.key]
                const dimmed = activeLevels.length > 0 && activeLevels.length < 4 && !activeLevels.includes(perm.level)
                return (
                  <td key={role.key} className={cn('px-3 py-2.5', dimmed && 'opacity-30')}>
                    <PermissionBadge
                      permission={perm}
                      editable={editMode}
                      onChange={(level) => onPermissionChange?.(stage.id, role.key, level)}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
