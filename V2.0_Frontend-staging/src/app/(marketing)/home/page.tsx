'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SankalpHubLogo from '@/components/SankalpHubLogo'
import {
  ClipboardCheck,
  Factory,
  BarChart3,
  Upload,
  Cpu,
  LineChart,
  Bell,
  FileSpreadsheet,
  Eye,
  TrendingDown,
  Check,
  Menu,
  X,
  ArrowRight,
  Send,
  MessageCircle,
  ChevronDown,
  ShieldCheck,
  Clock,
} from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features', href: '#services' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

const PAIN_POINTS = [
  {
    icon: FileSpreadsheet,
    title: 'Manual report processing wastes hours',
    desc: 'Your team spends more time on paperwork than on catching defects.',
  },
  {
    icon: Eye,
    title: 'No real-time visibility across factories',
    desc: 'You can\'t see what\'s happening across suppliers until it\'s too late.',
  },
  {
    icon: TrendingDown,
    title: 'Defect patterns go unnoticed',
    desc: 'Recurring quality issues slip through because data is scattered in spreadsheets.',
  },
]

const SERVICES = [
  {
    icon: ClipboardCheck,
    title: 'QC Dashboard Setup',
    desc: 'Automated parsing of inspection reports (AQL + Inline), real-time dashboards with pass/fail logic, defect categorization across Stitching, Labeling, Lasting, Surface/Esthetic, and Functional defects.',
    color: '#C9A96E',
  },
  {
    icon: Factory,
    title: 'Multi-Factory Monitoring',
    desc: 'Consolidated view across suppliers in China, Cambodia, and India. Compare factory performance side-by-side. Track OQR% and First-Pass AQL rates across your entire supply chain.',
    color: '#A87C30',
  },
  {
    icon: BarChart3,
    title: 'Defect Analytics & Alerts',
    desc: 'Trend analysis with automated alerts for recurring defects. Department-level scorecards with KPI tracking to drive continuous improvement.',
    color: '#9A7035',
  },
]

const STEPS = [
  {
    num: '01',
    icon: Upload,
    title: 'Upload Reports',
    desc: 'Upload your inspection reports in PDF or Excel format — AQL, Inline, or any standard QC format.',
  },
  {
    num: '02',
    icon: Cpu,
    title: 'Auto-Parse & Categorize',
    desc: 'Our system automatically extracts data, categorizes defects, and structures it for analysis.',
  },
  {
    num: '03',
    icon: LineChart,
    title: 'Real-Time Dashboards',
    desc: 'See pass/fail rates, defect distributions, factory comparisons, and trends — all updated in real time.',
  },
  {
    num: '04',
    icon: Bell,
    title: 'Alerts & Insights',
    desc: 'Get automated alerts on recurring defects and actionable insights to improve quality across your supply chain.',
  },
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
    ],
    cta: 'Contact Us',
    highlighted: false,
    isFree: false,
  },
]

const CAROUSEL_SLIDES = [
  {
    icon: ShieldCheck,
    title: 'Quality Management System',
    subtitle: 'End-to-end QMS with gated approvals, defect tracking, and AQL standards built for modern manufacturing.',
    color: '#C9A96E',
  },
  {
    icon: Factory,
    title: 'Factory Management',
    subtitle: 'Multi-factory visibility — monitor production plans, inspections, and supplier performance in real time.',
    color: '#A87C30',
  },
  {
    icon: BarChart3,
    title: 'Reports & Data Intelligence',
    subtitle: 'Auto-generated inspection reports, defect analytics, and data-driven dashboards for leadership decisions.',
    color: '#9A7035',
  },
  {
    icon: Clock,
    title: 'Time-Saving Automation',
    subtitle: 'Eliminate manual follow-ups — automated alerts, workflow stages, and T&A tracking save 10+ hours/week.',
    color: '#BBA878',
  },
]

const ROLE_OPTIONS = [
  { value: '', label: 'Select your role / position' },
  { value: 'owner_ceo', label: 'Owner / CEO' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'quality_manager', label: 'Quality Manager' },
  { value: 'merchandising_manager', label: 'Merchandising Manager' },
  { value: 'production_manager', label: 'Production Manager' },
  { value: 'sourcing_manager', label: 'Sourcing Manager' },
  { value: 'factory_head', label: 'Factory Head' },
  { value: 'other', label: 'Other' },
]

const INSPECTION_FIELDS = [
  { value: '', label: 'Monthly Inspections' },
  { value: 'less_50', label: 'Less than 50' },
  { value: '50_200', label: '50 - 200' },
  { value: 'more_200', label: '200+' },
]

