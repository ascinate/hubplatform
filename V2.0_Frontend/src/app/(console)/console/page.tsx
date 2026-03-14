'use client'

import { useEffect, useState } from 'react'
import {
  Building2, Users, Package, Factory, FileSearch, DollarSign,
  Crown, Activity,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

interface DashboardData {
  total_orgs: number
  total_users: number
  total_orders: number
  total_factories: number
  total_inspections: number
  total_revenue: number
  plan_distribution: Record<string, number>
  recent_actions: Array<{
    id: string
    actor: string
    action: string
    action_display: string
    target_user: string | null
    target_client_name: string
    notes: string
    timestamp: string
  }>
}

const GOLD = '#C9A96E'

export default function ConsoleDashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/founder/dashboard/')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!data) {
    return <div className="text-red-400 text-center py-10">Failed to load dashboard data.</div>
  }

  const kpis = [
    { label: 'Organizations', value: data.total_orgs, icon: Building2 },
    { label: 'Total Users', value: data.total_users, icon: Users },
    { label: 'Orders', value: data.total_orders, icon: Package },
    { label: 'Factories', value: data.total_factories, icon: Factory },
    { label: 'Inspections', value: data.total_inspections, icon: FileSearch },
    { label: 'Revenue', value: `$${data.total_revenue.toLocaleString()}`, icon: DollarSign },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Crown size={28} style={{ color: GOLD }} />
        <div>
          <h1 className="text-xl font-bold text-white">Founder Console</h1>
          <p className="text-slate-400 text-sm">Welcome back, {user?.full_name || user?.email}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-4 border"
            style={{ background: 'rgba(201, 169, 110, 0.05)', borderColor: 'rgba(201, 169, 110, 0.15)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={16} style={{ color: GOLD }} />
              <span className="text-xs text-slate-400">{kpi.label}</span>
            </div>
            <div className="text-xl font-bold text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Plan Distribution */}
      <div className="rounded-xl border p-5" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <h2 className="text-sm font-semibold text-white mb-3">Plan Distribution</h2>
        <div className="flex gap-4 flex-wrap">
          {Object.entries(data.plan_distribution).map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 capitalize">{plan}:</span>
              <span className="text-sm font-bold" style={{ color: GOLD }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Actions */}
      <div className="rounded-xl border p-5" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} style={{ color: GOLD }} />
          <h2 className="text-sm font-semibold text-white">Recent Actions</h2>
        </div>
        {data.recent_actions.length === 0 ? (
          <p className="text-slate-500 text-sm">No actions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/5">
                  <th className="pb-2 pr-4 font-medium">Time</th>
                  <th className="pb-2 pr-4 font-medium">Actor</th>
                  <th className="pb-2 pr-4 font-medium">Action</th>
                  <th className="pb-2 pr-4 font-medium">Target</th>
                  <th className="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {data.recent_actions.map((log) => (
                  <tr key={log.id} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-xs">{log.actor}</td>
                    <td className="py-2 pr-4">
                      <ActionBadge action={log.action} label={log.action_display} />
                    </td>
                    <td className="py-2 pr-4 text-xs">
                      {log.target_user || log.target_client_name || '—'}
                    </td>
                    <td className="py-2 text-xs text-slate-500 max-w-[200px] truncate">{log.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionBadge({ action, label }: { action: string; label: string }) {
  const colors: Record<string, string> = {
    impersonate_start: 'bg-blue-500/20 text-blue-300',
    impersonate_end: 'bg-blue-500/10 text-blue-400',
    suspend_user: 'bg-red-500/20 text-red-300',
    unsuspend_user: 'bg-green-500/20 text-green-300',
    suspend_client: 'bg-red-500/20 text-red-300',
    unsuspend_client: 'bg-green-500/20 text-green-300',
    create_agent: 'bg-purple-500/20 text-purple-300',
    revoke_agent: 'bg-orange-500/20 text-orange-300',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[action] || 'bg-slate-500/20 text-slate-300'}`}>
      {label}
    </span>
  )
}
