'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Building2, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Users } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useConfirm } from '@/hooks/useConfirm'

interface Department {
  id: string
  name: string
  code: string
  head_user: string | null
  head_user_name: string
  head_user_email: string
  member_count: number
  created_at: string
}

interface OrgUser {
  id: string
  full_name: string
  email: string
}

export default function DepartmentManager() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(true)
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', head_user: '' })
  const { confirm, modalProps } = useConfirm()

  useEffect(() => {
    fetchDepartments()
    fetchUsers()
  }, [])

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments/')
      setDepartments(res.data.results || res.data)
    } catch {
      toast.error('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users/')
      setOrgUsers(res.data.results || res.data)
    } catch {
      // silently fail
    }
  }

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast.error('Name and code are required')
      return
    }
    try {
      if (editingId) {
        await api.patch(`/departments/${editingId}/`, form)
        toast.success('Department updated')
      } else {
        await api.post('/departments/', form)
        toast.success('Department created')
      }
      setForm({ name: '', code: '', head_user: '' })
      setEditingId(null)
      setShowAdd(false)
      fetchDepartments()
    } catch {
      toast.error('Failed to save department')
    }
  }

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id)
    setForm({ name: dept.name, code: dept.code, head_user: dept.head_user || '' })
    setShowAdd(true)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Department',
      message: 'Are you sure you want to delete this department? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/departments/${id}/`)
      toast.success('Department deleted')
      fetchDepartments()
    } catch {
      toast.error('Failed to delete department')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-primary" />
          <span className="font-semibold text-text-primary">Departments</span>
          <span className="text-xs text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">
            {departments.length}
          </span>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-3">
          {loading ? (
            <p className="text-sm text-text-muted">Loading...</p>
          ) : (
            <>
              {/* Department list */}
              <div className="space-y-2">
                {departments.map(dept => (
                  <div key={dept.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono bg-white border border-border px-2 py-1 rounded flex-shrink-0">
                        {dept.code}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{dept.name}</p>
                        {dept.head_user_name && (
                          <p className="text-xs text-text-muted truncate">Head: {dept.head_user_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Users size={12} /> {dept.member_count}
                      </span>
                      <button onClick={() => handleEdit(dept)} className="p-1.5 hover:bg-white rounded">
                        <Pencil size={14} className="text-text-muted" />
                      </button>
                      <button onClick={() => handleDelete(dept.id)} className="p-1.5 hover:bg-white rounded">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add/Edit form */}
              {showAdd ? (
                <div className="p-3 border border-dashed border-primary/30 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      placeholder="Department Name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="px-3 py-2 border border-border rounded-lg text-sm"
                    />
                    <input
                      placeholder="Code (e.g. QUALITY)"
                      value={form.code}
                      onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                      className="px-3 py-2 border border-border rounded-lg text-sm font-mono"
                    />
                    <select
                      value={form.head_user}
                      onChange={e => setForm(f => ({ ...f, head_user: e.target.value }))}
                      className="px-3 py-2 border border-border rounded-lg text-sm"
                    >
                      <option value="">No Head User</option>
                      {orgUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                    >
                      {editingId ? 'Update' : 'Add'}
                    </button>
                    <button
                      onClick={() => { setShowAdd(false); setEditingId(null); setForm({ name: '', code: '', head_user: '' }) }}
                      className="px-4 py-1.5 text-sm text-text-muted hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
                >
                  <Plus size={14} /> Add Department
                </button>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmModal {...modalProps} />
    </div>
  )
}
