'use client'

import { useEffect, useState } from 'react'
import { Building2, Search, UserX, UserCheck, Eye } from 'lucide-react'
import api from '@/lib/api'
import { useImpersonation } from '@/lib/useImpersonation'

interface Client {
  id: string
  name: string
  slug: string
  plan: string
  is_active: boolean
  is_trial_locked: boolean
  member_count: number
  trial_days_remaining: number | null
  created_at: string
}

const GOLD = '#C9A96E'

export default function ConsoleClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')

  const fetchClients = () => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (planFilter) params.plan = planFilter
    api.get('/founder/clients/', { params })
      .then((res) => setClients(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchClients()
  }, [planFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    fetchClients()
  }

  const planColors: Record<string, string> = {
    free: 'bg-slate-500/20 text-slate-300',
    starter: 'bg-blue-500/20 text-blue-300',
    professional: 'bg-purple-500/20 text-purple-300',
    enterprise: 'bg-amber-500/20 text-amber-300',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 size={24} style={{ color: GOLD }} />
        <h1 className="text-xl font-bold text-white">Clients (Organizations)</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder-slate-500 border border-white/10 bg-white/5 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: GOLD }}>
            Search
          </button>
        </form>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm text-white border border-white/10 bg-white/5"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/5">
                <th className="p-3 font-medium">Organization</th>
                <th className="p-3 font-medium">Plan</th>
                <th className="p-3 font-medium">Members</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Trial</th>
                <th className="p-3 font-medium">Created</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-white">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.slug}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${planColors[c.plan] || ''}`}>
                      {c.plan}
                    </span>
                  </td>
                  <td className="p-3">{c.member_count}</td>
                  <td className="p-3">
                    {c.is_active ? (
                      <span className="text-xs text-green-400">Active</span>
                    ) : (
                      <span className="text-xs text-red-400">Inactive</span>
                    )}
                    {c.is_trial_locked && (
                      <span className="text-xs text-amber-400 ml-1">(Locked)</span>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    {c.trial_days_remaining !== null
                      ? `${Math.round(c.trial_days_remaining)}d left`
                      : '—'}
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <SuspendClientButton client={c} onDone={fetchClients} />
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SuspendClientButton({ client, onDone }: { client: Client; onDone: () => void }) {
  // Clients are suspended via org admin panel for now — placeholder
  return (
    <span className="text-xs text-slate-600">—</span>
  )
}
