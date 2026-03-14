'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FileText, FileSpreadsheet, Image, File, Archive, Download, Shield, Clock, Eye, AlertTriangle, Presentation } from 'lucide-react'
import type { PublicShareData } from '@/types/document'
import { formatFileSize, getFileTypeColor, DEPT_ICONS, DOC_CATEGORIES } from '@/types/document'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.sankalphub.in'

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  xlsx: FileSpreadsheet, xls: FileSpreadsheet, csv: FileSpreadsheet,
  docx: FileText, doc: FileText,
  pptx: Presentation, ppt: Presentation,
  png: Image, jpg: Image, jpeg: Image, gif: Image, webp: Image,
  zip: Archive, rar: Archive,
}

const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'webp']

export default function PublicSharePage() {
  const params = useParams()
  const token = params.token as string
  const [data, setData] = useState<PublicShareData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchShareData()
  }, [token])

  const fetchShareData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/share/${token}/`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Invalid or expired share link')
      } else {
        setData(json)
      }
    } catch {
      setError('Failed to load shared document')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`${API_URL}/api/share/${token}/download/`)
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || 'Download failed')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data?.document.name || 'document'}.${data?.document.file_type || 'pdf'}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-border p-8 text-center max-w-md w-full">
          <AlertTriangle size={48} className="mx-auto text-amber-400 mb-4" />
          <h1 className="text-lg font-bold text-text-primary mb-2">Link Unavailable</h1>
          <p className="text-sm text-text-muted">{error}</p>
          <a href="https://sankalphub.in" className="inline-block mt-6 text-sm text-[#C9A96E] hover:underline font-medium">
            Go to SankalpHub
          </a>
        </div>
      </div>
    )
  }

  if (!data) return null

  const doc = data.document
  const Icon = FILE_ICONS[doc.file_type] || File
  const colors = getFileTypeColor(doc.file_type)
  const deptIcon = DEPT_ICONS[doc.department] || ''
  const category = DOC_CATEGORIES.find(c => c.value === doc.doc_category)?.label || doc.doc_category
  const isImage = IMAGE_TYPES.includes(doc.file_type.toLowerCase())
  const expiresDate = new Date(data.expires_at)
  const remainingMs = expiresDate.getTime() - Date.now()
  const remainingHours = Math.max(0, Math.floor(remainingMs / 3600000))
  const remainingText = remainingHours < 24 ? `${remainingHours} hours` : `${Math.floor(remainingHours / 24)} days`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/sankalphub-icon.svg" alt="SankalpHub" className="w-6 h-6" />
            <span className="text-sm font-semibold text-text-primary">SankalpHub</span>
          </div>
          <span className="text-xs text-text-muted">Shared document</span>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Document card */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${colors.bg}`}>
              <Icon size={28} className={colors.text} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-text-primary">{doc.name}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-text-muted">
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">.{doc.file_type}</span>
                <span>{formatFileSize(doc.file_size)}</span>
                {doc.department && <span>{deptIcon} {doc.department.replace('_', ' ')}</span>}
                {category && <span>{category}</span>}
              </div>
            </div>
          </div>

          {/* Share info */}
          <div className="mt-5 pt-4 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-xs text-text-muted">Shared by</p>
              <p className="text-sm font-medium text-text-primary mt-0.5">{data.shared_by}</p>
            </div>
            {data.recipient_name && (
              <div className="text-center">
                <p className="text-xs text-text-muted">For</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{data.recipient_name}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-text-muted flex items-center justify-center gap-1"><Clock size={10} /> Expires</p>
              <p className="text-sm font-medium text-text-primary mt-0.5">{remainingText}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-muted flex items-center justify-center gap-1"><Eye size={10} /> Views</p>
              <p className="text-sm font-medium text-text-primary mt-0.5">{data.access_count}/{data.max_access}</p>
            </div>
          </div>

          {data.requires_watermark && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              <Shield size={14} />
              This document will be watermarked with recipient info on download
            </div>
          )}
        </div>

        {/* Preview for images */}
        {isImage && (
          <div className="bg-white rounded-2xl border border-border p-4 overflow-hidden">
            <p className="text-xs text-text-muted mb-3">Preview</p>
            <div className="rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center" style={{ maxHeight: '400px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${API_URL}/api/share/${token}/download/`}
                alt={doc.name}
                className="max-w-full max-h-[400px] object-contain"
              />
            </div>
          </div>
        )}

        {/* Download button */}
        <button onClick={handleDownload} disabled={downloading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#C9A96E] hover:bg-[#b89555] text-white rounded-2xl text-base font-semibold transition-colors disabled:opacity-50">
          <Download size={20} />
          {downloading ? 'Downloading...' : 'Download Document'}
        </button>

        <p className="text-center text-xs text-text-muted">
          Powered by <a href="https://sankalphub.in" className="text-[#C9A96E] hover:underline font-medium">SankalpHub</a>
        </p>
      </div>
    </div>
  )
}
