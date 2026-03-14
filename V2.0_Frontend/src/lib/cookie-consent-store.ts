import { create } from 'zustand'

interface CookieConsentState {
  consentGiven: boolean | null
  essentialCookies: boolean
  analyticsCookies: boolean
  marketingCookies: boolean
  consentTimestamp: string | null
  showBanner: boolean

  acceptAll: () => void
  rejectAll: () => void
  customizeConsent: (analytics: boolean, marketing: boolean) => void
  loadConsent: () => void
  openBanner: () => void
}

const STORAGE_KEY = 'sankalp_cookie_consent'

export const useCookieConsentStore = create<CookieConsentState>((set) => ({
  consentGiven: null,
  essentialCookies: true,
  analyticsCookies: false,
  marketingCookies: false,
  consentTimestamp: null,
  showBanner: false,

  acceptAll: () => {
    const timestamp = new Date().toISOString()
    const consent = {
      consentGiven: true,
      essentialCookies: true,
      analyticsCookies: true,
      marketingCookies: true,
      consentTimestamp: timestamp,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    set({ ...consent, showBanner: false })
  },

  rejectAll: () => {
    const timestamp = new Date().toISOString()
    const consent = {
      consentGiven: true,
      essentialCookies: true,
      analyticsCookies: false,
      marketingCookies: false,
      consentTimestamp: timestamp,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    set({ ...consent, showBanner: false })
  },

  customizeConsent: (analytics: boolean, marketing: boolean) => {
    const timestamp = new Date().toISOString()
    const consent = {
      consentGiven: true,
      essentialCookies: true,
      analyticsCookies: analytics,
      marketingCookies: marketing,
      consentTimestamp: timestamp,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    set({ ...consent, showBanner: false })
  },

  loadConsent: () => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const consent = JSON.parse(stored)
        set({
          consentGiven: consent.consentGiven,
          essentialCookies: true,
          analyticsCookies: consent.analyticsCookies ?? false,
          marketingCookies: consent.marketingCookies ?? false,
          consentTimestamp: consent.consentTimestamp,
          showBanner: false,
        })
      } catch {
        set({ showBanner: true })
      }
    } else {
      set({ showBanner: true })
    }
  },

  openBanner: () => {
    set({ showBanner: true })
  },
}))
