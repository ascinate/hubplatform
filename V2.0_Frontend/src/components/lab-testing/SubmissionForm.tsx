'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface SubmissionFormProps {
  onSubmitted: () => void
}

const laboratories = [
  'SANKALP Internal Labs',
  'Global Quality Labs',
  'EuroTech Testing',
  'SGS International',
]

const resultOptions = [
  { value: 'completed', label: 'Pass', color: 'text-success', ring: 'ring-success', bg: 'bg-success' },
  { value: 'failed', label: 'Fail', color: 'text-danger', ring: 'ring-danger', bg: 'bg-danger' },
  { value: 'in_progress', label: 'Hold', color: 'text-warning', ring: 'ring-warning', bg: 'bg-warning' },
]

export default function SubmissionForm({ onSubmitted }: SubmissionFormProps) {
  const [sampleId, setSampleId] = useState('')
  const [selectedLab, setSelectedLab] = useState('')
  const [selectedResult, setSelectedResult] = useState('')
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sampleId.trim() || !selectedLab || !selectedResult) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('sample_id', sampleId.trim())
      formData.append('test_name', selectedLab)
      formData.append('test_type', 'quality')
      formData.append('status', selectedResult)
      if (reportFile) {
        formData.append('report_file', reportFile)
      }
      await api.post('/lab-tests/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Lab result submitted successfully')
      setSampleId('')
      setSelectedLab('')
      setSelectedResult('')
      setReportFile(null)
      onSubmitted()
    } catch {
      toast.error('Failed to submit lab result')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5 h-full flex flex-col overflow-hidden">
      <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-tight">Submit Lab Result</h3>

      <form onSubmit={handleSubmit} className="flex-1 space-y-4 pr-1">
        {/* Laboratory Name */}
        <div>
          <label className="block text-sm font-bold text-text-primary uppercase tracking-tight mb-2">
            Laboratory Name
          </label>
          <div className="relative">
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white appearance-none font-medium transition-all"
            >
              <option value="">Select laboratory</option>
              {laboratories.map((lab) => (
                <option key={lab} value={lab}>
                  {lab}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
        </div>

        {/* Test Result */}
        <div>
          <label className="block text-sm font-bold text-text-primary uppercase tracking-tight mb-2">Test Result</label>
          <div className="flex items-center gap-6 py-1">
            {resultOptions.map((option) => (
              <label
                key={option.value}
                onClick={() => setSelectedResult(option.value)}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                    selectedResult === option.value
                      ? `border-current ${option.color}`
                      : 'border-gray-300 group-hover:border-gray-400'
                  )}
                >
                  {selectedResult === option.value && (
                    <div className={cn('w-2.5 h-2.5 rounded-full', option.bg)} />
                  )}
                </div>
                <span className={cn('text-sm font-bold transition-colors', selectedResult === option.value ? option.color : 'text-text-muted group-hover:text-text-primary')}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Upload Report */}
        <div className="flex-1 flex flex-col min-h-0">
          <label className="block text-sm font-bold text-text-primary uppercase tracking-tight mb-2">
            Upload Report
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => setReportFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const file = e.dataTransfer.files?.[0]
              if (file) setReportFile(file)
            }}
            className="flex-1 min-h-[110px] border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-primary/40 transition-all cursor-pointer bg-gray-50/50 flex flex-col items-center justify-center group"
          >
            {reportFile ? (
              <div className="flex items-center justify-center gap-3 bg-white p-3 rounded-lg border border-border shadow-sm">
                <FileText size={24} className="text-primary" />
                <span className="text-sm text-text-primary font-bold truncate max-w-[180px]">{reportFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setReportFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={14} className="text-text-muted" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-border group-hover:scale-110 transition-transform">
                  <Upload size={20} className="text-text-muted group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm text-text-primary font-bold">Click to upload report</p>
                  <p className="text-[10px] text-text-muted mt-0.5">PDF, DOC, or image files</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            'w-full px-4 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-[0.98] mt-2',
            submitting && 'opacity-60 cursor-not-allowed'
          )}
        >
          {submitting ? 'Submitting...' : 'Submit Result'}
        </button>
      </form>
    </div>
  )
}
