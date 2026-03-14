'use client'

import { useEffect, useState } from 'react'
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/api'

interface AuditEntry {
  id: string
  actor: string
  action: string
  action_display: string
  target_user: string | null
  target_client_id: string | null
  target_client_name: string
  notes: string
  ip_address: string | null
  session_duration_seconds: number | null
  timestamp: string
}

const GOLD = '#C9A96E'

const actionColors: Record<string, string> = {
  impersonate_start: 'bg-blue-500/20 text-blue-300',
  impersonate_end: 'bg-blue-500/10 text-blue-400',
  suspend_user: 'bg-red-500/20 text-red-300',
  unsuspend_user: 'bg-green-500/20 text-green-300',
  suspend_client: 'bg-red-500/20 text-red-300',
  unsuspend_client: 'bg-green-500/20 text-green-300',
  create_agent: 'bg-purple-500/20 text-purple-300',
  revoke_agent: 'bg-orange-500/20 text-orange-300',
  update_agent: 'bg-yellow-500/20 text-yellow-300',
  console_login: 'bg-cyan-500/20 text-cyan-300',
  config_change: 'bg-pink-500/20 text-pink-300',
}

export default function ConsoleAudit() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState('')
  const pageSize = 50

  const fetchAudit = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, page_size: pageSize }
    if (actionFilter) params.action = actionFilter
    api.get('/founder/audit/', { params })
      .then((res) => {
        setEntries(res.data.results)
        setTotal(res.data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAudit()
  }, [page, actionFilter])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText size={24} style={{ color: GOLD }} />
        <h1 className="text-xl font-bold text-white">Audit Log</h1>
        <span className="text-xs text-slate-500">({total} entries)</span>
      </div>

      {/* Filter */}
      <select
        value={actionFilter}
        onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
        className="px-3 py-2 rounded-lg text-sm text-white border border-white/10 bg-white/5"
      >
        <option value="">All Actions</option>
        <option value="impersonate_start">Impersonate Start</option>
        <option value="impersonate_end">Impersonate End</option>
        <option value="suspend_user">Suspend User</option>
        <option value="unsuspend_user">Unsuspend User</option>
        <option value="create_agent">Create Agent</option>
        <option value="revoke_agent">Revoke Agent</option>
      </select>

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
                <th className="p-3 font-medium">Timestamp</th>
                <th className="p-3 font-medium">Actor</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium">Target User</th>
                <th className="p-3 font-medium">Client</th>
                <th className="p-3 font-medium">IP</th>
                <th className="p-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 text-xs">{e.actor}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColors[e.action] || 'bg-slate-500/20 text-slate-300'}`}>
                      {e.action_display}
                    </span>
                  </td>
                  <td className="p-3 text-xs">{e.target_user || '—'}</td>
                  <td className="p-3 text-xs">{e.target_client_name || '—'}</td>
                  <td className="p-3 text-xs text-slate-500">{e.ip_address || '—'}</td>
                  <td className="p-3 text-xs text-slate-500 max-w-[200px] truncate">{e.notes || '—'}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">No audit entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded hover:bg-white/5 text-slate-400 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded hover:bg-white/5 text-slate-400 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
