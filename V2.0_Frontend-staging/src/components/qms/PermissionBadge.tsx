'use client'

import { cn } from '@/lib/utils'
import { type PermissionLevel, type StagePermission, PERMISSION_LEVELS, getLevelInfo } from './qms-data'

interface PermissionBadgeProps {
  permission: StagePermission
  editable?: boolean
  onChange?: (level: PermissionLevel) => void
}

export default function PermissionBadge({ permission, editable, onChange }: PermissionBadgeProps) {
  const info = getLevelInfo(permission.level)

  if (editable) {
    return (
      <select
        value={permission.level}
        onChange={(e) => onChange?.(e.target.value as PermissionLevel)}
        title={`${permission.level} — ${permission.label}`}
        className={cn(
          'px-2 py-1 rounded text-xs font-medium border cursor-pointer outline-none',
          info.badgeBg, info.badgeText, info.badgeBorder
        )}
      >
        {PERMISSION_LEVELS.map((l) => (
          <option key={l.level} value={l.level}>
            {l.level} — {l.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <span
      title={`${info.level} — ${info.label}\n${info.description}`}
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border whitespace-nowrap',
        info.badgeBg, info.badgeText, info.badgeBorder
      )}
    >
      {permission.level} — {permission.label}
    </span>
  )
}
