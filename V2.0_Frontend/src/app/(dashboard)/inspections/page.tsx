'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  Filter,
  FileSearch,
  Eye,
  Copy,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import NewInspectionModal from '@/components/inspections/NewInspectionModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useConfirm } from '@/hooks/useConfirm'

interface Inspection {
  id: string
  inspection_no?: string
  inspection_type: string
  inspection_type_display?: string
  factory_name?: string
  status: string
  status_display?: string
  result: string
  result_display?: string
  auditor_name: string
  inspection_date: string
  defect_rate: number
  quantity_inspected: number
  defects_found: number
  template_name?: string
  template_code?: string
}

const summaryCards = [
  { key: 'all', label: 'All Inspections', bg: 'bg-gradient-to-r from-gray-50 to-gray-100' },
  { key: 'active', label: 'Active', bg: 'bg-gradient-to-r from-blue-50 to-blue-100' },
  { key: 'submitted', label: 'Submitted', bg: 'bg-gradient-to-r from-teal-50 to-teal-100' },
  { key: 'approved', label: 'Approved', bg: 'bg-gradient-to-r from-green-50 to-green-100' },
]

const statusDot: Record<string, string> = {
  draft: 'bg-gray-400',
  scheduled: 'bg-blue-500',
  confirmed: 'bg-indigo-500',
  in_progress: 'bg-amber-500',
  report_pending: 'bg-orange-500',
  submitted: 'bg-teal-500',
  approved: 'bg-green-500',
  cancelled: 'bg-red-500',
}

const statusText: Record<string, string> = {
  draft: 'text-gray-600',
  scheduled: 'text-blue-700',
  confirmed: 'text-indigo-700',
  in_progress: 'text-amber-700',
  report_pending: 'text-orange-700',
  submitted: 'text-teal-700',
  approved: 'text-green-700',
  cancelled: 'text-red-700',
}

