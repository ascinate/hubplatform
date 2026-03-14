'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useCookieConsentStore } from './cookie-consent-store'
import {
  trackPageView,
  trackClick,
  getCSSSelector,
  initTracking,
  cleanupTracking,
} from './tracking'

export function useAnalytics() {
  const pathname = usePathname()
  const { analyticsCookies } = useCookieConsentStore()
  const pageEntryTime = useRef<number>(Date.now())

  // Initialize tracking on mount
  useEffect(() => {
    if (!analyticsCookies) return
    initTracking()
    return () => cleanupTracking()
  }, [analyticsCookies])

  // Track page views on route change
  useEffect(() => {
    if (!analyticsCookies) return
    pageEntryTime.current = Date.now()
    trackPageView(pathname, document.title)
  }, [pathname, analyticsCookies])

  // Track clicks
  useEffect(() => {
    if (!analyticsCookies) return

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      // Skip tracking clicks on the cookie consent banner itself
      const banner = target.closest('[class*="cookie-consent"]')
      if (banner) return

      trackClick(
        getCSSSelector(target),
        { x: e.clientX, y: e.clientY },
        window.location.pathname
      )
    }

    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [analyticsCookies])
}
