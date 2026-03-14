'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle,
  CreditCard,
  Users,
  CalendarDays,
  Globe,
  Loader2,
  Receipt,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import PlanCard, { type Plan } from '@/components/billing/PlanCard'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Payment {
  created_at: string
  amount: number
  currency: string
  gateway: string
  gateway_payment_id: string
  status: string
}

interface Subscription {
  plan: Plan
  status: string
  gateway: string
  current_period_end: string
  payments: Payment[]
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/* Razorpay types declared in src/types/razorpay.d.ts */

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-success-light', text: 'text-success', label: 'Active' },
  trialing: { bg: 'bg-info-light', text: 'text-info', label: 'Trialing' },
  past_due: { bg: 'bg-warning-light', text: 'text-warning', label: 'Past Due' },
  cancelled: { bg: 'bg-danger-light', text: 'text-danger', label: 'Cancelled' },
  expired: { bg: 'bg-danger-light', text: 'text-danger', label: 'Expired' },
}

const paymentStatusStyles: Record<string, { bg: string; text: string }> = {
  success: { bg: 'bg-success-light', text: 'text-success' },
  paid: { bg: 'bg-success-light', text: 'text-success' },
  pending: { bg: 'bg-warning-light', text: 'text-warning' },
  failed: { bg: 'bg-danger-light', text: 'text-danger' },
  refunded: { bg: 'bg-info-light', text: 'text-info' },
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function BillingPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [upgradingSlug, setUpgradingSlug] = useState<string | null>(null)

  const stripeSuccess = searchParams.get('stripe_success') === '1'

  useEffect(() => {
    loadBilling()
  }, [])

  const loadBilling = async () => {
    setLoading(true)
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get('/billing/my-subscription/').catch(() => ({ data: null })),
        api.get('/billing/plans/'),
      ])

      setSubscription(subRes.data)

      const planList = plansRes.data?.results || plansRes.data
      setPlans(Array.isArray(planList) ? planList : [])
    } catch {
      toast.error('Failed to load billing information')
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Razorpay upgrade flow                                            */
  /* ---------------------------------------------------------------- */

  const handleUpgrade = async (planSlug: string) => {
    setUpgradingSlug(planSlug)
    try {
      // 1. Create Razorpay order
      const { data: order } = await api.post('/billing/razorpay/create-order/', {
        plan_slug: planSlug,
      })

      // 2. Open Razorpay checkout
      const options: RazorpayOptions = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'SankalpHub',
        description: `Upgrade to ${planSlug}`,
        handler: async (response: RazorpayResponse) => {
          try {
            await api.post('/billing/razorpay/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_slug: planSlug,
            })
            toast.success('Payment verified successfully!')
            loadBilling()
          } catch {
            toast.error('Payment verification failed. Please contact support.')
          } finally {
            setUpgradingSlug(null)
          }
        },
        modal: {
          ondismiss: () => {
            setUpgradingSlug(null)
          },
        },
        theme: {
          color: '#27AE60',
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      toast.error('Failed to initiate payment. Please try again.')
      setUpgradingSlug(null)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary animate-spin" />
          <span className="text-sm text-text-muted">Loading billing...</span>
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Derived data                                                     */
  /* ---------------------------------------------------------------- */

  const currentPlan = subscription?.plan
  const payments = subscription?.payments ?? []
  const status = subscription?.status ?? ''
  const statusStyle = statusStyles[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    label: status || 'None',
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Billing &amp; Subscription</h1>

      {/* Stripe success banner */}
      {stripeSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle size={20} className="text-success shrink-0" />
          <p className="text-sm font-medium text-green-800">
            Payment successful! Your subscription has been updated.
          </p>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl border border-border p-6">
        {currentPlan ? (
          <>
            {/* Plan header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-text-primary">{currentPlan.name}</h2>
                  <span
                    className={cn(
                      'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium',
                      statusStyle.bg,
                      statusStyle.text
                    )}
                  >
                    {statusStyle.label}
                  </span>
                </div>
                <p className="text-sm text-text-muted mt-1">{currentPlan.description}</p>
              </div>
              {subscription?.current_period_end && (
                <p className="text-sm text-text-muted">
                  Renews on{' '}
                  <span className="font-medium text-text-primary">
                    {formatDate(subscription.current_period_end, 'long')}
                  </span>
                </p>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CreditCard size={18} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Price</p>
                  <p className="text-sm font-semibold text-text-primary">
                    &#8377;{currentPlan.price_inr.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CalendarDays size={18} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Billing</p>
                  <p className="text-sm font-semibold text-text-primary capitalize">
                    {currentPlan.interval}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Users size={18} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Max Users</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {currentPlan.max_users}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Globe size={18} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Gateway</p>
                  <p className="text-sm font-semibold text-text-primary capitalize">
                    {subscription?.gateway || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            {currentPlan.features && currentPlan.features.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">Included Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPlan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <CheckCircle size={15} className="text-success shrink-0" />
                      <span className="text-sm text-text-primary">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={40} className="text-gray-200 mb-3" />
            <p className="text-base font-semibold text-text-primary mb-1">No Active Subscription</p>
            <p className="text-sm text-text-muted text-center max-w-md">
              You do not have an active subscription. Choose a plan below to get started with
              SankalpHub.
            </p>
          </div>
        )}
      </div>

      {/* Available Plans */}
      {plans.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.slug}
                plan={plan}
                isCurrentPlan={currentPlan?.slug === plan.slug}
                isPopular={plan.is_highlighted ?? false}
                onUpgrade={handleUpgrade}
                upgrading={upgradingSlug === plan.slug}
              />
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-text-primary">Payment History</h2>
          </div>
          <span className="text-xs text-text-muted">
            {payments.length} transaction{payments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Mobile card view */}
        <div className="lg:hidden p-4 space-y-3">
          {payments.length === 0 ? (
            <p className="text-center text-sm text-text-muted py-8">No payment history found.</p>
          ) : (
            payments.map((payment, idx) => {
              const pStyle = paymentStatusStyles[payment.status] || { bg: 'bg-gray-100', text: 'text-gray-500' }
              return (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {payment.currency === 'INR' ? '\u20B9' : '$'}
                      {payment.amount.toLocaleString(payment.currency === 'INR' ? 'en-IN' : 'en-US')}
                    </span>
                    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', pStyle.bg, pStyle.text)}>
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">{formatDate(payment.created_at, 'long')}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted capitalize">{payment.gateway}</span>
                    <span className="text-xs text-text-muted font-mono truncate max-w-[150px]">{payment.gateway_payment_id || '—'}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                  Amount
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                  Gateway
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                  Reference
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-text-muted">
                    No payment history found.
                  </td>
                </tr>
              ) : (
                payments.map((payment, idx) => {
                  const pStyle = paymentStatusStyles[payment.status] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-500',
                  }
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {formatDate(payment.created_at, 'long')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text-primary">
                        {payment.currency === 'INR' ? '\u20B9' : '$'}
                        {payment.amount.toLocaleString(
                          payment.currency === 'INR' ? 'en-IN' : 'en-US'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted capitalize">
                        {payment.gateway}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted font-mono text-xs">
                        {payment.gateway_payment_id || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                            pStyle.bg,
                            pStyle.text
                          )}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
