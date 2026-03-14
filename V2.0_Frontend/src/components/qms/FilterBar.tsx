'use client'

import { Search, Pencil, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type RoleKey, type PermissionLevel, ROLES, PERMISSION_LEVELS } from './qms-data'

interface FilterBarProps {
  activeRoles: RoleKey[]
  setActiveRoles: (roles: RoleKey[]) => void
  activeLevels: PermissionLevel[]
  setActiveLevels: (levels: PermissionLevel[]) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  editMode: boolean
  setEditMode: (v: boolean) => void
  onReset?: () => void
}

export default function FilterBar({
  activeRoles,
  setActiveRoles,
  activeLevels,
  setActiveLevels,
  searchQuery,
  setSearchQuery,
  editMode,
  setEditMode,
  onReset,
}: FilterBarProps) {
  const toggleRole = (key: RoleKey) => {
    if (activeRoles.includes(key)) {
      if (activeRoles.length === 1) return
      setActiveRoles(activeRoles.filter((r) => r !== key))
    } else {
      setActiveRoles([...activeRoles, key])
    }
  }

  const toggleLevel = (level: PermissionLevel) => {
    if (activeLevels.includes(level)) {
      setActiveLevels(activeLevels.filter((l) => l !== level))
    } else {
      setActiveLevels([...activeLevels, level])
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-3 px-4 -mx-6 space-y-3">
      {/* Row 1: Roles + Search + Edit */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase mr-1">Roles</span>
        {ROLES.map((role) => (
          <button
            key={role.key}
            onClick={() => toggleRole(role.key)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              activeRoles.includes(role.key)
                ? 'bg-sky-50 text-sky-700 border-sky-300'
                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
            )}
          >
            {role.emoji} {role.label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stages..."
            className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 w-[180px]"
          />
        </div>

        {/* Edit Mode Toggle */}
        <button
          onClick={() => setEditMode(!editMode)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            editMode
              ? 'bg-sky-500 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          )}
        >
          <Pencil size={12} />
          {editMode ? 'Editing' : 'Edit Mode'}
        </button>

        {editMode && onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Row 2: Permission Level Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase mr-1">Levels</span>
        <button
          onClick={() => setActiveLevels([])}
          className={cn(
            'px-2.5 py-1 rounded text-xs font-medium border transition-colors',
            activeLevels.length === 0
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
          )}
        >
          All
        </button>
        {PERMISSION_LEVELS.map((l) => (
          <button
            key={l.level}
            onClick={() => toggleLevel(l.level)}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-medium border transition-colors',
              activeLevels.includes(l.level)
                ? `${l.badgeBg} ${l.badgeText} ${l.badgeBorder}`
                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
            )}
          >
            {l.level}
          </button>
        ))}
      </div>
    </div>
  )
}
