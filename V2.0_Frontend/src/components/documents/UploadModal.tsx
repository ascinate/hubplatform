'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, FileUp } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { DEPARTMENTS, DOC_CATEGORIES, VISIBILITY_OPTIONS, formatFileSize } from '@/types/document'

interface UploadModalProps {
  onClose: () => void
  onUploaded: () => void
  defaultOrder?: string
  defaultFactory?: string
}

interface Order { id: string; po_number: string }
interface Factory { id: string; name: string }

export default function UploadModal({ onClose, onUploaded, defaultOrder, defaultFactory }: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState('')
  const [order, setOrder] = useState(defaultOrder || '')
  const [factory, setFactory] = useState(defaultFactory || '')
  const [department, setDepartment] = useState('')
  const [docCategory, setDocCategory] = useState('other')
  const [visibility, setVisibility] = useState('team')
  const [description, setDescription] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [factories, setFactories] = useState<Factory[]>([])

  useEffect(() => {
    api.get('/orders/').then(r => setOrders(r.data.results || r.data)).catch(() => {})
    api.get('/factories/').then(r => setFactories(r.data.results || r.data)).catch(() => {})
  }, [])

  const handleFile = (f: File) => {
    const maxSize = 50 * 1024 * 1024
    if (f.size > maxSize) {
      toast.error('File exceeds 50 MB limit')
      return
    }
    setFile(f)
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name || file.name.replace(/\.[^.]+$/, ''))
      if (order) formData.append('order', order)
      if (factory) formData.append('factory', factory)
      if (department) formData.append('department', department)
      formData.append('doc_category', docCategory)
      formData.append('visibility', visibility)
      if (description) formData.append('description', description)

      await api.post('/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Document uploaded successfully')
      onUploaded()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Upload failed'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl lg:rounded-xl shadow-xl w-full lg:max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Upload Document</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-[#C9A96E] bg-[rgba(201,169,110,0.1)]' : file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileUp size={24} className="text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary">{file.name}</p>
                  <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setFile(null); setName('') }} className="ml-2 text-xs text-red-500 hover:underline">Remove</button>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-text-muted">Drag & drop or click to browse</p>
                <p className="text-xs text-text-light mt-1">PDF, XLSX, DOCX, Images, ZIP — max 50 MB</p>
              </>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Document Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AQL Report — PO-12345"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40" />
          </div>

          {/* Order + Factory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Order (optional)</label>
              <select value={order} onChange={e => setOrder(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40">
                <option value="">None</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.po_number}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Factory (optional)</label>
              <select value={factory} onChange={e => setFactory(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40">
                <option value="">None</option>
                {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>

          {/* Department + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40">
                <option value="">Select...</option>
                {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Category</label>
              <select value={docCategory} onChange={e => setDocCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40">
                {DOC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Visibility</label>
            <div className="flex flex-wrap gap-2">
              {VISIBILITY_OPTIONS.map(v => (
                <button key={v.value} onClick={() => setVisibility(v.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    visibility === v.value
                      ? 'bg-[rgba(201,169,110,0.30)] border-[#C9A96E] text-[#6B5A3E] font-bold'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >{v.label}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief note about this document..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">Cancel</button>
          <button onClick={handleUpload} disabled={!file || uploading}
            className="px-5 py-2 bg-[#C9A96E] hover:bg-[#b89555] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
