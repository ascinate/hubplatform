'use client'

import { useEffect, useState } from 'react'
import { Shield, Plus, X } from 'lucide-react'
import api from '@/lib/api'

interface Agent {
  id: string
  agent: { id: string; email: string; full_name: string }
  agent_type: string
  agent_type_display: string
  client_ids: string[]
  allowed_actions: string[]
  is_active: boolean
  notes: string
  assigned_by: string | null
  created_at: string
}

interface ClientOption {
  id: string
  name: string
}

const GOLD = '#C9A96E'

export default function ConsoleAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    agent_id: '',
    agent_type: 'client_success',
    client_ids: [] as string[],
    allowed_actions: [] as string[],
    notes: '',
  })

  const fetchAgents = () => {
    api.get('/founder/agents/')
      .then((res) => setAgents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAgents()
    api.get('/founder/clients/').then((res) => {
      setClients(res.data.map((c: any) => ({ id: c.id, name: c.name })))
    }).catch(() => {})
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/founder/agents/', form)
      setShowForm(false)
      setForm({ agent_id: '', agent_type: 'client_success', client_ids: [], allowed_actions: [], notes: '' })
      fetchAgents()
    } catch { }
  }

  const handleRevoke = async (assignmentId: string) => {
    try {
      await api.post(`/founder/agents/${assignmentId}/revoke/`)
      fetchAgents()
    } catch { }
  }

  const toggleClientId = (id: string) => {
    setForm((prev) => ({
      ...prev,
      client_ids: prev.client_ids.includes(id)
        ? prev.client_ids.filter((c) => c !== id)
        : [...prev.client_ids, id],
    }))
  }

  const ACTIONS = ['view_reports', 'add_users', 'handle_tickets', 'manage_inspections', 'view_analytics']

  const toggleAction = (action: string) => {
    setForm((prev) => ({
      ...prev,
      allowed_actions: prev.allowed_actions.includes(action)
        ? prev.allowed_actions.filter((a) => a !== action)
        : [...prev.allowed_actions, action],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={24} style={{ color: GOLD }} />
          <h1 className="text-xl font-bold text-white">Sub-Agents</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ background: GOLD }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Assignment'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Agent User ID (must have sub_agent role)</label>
            <input
              type="text"
              value={form.agent_id}
              onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
              placeholder="UUID of the sub_agent user"
              required
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 border border-white/10 bg-white/5 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Agent Type</label>
            <select
              value={form.agent_type}
              onChange={(e) => setForm({ ...form, agent_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border border-white/10 bg-white/5"
            >
              <option value="client_success">Client Success</option>
              <option value="qa_supervisor">QA Supervisor</option>
              <option value="technical">Technical Support</option>
              <option value="billing">Billing Support</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Assigned Clients</label>
            <div className="flex flex-wrap gap-2">
              {clients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleClientId(c.id)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    form.client_ids.includes(c.id)
                      ? 'border-amber-500 text-amber-300 bg-amber-500/20'
                      : 'border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Allowed Actions</label>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => toggleAction(action)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    form.allowed_actions.includes(action)
                      ? 'border-amber-500 text-amber-300 bg-amber-500/20'
                      : 'border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {action.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 border border-white/10 bg-white/5 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>
          <button type="submit" className="px-6 py-2 rounded-lg text-sm font-medium text-white" style={{ background: GOLD }}>
            Create Assignment
          </button>
        </form>
      )}

      {/* Agent List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="space-y-3">
          {agents.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-10">No sub-agent assignments yet.</p>
          )}
          {agents.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border p-4"
              style={{
                background: a.is_active ? 'rgba(255,255,255,0.02)' : 'rgba(255,0,0,0.02)',
                borderColor: a.is_active ? 'rgba(255,255,255,0.08)' : 'rgba(255,0,0,0.1)',
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{a.agent.full_name || a.agent.email}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                      {a.agent_type_display}
                    </span>
                    {!a.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">Revoked</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{a.agent.email}</div>
                  {a.notes && <div className="text-xs text-slate-400 mt-1">{a.notes}</div>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.allowed_actions.map((action) => (
                      <span key={action} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400">
                        {String(action).replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                {a.is_active && (
                  <button
                    onClick={() => handleRevoke(a.id)}
                    className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