export default function InspectionsPage() {
  const router = useRouter()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [counts, setCounts] = useState({ all: 0, active: 0, submitted: 0, approved: 0 })
  const [showNewModal, setShowNewModal] = useState(false)
  const { confirm, modalProps } = useConfirm()

  useEffect(() => {
    loadInspections()
  }, [])

  const loadInspections = async () => {
    try {
      const { data } = await api.get('/inspections/', { params: { ordering: '-inspection_date' } })
      const list = data.results || data
      setInspections(list)
      setCounts({
        all: list.length,
        active: list.filter((i: Inspection) => !['approved', 'cancelled'].includes(i.status)).length,
        submitted: list.filter((i: Inspection) => i.status === 'submitted').length,
        approved: list.filter((i: Inspection) => i.status === 'approved').length,
      })
    } catch {
      toast.error('Failed to load inspections')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInspection = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Inspection',
      message: 'Are you sure you want to delete this inspection? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/inspections/${id}/`)
      toast.success('Inspection deleted')
      loadInspections()
    } catch {
      toast.error('Failed to delete inspection')
    }
  }

  const handleCopyInspection = async (id: string) => {
    try {
      const { data: original } = await api.get(`/inspections/${id}/`)
      await api.post('/inspections/', {
        factory: original.factory,
        inspection_type: original.inspection_type,
        template: original.template || null,
        inspection_date: new Date().toISOString().split('T')[0],
        auditor_name: original.auditor_name,
        status: 'draft',
        result: 'pending',
      })
      toast.success('Inspection duplicated')
      loadInspections()
    } catch {
      toast.error('Failed to duplicate inspection')
    }
  }

  const filtered = inspections.filter((i) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (i.inspection_no || '').toLowerCase().includes(q) ||
      (i.factory_name || '').toLowerCase().includes(q) ||
      (i.auditor_name || '').toLowerCase().includes(q) ||
      (i.template_code || '').toLowerCase().includes(q) ||
      (i.template_name || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-text-primary">My Quality</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          New Inspection
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {summaryCards.map((card) => (
          <div key={card.key} className={cn('rounded-xl border border-border p-4 lg:p-5', card.bg)}>
            <p className="text-2xl lg:text-3xl font-bold text-text-primary">
              {counts[card.key as keyof typeof counts]}
            </p>
            <p className="text-xs lg:text-sm text-text-muted mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by Inspection No., Factory, Inspector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm text-text-muted hover:bg-gray-50">
          <Filter size={14} />
          Filter
        </button>
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-muted">
            <FileSearch size={36} className="mx-auto text-text-light mb-3" />
            <p className="text-sm">No inspections yet. Create your first inspection.</p>
          </div>
        ) : (
          filtered.map((insp) => (
            <div
              key={insp.id}
              onClick={() => router.push(`/inspections/${insp.id}`)}
              className="bg-white rounded-xl border border-border p-4 shadow-sm active:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-info">
                    {insp.inspection_no || `INS-${insp.id.slice(0, 6)}`}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 capitalize">
                    {insp.inspection_type_display || insp.inspection_type.replace('_', ' ')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <div className={cn('w-2 h-2 rounded-full', statusDot[insp.status] || 'bg-gray-300')} />
                  <span className={cn('text-xs font-medium', statusText[insp.status] || 'text-gray-500')}>
                    {insp.status_display || insp.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-[10px] text-text-light uppercase">Factory</p>
                  <p className="text-sm font-medium text-text-primary truncate">{insp.factory_name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-light uppercase">Date</p>
                  <p className="text-sm font-medium text-text-primary">{formatDate(insp.inspection_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-light uppercase">Inspector</p>
                  <p className="text-sm font-medium text-text-primary truncate">{insp.auditor_name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-light uppercase">Result</p>
                  {insp.result && insp.result !== 'pending' ? (
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      insp.result === 'pass' ? 'bg-green-50 text-green-700' :
                      insp.result === 'fail' ? 'bg-red-50 text-red-700' :
                      'bg-blue-50 text-blue-700'
                    )}>
                      {insp.result_display || insp.result.replace('_', ' ')}
                    </span>
                  ) : (
                    <p className="text-sm text-text-light">Pending</p>
                  )}
                </div>
              </div>
              {insp.template_code && (
                <div className="mb-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                    {insp.template_code}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-3 border-t border-border-light">
                <button onClick={(e) => { e.stopPropagation(); router.push(`/inspections/${insp.id}`) }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs text-text-muted transition-colors">
                  <Eye size={14} /> View
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleCopyInspection(insp.id) }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs text-text-muted transition-colors">
                  <Copy size={14} /> Copy
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteInspection(insp.id) }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-xs text-danger transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Inspection No.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Template</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Factory</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Inspector</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Result</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                    <FileSearch size={40} className="mx-auto text-text-light mb-3" />
                    <p className="text-sm">No inspections yet. Create your first inspection to get started.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((insp) => (
                  <tr
                    key={insp.id}
                    onClick={() => router.push(`/inspections/${insp.id}`)}
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-info">
                      {insp.inspection_no || `INS-${insp.id.slice(0, 6)}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary capitalize">
                      {insp.inspection_type_display || insp.inspection_type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {insp.template_code ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                          {insp.template_code}
                        </span>
                      ) : (
                        <span className="text-text-light">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">{insp.factory_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{formatDate(insp.inspection_date)}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{insp.auditor_name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={cn('w-2 h-2 rounded-full', statusDot[insp.status] || 'bg-gray-300')} />
                        <span className={cn('text-sm font-medium', statusText[insp.status] || 'text-gray-500')}>
                          {insp.status_display || insp.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {insp.result && insp.result !== 'pending' ? (
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          insp.result === 'pass' ? 'bg-green-50 text-green-700' :
                          insp.result === 'fail' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'
                        )}>
                          {insp.result_display || insp.result.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-xs text-text-light">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button title="View" onClick={(e) => { e.stopPropagation(); router.push(`/inspections/${insp.id}`) }} className="p-1.5 rounded hover:bg-gray-100 text-text-muted hover:text-info transition-colors">
                          <Eye size={15} />
                        </button>
                        <button title="Copy" onClick={(e) => { e.stopPropagation(); handleCopyInspection(insp.id) }} className="p-1.5 rounded hover:bg-gray-100 text-text-muted hover:text-indigo-500 transition-colors">
                          <Copy size={15} />
                        </button>
                        <button title="Delete" onClick={(e) => { e.stopPropagation(); handleDeleteInspection(insp.id) }} className="p-1.5 rounded hover:bg-gray-100 text-text-muted hover:text-danger transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewInspectionModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={() => {
          setShowNewModal(false)
          loadInspections()
        }}
      />

      <ConfirmModal {...modalProps} />
    </div>
  )
}
