'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck } from 'lucide-react'
import {
  type RoleKey,
  type PermissionLevel,
  type StagePermission,
  PHASES,
  ROLES,
  PERMISSION_LEVELS,
  getLevelInfo,
} from '@/components/qms/qms-data'
import FilterBar from '@/components/qms/FilterBar'
import PhaseSection from '@/components/qms/PhaseSection'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'qms-permissions'

type CustomPermissions = Record<string, Record<RoleKey, StagePermission>>

export default function QMSPermissionsPage() {
  const [activeRoles, setActiveRoles] = useState<RoleKey[]>(ROLES.map((r) => r.key))
  const [activeLevels, setActiveLevels] = useState<PermissionLevel[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [customPermissions, setCustomPermissions] = useState<CustomPermissions>({})

  // Load saved permissions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setCustomPermissions(JSON.parse(saved))
    } catch {
      // Ignore parse errors
    }
  }, [])

  const handlePermissionChange = useCallback(
    (stageId: string, role: RoleKey, level: PermissionLevel) => {
      const info = getLevelInfo(level)
      setCustomPermissions((prev) => {
        const next = {
          ...prev,
          [stageId]: {
            ...prev[stageId],
            [role]: { level, label: info.label },
          },
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    []
  )

  const handleReset = () => {
    setCustomPermissions({})
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <div className="-m-6">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
            <ShieldCheck size={20} className="text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QMS Permission Hierarchy</h1>
            <p className="text-sm text-gray-500">5 Phases · 21 Stages · 4 Roles</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6">
        <FilterBar
          activeRoles={activeRoles}
          setActiveRoles={setActiveRoles}
          activeLevels={activeLevels}
          setActiveLevels={setActiveLevels}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          editMode={editMode}
          setEditMode={setEditMode}
          onReset={Object.keys(customPermissions).length > 0 ? handleReset : undefined}
        />
      </div>

      {/* Permission Level Legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-6">
        {PERMISSION_LEVELS.map((l) => (
          <div
            key={l.level}
            className={cn(
              'rounded-lg border p-3',
              l.badgeBg, l.badgeBorder
            )}
          >
            <div className={cn('text-sm font-bold', l.badgeText)}>
              {l.level} — {l.label}
            </div>
            <p className="text-xs text-gray-500 mt-1">{l.description}</p>
          </div>
        ))}
      </div>

      {/* Phase Sections */}
      {PHASES.map((phase, i) => (
        <PhaseSection
          key={phase.id}
          phase={phase}
          index={i}
          activeRoles={activeRoles}
          activeLevels={activeLevels}
          searchQuery={searchQuery}
          editMode={editMode}
          onPermissionChange={handlePermissionChange}
          customPermissions={customPermissions}
        />
      ))}

      {/* Footer */}
      <div className="text-center py-8 text-xs text-gray-400">
        QMS Approval Hierarchy — SankalpHub · {PHASES.reduce((sum, p) => sum + p.stages.length, 0)} Stages · {ROLES.length} Roles
      </div>
    </div>
  )
}
