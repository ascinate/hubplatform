'use client'

import { useState, useMemo } from 'react'
import { Users, Image as ImageIcon, Info, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import TabPills from '@/components/ui/TabPills'
import type { Room, Message } from './CollaborationHub'

export interface Participant {
  id: string
  user: string
  user_name: string
  user_email: string
  user_role: string
  participant_role: string
}

const ROLE_BADGES: Record<string, { bg: string; text: string }> = {
  admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
  org_admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
  brand: { bg: 'bg-orange-100', text: 'text-orange-700' },
  factory: { bg: 'bg-blue-100', text: 'text-blue-700' },
  third_party: { bg: 'bg-green-100', text: 'text-green-700' },
  user: { bg: 'bg-gray-100', text: 'text-gray-700' },
}

interface ContextPanelProps {
  room: Room
  messages: Message[]
  participants: Participant[]
}

export default function ContextPanel({ room, messages, participants }: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'photos'>('info')

  const photos = useMemo(() => {
    return messages
      .filter(m => m.message_type === 'photo' && m.attachment_url)
      .reverse()
      .slice(0, 20)
  }, [messages])

  const tabs = [
    { key: 'info' as const, label: 'Info', icon: Info },
    { key: 'members' as const, label: 'Members', icon: Users, count: participants.length },
    { key: 'photos' as const, label: 'Photos', icon: ImageIcon, count: photos.length },
  ]

  return (
    <div className="w-72 border-l border-border flex flex-col shrink-0 bg-white">
      {/* Tabs */}
      <div className="p-1.5">
        <TabPills
          tabs={tabs.map(tab => {
            const Icon = tab.icon
            return {
              id: tab.key,
              label: tab.label,
              icon: <Icon size={14} />,
              count: tab.count,
            }
          })}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as 'info' | 'members' | 'photos')}
          compact
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Info tab */}
        {activeTab === 'info' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Room Type</label>
              <p className="text-xs text-text-primary mt-0.5 capitalize">{room.room_type.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Entity</label>
              <p className="text-xs text-text-primary mt-0.5">{room.entity_name || room.name}</p>
            </div>
            {room.entity_id && (
              <div>
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Quick Link</label>
                <a
                  href={room.room_type === 'po' ? `/orders/${room.entity_id}` : room.room_type === 'inspection' ? `/inspections/${room.entity_id}` : '#'}
                  className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                >
                  <ExternalLink size={10} />
                  View {room.room_type === 'po' ? 'Order' : room.room_type === 'inspection' ? 'Inspection' : 'Factory'}
                </a>
              </div>
            )}
            <div>
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Messages</label>
              <p className="text-xs text-text-primary mt-0.5">{messages.length}</p>
            </div>
          </div>
        )}

        {/* Members tab */}
        {activeTab === 'members' && (
          <div className="p-2">
            {participants.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6">No participants yet</p>
            ) : (
              participants.map(p => {
                const badge = ROLE_BADGES[p.user_role] || ROLE_BADGES.user
                return (
                  <div key={p.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-text-muted">
                        {p.user_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{p.user_name}</p>
                      <p className="text-[10px] text-text-muted truncate">{p.user_email}</p>
                    </div>
                    <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-bold uppercase', badge.bg, badge.text)}>
                      {p.user_role.replace('_', ' ')}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Photos tab */}
        {activeTab === 'photos' && (
          <div className="p-3">
            {photos.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6">No photos shared yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {photos.map(p => (
                  <a
                    key={p.id}
                    href={p.attachment_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={p.attachment_url || ''}
                      alt={p.attachment_name || 'Photo'}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
