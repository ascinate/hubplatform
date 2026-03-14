'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'
import { useCookieConsentStore } from '@/lib/cookie-consent-store'
import CookieConsentModal from './CookieConsentModal'

export default function CookieConsentBanner() {
  const { showBanner, loadConsent, acceptAll, rejectAll } = useCookieConsentStore()
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    loadConsent()
    setMounted(true)
  }, [loadConsent])

  if (!mounted || !showBanner) return null

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Cookie size={20} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                We value your privacy
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use cookies to enhance your browsing experience, analyze site traffic, and
                understand where our visitors come from. By clicking &quot;Accept All&quot;, you consent
                to our use of cookies.{' '}
                <Link
                  href="/cookie-policy"
                  className="text-orange-500 hover:text-orange-600 underline underline-offset-2"
                >
                  Learn more
                </Link>
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  onClick={acceptAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                >
                  Accept All
                </button>
                <button
                  onClick={rejectAll}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
                >
                  Customize
                </button>
              </div>
            </div>
            <button
              onClick={rejectAll}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close cookie banner"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {showModal && <CookieConsentModal onClose={() => setShowModal(false)} />}
    </>
  )
}
