'use client'

import { useState, useMemo } from 'react'
import { Search, Package, Factory, ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Room } from './CollaborationHub'

interface RoomListProps {
  rooms: Room[]
  selectedRoom: Room | null
  onSelectRoom: (room: Room) => void
}

const ROOM_TYPE_CONFIG = {
  po: { label: 'Production Orders', icon: Package, color: 'text-primary' },
  factory: { label: 'Factories', icon: Factory, color: 'text-blue-600' },
  inspection: { label: 'Inspections', icon: ClipboardCheck, color: 'text-green-600' },
} as const

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

export default function RoomList({ rooms, selectedRoom, onSelectRoom }: RoomListProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return rooms
    const q = search.toLowerCase()
    return rooms.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.entity_name && r.entity_name.toLowerCase().includes(q))
    )
  }, [rooms, search])

  const grouped = useMemo(() => {
    const groups: Record<string, Room[]> = { po: [], factory: [], inspection: [] }
    filtered.forEach(r => {
      if (groups[r.room_type]) groups[r.room_type].push(r)
    })
    return groups
  }, [filtered])

  return (
    <div className="w-72 border-r border-border flex flex-col shrink-0">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Room groups */}
      <div className="flex-1 overflow-y-auto">
        {(['po', 'factory', 'inspection'] as const).map(type => {
          const config = ROOM_TYPE_CONFIG[type]
          const groupRooms = grouped[type]
          if (groupRooms.length === 0) return null
          const Icon = config.icon

          return (
            <div key={type}>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                <Icon size={12} className={config.color} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {config.label}
                </span>
                <span className="ml-auto text-[10px] text-text-light">{groupRooms.length}</span>
              </div>
              {groupRooms.map(room => {
                const isSelected = selectedRoom?.id === room.id
                return (
                  <button
                    key={room.id}
                    onClick={() => onSelectRoom(room)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50/80 transition-colors',
                      isSelected && 'bg-primary/5 border-l-2 border-l-primary'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs font-medium truncate flex-1',
                        isSelected ? 'text-primary' : 'text-text-primary'
                      )}>
                        {room.name}
                      </span>
                      {room.unread_count > 0 && (
                        <span className="px-1.5 py-0.5 bg-primary text-white text-[9px] font-bold rounded-full min-w-[18px] text-center">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                    {room.last_message && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-text-muted truncate flex-1">
                          {room.last_message.sender_name}: {room.last_message.text}
                        </span>
                        <span className="text-[9px] text-text-light shrink-0">
                          {timeAgo(room.last_message.created_at)}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
