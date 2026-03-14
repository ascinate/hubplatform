'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import ConsoleSidebar from '@/components/console/ConsoleSidebar'
import ImpersonationBanner from '@/components/console/ImpersonationBanner'

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading, loadFromStorage, user } = useAuthStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
      return
    }
    if (!isLoading && isAuthenticated && user) {
      if (user.role !== 'super_owner' && user.role !== 'sub_agent') {
        router.replace('/dashboard')
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#0B0F19' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#C9A96E', borderTopColor: 'transparent' }} />
          <span className="text-slate-400 text-sm">Loading Console...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null
  if (user?.role !== 'super_owner' && user?.role !== 'sub_agent') return null

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0B0F19' }}>
      <ConsoleSidebar />
      <div className="flex-1 flex flex-col ml-0 lg:ml-[60px]">
        <ImpersonationBanner />
        <main className="flex-1 overflow-auto overflow-x-hidden p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
