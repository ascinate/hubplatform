'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useCookieConsentStore } from '@/lib/cookie-consent-store'

export default function CookiePolicyPage() {
  const { openBanner } = useCookieConsentStore()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/home" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1a1a2e' }}>
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold" style={{ color: '#1a1a2e' }}>SankalpHub</span>
            </Link>
            <Link href="/home" className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a1a2e' }}>Cookie Policy</h1>
          <p className="text-gray-400 text-sm mb-10">Last updated: March 6, 2026</p>

          <div className="space-y-8 text-gray-600 leading-relaxed">
            {/* What Are Cookies */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>1. What Are Cookies?</h2>
              <p>
                Cookies are small text files stored on your device (computer, tablet, or mobile phone)
                when you visit a website. They are widely used to make websites work more efficiently,
                improve user experience, and provide information to website owners.
              </p>
              <p className="mt-3">
                We also use similar technologies such as <strong>localStorage</strong> to store
                preferences and session information on your device.
              </p>
            </section>

            {/* How We Use Cookies */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>2. How We Use Cookies</h2>
              <p>
                SankalpHub uses cookies and similar technologies to provide, protect, and improve
                our Service. Below is a detailed breakdown of the cookies we use, organized by category.
              </p>
            </section>

            {/* Cookie Categories */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>3. Cookie Categories</h2>

              {/* Essential */}
              <div className="mt-4 p-5 bg-green-50 rounded-xl border border-green-100">
                <h3 className="text-base font-semibold text-green-800 mb-2">Essential Cookies (Always Active)</h3>
                <p className="text-sm text-green-700 mb-3">
                  These cookies are strictly necessary for the website to function. They cannot be
                  switched off in our systems.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-green-800">
                        <th className="pb-2 pr-4 font-semibold">Name</th>
                        <th className="pb-2 pr-4 font-semibold">Purpose</th>
                        <th className="pb-2 font-semibold">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-green-700">
                      <tr className="border-t border-green-100">
                        <td className="py-2 pr-4 font-mono text-xs">sankalp_access_token</td>
                        <td className="py-2 pr-4">JWT authentication token</td>
                        <td className="py-2">Session</td>
                      </tr>
                      <tr className="border-t border-green-100">
                        <td className="py-2 pr-4 font-mono text-xs">sankalp_refresh_token</td>
                        <td className="py-2 pr-4">Token refresh for seamless login</td>
                        <td className="py-2">7 days</td>
                      </tr>
                      <tr className="border-t border-green-100">
                        <td className="py-2 pr-4 font-mono text-xs">sankalp_user</td>
                        <td className="py-2 pr-4">User profile and role information</td>
                        <td className="py-2">Session</td>
                      </tr>
                      <tr className="border-t border-green-100">
                        <td className="py-2 pr-4 font-mono text-xs">sankalp_cookie_consent</td>
                        <td className="py-2 pr-4">Stores your cookie preferences</td>
                        <td className="py-2">12 months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Analytics */}
              <div className="mt-4 p-5 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="text-base font-semibold text-blue-800 mb-2">Analytics Cookies (Opt-in)</h3>
                <p className="text-sm text-blue-700 mb-3">
                  These cookies help us understand how visitors interact with our website by collecting
                  anonymous data. They are only activated with your explicit consent.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-blue-800">
                        <th className="pb-2 pr-4 font-semibold">Name</th>
                        <th className="pb-2 pr-4 font-semibold">Purpose</th>
                        <th className="pb-2 font-semibold">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-blue-700">
                      <tr className="border-t border-blue-100">
                        <td className="py-2 pr-4 font-mono text-xs">sankalp_visitor_id</td>
                        <td className="py-2 pr-4">Anonymous visitor identification</td>
                        <td className="py-2">12 months</td>
                      </tr>
                      <tr className="border-t border-blue-100">
                        <td className="py-2 pr-4 font-mono text-xs">sankalp_session_id</td>
                        <td className="py-2 pr-4">Groups page views into sessions</td>
                        <td className="py-2">30 minutes (inactivity)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-blue-600 mt-3">
                  Data collected: page views, clicks, session duration, search queries, device type,
                  browser, approximate location (country/city). No personal identifying information is stored.
                </p>
              </div>

              {/* Marketing */}
              <div className="mt-4 p-5 bg-purple-50 rounded-xl border border-purple-100">
                <h3 className="text-base font-semibold text-purple-800 mb-2">Marketing Cookies (Opt-in)</h3>
                <p className="text-sm text-purple-700 mb-3">
                  These cookies may be used in the future to deliver personalized content and measure
                  the effectiveness of marketing campaigns. Currently, we do not use marketing cookies.
                </p>
                <p className="text-xs text-purple-600">
                  This category is reserved for future use. We will update this policy before
                  introducing any marketing cookies.
                </p>
              </div>
            </section>

            {/* Managing Cookies */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>4. Managing Your Cookie Preferences</h2>
              <p>You can manage your cookie preferences in several ways:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <strong>Cookie consent banner:</strong> When you first visit our website, you can
                  accept all, reject all, or customize your preferences.
                </li>
                <li>
                  <strong>Update preferences:</strong> You can change your cookie settings at any time
                  by clicking the button below.
                </li>
                <li>
                  <strong>Browser settings:</strong> Most browsers allow you to manage cookies through
                  their settings. Note that blocking essential cookies may impact website functionality.
                </li>
              </ul>
              <button
                onClick={openBanner}
                className="mt-4 px-5 py-2.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
              >
                Update Cookie Preferences
              </button>
            </section>

            {/* Data Processing */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>5. How We Process Cookie Data</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Analytics data is collected and stored on our own servers (self-hosted). We do not use third-party analytics services like Google Analytics.</li>
                <li>All tracking data is anonymous and cannot be used to identify you personally.</li>
                <li>IP addresses are used only transiently for geographic lookup and are immediately hashed (SHA-256) or discarded.</li>
                <li>Analytics data is automatically deleted after 12 months.</li>
              </ul>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>6. Changes to This Cookie Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices
                or for other operational, legal, or regulatory reasons. We will update the &quot;Last
                updated&quot; date at the top of this page.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>7. Contact Us</h2>
              <p>
                For questions about this Cookie Policy, please refer to our{' '}
                <Link href="/privacy-policy" className="text-orange-500 hover:text-orange-600 underline underline-offset-2">
                  Privacy Policy
                </Link>{' '}
                or contact us at{' '}
                <a href="mailto:support@sankalphub.in" className="text-orange-500 hover:text-orange-600 underline underline-offset-2">
                  support@sankalphub.in
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>&copy; 2025 SankalpHub. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-gray-600">Privacy Policy</Link>
            <Link href="/cookie-policy" className="hover:text-gray-600">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
