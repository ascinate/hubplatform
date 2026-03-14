'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, FolderOpen, HardDrive, FileStack, Filter, PackageCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import type { ManagedDocument, DocumentStats } from '@/types/document'
import { DEPARTMENTS, DOC_CATEGORIES, formatFileSize, DEPT_ICONS } from '@/types/document'
import DocumentCard from '@/components/documents/DocumentCard'
import UploadModal from '@/components/documents/UploadModal'
import AuditLogDrawer from '@/components/documents/AuditLogDrawer'
import ShareModal from '@/components/documents/ShareModal'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function DocumentsPage() {
  const { user } = useAuthStore()
  const [docs, setDocs] = useState<ManagedDocument[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [auditDoc, setAuditDoc] = useState<ManagedDocument | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<ManagedDocument | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [shareDoc, setShareDoc] = useState<ManagedDocument | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [docCategory, setDocCategory] = useState('')

  const isAdmin = user?.role === 'admin' || user?.role === 'org_admin'

  const fetchDocs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (department) params.set('department', department)
      if (docCategory) params.set('doc_category', docCategory)
      const res = await api.get(`/documents/?${params}`)
      setDocs(res.data)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [search, department, docCategory])

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/documents/stats/')
      setStats(res.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchDocs()
    fetchStats()
  }, [fetchDocs, fetchStats])

  const handleDownload = async (doc: ManagedDocument) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.name}.${doc.file_type}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteDoc) return
    try {
      await api.delete(`/documents/${deleteDoc.id}/`)
      toast.success('Document deleted')
      setDeleteDoc(null)
      fetchDocs()
      fetchStats()
    } catch {
      toast.error('Delete failed')
    }
  }

  const canDelete = (doc: ManagedDocument) => {
    if (isAdmin) return true
    return doc.uploaded_by === user?.id
  }

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === docs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(docs.map(d => d.id)))
    }
  }

  const handleBulkExport = async () => {
    if (selectedIds.size === 0) return
    setExporting(true)
    try {
      const res = await api.post('/documents/bulk-export/', {
        document_ids: Array.from(selectedIds),
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'documents-export.zip'
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`Exported ${selectedIds.size} documents`)
      setSelectedIds(new Set())
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Documents</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage files across orders, factories & departments</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A96E] hover:bg-[#b89555] text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Upload
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileStack size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{stats.total_count}</p>
                <p className="text-xs text-text-muted">Total Documents</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <HardDrive size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{formatFileSize(stats.total_size)}</p>
                <p className="text-xs text-text-muted">Total Size</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <FolderOpen size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{stats.by_department.length}</p>
                <p className="text-xs text-text-muted">Departments</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <span className="text-lg">📊</span>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{stats.by_file_type.length}</p>
                <p className="text-xs text-text-muted">File Types</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 sm:w-auto">
            <Filter size={14} /> Filters {(department || docCategory) && <span className="w-2 h-2 rounded-full bg-[#C9A96E]" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/50">
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40">
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{DEPT_ICONS[d.value]} {d.label}</option>)}
            </select>
            <select value={docCategory} onChange={e => setDocCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40">
              <option value="">All Categories</option>
              {DOC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Department breakdown */}
      {stats && stats.by_department.length > 0 && !department && !docCategory && !search && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {stats.by_department.map(d => (
            <button key={d.department} onClick={() => { setDepartment(d.department); setShowFilters(true) }}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-border hover:border-[#C9A96E]/40 transition-colors shrink-0">
              <span className="text-lg">{DEPT_ICONS[d.department] || '📁'}</span>
              <div className="text-left">
                <p className="text-xs font-medium text-text-primary capitalize">{d.department.replace('_', ' ')}</p>
                <p className="text-[10px] text-text-muted">{d.count} files · {formatFileSize(d.size)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {docs.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-border px-4 py-2.5">
          <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
            <input type="checkbox" checked={selectedIds.size === docs.length && docs.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-[#C9A96E] focus:ring-[#C9A96E]" />
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
          </label>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-text-muted hover:bg-gray-50 rounded-lg transition-colors">
                <X size={13} /> Clear
              </button>
              <button onClick={handleBulkExport} disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A96E] hover:bg-[#b89555] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                <PackageCheck size={13} />
                {exporting ? 'Exporting...' : `Export ${selectedIds.size} as ZIP`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Document grid */}
      {loading ? (
        <div className="text-center py-12 text-text-muted">Loading documents...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-border">
          <FolderOpen size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-text-muted">No documents found</p>
          <button onClick={() => setShowUpload(true)} className="mt-3 text-sm text-[#C9A96E] hover:underline font-medium">
            Upload your first document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDownload={handleDownload}
              onAudit={setAuditDoc}
              onDelete={setDeleteDoc}
              onShare={setShareDoc}
              canDelete={canDelete(doc)}
              showAudit={isAdmin}
              selected={selectedIds.has(doc.id)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => { fetchDocs(); fetchStats() }} />
      )}
      {shareDoc && (
        <ShareModal doc={shareDoc} onClose={() => setShareDoc(null)} />
      )}
      {auditDoc && (
        <AuditLogDrawer doc={auditDoc} onClose={() => setAuditDoc(null)} />
      )}
      {deleteDoc && (
        <ConfirmModal
          isOpen={!!deleteDoc}
          title="Delete Document"
          message={`Are you sure you want to delete "${deleteDoc.name}"? This action can be reversed by an admin.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteDoc(null)}
        />
      )}
    </div>
  )
}
