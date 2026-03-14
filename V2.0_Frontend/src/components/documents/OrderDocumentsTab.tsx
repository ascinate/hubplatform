'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import type { ManagedDocument } from '@/types/document'
import DocumentCard from './DocumentCard'
import UploadModal from './UploadModal'
import AuditLogDrawer from './AuditLogDrawer'
import ShareModal from './ShareModal'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface OrderDocumentsTabProps {
  orderId: string
  poNumber: string
}

export default function OrderDocumentsTab({ orderId, poNumber }: OrderDocumentsTabProps) {
  const { user } = useAuthStore()
  const [docs, setDocs] = useState<ManagedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [auditDoc, setAuditDoc] = useState<ManagedDocument | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<ManagedDocument | null>(null)
  const [shareDoc, setShareDoc] = useState<ManagedDocument | null>(null)

  const isAdmin = user?.role === 'admin' || user?.role === 'org_admin'

  const fetchDocs = useCallback(async () => {
    try {
      const res = await api.get(`/documents/?order=${orderId}`)
      setDocs(res.data)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

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
    } catch {
      toast.error('Delete failed')
    }
  }

  const canDelete = (doc: ManagedDocument) => {
    if (isAdmin) return true
    return doc.uploaded_by === user?.id
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {docs.length} document{docs.length !== 1 ? 's' : ''} for {poNumber}
        </p>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#C9A96E] hover:bg-[#b89555] text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={14} /> Upload
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-border">
          <FolderOpen size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-text-muted text-sm">No documents attached to this order</p>
          <button onClick={() => setShowUpload(true)} className="mt-3 text-sm text-[#C9A96E] hover:underline font-medium">
            Upload first document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); fetchDocs() }}
          defaultOrder={orderId}
        />
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
          message={`Are you sure you want to delete "${deleteDoc.name}"?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteDoc(null)}
        />
      )}
    </div>
  )
}
