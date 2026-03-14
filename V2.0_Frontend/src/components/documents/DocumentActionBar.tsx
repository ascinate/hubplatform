'use client'

import { useState } from 'react'
import { Download, FileDown, Mail, Save } from 'lucide-react'
import api from '@/lib/api'

interface DocumentActionBarProps {
  documentId?: string
  exportTargetRef?: React.RefObject<HTMLDivElement | null>
  exportFileName?: string
  onShareEmail?: () => void
  onSaveDraft?: () => void
}

export default function DocumentActionBar({
  documentId,
  exportTargetRef,
  exportFileName = 'export',
  onShareEmail,
  onSaveDraft,
}: DocumentActionBarProps) {
  const [exporting, setExporting] = useState(false)

  const logAction = async (action: string) => {
    if (!documentId) return
    try {
      await api.post('/documents/log-action/', { document_id: documentId, action })
    } catch {
      // Silent logging
    }
  }

  const handleDownload = async () => {
    if (!documentId) return
    try {
      await logAction('download')
      const response = await api.get(`/documents/${documentId}/download/`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers['content-disposition']
      const match = disposition?.match(/filename="?(.+)"?/)
      a.download = match?.[1] || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      // Download error
    }
  }

  const handleExportPdf = async () => {
    if (!exportTargetRef?.current) return
    setExporting(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${exportFileName}.pdf`,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(exportTargetRef.current)
        .save()
      await logAction('export_pdf')
    } catch {
      // PDF export error
    } finally {
      setExporting(false)
    }
  }

  const handleShareEmail = async () => {
    await logAction('email_share')
    onShareEmail?.()
  }

  const handleSaveDraft = async () => {
    await logAction('save_draft')
    onSaveDraft?.()
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {documentId && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
        >
          <Download size={14} />
          Download File
        </button>
      )}
      {exportTargetRef && (
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200 disabled:opacity-50"
        >
          <FileDown size={14} />
          {exporting ? 'Exporting...' : 'Export View as PDF'}
        </button>
      )}
      {onShareEmail && (
        <button
          onClick={handleShareEmail}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200"
        >
          <Mail size={14} />
          Share via Email
        </button>
      )}
      {onSaveDraft && (
        <button
          onClick={handleSaveDraft}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
        >
          <Save size={14} />
          Save as Draft
        </button>
      )}
    </div>
  )
}
