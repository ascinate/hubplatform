'use client'

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, BookOpen, Shield, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type AQLResult, type CodeLetter,
  INSPECTION_LEVELS, DEFECT_CLASSIFICATION, COMMON_SCENARIOS,
} from './aql-data'
import AQLCalculator from './AQLCalculator'
import AQLReferenceTable from './AQLReferenceTable'

export default function AQLStandards() {
  const [result, setResult] = useState<AQLResult | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['lot-size', 'acceptance']))

  const highlightCode: CodeLetter | null = result?.codeLetter ?? null

  const handleResultChange = useCallback((r: AQLResult | null) => {
    setResult(r)
  }, [])

  const toggleSection = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">AQL Standards — ANSI/ASQ Z1.4</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Sampling Procedures and Tables for Inspection by Attributes
        </p>
      </div>

      {/* Calculator */}
      <AQLCalculator onResultChange={handleResultChange} />

      {/* Defect Classification */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DEFECT_CLASSIFICATION.map((cls) => (
          <div key={cls.key} className={cn('rounded-xl border p-4', cls.colorBg, cls.colorBorder)}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-2.5 h-2.5 rounded-full', cls.colorDot)} />
              <span className={cn('text-sm font-bold', cls.colorText)}>{cls.label}</span>
              <span className={cn('ml-auto px-2 py-0.5 rounded text-[10px] font-bold border', cls.colorBg, cls.colorText, cls.colorBorder)}>
                AQL {cls.aql}
              </span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed mb-2">{cls.description}</p>
            <div className="flex items-center gap-1.5">
              <Shield size={10} className={cls.colorText} />
              <span className={cn('text-[10px] font-semibold', cls.colorText)}>{cls.disposition}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Inspection Levels */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={14} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">Inspection Levels</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {INSPECTION_LEVELS.map((info) => (
            <div
              key={info.level}
              className={cn(
                'rounded-lg border p-3',
                info.level === 2 ? 'border-primary/30 bg-primary/5' : 'border-gray-200 bg-gray-50/50'
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-bold',
                  info.level === 2 ? 'bg-primary text-white' : 'bg-gray-200 text-text-primary'
                )}>
                  Level {info.code}
                </span>
                <span className="text-xs font-medium text-text-primary">{info.label}</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed mb-1.5">{info.description}</p>
              <p className="text-[10px] text-text-muted">
                <span className="font-semibold">When:</span> {info.whenToUse}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-text-muted mt-3">
          Default: Level II. Switch to Level III after 2 consecutive FAIL results. Revert to Level II after 5 consecutive PASS results on Level III.
        </p>
      </div>

      {/* Reference Tables */}
      <CollapsibleSection
        title="Lot Size → Code Letter"
        subtitle="15 lot size ranges mapped to code letters per inspection level"
        icon={<BookOpen size={14} className="text-text-muted" />}
        sectionKey="lot-size"
        expanded={expanded.has('lot-size')}
        onToggle={toggleSection}
      >
        <AQLReferenceTable variant="lot-size" highlightCodeLetter={highlightCode} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Code Letter → Sample Size"
        subtitle="16 code letters with corresponding sample sizes"
        icon={<BookOpen size={14} className="text-text-muted" />}
        sectionKey="sample-size"
        expanded={expanded.has('sample-size')}
        onToggle={toggleSection}
      >
        <AQLReferenceTable variant="sample-size" highlightCodeLetter={highlightCode} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Acceptance Limits Table"
        subtitle="Accept/Reject numbers for AQL 1.0, 2.5, and 4.0 — common apparel range highlighted"
        icon={<BookOpen size={14} className="text-text-muted" />}
        sectionKey="acceptance"
        expanded={expanded.has('acceptance')}
        onToggle={toggleSection}
      >
        <AQLReferenceTable variant="acceptance" highlightCodeLetter={highlightCode} />
      </CollapsibleSection>

      {/* Quick Reference */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">Quick Reference — Common Apparel Scenarios</h3>
          <p className="text-[10px] text-text-muted mt-0.5">Pre-computed results for typical lot sizes (Level II)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                {['Lot Size', 'Code', 'Sample', 'Major (Ac/Re)', 'Minor (Ac/Re)', 'Critical'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMMON_SCENARIOS.map((s) => (
                <tr key={s.lotSize} className="border-b border-gray-100 even:bg-gray-50/50">
                  <td className="px-3 py-2 text-xs font-semibold text-text-primary">{s.lotSize.toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs font-mono font-semibold">{s.codeLetter}</td>
                  <td className="px-3 py-2 text-xs">{s.sampleSize}</td>
                  <td className="px-3 py-2 text-xs font-mono text-orange-700">{s.majorAc} / {s.majorRe}</td>
                  <td className="px-3 py-2 text-xs font-mono text-blue-700">{s.minorAc} / {s.minorRe}</td>
                  <td className="px-3 py-2 text-xs font-mono text-red-700">0 / 1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Collapsible Section ────────────────────────────────────────────────────────

function CollapsibleSection({
  title, subtitle, icon, sectionKey, expanded, onToggle, children,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  sectionKey: string
  expanded: boolean
  onToggle: (key: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center gap-2 px-5 py-3 hover:bg-gray-50/50 transition-colors text-left"
      >
        {icon}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="text-[10px] text-text-muted">{subtitle}</p>
        </div>
        {expanded
          ? <ChevronUp size={16} className="text-text-muted shrink-0" />
          : <ChevronDown size={16} className="text-text-muted shrink-0" />
        }
      </button>
      {expanded && (
        <div className="border-t border-border">
          {children}
        </div>
      )}
    </div>
  )
}
