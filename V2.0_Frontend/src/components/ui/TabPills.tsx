'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const ACTIVE_STYLE = 'bg-[rgba(201,169,110,0.30)] text-[#6B5A3E] border-[#C9A96E] font-bold shadow-[0_2px_8px_rgba(201,169,110,0.25)]'
const INACTIVE_STYLE = 'bg-white text-gray-700 border-gray-200 font-medium shadow-sm hover:shadow-md hover:border-[#C9A96E]/40'

export interface TabItem {
  id: string | number
  label: string
  icon?: ReactNode
  emoji?: string
  count?: number
}

interface TabPillsProps {
  tabs: TabItem[]
  activeTab: string | number
  onTabChange: (id: string | number) => void
  className?: string
  vertical?: boolean
  compact?: boolean
}

export default function TabPills({
  tabs,
  activeTab,
  onTabChange,
  className,
  vertical = false,
  compact = false,
}: TabPillsProps) {

  if (vertical) {
    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'w-full text-left inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 cursor-pointer',
              activeTab === tab.id ? ACTIVE_STYLE : INACTIVE_STYLE
            )}
          >
            {tab.emoji && <span className="text-[15px] leading-none">{tab.emoji}</span>}
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-row flex-nowrap gap-2 overflow-x-auto scrollbar-hide rounded-2xl px-1.5 py-1.5 bg-[#F7F3EC]',
        className
      )}
      style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 rounded-xl border transition-all duration-200 cursor-pointer',
            compact
              ? 'px-3 py-1.5 text-xs'
              : 'px-3.5 py-2 text-[13px] lg:px-4 lg:py-2.5 lg:text-[14px]',
            activeTab === tab.id ? ACTIVE_STYLE : INACTIVE_STYLE
          )}
        >
          {tab.emoji && <span className="text-[14px] lg:text-[15px] leading-none">{tab.emoji}</span>}
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className={cn(
              'text-[10px] ml-0.5',
              activeTab === tab.id ? 'opacity-80' : 'text-gray-400'
            )}>
              ({tab.count})
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
