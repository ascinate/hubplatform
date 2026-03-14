'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface Factory {
  id: string
  name: string
  location: string
  contact_person: string
  contact_email: string
  contact_phone: string
  is_active: boolean
}

interface DeleteConfirmModalProps {
  open: boolean
  onClose: () => void
  factory: Factory | null
  onDeleted: () => void
}

export default function DeleteConfirmModal({ open, onClose, factory, onDeleted }: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false)

  if (!open || !factory) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/factories/${factory.id}/`)
      toast.success(`${factory.name} has been deleted`)
      onDeleted()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete factory')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-danger" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-text-primary mb-2">Delete Factory</h2>

          {/* Message */}
          <p className="text-sm text-text-muted mb-6">
            Are you sure you want to delete <span className="font-medium text-text-primary">{factory.name}</span>?
            This action cannot be undone.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 border border-border text-text-muted rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-danger hover:bg-danger/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Factory'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
