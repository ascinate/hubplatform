'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { Participant } from './ContextPanel'

const ROLE_BADGES: Record<string, { bg: string; text: string }> = {
  admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
  org_admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
  brand: { bg: 'bg-orange-100', text: 'text-orange-700' },
  factory: { bg: 'bg-blue-100', text: 'text-blue-700' },
  third_party: { bg: 'bg-green-100', text: 'text-green-700' },
  user: { bg: 'bg-gray-100', text: 'text-gray-700' },
}

interface MentionDropdownProps {
  participants: Participant[]
  query: string
  activeIndex: number
  onSelect: (p: Participant) => void
  onClose: () => void
}

export default function MentionDropdown({ participants, query, activeIndex, onSelect, onClose }: MentionDropdownProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = participants
    .filter(p => p.user_name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5)

  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.children[activeIndex] as HTMLElement
      active?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  if (filtered.length === 0) return null

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50"
    >
      {filtered.map((p, i) => {
        const badge = ROLE_BADGES[p.user_role] || ROLE_BADGES.user
        return (
          <button
            key={p.id}
            type="button"
            onMouseDown={e => { e.preventDefault(); onSelect(p) }}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors',
              i === activeIndex && 'bg-gray-50'
            )}
          >
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <span className="text-[8px] font-bold text-text-muted">
                {p.user_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{p.user_name}</p>
            </div>
            <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0', badge.bg, badge.text)}>
              {p.user_role.replace('_', ' ')}
            </span>
          </button>
        )
      })}
    </div>
  )
}
