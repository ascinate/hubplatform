'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a1a2e' }}>Privacy Policy</h1>
          <p className="text-gray-400 text-sm mb-10">Last updated: March 6, 2026</p>

          <div className="space-y-8 text-gray-600 leading-relaxed">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>1. Introduction</h2>
              <p>
                SankalpHub (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website{' '}
                <strong>sankalphub.in</strong> and the SankalpHub QC automation platform (collectively,
                the &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose,
                and safeguard your information when you visit our website and use our Service.
              </p>
              <p className="mt-3">
                By accessing or using the Service, you agree to this Privacy Policy. If you do not
                agree with the terms of this policy, please do not access the Service.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>2. Information We Collect</h2>

              <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800">2.1 Account Information</h3>
              <p>When you register for an account, we collect:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Full name</li>
                <li>Email address</li>
                <li>Company/Organization name</li>
                <li>Password (encrypted)</li>
                <li>Role within your organization</li>
              </ul>

              <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800">2.2 Business Data</h3>
              <p>Through your use of the Service, we process:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Inspection reports and quality control data</li>
                <li>Factory and supplier information</li>
                <li>Order and production tracking data</li>
                <li>Lab testing results</li>
                <li>Defect analytics and quality metrics</li>
              </ul>

              <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800">2.3 Usage Data</h3>
              <p>When you access our website (with your consent), we may collect:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Pages visited and navigation paths</li>
                <li>Click interactions</li>
                <li>Search queries within the Service</li>
                <li>Session duration and frequency of visits</li>
                <li>Referring website or source</li>
              </ul>

              <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800">2.4 Device Information</h3>
              <p>We may automatically collect:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>Screen resolution</li>
                <li>Language preferences</li>
                <li>Approximate geographic location (country/city level, derived from IP address)</li>
              </ul>
              <p className="mt-2 text-sm text-gray-500">
                Note: We do not store raw IP addresses. IP addresses are used only transiently for
                geographic lookup and are then discarded or hashed.
              </p>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>3. How We Use Your Information</h2>
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Service delivery:</strong> To provide, operate, and maintain the QC automation platform</li>
                <li><strong>Account management:</strong> To manage your account, process authentication, and handle billing</li>
                <li><strong>Improvement:</strong> To understand how our Service is used and improve user experience</li>
                <li><strong>Analytics:</strong> To generate aggregate, anonymized analytics about website usage</li>
                <li><strong>Communication:</strong> To send you important updates, security alerts, and support messages</li>
                <li><strong>Security:</strong> To detect, prevent, and address technical issues and security threats</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>4. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar technologies to enhance your experience. You can manage
                your cookie preferences at any time through our cookie consent banner or by visiting
                our{' '}
                <Link href="/cookie-policy" className="text-orange-500 hover:text-orange-600 underline underline-offset-2">
                  Cookie Policy
                </Link>
                .
              </p>
              <p className="mt-3">We categorize cookies as follows:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Essential Cookies:</strong> Required for authentication, security, and basic functionality. These cannot be disabled.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand website usage patterns. Enabled only with your explicit consent.</li>
                <li><strong>Marketing Cookies:</strong> Used for personalized content and campaign measurement. Enabled only with your explicit consent.</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>5. Data Sharing and Third Parties</h2>
              <p>We do <strong>not</strong> sell your personal data. We may share data with:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Razorpay:</strong> For processing payments securely. Razorpay&apos;s privacy policy governs their handling of payment data.</li>
                <li><strong>WhatsApp/Communication tools:</strong> When you choose to contact us via WhatsApp or other messaging platforms.</li>
                <li><strong>Legal requirements:</strong> When required by law, regulation, or legal process.</li>
              </ul>
              <p className="mt-3">
                All third-party service providers are contractually obligated to protect your data
                and use it only for the purposes we specify.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>6. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your data:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>All data transmitted over HTTPS (TLS encryption)</li>
                <li>JWT-based authentication with automatic token refresh</li>
                <li>Passwords are hashed and never stored in plaintext</li>
                <li>IP addresses are hashed (SHA-256) for privacy</li>
                <li>Regular security reviews and updates</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>7. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Account data:</strong> Retained for as long as your account is active. Deleted upon account deletion request.</li>
                <li><strong>Business data:</strong> Retained while your subscription is active. Available for export before deletion.</li>
                <li><strong>Analytics data:</strong> Anonymized visitor tracking data is retained for up to 12 months, then automatically deleted.</li>
                <li><strong>Cookie consent records:</strong> Retained for the duration of the consent period or until you change your preferences.</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>8. Your Rights</h2>
              <p>
                Under applicable data protection laws, including the EU General Data Protection
                Regulation (GDPR) and the Indian Digital Personal Data Protection Act, 2023 (DPDP Act),
                you have the following rights:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate data.</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data.</li>
                <li><strong>Right to Portability:</strong> Request your data in a structured, machine-readable format.</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent for analytics/marketing cookies at any time.</li>
                <li><strong>Right to Grievance Redressal:</strong> Under the DPDP Act, you may raise concerns with our Data Protection Officer.</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at the email address provided below.
              </p>
            </section>

            {/* Children */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>9. Children&apos;s Privacy</h2>
              <p>
                Our Service is not directed to individuals under the age of 18. We do not knowingly
                collect personal data from children. If we become aware that we have collected data
                from a child, we will take steps to delete it promptly.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant
                changes by posting the new policy on this page and updating the &quot;Last updated&quot;
                date. For material changes, we may also notify you via email.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>11. Contact Us</h2>
              <p>If you have questions about this Privacy Policy or wish to exercise your data rights, contact us:</p>
              <div className="mt-3 p-4 bg-gray-50 rounded-xl">
                <p><strong>SankalpHub</strong></p>
                <p className="mt-1">Email: <a href="mailto:support@sankalphub.in" className="text-orange-500 hover:text-orange-600 underline underline-offset-2">support@sankalphub.in</a></p>
                <p>Website: <a href="https://sankalphub.in" className="text-orange-500 hover:text-orange-600 underline underline-offset-2">sankalphub.in</a></p>
              </div>
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
