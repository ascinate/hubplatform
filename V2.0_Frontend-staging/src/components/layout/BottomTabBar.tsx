'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Folder,
  FileSearch,
  TrendingUp,
  Menu,
  X,
  CheckSquare,
  Factory,
  FlaskConical,
  BarChart3,
  CreditCard,
  Settings,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'

const primaryTabs = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: Folder, label: 'Orders', href: '/orders' },
  { icon: FileSearch, label: 'Quality', href: '/inspections' },
  { icon: TrendingUp, label: 'Analytics', href: '/analytics' },
]

const moreItems = [
  { icon: CheckSquare, label: 'My Tasks', href: '/tasks' },
  { icon: Factory, label: 'Factories', href: '/factories' },
  { icon: FlaskConical, label: 'Lab Testing', href: '/lab-testing' },
  { icon: BarChart3, label: 'Liveboard', href: '/liveboard' },
  { icon: CreditCard, label: 'Billing', href: '/billing' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [showMore, setShowMore] = useState(false)
  const { user } = useAuthStore()
  const isTrialExpired = user?.organization?.is_trial_expired === true
  const alwaysAllowed = ['/dashboard', '/billing', '/settings']
  const isLocked = (href: string) =>
    isTrialExpired && !alwaysAllowed.some((a) => href.startsWith(a))

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href))

  return (
    <>
      {/* More drawer overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More drawer */}
      {showMore && (
        <div className="fixed bottom-0 left-0 right-0 z-[95] bg-white rounded-t-2xl shadow-elevated border-t border-border-light lg:hidden pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
            <span className="text-sm font-semibold text-text-primary">More</span>
            <button onClick={() => setShowMore(false)} className="p-2 rounded-lg hover:bg-gray-100">
              <X size={18} className="text-text-muted" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 p-3">
            {moreItems.map((item) => {
              const active = pathname.startsWith(item.href)
              const locked = isLocked(item.href)
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    setShowMore(false)
                    if (locked) {
                      router.push('/billing')
                    } else {
                      router.push(item.href)
                    }
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-colors relative',
                    active ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-gray-50',
                    locked && 'opacity-50'
                  )}
                >
                  <div className="relative">
                    <item.icon size={22} />
                    {locked && <Lock size={10} className="absolute -top-1 -right-2 text-amber-400" />}
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[80] bg-white border-t border-border-light lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryTabs.map((tab) => {
            const active = pathname.startsWith(tab.href)
            const locked = isLocked(tab.href)
            return (
              <Link
                key={tab.href}
                href={locked ? '/billing' : tab.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative',
                  active ? 'text-primary' : 'text-text-muted',
                  locked && 'opacity-50'
                )}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
                )}
                <div className="relative">
                  <tab.icon size={22} />
                  {locked && <Lock size={10} className="absolute -top-1 -right-2 text-amber-400" />}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            )
          })}
          {/* More tab */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full',
              isMoreActive || showMore ? 'text-primary' : 'text-text-muted'
            )}
          >
            {isMoreActive && !showMore && (
              <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full" />
            )}
            <Menu size={22} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
