'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  ScrollText,
  Crown,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'

const consoleNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/console', exact: true },
  { icon: Building2, label: 'Clients', href: '/console/clients' },
  { icon: Users, label: 'Users', href: '/console/users' },
  { icon: Shield, label: 'Sub-Agents', href: '/console/agents' },
  { icon: ScrollText, label: 'Audit Log', href: '/console/audit' },
]

export default function ConsoleSidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const { user } = useAuthStore()
  const isAgent = user?.role === 'sub_agent'

  // Sub-agents cannot see Agents or Users page
  const visibleItems = isAgent
    ? consoleNavItems.filter((i) => !['Sub-Agents', 'Users'].includes(i.label))
    : consoleNavItems

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        'fixed left-0 top-0 h-screen flex-col z-50 transition-all duration-300 ease-in-out hidden lg:flex',
        expanded ? 'w-[220px]' : 'w-[60px]'
      )}
      style={{ background: '#0D1420' }}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        <Crown size={22} className="flex-shrink-0" style={{ color: '#C9A96E' }} />
        {expanded && (
          <span className="ml-3 text-sm font-semibold whitespace-nowrap" style={{ color: '#C9A96E' }}>
            {isAgent ? 'Agent Console' : 'Founder Console'}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center h-11 px-4 mx-2 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              )}
              style={isActive ? { background: 'rgba(201, 169, 110, 0.15)' } : undefined}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                  style={{ background: '#C9A96E' }}
                />
              )}
              <item.icon size={20} className="flex-shrink-0" />
              {expanded && (
                <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 py-3 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center h-11 px-4 mx-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} className="flex-shrink-0" />
          {expanded && (
            <span className="ml-3 text-sm font-medium whitespace-nowrap">Back to App</span>
          )}
        </Link>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center h-11 px-4 mx-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full"
        >
          {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          {expanded && (
            <span className="ml-3 text-sm font-medium whitespace-nowrap">Collapse</span>
          )}
        </button>
      </div>
    </aside>
  )
}
