'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Folder,
  FileSearch,
  Factory,
  FlaskConical,
  FolderOpen,
  BarChart3,
  TrendingUp,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Lock,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'
import SankalpHubLogo from '@/components/SankalpHubLogo'

const navItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/dashboard',
    activeColor: 'border-primary',
  },
  {
    icon: CheckSquare,
    label: 'My Tasks',
    href: '/tasks',
    activeColor: 'border-success',
  },
  {
    icon: Folder,
    label: 'My Orders',
    href: '/orders',
    activeColor: 'border-info',
  },
  {
    icon: FileSearch,
    label: 'My Quality',
    href: '/inspections',
    activeColor: 'border-primary',
  },
  {
    icon: Factory,
    label: 'Factories',
    href: '/factories',
    activeColor: 'border-warning',
  },
  {
    icon: FlaskConical,
    label: 'Lab Testing',
    href: '/lab-testing',
    activeColor: 'border-info',
  },
  {
    icon: FolderOpen,
    label: 'Documents',
    href: '/documents',
    activeColor: 'border-primary',
    roles: ['admin', 'org_admin', 'super_owner'] as string[],
  },
  {
    icon: TrendingUp,
    label: 'Analytics',
    href: '/analytics',
    activeColor: 'border-success',
  },
  {
    icon: BarChart3,
    label: 'Liveboard',
    href: '/liveboard',
    activeColor: 'border-success',
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const { user } = useAuthStore()
const isTrialExpired = user?.organization?.is_trial_expired === true

  // Routes always accessible even when trial expired
  const alwaysAllowed = ['/dashboard', '/billing', '/settings']
  const isItemLocked = (href: string) =>
    isTrialExpired && !alwaysAllowed.some((a) => href.startsWith(a))

  const allNavItems = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  )

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar-dark flex-col z-50 transition-all duration-300 ease-in-out hidden lg:flex',
        expanded ? 'w-[220px]' : 'w-[60px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        {expanded ? (
          <SankalpHubLogo variant="dark" height={40} />
        ) : (
          <img src="/sankalphub-icon.svg" alt="SankalpHub" className="w-8 h-8 flex-shrink-0" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1">
        {allNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const locked = isItemLocked(item.href)
          const baseClass = cn(
            'flex items-center h-11 px-4 mx-2 rounded-lg transition-all duration-200 group relative',
            locked
              ? 'text-slate-600 opacity-50 cursor-not-allowed'
              : isActive
                ? 'bg-sidebar-active text-white'
                : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'
          )
          const inner = (
            <>
              {isActive && !locked && (
                <div
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full',
                    item.activeColor.replace('border-', 'bg-')
                  )}
                />
              )}
              <div className="relative flex-shrink-0">
                <item.icon size={20} />
                {locked && (
                  <Lock size={10} className="absolute -top-1 -right-1 text-amber-400" />
                )}
              </div>
              {expanded && (
                <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </>
          )
          return locked ? (
            <button
              key={item.href}
              title="Upgrade your plan to access this feature"
              onClick={() => router.push('/billing')}
              className={baseClass}
            >
              {inner}
            </button>
          ) : (
            <Link key={item.href} href={item.href} className={baseClass}>
              {inner}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 py-3 space-y-1">
        {(user?.role === 'super_owner' || user?.role === 'sub_agent') && (
          <Link
            href="/console"
            className={cn(
              'flex items-center h-11 px-4 mx-2 rounded-lg transition-colors',
              pathname.startsWith('/console')
                ? 'bg-sidebar-active text-white'
                : 'text-amber-400/70 hover:bg-sidebar-hover hover:text-amber-300'
            )}
          >
            <Crown size={20} className="flex-shrink-0" />
            {expanded && (
              <span className="ml-3 text-sm font-medium whitespace-nowrap">Console</span>
            )}
          </Link>
        )}
        <Link
          href="/billing"
          className={cn(
            'flex items-center h-11 px-4 mx-2 rounded-lg transition-colors',
            pathname.startsWith('/billing')
              ? 'bg-sidebar-active text-white'
              : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'
          )}
        >
          <CreditCard size={20} className="flex-shrink-0" />
          {expanded && (
            <span className="ml-3 text-sm font-medium whitespace-nowrap">Billing</span>
          )}
        </Link>
        <Link
          href="/settings"
          className={cn(
            'flex items-center h-11 px-4 mx-2 rounded-lg transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-sidebar-active text-white'
              : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'
          )}
        >
          <Settings size={20} className="flex-shrink-0" />
          {expanded && (
            <span className="ml-3 text-sm font-medium whitespace-nowrap">Settings</span>
          )}
        </Link>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center h-11 px-4 mx-2 rounded-lg text-slate-400 hover:bg-sidebar-hover hover:text-white transition-colors w-full"
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
