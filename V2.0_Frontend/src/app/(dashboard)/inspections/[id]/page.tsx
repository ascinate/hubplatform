'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, FileCheck, CheckCircle, XCircle, Clock, CalendarCheck,
  Play, FileText, Send, ShieldCheck, XOctagon, Download, Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import DocumentActionBar from '@/components/documents/DocumentActionBar'
import InspectionForm, { type InspectionFormHandle, type ExistingSection } from '@/components/inspections/InspectionForm'

interface InspectionDetail {
  id: string
  inspection_no?: string
  inspection_type: string
  inspection_type_display?: string
  factory_name?: string
  auditor_name: string
  inspection_date: string
  quantity_inspected: number
  defects_found: number
  defect_rate: number
  status: string
  status_display?: string
  result: string
  result_display?: string
  notes: string
  aql_level?: string
  overall_result?: string
  template?: string
  template_name?: string
  template_code?: string
  sections?: ExistingSection[]
  production_order_number?: string
}

const STATUS_CONFIG: Record<string, { dot: string; bg: string; text: string }> = {
  draft:          { dot: 'bg-gray-400',    bg: 'bg-gray-100',    text: 'text-gray-700' },
  scheduled:      { dot: 'bg-blue-500',    bg: 'bg-blue-50',     text: 'text-blue-700' },
  confirmed:      { dot: 'bg-indigo-500',  bg: 'bg-indigo-50',   text: 'text-indigo-700' },
  in_progress:    { dot: 'bg-amber-500',   bg: 'bg-amber-50',    text: 'text-amber-700' },
  report_pending: { dot: 'bg-orange-500',  bg: 'bg-orange-50',   text: 'text-orange-700' },
  submitted:      { dot: 'bg-teal-500',    bg: 'bg-teal-50',     text: 'text-teal-700' },
  approved:       { dot: 'bg-green-500',   bg: 'bg-green-50',    text: 'text-green-700' },
  cancelled:      { dot: 'bg-red-500',     bg: 'bg-red-50',      text: 'text-red-700' },
}

const RESULT_CONFIG: Record<string, { bg: string; text: string }> = {
  pass:             { bg: 'bg-green-50',  text: 'text-green-700' },
  fail:             { bg: 'bg-red-50',    text: 'text-red-700' },
  conditional_pass: { bg: 'bg-blue-50',   text: 'text-blue-700' },
  pending:          { bg: 'bg-gray-100',  text: 'text-gray-500' },
}

// Status transitions: current status → { nextStatus, label, icon, color }
const STATUS_ACTIONS: Record<string, { nextStatus: string; label: string; color: string }[]> = {
  draft:          [{ nextStatus: 'scheduled',      label: 'Schedule Inspection', color: 'border-blue-500 text-blue-600 hover:bg-blue-50' }],
  scheduled:      [{ nextStatus: 'confirmed',      label: 'Confirm',             color: 'border-indigo-500 text-indigo-600 hover:bg-indigo-50' }],
  confirmed:      [{ nextStatus: 'in_progress',    label: 'Start Inspection',    color: 'border-amber-500 text-amber-600 hover:bg-amber-50' }],
  in_progress:    [{ nextStatus: 'report_pending', label: 'Complete On-Site',    color: 'border-orange-500 text-orange-600 hover:bg-orange-50' }],
  report_pending: [{ nextStatus: 'submitted',      label: 'Submit Report',       color: 'border-teal-500 text-teal-600 hover:bg-teal-50' }],
  submitted:      [
    { nextStatus: 'approved',  label: 'Approve',          color: 'border-green-500 text-green-600 hover:bg-green-50' },
    { nextStatus: 'scheduled', label: 'Request Revision',  color: 'border-amber-500 text-amber-600 hover:bg-amber-50' },
  ],
}

