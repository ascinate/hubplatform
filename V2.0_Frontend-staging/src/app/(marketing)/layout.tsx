'use client'

import { useAnalytics } from '@/lib/useAnalytics'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useAnalytics()
  return <>{children}</>
}
