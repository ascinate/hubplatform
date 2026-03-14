'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, MessageCircle, Menu, X } from 'lucide-react'
import SankalpHubLogo from '@/components/SankalpHubLogo'

const NAV_LINKS = [
  { label: 'Features', href: '/home#services' },
  { label: 'How It Works', href: '/home#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/home#about' },
  { label: 'Contact', href: '/home#contact' },
]

const PLANS = [
  {
    name: 'Free Trial',
    price: '$0',
    period: ' for 21 days',
    desc: 'Try SankalpHub free for 21 days. No credit card required.',
    features: [
      '21-day full access',
      'No credit card needed',
      '1 factory',
      'Up to 20 inspections',
      'Basic dashboard',
      'Data preserved after trial',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
    isFree: true,
  },
  {
    name: 'Starter',
    price: '$19',
    period: '/month',
    desc: 'Perfect for single-factory operations getting started with QC automation.',
    features: [
      '1 factory',
      'Up to 50 inspections/month',
      'Basic dashboard',
      'Email support',
      'Standard reports',
      'Pass/Fail tracking',
    ],
    cta: 'Get Started',
    highlighted: false,
    isFree: false,
  },
  {
    name: 'Professional',
    price: '$49',
    period: '/month',
    desc: 'For growing brands managing quality across multiple suppliers.',
    features: [
      'Up to 5 factories',
      'Unlimited inspections',
      'Advanced analytics',
      'Defect trend reports',
      'Priority support',
      'Custom alerts',
      'Factory comparison',
      'PDF export',
    ],
    cta: 'Get Started',
    highlighted: true,
    isFree: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: ' Pricing',
    desc: 'For large organizations needing full-scale QC intelligence.',
    features: [
      'Unlimited factories',
      'Custom integrations',
      'Dedicated account manager',
      'API access',
      'On-site training',
      'SLA guarantee',
      'Custom reports',
      'White-label option',
    ],
    cta: 'Contact Us',
    highlighted: false,
    isFree: false,
  },
]

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.',
  },
  {
    q: 'Do you support Indian payment methods?',
    a: 'Yes! We support UPI, Razorpay, net banking, and all major credit/debit cards through our Razorpay integration.',
  },
  {
    q: 'What happens after my free trial?',
    a: 'After your 21-day free trial, your account is paused until you subscribe. Your data will be preserved. Upgrade anytime to restore full access.',
  },
  {
    q: 'Is there a discount for yearly billing?',
    a: 'Yes, annual billing saves you 20%. Contact us for enterprise annual pricing.',
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Absolutely. You can switch plans at any time and the billing difference will be prorated.',
  },
]

