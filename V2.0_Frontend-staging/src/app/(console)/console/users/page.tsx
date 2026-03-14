'use client'

import { useEffect, useState } from 'react'
import { Users, Search, UserX, UserCheck, Eye } from 'lucide-react'
import api from '@/lib/api'
import { useImpersonation } from '@/lib/useImpersonation'

interface UserRow {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  organization: { id: string; name: string } | null
  last_login_at: string | null
  created_at: string
}

const GOLD = '#C9A96E'

export default function ConsoleUsers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const { startImpersonation } = useImpersonation()

  const fetchUsers = () => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (roleFilter) params.role = roleFilter
    setLoading(true)
    api.get('/founder/users/', { params })
      .then((res) => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleSuspend = async (userId: string) => {
    try {
      await api.post(`/founder/suspend/${userId}/`)
      fetchUsers()
    } catch { }
  }

  const handleImpersonate = async (userId: string) => {
    try {
      await startImpersonation(userId)
    } catch { }
  }

  const roleColors: Record<string, string> = {
    super_owner: 'bg-amber-500/20 text-amber-300',
    sub_agent: 'bg-purple-500/20 text-purple-300',
    admin: 'bg-red-500/20 text-red-300',
    org_admin: 'bg-blue-500/20 text-blue-300',
    user: 'bg-slate-500/20 text-slate-300',
    brand: 'bg-green-500/20 text-green-300',
    factory: 'bg-orange-500/20 text-orange-300',
    third_party: 'bg-cyan-500/20 text-cyan-300',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users size={24} style={{ color: GOLD }} />
        <h1 className="text-xl font-bold text-white">All Users</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search email or name..."
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
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm text-white border border-white/10 bg-white/5"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="org_admin">Org Admin</option>
          <option value="user">User</option>
          <option value="brand">Brand</option>
          <option value="factory">Factory</option>
          <option value="third_party">3rd Party</option>
          <option value="sub_agent">Sub Agent</option>
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
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Organization</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Last Login</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {users.map((u) => {
                const canImpersonate = !['super_owner', 'sub_agent'].includes(u.role)
                return (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-white">{u.full_name || '—'}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role] || ''}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{u.organization?.name || '—'}</td>
                    <td className="p-3">
                      {u.is_active ? (
                        <span className="text-xs text-green-400">Active</span>
                      ) : (
                        <span className="text-xs text-red-400">Suspended</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {canImpersonate && (
                          <button
                            onClick={() => handleImpersonate(u.id)}
                            className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="Impersonate"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {u.role !== 'super_owner' && (
                          <button
                            onClick={() => handleSuspend(u.id)}
                            className={`p-1.5 rounded transition-colors ${
                              u.is_active
                                ? 'hover:bg-red-500/20 text-red-400'
                                : 'hover:bg-green-500/20 text-green-400'
                            }`}
                            title={u.is_active ? 'Suspend' : 'Unsuspend'}
                          >
                            {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
