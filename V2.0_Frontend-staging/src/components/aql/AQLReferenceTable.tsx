'use client'

import { cn } from '@/lib/utils'
import { ArrowUp } from 'lucide-react'
import {
  type CodeLetter,
  LOT_SIZE_TABLE,
  CODE_ORDER,
  CODE_SAMPLE_MAP,
  ACCEPTANCE_TABLE,
  APPAREL_RANGE_CODES,
} from './aql-data'

interface AQLReferenceTableProps {
  variant: 'lot-size' | 'sample-size' | 'acceptance'
  highlightCodeLetter?: CodeLetter | null
}

function formatAcRe(entry: { accept: number | null; reject: number | null; arrow: '↑' | null }) {
  if (entry.arrow) return null // handled with arrow icon in JSX
  if (entry.accept === null) return '—'
  return `${entry.accept} / ${entry.reject}`
}

export default function AQLReferenceTable({ variant, highlightCodeLetter }: AQLReferenceTableProps) {
  const thClass = 'px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted text-left'
  const tdClass = 'px-3 py-2 text-xs text-text-primary'

  if (variant === 'lot-size') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className={thClass}>Lot Size Range</th>
              <th className={thClass}>Level I</th>
              <th className={cn(thClass, 'bg-primary/5')}>Level II (Default)</th>
              <th className={thClass}>Level III</th>
            </tr>
          </thead>
          <tbody>
            {LOT_SIZE_TABLE.map((row) => {
              const isHighlighted = highlightCodeLetter && (
                row.level1 === highlightCodeLetter ||
                row.level2 === highlightCodeLetter ||
                row.level3 === highlightCodeLetter
              )
              return (
                <tr
                  key={row.min}
                  className={cn(
                    'border-b border-gray-100 transition-colors',
                    isHighlighted ? 'bg-amber-50/60' : 'even:bg-gray-50/50'
                  )}
                >
                  <td className={cn(tdClass, 'font-medium')}>{row.label}</td>
                  <td className={cn(tdClass, 'font-mono')}>
                    <span className={cn(row.level1 === highlightCodeLetter && 'font-bold text-primary')}>{row.level1}</span>
                  </td>
                  <td className={cn(tdClass, 'font-mono bg-primary/5')}>
                    <span className={cn('font-semibold', row.level2 === highlightCodeLetter && 'text-primary')}>{row.level2}</span>
                  </td>
                  <td className={cn(tdClass, 'font-mono')}>
                    <span className={cn(row.level3 === highlightCodeLetter && 'font-bold text-primary')}>{row.level3}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  if (variant === 'sample-size') {
    // Display in two-column layout (8 per column)
    const half = Math.ceil(CODE_ORDER.length / 2)
    const left = CODE_ORDER.slice(0, half)
    const right = CODE_ORDER.slice(half)

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[left, right].map((group, gi) => (
          <table key={gi} className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className={thClass}>Code Letter</th>
                <th className={thClass}>Sample Size</th>
              </tr>
            </thead>
            <tbody>
              {group.map((code) => {
                const isHighlighted = code === highlightCodeLetter
                return (
                  <tr
                    key={code}
                    className={cn(
                      'border-b border-gray-100 transition-colors',
                      isHighlighted ? 'bg-amber-50/60' : 'even:bg-gray-50/50'
                    )}
                  >
                    <td className={cn(tdClass, 'font-mono font-semibold', isHighlighted && 'text-primary')}>{code}</td>
                    <td className={cn(tdClass, isHighlighted && 'font-semibold')}>
                      {CODE_SAMPLE_MAP[code].toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ))}
      </div>
    )
  }

  // acceptance variant
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-border">
            <th className={thClass}>Code</th>
            <th className={thClass}>Sample</th>
            <th className={cn(thClass, 'text-red-600')}>AQL 1.0 (Ac/Re)</th>
            <th className={cn(thClass, 'text-orange-600')}>AQL 2.5 (Ac/Re)</th>
            <th className={cn(thClass, 'text-blue-600')}>AQL 4.0 (Ac/Re)</th>
          </tr>
        </thead>
        <tbody>
          {ACCEPTANCE_TABLE.map((row) => {
            const isHighlighted = row.codeLetter === highlightCodeLetter
            const isApparel = APPAREL_RANGE_CODES.includes(row.codeLetter)
            return (
              <tr
                key={row.codeLetter}
                className={cn(
                  'border-b border-gray-100 transition-colors',
                  isHighlighted ? 'bg-amber-50/60' : isApparel ? 'bg-blue-50/30' : 'even:bg-gray-50/50'
                )}
              >
                <td className={cn(tdClass, 'font-mono font-semibold', isHighlighted && 'text-primary')}>
                  {row.codeLetter}
                </td>
                <td className={cn(tdClass, isApparel && 'font-semibold')}>
                  {row.sampleSize.toLocaleString()}
                </td>
                {(['aql10', 'aql25', 'aql40'] as const).map((aqlKey) => {
                  const entry = row[aqlKey]
                  const formatted = formatAcRe(entry)
                  return (
                    <td key={aqlKey} className={cn(tdClass, 'font-mono')}>
                      {entry.arrow ? (
                        <span className="inline-flex items-center gap-0.5 text-text-muted" title="Use next larger sample size">
                          <ArrowUp size={12} />
                        </span>
                      ) : (
                        <span className={cn(isApparel && 'font-semibold')}>{formatted}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
