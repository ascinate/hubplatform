'use client'

import { FileText, FileSpreadsheet, Image, File, Archive, Download, History, Trash2, Presentation, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ManagedDocument } from '@/types/document'
import { formatFileSize, getFileTypeColor, DEPT_ICONS } from '@/types/document'

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  xlsx: FileSpreadsheet, xls: FileSpreadsheet, csv: FileSpreadsheet,
  docx: FileText, doc: FileText,
  pptx: Presentation, ppt: Presentation,
  png: Image, jpg: Image, jpeg: Image, gif: Image, webp: Image, bmp: Image,
  zip: Archive, rar: Archive,
}

interface DocumentCardProps {
  doc: ManagedDocument
  onDownload: (doc: ManagedDocument) => void
  onAudit: (doc: ManagedDocument) => void
  onDelete: (doc: ManagedDocument) => void
  onShare?: (doc: ManagedDocument) => void
  canDelete: boolean
  showAudit: boolean
  selected?: boolean
  onSelect?: (id: string, checked: boolean) => void
}

export default function DocumentCard({ doc, onDownload, onAudit, onDelete, onShare, canDelete, showAudit, selected, onSelect }: DocumentCardProps) {
  const Icon = FILE_ICONS[doc.file_type] || File
  const colors = getFileTypeColor(doc.file_type)
  const deptIcon = DEPT_ICONS[doc.department] || '📁'

  return (
    <div className={cn('bg-white rounded-xl border p-4 hover:shadow-md transition-shadow group', selected ? 'border-[#C9A96E] ring-1 ring-[#C9A96E]/30' : 'border-border')}>
      <div className="flex items-start gap-3">
        {/* Checkbox for bulk select */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected || false}
            onChange={e => onSelect(doc.id, e.target.checked)}
            className="mt-1 rounded border-gray-300 text-[#C9A96E] focus:ring-[#C9A96E] shrink-0"
          />
        )}
        {/* File icon */}
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', colors.bg)}>
          <Icon size={20} className={colors.text} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary truncate">{doc.name}</h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">.{doc.file_type}</span>
            <span className="text-[10px] text-text-muted">{formatFileSize(doc.file_size)}</span>
            {doc.department && (
              <span className="text-[10px] text-text-muted">{deptIcon} {doc.department.replace('_', ' ')}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-text-muted">{doc.uploaded_by_name}</span>
            <span className="text-[11px] text-text-light">{new Date(doc.created_at).toLocaleDateString()}</span>
          </div>
          {doc.order_po_number && (
            <span className="text-[10px] text-[#C9A96E] font-medium mt-1 inline-block">PO: {doc.order_po_number}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
        <button onClick={() => onDownload(doc)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <Download size={13} /> Download
        </button>
        {onShare && (
          <button onClick={() => onShare(doc)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#C9A96E] hover:bg-amber-50 rounded-lg transition-colors">
            <Share2 size={13} /> Share
          </button>
        )}
        {showAudit && (
          <button onClick={() => onAudit(doc)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-text-muted hover:bg-gray-50 rounded-lg transition-colors">
            <History size={13} /> Audit
          </button>
        )}
        {canDelete && (
          <button onClick={() => onDelete(doc)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto">
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>
    </div>
  )
}
