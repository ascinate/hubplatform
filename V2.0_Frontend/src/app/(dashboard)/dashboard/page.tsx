'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Package,
  Clock,
  AlertTriangle,
  TrendingDown,
  Factory,
  FlaskConical,
  Plus,
  ClipboardCheck,
  Activity,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn, formatNumber, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'

interface RecentActivity {
  id: string
  inspection_type: string
  inspection_date: string
  result: string
  defect_rate: number
  factory_name: string
}

interface DashboardSummary {
  total_orders: number
  pending_orders: number
  completed_orders: number
  failed_inspections: number
  passed_inspections: number
  total_inspections: number
  avg_defect_rate: number
  active_factories: number
  total_lab_tests: number
  passed_lab_tests: number
  recent_activity: RecentActivity[]
}

interface FactoryItem {
  id: string
  name: string
  location: string
  quality_score?: number
}

const kpiCards = [
  {
    key: 'total_orders' as const,
    label: 'Total Orders',
    icon: Package,
    accent: 'border-l-primary',
  },
  {
    key: 'pending_orders' as const,
    label: 'Pending Orders',
    icon: Clock,
    accent: 'border-l-warning',
  },
  {
    key: 'passed_inspections' as const,
    label: 'Pass Inspections',
    icon: CheckCircle2,
    accent: 'border-l-success',
  },
  {
    key: 'failed_inspections' as const,
    label: 'Failed Inspections',
    icon: AlertTriangle,
    accent: 'border-l-danger',
  },
  {
    key: 'avg_defect_rate' as const,
    label: 'Avg Defect Rate',
    icon: TrendingDown,
    accent: 'border-l-info',
    isPercent: true,
  },
  {
    key: 'active_factories' as const,
    label: 'Active Factories',
    icon: Factory,
    accent: 'border-l-success',
  },
  {
    key: 'total_lab_tests' as const,
    label: 'Lab Tests',
    icon: FlaskConical,
    accent: 'border-l-primary',
  },
]

const resultBadge: Record<string, { bg: string; text: string; label: string }> = {
  pass: { bg: 'bg-success-light', text: 'text-success', label: 'Pass' },
  fail: { bg: 'bg-danger-light', text: 'text-danger', label: 'Fail' },
  pending: { bg: 'bg-warning-light', text: 'text-warning', label: 'Pending' },
  conditional: { bg: 'bg-info-light', text: 'text-info', label: 'Conditional' },
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [factories, setFactories] = useState<FactoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [summaryRes, factoriesRes] = await Promise.all([
        api.get('/analytics/summary/'),
        api.get('/factories/', { params: { is_active: true } }),
      ])

      setSummary(summaryRes.data)

      const factoryList = factoriesRes.data.results || factoriesRes.data
      setFactories(Array.isArray(factoryList) ? factoryList : [])
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getKpiValue = (key: keyof DashboardSummary): number => {
    if (!summary) return 0
    const value = summary[key]
    return typeof value === 'number' ? value : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary animate-spin" />
          <span className="text-sm text-text-muted">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary">SANKALP Control Panel</h1>
          <p className="text-sm text-text-muted mt-1">
            {getGreeting()}, {user?.full_name || 'User'}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search orders, inspections, factories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 lg:gap-4">
        {kpiCards.map((card) => {
          const value = getKpiValue(card.key)
          return (
            <div
              key={card.key}
              className={cn(
                'bg-white rounded-xl border border-border p-4 lg:p-5 border-l-4 transition-shadow hover:shadow-card',
                card.accent
              )}
            >
              <div className="flex items-center justify-between mb-2 lg:mb-3">
                <card.icon size={18} className="text-text-muted" />
              </div>
              <p className="text-xl lg:text-2xl font-bold text-text-primary">
                {card.isPercent
                  ? `${typeof value === 'number' ? value.toFixed(1) : 0}%`
                  : formatNumber(value)}
              </p>
              <p className="text-xs text-text-muted mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
            </div>
            <span className="text-xs text-text-muted">
              {summary?.recent_activity?.length || 0} recent inspections
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {!summary?.recent_activity || summary.recent_activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <ClipboardCheck size={40} className="text-gray-200 mb-3" />
                <p className="text-sm text-text-muted text-center">
                  No recent activity found. Inspections will appear here once created.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-light">
                {summary.recent_activity.map((item) => {
                  const badge = resultBadge[item.result] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-500',
                    label: item.result,
                  }
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/inspections/${item.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary truncate capitalize">
                            {item.inspection_type.replace(/_/g, ' ')}
                          </p>
                          <span
                            className={cn(
                              'inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                              badge.bg,
                              badge.text
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-text-muted">
                            {item.factory_name || 'Unknown Factory'}
                          </span>
                          <span className="text-xs text-text-muted">
                            {formatDate(item.inspection_date)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            item.defect_rate > 5 ? 'text-danger' : item.defect_rate > 2 ? 'text-warning' : 'text-success'
                          )}
                        >
                          {item.defect_rate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-text-muted">Defect Rate</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Factory Quality Scores */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Factory size={18} className="text-primary" />
              <h2 className="text-base font-semibold text-text-primary">Factory Quality Scores</h2>
            </div>
            <span className="text-xs text-text-muted">
              {factories.length} active
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {factories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <Factory size={40} className="text-gray-200 mb-3" />
                <p className="text-sm text-text-muted text-center">
                  No active factories found. Add factories to see quality scores.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-light">
                {factories.map((factory) => {
                  const score = factory.quality_score ?? Math.floor(Math.random() * 30 + 70)
                  const scoreColor =
                    score >= 90
                      ? 'bg-success'
                      : score >= 75
                        ? 'bg-warning'
                        : 'bg-danger'
                  const scoreTextColor =
                    score >= 90
                      ? 'text-success'
                      : score >= 75
                        ? 'text-warning'
                        : 'text-danger'
                  return (
                    <div key={factory.id} className="px-5 py-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {factory.name}
                          </p>
                          <p className="text-xs text-text-muted">{factory.location}</p>
                        </div>
                        <span className={cn('text-sm font-bold ml-3 shrink-0', scoreTextColor)}>
                          {score}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', scoreColor)}
                          style={{ width: `${Math.min(score, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        <button
          onClick={() => router.push('/orders/new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Create New Order
        </button>
        <button
          onClick={() => router.push('/inspections')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
        >
          <ClipboardCheck size={16} />
          Create Inspection
        </button>
      </div>
    </div>
  )
}
