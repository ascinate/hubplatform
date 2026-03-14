'use client'

import { useState } from 'react'
import { Search, Circle } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

interface ThreadItem {
  id: string
  label: string
  company: string
  badge?: { text: string; color: string }
  isLive?: boolean
}

const productionThreads: ThreadItem[] = [
  {
    id: 'po-8842',
    label: 'PO-2024-8842',
    company: 'Global Garments Ltd.',
    badge: { text: '3 CRITICAL ISSUES', color: 'bg-danger/10 text-danger' },
  },
  {
    id: 'po-9120',
    label: 'PO-2024-9120',
    company: 'Apex Textiles',
    isLive: true,
  },
]

const facilityHubs: ThreadItem[] = [
  {
    id: 'oceanic',
    label: 'Oceanic Exports',
    company: 'Hub',
    isLive: true,
  },
  {
    id: 'skyline',
    label: 'Skyline Manufacturing',
    company: 'Hub',
  },
]

interface ThreadSidebarProps {
  className?: string
}

export default function ThreadSidebar({ className }: ThreadSidebarProps) {
  const [search, setSearch] = useState('')
  const [activeThread, setActiveThread] = useState('po-8842')

  const renderThread = (thread: ThreadItem) => (
    <button
      key={thread.id}
      onClick={() => setActiveThread(thread.id)}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-left',
        activeThread === thread.id && 'bg-primary/5 border border-primary/20'
      )}
    >
      <div className="w-9 h-9 rounded-full bg-sidebar-dark text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
        {getInitials(thread.company)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary truncate">
            {thread.label}
          </span>
          {thread.isLive && (
            <Circle size={8} className="text-success fill-success flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-text-muted truncate">{thread.company}</p>
        {thread.badge && (
          <span
            className={cn(
              'inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
              thread.badge.color
            )}
          >
            {thread.badge.text}
          </span>
        )}
      </div>
    </button>
  )

  return (
    <div className={cn('flex flex-col bg-white', className)}>
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search threads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Production Threads */}
      <div className="px-4 pb-2">
        <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wide mb-2">
          Production Threads
        </h3>
        <div className="space-y-1">
          {productionThreads.map(renderThread)}
        </div>
      </div>

      {/* Facility Hubs */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wide mb-2">
          Facility Hubs
        </h3>
        <div className="space-y-1">
          {facilityHubs.map(renderThread)}
        </div>
      </div>
    </div>
  )
}
