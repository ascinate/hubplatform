'use client'

import { useEffect, useState } from 'react'
import { X, Upload, Eye, Download, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import type { DocumentAccessLog, ManagedDocument } from '@/types/document'

const ACTION_CONFIG: Record<string, { icon: typeof Upload; color: string; label: string }> = {
  upload: { icon: Upload, color: 'text-green-600 bg-green-50', label: 'Uploaded' },
  view: { icon: Eye, color: 'text-blue-600 bg-blue-50', label: 'Viewed' },
  download: { icon: Download, color: 'text-purple-600 bg-purple-50', label: 'Downloaded' },
  delete: { icon: Trash2, color: 'text-red-600 bg-red-50', label: 'Deleted' },
}

interface AuditLogDrawerProps {
  doc: ManagedDocument
  onClose: () => void
}

export default function AuditLogDrawer({ doc, onClose }: AuditLogDrawerProps) {
  const [logs, setLogs] = useState<DocumentAccessLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/documents/${doc.id}/audit/`)
      .then(r => setLogs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [doc.id])

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-md bg-white shadow-xl flex flex-col h-full" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary">Audit Log</h3>
            <p className="text-xs text-text-muted truncate">{doc.name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-text-muted text-center py-8">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">No access logs found</p>
          ) : (
            <div className="space-y-0">
              {logs.map((log, i) => {
                const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.view
                const Icon = config.icon
                return (
                  <div key={log.id} className="flex gap-3 relative">
                    {/* Line */}
                    {i < logs.length - 1 && (
                      <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)] bg-gray-100" />
                    )}
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${config.color}`}>
                      <Icon size={14} />
                    </div>
                    {/* Details */}
                    <div className="pb-5 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {log.user_name} <span className="font-normal text-text-muted">{config.label.toLowerCase()}</span>
                      </p>
                      <p className="text-[11px] text-text-light mt-0.5">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      {log.ip_address && (
                        <p className="text-[10px] text-text-light mt-0.5 font-mono">IP: {log.ip_address}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
