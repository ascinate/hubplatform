'use client'

import { useState, useMemo } from 'react'
import { X, CalendarDays, Layers, Hash } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { businessDaysBetween, formatNumber } from '@/lib/utils'

interface PlanModalProps {
  orderId: string
  orderQuantity: number
  dueDate: string | null
  onClose: () => void
  onCreated: () => void
}

export default function PlanModal({ orderId, orderQuantity, dueDate, onClose, onCreated }: PlanModalProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState(dueDate || '')
  const [plannedLines, setPlannedLines] = useState(1)
  const [dailyPiecesPerLine, setDailyPiecesPerLine] = useState(0)
  const [saving, setSaving] = useState(false)

  const productionDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    return businessDaysBetween(new Date(startDate), new Date(endDate))
  }, [startDate, endDate])

  const totalPlanned = useMemo(() => {
    return productionDays * plannedLines * dailyPiecesPerLine
  }, [productionDays, plannedLines, dailyPiecesPerLine])

  const quantityWarning = totalPlanned > 0 && totalPlanned < orderQuantity
  const overProduction = totalPlanned > orderQuantity * 1.1 // 10% over

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      toast.error('Please set both start and end dates')
      return
    }
    if (dailyPiecesPerLine <= 0) {
      toast.error('Daily pieces per line must be greater than 0')
      return
    }

    setSaving(true)
    try {
      await api.post(`/orders/${orderId}/production/plan/`, {
        start_date: startDate,
        end_date: endDate,
        planned_lines: plannedLines,
        daily_pieces_per_line: dailyPiecesPerLine,
      })
      toast.success('Production plan created')
      onCreated()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Set Production Plan</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                <CalendarDays size={12} className="inline mr-1" />Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                <CalendarDays size={12} className="inline mr-1" />End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
          </div>

          {/* Lines and pieces */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                <Layers size={12} className="inline mr-1" />Production Lines
              </label>
              <input
                type="number"
                min={1}
                value={plannedLines}
                onChange={(e) => setPlannedLines(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                <Hash size={12} className="inline mr-1" />Daily Pieces / Line
              </label>
              <input
                type="number"
                min={0}
                value={dailyPiecesPerLine}
                onChange={(e) => setDailyPiecesPerLine(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Auto-calc summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Production Time</span>
              <span className="font-medium text-text-primary">
                {productionDays} business day{productionDays !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Total Quantity Planned</span>
              <span className="font-bold text-text-primary">{formatNumber(totalPlanned)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Order Quantity</span>
              <span className="font-medium text-text-primary">{formatNumber(orderQuantity)}</span>
            </div>
          </div>

          {/* Warnings */}
          {quantityWarning && (
            <div className="bg-warning/10 border border-warning/30 text-warning rounded-lg px-4 py-2.5 text-sm">
              Planned quantity ({formatNumber(totalPlanned)}) is less than order quantity ({formatNumber(orderQuantity)}).
            </div>
          )}
          {overProduction && (
            <div className="bg-info/10 border border-info/30 text-info rounded-lg px-4 py-2.5 text-sm">
              Planned quantity exceeds order quantity by more than 10%.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border text-text-muted rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !startDate || !endDate || dailyPiecesPerLine <= 0}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
