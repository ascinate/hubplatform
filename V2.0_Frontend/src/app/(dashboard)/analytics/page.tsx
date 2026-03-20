'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3,
  ShieldCheck,
  Gauge,
  AlertTriangle,
  CalendarDays,
  Filter,
  Eye,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import ProductionTrendChart from '@/components/analytics/ProductionTrendChart'
import DefectRateBars from '@/components/analytics/DefectRateBars'
import FactoryPerformanceMap from '@/components/analytics/FactoryPerformanceMap'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RecentActivity {
  id: string
  inspection_type: string
  inspection_date: string
  result: string
  defect_rate: number
  factory_name: string
}

interface AnalyticsSummary {
  total_orders: number
  completed_orders: number
  total_inspections: number
  failed_inspections: number
  avg_defect_rate: number
  active_factories: number
  recent_activity: RecentActivity[]
}

interface TrendPoint {
  month: string
  actual: number
  target: number
}

interface FactoryItem {
  id: string
  name: string
  location: string
  quality_score?: number
}

/* ------------------------------------------------------------------ */
/*  KPI card definitions                                               */
/* ------------------------------------------------------------------ */

const kpiCards = [
  {
    key: 'total_output',
    label: 'Total Output',
    icon: BarChart3,
    accent: 'border-l-primary',
    getValue: (s: AnalyticsSummary) => s.total_orders.toLocaleString('en-IN'),
  },
  {
    key: 'quality_rate',
    label: 'Quality Rate %',
    icon: ShieldCheck,
    accent: 'border-l-success',
    getValue: (s: AnalyticsSummary) => {
      if (!s.total_inspections) return '0.0%'
      const rate = ((s.total_inspections - s.failed_inspections) / s.total_inspections) * 100
      return `${rate.toFixed(1)}%`
    },
  },
  {
    key: 'efficiency',
    label: 'Efficiency Index',
    icon: Gauge,
    accent: 'border-l-info',
    getValue: (s: AnalyticsSummary) => {
      if (!s.total_orders) return '0.0%'
      const eff = (s.completed_orders / s.total_orders) * 100
      return `${eff.toFixed(1)}%`
    },
  },
  {
    key: 'anomalies',
    label: 'Active Anomalies',
    icon: AlertTriangle,
    accent: 'border-l-danger',
    getValue: (s: AnalyticsSummary) => s.failed_inspections.toString(),
  },
]

/* ------------------------------------------------------------------ */
/*  Anomaly type badge colors                                          */
/* ------------------------------------------------------------------ */

const anomalyBadge: Record<string, { bg: string; text: string }> = {
  fail: { bg: 'bg-danger-light', text: 'text-danger' },
  pass: { bg: 'bg-success-light', text: 'text-success' },
  pending: { bg: 'bg-warning-light', text: 'text-warning' },
  conditional: { bg: 'bg-info-light', text: 'text-info' },
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [factories, setFactories] = useState<FactoryItem[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAnalytics = async (from?: string, to?: string) => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (from) params.date_from = from
      if (to) params.date_to = to

      const [summaryRes, trendsRes, factoriesRes] = await Promise.all([
        api.get('/analytics/summary/', { params }),
        api.get('/analytics/trends/', { params }).catch(() => ({ data: [] })),
        api.get('/factories/', { params: { is_active: true } }),
      ])

      setSummary(summaryRes.data)

      const trendList = trendsRes.data?.results || trendsRes.data
      setTrends(Array.isArray(trendList) ? trendList : [])

      const factoryList = factoriesRes.data?.results || factoriesRes.data
      setFactories(Array.isArray(factoryList) ? factoryList : [])
    } catch {
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    loadAnalytics(dateFrom || undefined, dateTo || undefined)
  }

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary animate-spin" />
          <span className="text-sm text-text-muted">Loading analytics...</span>
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Derived data                                                     */
  /* ---------------------------------------------------------------- */

  const recentActivity = summary?.recent_activity ?? []

  const factoryPerformance = factories.map((f) => ({
    name: f.name,
    location: f.location,
    score: f.quality_score ?? Math.floor(Math.random() * 30 + 70),
  }))

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="h-full flex flex-col gap-4 lg:gap-6">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Performance Analytics</h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={15} className="text-text-muted hidden sm:block" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <span className="text-text-muted text-sm text-center">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {/*<button
            onClick={handleFilter}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Filter size={14} />
            Filter
          </button>*/}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.key}
            className={cn(
              'bg-white rounded-xl border border-border p-5 border-l-4 transition-shadow hover:shadow-card',
              card.accent
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <card.icon size={20} className="text-text-muted" />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {summary ? card.getValue(summary) : '—'}
            </p>
            <p className="text-xs text-text-muted mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:gap-6">
        {/* Row 1 — 3 charts */}
        <div className="min-h-0">
          <ProductionTrendChart className="h-full" data={trends.length > 0 ? trends : undefined} />
        </div>

        <div className="min-h-0">
          <DefectRateBars className="h-full" />
        </div>

        <div className="min-h-0">
          <FactoryPerformanceMap
            className="h-full"
            factories={factoryPerformance.length > 0 ? factoryPerformance : undefined}
          />
        </div>

        {/* Row 2 — Live Inspection Stream (full width) */}
        <div className="lg:col-span-3 min-h-0 bg-white rounded-xl border border-border flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-base font-semibold text-text-primary">
              Live Inspection Stream
            </h3>
            <span className="text-xs text-text-muted">
              {recentActivity.length} recent
            </span>
          </div>

          {/* Mobile card view */}
          <div className="lg:hidden p-4 space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-center text-sm text-text-muted py-8">No recent inspection activity found.</p>
            ) : (
              recentActivity.map((item) => {
                const badge = anomalyBadge[item.result] || { bg: 'bg-gray-100', text: 'text-gray-500' }
                return (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-info">INC-{item.id.toString().slice(0, 6).toUpperCase()}</span>
                      <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', badge.bg, badge.text)}>
                        {item.inspection_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">{item.factory_name || 'Unknown'} / {formatDate(item.inspection_date)}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm font-semibold', item.defect_rate > 5 ? 'text-danger' : item.defect_rate > 2 ? 'text-warning' : 'text-success')}>
                        Impact: {item.defect_rate.toFixed(1)}%
                      </span>
                      <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary-light rounded-lg hover:bg-primary/10 transition-colors">
                        <Eye size={13} />
                        Review
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                    Incident ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                    Line / Shift
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                    Anomaly Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                    Impact
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-text-muted">
                      No recent inspection activity found.
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((item) => {
                    const badge = anomalyBadge[item.result] || {
                      bg: 'bg-gray-100',
                      text: 'text-gray-500',
                    }
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-info">
                          INC-{item.id.toString().slice(0, 6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-muted">
                          {item.factory_name || 'Unknown'} / {formatDate(item.inspection_date)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                              badge.bg,
                              badge.text
                            )}
                          >
                            {item.inspection_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-sm font-semibold',
                              item.defect_rate > 5
                                ? 'text-danger'
                                : item.defect_rate > 2
                                  ? 'text-warning'
                                  : 'text-success'
                            )}
                          >
                            {item.defect_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary-light rounded-lg hover:bg-primary/10 transition-colors">
                            <Eye size={13} />
                            Review
                          </button>
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
    </div>
  )
}
