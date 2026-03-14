'use client'

import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Plan {
  slug: string
  name: string
  description: string
  price_inr: number
  price_usd: number
  interval: string
  max_users: number
  features: string[]
  is_highlighted?: boolean
}

interface PlanCardProps {
  plan: Plan
  isCurrentPlan: boolean
  isPopular: boolean
  onUpgrade: (slug: string) => void
  upgrading: boolean
}

export default function PlanCard({
  plan,
  isCurrentPlan,
  isPopular,
  onUpgrade,
  upgrading,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border p-6 transition-shadow hover:shadow-card',
        isPopular ? 'border-2 border-primary' : 'border-border'
      )}
    >
      {/* Popular badge */}
      {isPopular && (
        <span className="absolute -top-3 right-4 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wide">
          Most Popular
        </span>
      )}

      {/* Plan name & description */}
      <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
      <p className="text-sm text-text-muted mt-1 leading-relaxed">{plan.description}</p>

      {/* Price */}
      <div className="mt-5 mb-1">
        <span className="text-3xl font-bold text-text-primary">
          &#8377;{plan.price_inr.toLocaleString('en-IN')}
        </span>
        <span className="text-sm text-text-muted ml-1">/ {plan.interval}</span>
      </div>
      <p className="text-xs text-text-muted">
        ~${plan.price_usd.toLocaleString('en-US')} USD equivalent
      </p>

      {/* Max users */}
      <p className="text-xs text-text-muted mt-2">
        Up to <span className="font-semibold text-text-primary">{plan.max_users}</span> users
      </p>

      {/* Features */}
      <ul className="mt-5 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check size={16} className="text-success shrink-0 mt-0.5" />
            <span className="text-sm text-text-primary">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action */}
      <div className="mt-6">
        {isCurrentPlan ? (
          <div className="w-full py-2.5 text-center text-sm font-medium text-text-muted bg-gray-100 rounded-lg">
            Current Plan
          </div>
        ) : (
          <button
            onClick={() => onUpgrade(plan.slug)}
            disabled={upgrading}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-60',
              isPopular
                ? 'bg-primary hover:bg-primary-hover text-white'
                : 'border border-primary text-primary hover:bg-primary-light'
            )}
          >
            {upgrading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </>
            ) : (
              `Upgrade to ${plan.name}`
            )}
          </button>
        )}
      </div>
    </div>
  )
}