export default function PricingPage() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Free trial modal
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [trialData, setTrialData] = useState({ full_name: '', email: '', company_name: '', password: '' })
  const [trialSubmitting, setTrialSubmitting] = useState(false)
  const [trialSuccess, setTrialSuccess] = useState(false)
  const [trialError, setTrialError] = useState('')

  const handleTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTrialSubmitting(true)
    setTrialError('')
    try {
      const res = await fetch('https://app.sankalphub.in/api/auth/free-trial/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trialData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create trial')
      setTrialSuccess(true)
    } catch (err) {
      setTrialError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setTrialSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/home" className="flex items-center">
              <SankalpHubLogo variant="light" height={44} />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm transition-colors ${link.href === '/pricing' ? 'font-semibold text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2">
                Sign In
              </Link>
              <Link
                href="/home#contact"
                className="text-sm font-medium text-white px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: '#A87C30' }}
              >
                Request a Demo
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="block text-gray-600 hover:text-gray-900 py-2" onClick={() => setMobileMenu(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/login" className="block text-gray-700 py-2">Sign In</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: '#1A1208' }}>
          Choose Your Plan
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Start with a 21-day free trial. No credit card required. Upgrade anytime.
        </p>
      </section>

      {/* Plans */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-8 ${plan.highlighted ? 'ring-2 ring-[#C9A96E] shadow-lg scale-105' : 'border border-gray-200 shadow-sm'} bg-white relative transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-white text-xs font-semibold px-4 py-1.5 rounded-full" style={{ backgroundColor: '#A87C30' }}>
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-2" style={{ color: '#1A1208' }}>{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-5">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ color: '#1A1208' }}>{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#C9A96E' }} />
                    {f}
                  </li>
                ))}
              </ul>
              {(plan as any).isFree ? (
                <button
                  onClick={() => setShowTrialModal(true)}
                  className="block w-full py-3 rounded-lg font-semibold text-sm text-center transition-all border-2 hover:bg-gray-50"
                  style={{ borderColor: '#C9A96E', color: '#C9A96E' }}
                >
                  {plan.cta}
                </button>
              ) : (
                <Link
                  href="/home#contact"
                  className={`block w-full py-3 rounded-lg font-semibold text-sm text-center transition-all ${plan.highlighted ? 'text-white hover:opacity-90' : 'border-2 hover:bg-gray-50'}`}
                  style={plan.highlighted ? { backgroundColor: '#A87C30' } : { borderColor: '#C9A96E', color: '#C9A96E' }}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10" style={{ color: '#1A1208' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-medium"
                  style={{ color: '#1A1208' }}
                >
                  {faq.q}
                  <span className={`transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-500 text-sm leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center" style={{ background: 'linear-gradient(135deg, #1A1208 0%, #2A1F10 100%)' }}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          Transform your QC process with data-driven insights. Start your free trial today.
        </p>
        <Link
          href="/home#contact"
          className="inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:opacity-90"
          style={{ backgroundColor: '#A87C30' }}
        >
          Request a Demo
        </Link>
      </section>

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

      {/* Free Trial Signup Modal */}
      {showTrialModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button onClick={() => { setShowTrialModal(false); setTrialSuccess(false); setTrialError('') }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>

            {trialSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#A87C30' }}>
                  <Check size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#1A1208' }}>Welcome to SankalpHub!</h3>
                <p className="text-gray-500 mb-6">Your 21-day free trial is active.</p>
                <a href="/login" className="inline-block text-white font-semibold px-8 py-3 rounded-lg" style={{ backgroundColor: '#A87C30' }}>Go to Login</a>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-1" style={{ color: '#1A1208' }}>Start Your Free Trial</h3>
                <p className="text-gray-500 text-sm mb-6">21 days of full access. No credit card required.</p>
                <form onSubmit={handleTrialSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
                    <input type="text" required value={trialData.full_name} onChange={(e) => setTrialData({ ...trialData, full_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Work Email *</label>
                    <input type="email" required value={trialData.email} onChange={(e) => setTrialData({ ...trialData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]" placeholder="you@company.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Company Name</label>
                    <input type="text" value={trialData.company_name} onChange={(e) => setTrialData({ ...trialData, company_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]" placeholder="Company name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Password *</label>
                    <input type="password" required minLength={8} value={trialData.password} onChange={(e) => setTrialData({ ...trialData, password: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]" placeholder="Min 8 characters" />
                  </div>
                  {trialError && <div className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{trialError}</div>}
                  <button type="submit" disabled={trialSubmitting}
                    className="w-full text-white font-semibold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#A87C30' }}>
                    {trialSubmitting ? 'Creating account...' : 'Start Free Trial'}
                  </button>
                  <p className="text-xs text-gray-400 text-center">No credit card required. Data safe even after trial ends.</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/919410261360?text=Hi%2C%20I%27m%20interested%20in%20SankalpHub.%20Please%20note%20our%20support%20team%20responds%20within%2024%20hours%20(Mon%E2%80%93Sat%2C%209%20AM%E2%80%936%20PM%20IST)."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        style={{ backgroundColor: '#25D366' }}
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={28} className="text-white" />
      </a>
    </div>
  )
}
