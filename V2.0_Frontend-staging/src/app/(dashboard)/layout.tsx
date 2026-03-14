'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useAnalytics } from '@/lib/useAnalytics'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import BottomTabBar from '@/components/layout/BottomTabBar'
import ImpersonationBanner from '@/components/console/ImpersonationBanner'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, loadFromStorage, user } = useAuthStore()
  const isTrialExpired = user?.organization?.is_trial_expired === true
  const showExpiredBanner = isTrialExpired && !['/dashboard', '/billing', '/settings'].some((p) => pathname.startsWith(p))
  useAnalytics()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-main">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-text-muted text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-0 lg:ml-[60px]">
        <TopBar />
        <ImpersonationBanner />
        {showExpiredBanner && (
          <div className="bg-amber-500 text-white text-sm flex items-center justify-between px-4 lg:px-6 py-2.5 flex-shrink-0">
            <span className="text-xs sm:text-sm">Your free trial has expired. Upgrade to restore full access.</span>
            <Link href="/billing" className="ml-3 font-semibold underline hover:text-amber-100 whitespace-nowrap text-xs sm:text-sm">
              Upgrade →
            </Link>
          </div>
        )}
        <main className="flex-1 overflow-auto overflow-x-hidden bg-bg-main p-4 sm:p-5 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  )
}