export default function InspectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [inspection, setInspection] = useState<InspectionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [resultValue, setResultValue] = useState('')
  const [formComplete, setFormComplete] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<InspectionFormHandle>(null)

  useEffect(() => {
    loadInspection()
  }, [params.id])

  const loadInspection = async () => {
    try {
      const { data } = await api.get(`/inspections/${params.id}/`)
      setInspection(data)
      setResultValue(data.result || 'pending')
    } catch {
      toast.error('Failed to load inspection')
      router.push('/inspections')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (nextStatus: string) => {
    // When completing on-site: save form then validate required fields
    if (nextStatus === 'report_pending' && formRef.current && inspection?.template) {
      await formRef.current.save()
      const missing = formRef.current.validate()
      if (missing.length > 0) {
        const preview = missing.slice(0, 3).join(', ') + (missing.length > 3 ? ` +${missing.length - 3} more` : '')
        toast.error(`Required fields missing: ${preview}`)
        return
      }
    }
    setUpdating(true)
    try {
      const payload: Record<string, string> = { status: nextStatus }
      // When approving, also save the result
      if (nextStatus === 'approved' && resultValue && resultValue !== 'pending') {
        payload.result = resultValue
      }
      await api.patch(`/inspections/${params.id}/`, payload)
      toast.success(`Status updated to ${nextStatus.replace('_', ' ')}`)
      loadInspection()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelInspection = async () => {
    setUpdating(true)
    try {
      await api.patch(`/inspections/${params.id}/`, { status: 'cancelled' })
      toast.success('Inspection cancelled')
      loadInspection()
    } catch {
      toast.error('Failed to cancel inspection')
    } finally {
      setUpdating(false)
    }
  }

  const handleResultUpdate = async (newResult: string) => {
    setUpdating(true)
    try {
      await api.patch(`/inspections/${params.id}/`, { result: newResult })
      toast.success('Result updated')
      setResultValue(newResult)
      loadInspection()
    } catch {
      toast.error('Failed to update result')
    } finally {
      setUpdating(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('sankalp_access_token')
      const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${apiBase}/inspections/${params.id}/export/pdf/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="([^"]+)"/)
      a.download = match?.[1] || `Inspection-${params.id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to export PDF')
    }
  }

  const handleSharePdf = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success('Link copied to clipboard'))
      .catch(() => toast.error('Failed to copy link'))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!inspection) return null

  const statusConf = STATUS_CONFIG[inspection.status] || STATUS_CONFIG.draft
  const resultConf = RESULT_CONFIG[inspection.result] || RESULT_CONFIG.pending
  const actions = STATUS_ACTIONS[inspection.status] || []
  const canCancel = !['approved', 'cancelled'].includes(inspection.status)

  return (
    <div ref={exportRef} className="space-y-4 lg:space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/inspections')}
        className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Inspections
      </button>

      {/* Document Actions */}
      <DocumentActionBar
        exportTargetRef={exportRef}
        exportFileName={`Inspection-${inspection.inspection_no || inspection.id.slice(0, 8)}`}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary">
            Inspection {inspection.inspection_no || `#${inspection.id.slice(0, 8)}`}
          </h1>
          {/* Status badge */}
          <span className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
            statusConf.bg, statusConf.text
          )}>
            <div className={cn('w-2 h-2 rounded-full', statusConf.dot)} />
            {inspection.status_display || inspection.status.replace('_', ' ')}
          </span>
          {/* Result badge (only when not pending) */}
          {inspection.result && inspection.result !== 'pending' && (
            <span className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
              resultConf.bg, resultConf.text
            )}>
              {inspection.result === 'pass' ? 'PASS' :
               inspection.result === 'fail' ? 'FAIL' : 'CONDITIONAL PASS'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* PDF buttons — visibility controlled by status */}
          {['report_pending', 'submitted', 'approved'].includes(inspection.status) && (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download size={15} />
              Download PDF
            </button>
          )}
          {['submitted', 'approved'].includes(inspection.status) && (
            <button
              onClick={handleSharePdf}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Share2 size={15} />
              Share
            </button>
          )}
          {/* Status action buttons */}
          {actions.map((action) => {
            const isSubmitReport = action.nextStatus === 'submitted'
            const isDisabled = updating || (isSubmitReport && !!inspection.template && !formComplete)
            return (
              <button
                key={action.nextStatus}
                onClick={() => handleStatusChange(action.nextStatus)}
                disabled={isDisabled}
                title={isSubmitReport && !!inspection.template && !formComplete ? 'Fill all required fields before submitting' : undefined}
                className={cn(
                  'w-full sm:w-auto flex items-center justify-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  action.color,
                )}
              >
                {action.label}
              </button>
            )
          })}
          {/* Cancel button */}
          {canCancel && (
            <button
              onClick={handleCancelInspection}
              disabled={updating}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-red-300 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Report body */}
      <div className="bg-white rounded-xl border border-border p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* General Info */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">General Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border-light">
                <span className="text-sm text-text-muted">Inspection Date</span>
                <span className="text-sm font-medium">{formatDate(inspection.inspection_date, 'long')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-light">
                <span className="text-sm text-text-muted">Type</span>
                <span className="text-sm font-medium capitalize">{inspection.inspection_type_display || inspection.inspection_type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-light">
                <span className="text-sm text-text-muted">Inspector</span>
                <span className="text-sm font-medium">{inspection.auditor_name || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-light">
                <span className="text-sm text-text-muted">Template</span>
                <span className="text-sm font-medium">
                  {inspection.template_code ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold">{inspection.template_code}</span>
                      {inspection.template_name}
                    </span>
                  ) : '—'}
                </span>
              </div>
              {inspection.aql_level && (
                <div className="flex justify-between py-2 border-b border-border-light">
                  <span className="text-sm text-text-muted">AQL Level</span>
                  <span className="text-sm font-medium">{inspection.aql_level}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border-light">
                <span className="text-sm text-text-muted">Qty Inspected</span>
                <span className="text-sm font-medium">{inspection.quantity_inspected}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-light">
                <span className="text-sm text-text-muted">Defects Found</span>
                <span className="text-sm font-medium">{inspection.defects_found}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-light">
                <span className="text-sm text-text-muted">Defect Rate</span>
                <span className="text-sm font-medium">{inspection.defect_rate}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-light">
                <span className="text-sm text-text-muted">Factory</span>
                <span className="text-sm font-medium">{inspection.factory_name || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Template form — shown when in_progress or report_pending and a template is assigned */}
        {['in_progress', 'report_pending'].includes(inspection.status) && inspection.template && (
          <>
            <div className="border-t border-border" />
            <InspectionForm
              ref={formRef}
              inspectionId={inspection.id}
              templateId={inspection.template}
              existingSections={inspection.sections || []}
              onValidationChange={setFormComplete}
              autoFillData={{
                factory_name:             inspection.factory_name || '',
                factory:                  inspection.factory_name || '',
                auditor_name:             inspection.auditor_name || '',
                inspector:                inspection.auditor_name || '',
                inspection_date:          inspection.inspection_date || '',
                date:                     inspection.inspection_date || '',
                inspection_type:          inspection.inspection_type_display || inspection.inspection_type || '',
                status:                   inspection.status_display || inspection.status || '',
                template_name:            inspection.template_name || '',
                template_code:            inspection.template_code || '',
                aql_level:                inspection.aql_level || '',
                inspection_no:            inspection.inspection_no || '',
                quantity_inspected:       String(inspection.quantity_inspected || ''),
                production_order_number:  inspection.production_order_number || '',
              }}
            />
          </>
        )}

        {/* Result section — editable when submitted/approved */}
        <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-4">
              {inspection.result === 'pass' ? (
                <CheckCircle size={24} className="text-green-500" />
              ) : inspection.result === 'fail' ? (
                <XCircle size={24} className="text-red-500" />
              ) : (
                <FileCheck size={24} className="text-amber-500" />
              )}
              <div>
                <p className="text-sm text-text-muted">Inspection Result</p>
                <p className="text-xl font-bold capitalize">
                  {inspection.result_display || inspection.result.replace('_', ' ')}
                </p>
              </div>
            </div>
            {/* Result selector — visible on submitted or report_pending */}
            {['submitted', 'report_pending', 'in_progress'].includes(inspection.status) && (
              <div className="flex items-center gap-2">
                <select
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="pending">Pending</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="conditional_pass">Conditional Pass</option>
                </select>
                <button
                  onClick={() => handleResultUpdate(resultValue)}
                  disabled={updating}
                  className="px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Flow */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Status Flow</h2>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {['draft', 'scheduled', 'confirmed', 'in_progress', 'report_pending', 'submitted', 'approved'].map((s, i) => {
              const conf = STATUS_CONFIG[s]
              const isCurrent = inspection.status === s
              const isPast = ['draft', 'scheduled', 'confirmed', 'in_progress', 'report_pending', 'submitted', 'approved']
                .indexOf(inspection.status) > i
              const isCancelled = inspection.status === 'cancelled'
              return (
                <div key={s} className="flex items-center gap-1 shrink-0">
                  {i > 0 && <div className={cn('w-4 h-0.5', isPast ? 'bg-green-400' : 'bg-gray-200')} />}
                  <div className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border',
                    isCurrent ? `${conf.bg} ${conf.text} border-current` :
                    isPast ? 'bg-green-50 text-green-600 border-green-200' :
                    isCancelled ? 'bg-gray-50 text-gray-400 border-gray-200' :
                    'bg-gray-50 text-gray-400 border-gray-200'
                  )}>
                    {s.replace('_', ' ')}
                  </div>
                </div>
              )
            })}
            {inspection.status === 'cancelled' && (
              <>
                <div className="w-4 h-0.5 bg-red-300" />
                <div className="px-2.5 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-600 border-red-300">
                  cancelled
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {inspection.notes && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Notes</h2>
            <p className="text-sm text-text-muted whitespace-pre-wrap">{inspection.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