export default function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    role: '',
    factories_count: '',
    monthly_inspections: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  // Free trial signup modal state
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [trialData, setTrialData] = useState({ full_name: '', email: '', company_name: '', password: '' })
  const [trialSubmitting, setTrialSubmitting] = useState(false)
  const [trialSuccess, setTrialSuccess] = useState(false)
  const [trialError, setTrialError] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setActiveSlide((s) => (s + 1) % CAROUSEL_SLIDES.length), 4000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const res = await fetch('https://app.sankalphub.in/api/demo-request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to submit')
      setSubmitted(true)
      setFormData({ name: '', company: '', email: '', phone: '', role: '', factories_count: '', monthly_inspections: '', message: '' })
    } catch {
      setFormError('Something went wrong. Please try again or contact us via WhatsApp.')
    } finally {
      setSubmitting(false)
    }
  }

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
      setTrialError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setTrialSubmitting(false)
    }
  }

  const scrollTo = (id: string) => {
    setMobileMenu(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/home" className="flex items-center">
              <SankalpHubLogo variant="light" height={44} />
            </a>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href.slice(1))}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2">
                Sign In
              </Link>
              <button
                onClick={() => scrollTo('contact')}
                className="text-sm font-medium text-white px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: '#A87C30' }}
              >
                Request a Demo
              </button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href.slice(1))}
                className="block w-full text-left text-gray-600 hover:text-gray-900 py-2"
              >
                {link.label}
              </button>
            ))}
            <Link href="/login" className="block text-gray-700 py-2">Sign In</Link>
            <button
              onClick={() => scrollTo('contact')}
              className="w-full text-white py-2.5 rounded-lg font-medium"
              style={{ backgroundColor: '#A87C30' }}
            >
              Request a Demo
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #1A1208 0%, #2A1F10 50%, #3D2E18 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Platform Built to Redesign{' '}
              <span style={{ color: '#C9A96E' }}>Organization Structure</span>{' '}
              for Industry Manufacturers
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed">
              Automate Work &amp; Reports with Real-time Monitoring. Drive Data-Driven Decisions
              across all your Organization &amp; Departments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => scrollTo('contact')}
                className="inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:opacity-90"
                style={{ backgroundColor: '#A87C30' }}
              >
                Request a Demo <ArrowRight size={20} />
              </button>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:bg-white/20"
              >
                View Pricing
              </Link>
            </div>
          </div>

          {/* Feature Carousel */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-10">
              <div className="grid sm:grid-cols-2 gap-8 items-center min-h-[220px]">
                {/* Left: text + steps */}
                <div>
                  <div className="flex gap-2 mb-6">
                    {CAROUSEL_SLIDES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSlide(i)}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{ width: i === activeSlide ? 32 : 12, backgroundColor: i === activeSlide ? '#C9A96E' : 'rgba(255,255,255,0.3)' }}
                      />
                    ))}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    {CAROUSEL_SLIDES[activeSlide].title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {CAROUSEL_SLIDES[activeSlide].subtitle}
                  </p>
                </div>
                {/* Right: icon card */}
                <div className="flex items-center justify-center">
                  <div
                    className="w-40 h-40 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500"
                    style={{ background: `linear-gradient(135deg, ${CAROUSEL_SLIDES[activeSlide].color}22, ${CAROUSEL_SLIDES[activeSlide].color}44)`, border: `2px solid ${CAROUSEL_SLIDES[activeSlide].color}55` }}
                  >
                    {(() => {
                      const Icon = CAROUSEL_SLIDES[activeSlide].icon
                      return <Icon size={72} style={{ color: CAROUSEL_SLIDES[activeSlide].color }} />
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1208' }}>
              Still managing QC with spreadsheets and PDFs?
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Most garment manufacturers lose time, money, and quality visibility because of outdated QC processes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {PAIN_POINTS.map((p) => (
              <div key={p.title} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#FEF5F4' }}>
                  <p.icon size={28} className="text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#1A1208' }}>{p.title}</h3>
                <p className="text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1208' }}>
              Everything you need for QC excellence
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              From automated report parsing to real-time alerts, SankalpHub gives you complete control over garment quality.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${s.color}15` }}>
                  <s.icon size={28} style={{ color: s.color }} />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#1A1208' }}>{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#1A1208' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Get from raw inspection reports to actionable insights in four simple steps.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.num} className="text-center">
                <div className="text-5xl font-bold mb-4" style={{ color: '#C9A96E', opacity: 0.3 }}>{step.num}</div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(0, 212, 170, 0.1)' }}>
                  <step.icon size={32} style={{ color: '#C9A96E' }} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1208' }}>
              Simple, transparent pricing
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Start small, scale as you grow. All plans include a 21-day free trial.
            </p>
          </div>
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
                <button
                  onClick={() => (plan as any).isFree ? setShowTrialModal(true) : scrollTo('contact')}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${plan.highlighted ? 'text-white hover:opacity-90' : 'border-2 hover:bg-gray-50'}`}
                  style={plan.highlighted ? { backgroundColor: '#A87C30' } : { borderColor: '#C9A96E', color: '#C9A96E' }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: '#1A1208' }}>
            Designed by Experts &amp; Experienced Professionals for New Growth in Quality Management System
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            SankalpHub exists to bridge the gap between manual QC and smart manufacturing.
            We understand the pain of manual inspection processes because we&apos;ve lived it.
          </p>
          <p className="text-gray-500 leading-relaxed">
            Our team brings years of hands-on garment inspection experience across
            international supply chains in Asia. We&apos;ve worked with factories in China,
            Cambodia, and India — and we built the tool we always wished we had.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #1A1208 0%, #2A1F10 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Request a Demo</h2>
            <p className="text-gray-400 text-lg">
              See how SankalpHub can transform your QC process. We&apos;ll reach out within 24 hours.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-10 text-center border border-white/10">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#A87C30' }}>
                <Check size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Thanks for reaching out!</h3>
              <p className="text-gray-400">We&apos;ll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-10 border border-white/10">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1.5 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1.5 block">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="Company name"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1.5 block">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1.5 block">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-gray-300 text-sm mb-1.5 block">Role / Position in Organization *</label>
                <div className="relative">
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:border-[#C9A96E] transition-colors"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1.5 block">Number of Factories</label>
                  <input
                    type="text"
                    value={formData.factories_count}
                    onChange={(e) => setFormData({ ...formData, factories_count: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="e.g. 3"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1.5 block">Monthly Inspections</label>
                  <div className="relative">
                    <select
                      value={formData.monthly_inspections}
                      onChange={(e) => setFormData({ ...formData, monthly_inspections: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:border-[#C9A96E] transition-colors"
                    >
                      {INSPECTION_FIELDS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <label className="text-gray-300 text-sm mb-1.5 block">Message (optional)</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors resize-none"
                  placeholder="Tell us about your QC needs..."
                />
              </div>
              {formError && (
                <div className="mb-4 text-red-400 text-sm bg-red-400/10 rounded-lg p-3">{formError}</div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 text-white font-semibold py-4 rounded-lg text-lg transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#A87C30' }}
              >
                {submitting ? 'Sending...' : 'Send Request'} <Send size={18} />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center mb-4">
                <SankalpHubLogo variant="light" height={40} />
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Production & Inspection Intelligence for Garment Manufacturers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: '#1A1208' }}>Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><button onClick={() => scrollTo('services')} className="hover:text-gray-700">Features</button></li>
                <li><Link href="/pricing" className="hover:text-gray-700">Pricing</Link></li>
                <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-gray-700">How It Works</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: '#1A1208' }}>Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><button onClick={() => scrollTo('about')} className="hover:text-gray-700">About</button></li>
                <li><button onClick={() => scrollTo('contact')} className="hover:text-gray-700">Contact</button></li>
                <li><Link href="/privacy-policy" className="hover:text-gray-700">Privacy Policy</Link></li>
                <li><Link href="/cookie-policy" className="hover:text-gray-700">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: '#1A1208' }}>Connect</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <a
                    href="https://wa.me/919410261360?text=Hi%2C%20I%27m%20interested%20in%20SankalpHub.%20Please%20note%20our%20support%20team%20responds%20within%2024%20hours%20(Mon%E2%80%93Sat%2C%209%20AM%E2%80%936%20PM%20IST)."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-700 flex items-center gap-1"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                </li>
                <li><button onClick={() => scrollTo('contact')} className="hover:text-gray-700">Request a Demo</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <span>&copy; 2025 SankalpHub. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy-policy" className="hover:text-gray-600">Privacy Policy</Link>
              <Link href="/cookie-policy" className="hover:text-gray-600">Cookie Policy</Link>
            </div>
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
                <p className="text-gray-500 mb-6">Your 21-day free trial is active. You can now sign in and explore the platform.</p>
                <a href="/login" className="inline-block text-white font-semibold px-8 py-3 rounded-lg" style={{ backgroundColor: '#A87C30' }}>
                  Go to Login
                </a>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-1" style={{ color: '#1A1208' }}>Start Your Free Trial</h3>
                <p className="text-gray-500 text-sm mb-6">21 days of full access. No credit card required.</p>

                <form onSubmit={handleTrialSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
                    <input type="text" required value={trialData.full_name} onChange={(e) => setTrialData({ ...trialData, full_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Work Email *</label>
                    <input type="email" required value={trialData.email} onChange={(e) => setTrialData({ ...trialData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent" placeholder="you@company.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Company Name</label>
                    <input type="text" value={trialData.company_name} onChange={(e) => setTrialData({ ...trialData, company_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent" placeholder="Company name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Password *</label>
                    <input type="password" required minLength={8} value={trialData.password} onChange={(e) => setTrialData({ ...trialData, password: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent" placeholder="Min 8 characters" />
                  </div>
                  {trialError && <div className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{trialError}</div>}
                  <button type="submit" disabled={trialSubmitting}
                    className="w-full text-white font-semibold py-3 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#A87C30' }}>
                    {trialSubmitting ? 'Creating account...' : 'Start Free Trial'}
                  </button>
                  <p className="text-xs text-gray-400 text-center">No credit card required. Your data is safe even after trial ends.</p>
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
