'use client'

import { useState, useMemo, useEffect } from 'react'
import { Calculator, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import TabPills from '@/components/ui/TabPills'
import {
  type InspectionLevel, type AQLResult,
  INSPECTION_LEVELS, calculateAQL,
} from './aql-data'

interface AQLCalculatorProps {
  onResultChange: (result: AQLResult | null) => void
}

export default function AQLCalculator({ onResultChange }: AQLCalculatorProps) {
  const [lotSizeInput, setLotSizeInput] = useState('')
  const [level, setLevel] = useState<InspectionLevel>(2)

  const lotSize = parseInt(lotSizeInput, 10)
  const isValid = !isNaN(lotSize) && lotSize >= 2

  const result = useMemo(() => {
    if (!isValid) return null
    try {
      return calculateAQL(lotSize, level)
    } catch {
      return null
    }
  }, [lotSize, level, isValid])

  useEffect(() => {
    onResultChange(result)
  }, [result, onResultChange])

  return (
    <div className="bg-white rounded-xl border border-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator size={16} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">AQL Sampling Calculator</h3>
          <p className="text-[10px] text-text-muted">Enter lot size to get the sampling plan instantly</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
        {/* Lot Size */}
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-medium text-text-primary mb-1">Lot Size (pcs)</label>
          <input
            type="number"
            min={2}
            value={lotSizeInput}
            onChange={(e) => setLotSizeInput(e.target.value)}
            placeholder="e.g. 1200"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {lotSizeInput && !isValid && (
            <p className="text-[10px] text-red-500 mt-0.5">Must be a number &ge; 2</p>
          )}
        </div>

        {/* Inspection Level */}
        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">Inspection Level</label>
          <TabPills
            tabs={INSPECTION_LEVELS.map((info) => ({
              id: info.level,
              label: `${info.code} (${info.label.split(' ')[0]})`,
            }))}
            activeTab={level}
            onTabChange={(id) => setLevel(id as InspectionLevel)}
            compact
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Code + Sample badges */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-text-muted uppercase tracking-wider">Code Letter</span>
              <span className="px-2 py-0.5 bg-primary text-white text-sm font-bold rounded">{result.codeLetter}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-text-muted uppercase tracking-wider">Sample Size</span>
              <span className="px-2 py-0.5 bg-gray-800 text-white text-sm font-bold rounded">{result.sampleSize.toLocaleString()} pcs</span>
            </div>
          </div>

          {/* Limits table */}
          <div className="divide-y divide-gray-100">
            {/* Critical */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50/50">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="text-xs font-semibold text-red-700 w-16">Critical</span>
              <span className="text-[10px] text-text-muted">AQL 0.0</span>
              <div className="flex-1" />
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-600" />
                  Accept &le; <strong>0</strong>
                </span>
                <span className="flex items-center gap-1">
                  <XCircle size={12} className="text-red-500" />
                  Reject &ge; <strong>1</strong>
                </span>
              </div>
            </div>

            {/* Major */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-50/50">
              <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              <span className="text-xs font-semibold text-orange-700 w-16">Major</span>
              <span className="text-[10px] text-text-muted">AQL 2.5</span>
              <div className="flex-1" />
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-600" />
                  Accept &le; <strong>{result.major.accept}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <XCircle size={12} className="text-red-500" />
                  Reject &ge; <strong>{result.major.reject}</strong>
                </span>
              </div>
            </div>

            {/* Minor */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50/50">
              <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="text-xs font-semibold text-blue-700 w-16">Minor</span>
              <span className="text-[10px] text-text-muted">AQL 4.0</span>
              <div className="flex-1" />
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-600" />
                  Accept &le; <strong>{result.minor.accept}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <XCircle size={12} className="text-red-500" />
                  Reject &ge; <strong>{result.minor.reject}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-text-muted leading-relaxed">
              From a lot of <strong className="text-text-primary">{result.lotSize.toLocaleString()}</strong> pcs,
              inspect <strong className="text-text-primary">{result.sampleSize.toLocaleString()}</strong> randomly selected units.
              Accept if Major defects &le; {result.major.accept} and Minor defects &le; {result.minor.accept}.
              Any Critical defect = automatic FAIL.
            </p>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700">
                  <AlertTriangle size={12} />
                  {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
