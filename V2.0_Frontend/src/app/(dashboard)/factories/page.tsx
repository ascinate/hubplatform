'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Search,
  Plus,
  MapPin,
  User,
  Mail,
  Phone,
  Factory,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Globe,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn, getInitials } from '@/lib/utils'
import FactoryModal from '@/components/factories/FactoryModal'
import DeleteConfirmModal from '@/components/factories/DeleteConfirmModal'

interface Factory {
  id: string
  name: string
  location: string
  city: string
  country: string
  certifications: string
  audit_compliance: string
  last_audit_date: string
  production_capacity: number | null
  total_manpower: number | null
  infrastructure: string
  contact_person: string
  contact_email: string
  contact_phone: string
  is_active: boolean
}

const avatarColors = [
  'bg-primary/10 text-primary',
  'bg-success/10 text-success',
  'bg-warning/10 text-warning',
  'bg-info/10 text-info',
  'bg-danger/10 text-danger',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-teal-100 text-teal-600',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

export default function FactoriesPage() {
  const [factories, setFactories] = useState<Factory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editFactory, setEditFactory] = useState<Factory | null>(null)
  const [deleteFactory, setDeleteFactory] = useState<Factory | null>(null)

  useEffect(() => {
    loadFactories()
  }, [])

  const loadFactories = async () => {
    try {
      const { data } = await api.get('/factories/')
      setFactories(data.results || data)
    } catch {
      toast.error('Failed to load factories')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (factory: Factory) => {
    try {
      await api.patch(`/factories/${factory.id}/`, { is_active: !factory.is_active })
      toast.success(`${factory.name} ${factory.is_active ? 'deactivated' : 'activated'}`)
      loadFactories()
    } catch {
      toast.error('Failed to update factory status')
    }
  }

  const filteredFactories = useMemo(() => {
    let result = factories

    // Filter by search text
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.city || '').toLowerCase().includes(q) ||
          (f.country || '').toLowerCase().includes(q) ||
          (f.location || '').toLowerCase().includes(q) ||
          (f.contact_person || '').toLowerCase().includes(q) ||
          (f.contact_email || '').toLowerCase().includes(q)
      )
    }

    // Filter by status
    if (statusFilter === 'active') {
      result = result.filter((f) => f.is_active)
    } else if (statusFilter === 'inactive') {
      result = result.filter((f) => !f.is_active)
    }

    return result
  }, [factories, search, statusFilter])

  const stats = useMemo(() => {
    const total = factories.length
    const active = factories.filter((f) => f.is_active).length
    const inactive = factories.filter((f) => !f.is_active).length
    const countries = new Set(
      factories
        .map((f) => f.country || (f.location ? f.location.split(',').pop()?.trim() : ''))
        .filter(Boolean)
    ).size

    return { total, active, inactive, countries }
  }, [factories])

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Factory Management</h1>
        <button
          onClick={() => {
            setEditFactory(null)
            setModalOpen(true)
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Factory
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Factory size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
              <p className="text-xs text-text-muted">Total Factories</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ToggleRight size={20} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
              <p className="text-xs text-text-muted">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <ToggleLeft size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.inactive}</p>
              <p className="text-xs text-text-muted">Inactive</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Globe size={20} className="text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.countries}</p>
              <p className="text-xs text-text-muted">Countries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search factories by name, location, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="w-full sm:w-auto relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white appearance-none pr-10"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>
      </div>

      {/* Factory Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-text-muted">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading factories...
          </div>
        </div>
      ) : filteredFactories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Factory size={48} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">No factories found</p>
          <p className="text-xs mt-1">
            {factories.length === 0
              ? 'Add your first factory to get started.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFactories.map((factory) => (
            <div
              key={factory.id}
              className="bg-white rounded-xl border border-border p-5 hover:shadow-card transition-shadow"
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
                      getAvatarColor(factory.name)
                    )}
                  >
                    {getInitials(factory.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary text-sm">{factory.name}</h3>
                    {(factory.city || factory.country || factory.location) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-text-muted" />
                        <span className="text-xs text-text-muted">
                          {factory.city && factory.country
                            ? `${factory.city}, ${factory.country}`
                            : factory.city || factory.country || factory.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                    factory.is_active
                      ? 'bg-success/10 text-success'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {factory.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Contact info */}
              {(factory.contact_person || factory.contact_email || factory.contact_phone) && (
                <div className="space-y-1.5 mb-4 pt-3 border-t border-border-light">
                  {factory.contact_person && (
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-text-muted" />
                      <span className="text-xs text-text-muted">{factory.contact_person}</span>
                    </div>
                  )}
                  {factory.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-text-muted" />
                      <span className="text-xs text-text-muted">{factory.contact_email}</span>
                    </div>
                  )}
                  {factory.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-text-muted" />
                      <span className="text-xs text-text-muted">{factory.contact_phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Additional info */}
              {(factory.certifications || factory.audit_compliance || factory.production_capacity != null || factory.total_manpower != null || factory.infrastructure) && (
                <div className="space-y-1.5 mb-4 pt-3 border-t border-border-light">
                  {factory.certifications && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-text-muted font-medium w-20 shrink-0">Certs:</span>
                      <span className="text-xs text-text-muted">{factory.certifications}</span>
                    </div>
                  )}
                  {factory.audit_compliance && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted font-medium w-20 shrink-0">Audit:</span>
                      <span className={`text-xs font-medium ${factory.audit_compliance === 'compliant' ? 'text-success' : factory.audit_compliance === 'non_compliant' ? 'text-danger' : 'text-warning'}`}>
                        {factory.audit_compliance === 'non_compliant' ? 'Non-Compliant' : factory.audit_compliance.charAt(0).toUpperCase() + factory.audit_compliance.slice(1)}
                      </span>
                    </div>
                  )}
                  {factory.production_capacity != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted font-medium w-20 shrink-0">Capacity:</span>
                      <span className="text-xs text-text-muted">{factory.production_capacity.toLocaleString()} units/mo</span>
                    </div>
                  )}
                  {factory.total_manpower != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted font-medium w-20 shrink-0">Manpower:</span>
                      <span className="text-xs text-text-muted">{factory.total_manpower.toLocaleString()} people</span>
                    </div>
                  )}
                  {factory.infrastructure && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-text-muted font-medium w-20 shrink-0">Infra:</span>
                      <span className="text-xs text-text-muted">{factory.infrastructure}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions row */}
              <div className="flex items-center gap-2 pt-3 border-t border-border-light">
                <button
                  onClick={() => {
                    setEditFactory(factory)
                    setModalOpen(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Edit3 size={13} />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(factory)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                    factory.is_active
                      ? 'text-warning hover:bg-warning/5'
                      : 'text-success hover:bg-success/5'
                  )}
                >
                  {factory.is_active ? (
                    <>
                      <ToggleLeft size={13} />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight size={13} />
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={() => setDeleteFactory(factory)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/5 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <FactoryModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setEditFactory(null)
          }}
          factory={editFactory}
          onSaved={() => {
            setModalOpen(false)
            setEditFactory(null)
            loadFactories()
          }}
        />
      )}

      {deleteFactory && (
        <DeleteConfirmModal
          open={!!deleteFactory}
          onClose={() => setDeleteFactory(null)}
          factory={deleteFactory}
          onDeleted={() => {
            setDeleteFactory(null)
            loadFactories()
          }}
        />
      )}
    </div>
  )
}
