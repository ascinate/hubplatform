'use client'

import { useState } from 'react'
import { X, Shield, BarChart3, Megaphone } from 'lucide-react'
import { useCookieConsentStore } from '@/lib/cookie-consent-store'

interface CookieConsentModalProps {
  onClose: () => void
}

export default function CookieConsentModal({ onClose }: CookieConsentModalProps) {
  const { customizeConsent, analyticsCookies, marketingCookies } = useCookieConsentStore()
  const [analytics, setAnalytics] = useState(analyticsCookies)
  const [marketing, setMarketing] = useState(marketingCookies)

  const handleSave = () => {
    customizeConsent(analytics, marketing)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Cookie Preferences</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cookie Categories */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Choose which cookies you&apos;d like to accept. Essential cookies are always active
            as they are necessary for the website to function properly.
          </p>

          {/* Essential Cookies */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="flex-shrink-0 w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center mt-0.5">
              <Shield size={18} className="text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Essential Cookies</h3>
                <div className="relative">
                  <div className="w-10 h-5 bg-green-500 rounded-full cursor-not-allowed" />
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Required for authentication, security, and basic website functionality.
                These cannot be disabled.
              </p>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
              <BarChart3 size={18} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Analytics Cookies</h3>
                <button
                  onClick={() => setAnalytics(!analytics)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    analytics ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      analytics ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Help us understand how visitors interact with our website by collecting
                anonymous usage data such as page views, clicks, and session duration.
              </p>
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="flex-shrink-0 w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center mt-0.5">
              <Megaphone size={18} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Marketing Cookies</h3>
                <button
                  onClick={() => setMarketing(!marketing)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    marketing ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      marketing ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used to deliver personalized content and measure the effectiveness of our
                marketing campaigns.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}
