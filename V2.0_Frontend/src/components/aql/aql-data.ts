// AQL Engine — ANSI/ASQ Z1.4 Standard
// Reusable data layer for AQL Standards page + future Inspection Forms

// ─── TYPES ──────────────────────────────────────────────────────────────────────

export type InspectionLevel = 1 | 2 | 3

export type CodeLetter = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'J'|'K'|'L'|'M'|'N'|'P'|'Q'|'R'

export interface LotSizeRow {
  min: number
  max: number
  label: string
  level1: CodeLetter
  level2: CodeLetter
  level3: CodeLetter
}

export interface AcceptReject {
  accept: number | null
  reject: number | null
  arrow: '↑' | null
}

export interface AcceptanceLimitRow {
  codeLetter: CodeLetter
  sampleSize: number
  aql10: AcceptReject
  aql25: AcceptReject
  aql40: AcceptReject
}

export interface AQLResult {
  lotSize: number
  level: InspectionLevel
  codeLetter: CodeLetter
  sampleSize: number
  critical: { accept: 0; reject: 1 }
  major: { accept: number; reject: number }
  minor: { accept: number; reject: number }
  warnings: string[]
}

export interface InspectionLevelInfo {
  level: InspectionLevel
  code: string
  label: string
  description: string
  whenToUse: string
}

export interface DefectClassInfo {
  key: string
  label: string
  aql: string
  description: string
  disposition: string
  colorDot: string
  colorBg: string
  colorText: string
  colorBorder: string
}

export interface CommonScenario {
  lotSize: number
  level: InspectionLevel
  codeLetter: CodeLetter
  sampleSize: number
  majorAc: number
  majorRe: number
  minorAc: number
  minorRe: number
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────

export const INSPECTION_LEVELS: InspectionLevelInfo[] = [
  {
    level: 1, code: 'I', label: 'Reduced',
    description: 'One step left on code letter table — smaller sample size.',
    whenToUse: 'Low-risk supplier, excellent quality history, trusted production.',
  },
  {
    level: 2, code: 'II', label: 'Normal (Default)',
    description: 'Standard inspection level — default for all inspections.',
    whenToUse: 'Most common; use unless supplier history dictates otherwise.',
  },
  {
    level: 3, code: 'III', label: 'Tightened',
    description: 'One step right on code letter table — larger sample size.',
    whenToUse: 'New supplier, poor quality history, critical or high-value order.',
  },
]

export const DEFECT_CLASSIFICATION: DefectClassInfo[] = [
  {
    key: 'critical', label: 'Critical', aql: '0.0',
    description: 'Safety hazard or regulatory non-compliance. Zero tolerance.',
    disposition: 'HALT — do not ship',
    colorDot: 'bg-red-500', colorBg: 'bg-red-50', colorText: 'text-red-700', colorBorder: 'border-red-200',
  },
  {
    key: 'major', label: 'Major', aql: '2.5',
    description: 'Defect likely to result in failure or reduces usability.',
    disposition: 'Rework or reject lot',
    colorDot: 'bg-orange-500', colorBg: 'bg-orange-50', colorText: 'text-orange-700', colorBorder: 'border-orange-200',
  },
  {
    key: 'minor', label: 'Minor', aql: '4.0',
    description: 'Defect unlikely to reduce usability but deviates from spec.',
    disposition: 'Conditional accept',
    colorDot: 'bg-blue-500', colorBg: 'bg-blue-50', colorText: 'text-blue-700', colorBorder: 'border-blue-200',
  },
]

export const LOT_SIZE_TABLE: LotSizeRow[] = [
  { min: 2,      max: 8,         label: '2 – 8',           level1: 'A', level2: 'A', level3: 'B' },
  { min: 9,      max: 15,        label: '9 – 15',          level1: 'A', level2: 'B', level3: 'C' },
  { min: 16,     max: 25,        label: '16 – 25',         level1: 'B', level2: 'C', level3: 'D' },
  { min: 26,     max: 50,        label: '26 – 50',         level1: 'C', level2: 'D', level3: 'E' },
  { min: 51,     max: 90,        label: '51 – 90',         level1: 'C', level2: 'E', level3: 'F' },
  { min: 91,     max: 150,       label: '91 – 150',        level1: 'D', level2: 'F', level3: 'G' },
  { min: 151,    max: 280,       label: '151 – 280',       level1: 'E', level2: 'G', level3: 'H' },
  { min: 281,    max: 500,       label: '281 – 500',       level1: 'F', level2: 'H', level3: 'J' },
  { min: 501,    max: 1200,      label: '501 – 1,200',     level1: 'G', level2: 'J', level3: 'K' },
  { min: 1201,   max: 3200,      label: '1,201 – 3,200',   level1: 'H', level2: 'K', level3: 'L' },
  { min: 3201,   max: 10000,     label: '3,201 – 10,000',  level1: 'J', level2: 'L', level3: 'M' },
  { min: 10001,  max: 35000,     label: '10,001 – 35,000', level1: 'K', level2: 'M', level3: 'N' },
  { min: 35001,  max: 150000,    label: '35,001 – 150,000', level1: 'L', level2: 'N', level3: 'P' },
  { min: 150001, max: 500000,    label: '150,001 – 500,000', level1: 'M', level2: 'P', level3: 'Q' },
  { min: 500001, max: 999999999, label: '500,001+',        level1: 'N', level2: 'Q', level3: 'R' },
]

export const CODE_SAMPLE_MAP: Record<CodeLetter, number> = {
  A: 2, B: 3, C: 5, D: 8, E: 13, F: 20,
  G: 32, H: 50, J: 80, K: 125, L: 200,
  M: 315, N: 500, P: 800, Q: 1250, R: 2000,
}

export const CODE_ORDER: CodeLetter[] = ['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R']

const ar = (accept: number | null, reject: number | null, arrow: '↑' | null = null): AcceptReject => ({ accept, reject, arrow })

export const ACCEPTANCE_TABLE: AcceptanceLimitRow[] = [
  { codeLetter: 'A', sampleSize: 2,    aql10: ar(null,null,'↑'), aql25: ar(null,null,'↑'), aql40: ar(null,null,'↑') },
  { codeLetter: 'B', sampleSize: 3,    aql10: ar(null,null,'↑'), aql25: ar(null,null,'↑'), aql40: ar(0,1) },
  { codeLetter: 'C', sampleSize: 5,    aql10: ar(0,1),           aql25: ar(null,null,'↑'), aql40: ar(0,1) },
  { codeLetter: 'D', sampleSize: 8,    aql10: ar(0,1),           aql25: ar(0,1),           aql40: ar(1,2) },
  { codeLetter: 'E', sampleSize: 13,   aql10: ar(0,1),           aql25: ar(1,2),           aql40: ar(1,2) },
  { codeLetter: 'F', sampleSize: 20,   aql10: ar(0,1),           aql25: ar(1,2),           aql40: ar(2,3) },
  { codeLetter: 'G', sampleSize: 32,   aql10: ar(1,2),           aql25: ar(2,3),           aql40: ar(3,4) },
  { codeLetter: 'H', sampleSize: 50,   aql10: ar(1,2),           aql25: ar(3,4),           aql40: ar(5,6) },
  { codeLetter: 'J', sampleSize: 80,   aql10: ar(2,3),           aql25: ar(5,6),           aql40: ar(7,8) },
  { codeLetter: 'K', sampleSize: 125,  aql10: ar(3,4),           aql25: ar(7,8),           aql40: ar(10,11) },
  { codeLetter: 'L', sampleSize: 200,  aql10: ar(5,6),           aql25: ar(10,11),         aql40: ar(14,15) },
  { codeLetter: 'M', sampleSize: 315,  aql10: ar(7,8),           aql25: ar(14,15),         aql40: ar(21,22) },
  { codeLetter: 'N', sampleSize: 500,  aql10: ar(10,11),         aql25: ar(21,22),         aql40: ar(null,null,'↑') },
  { codeLetter: 'P', sampleSize: 800,  aql10: ar(14,15),         aql25: ar(21,22),         aql40: ar(null,null,'↑') },
  { codeLetter: 'Q', sampleSize: 1250, aql10: ar(21,22),         aql25: ar(21,22),         aql40: ar(null,null,'↑') },
  { codeLetter: 'R', sampleSize: 2000, aql10: ar(21,22),         aql25: ar(null,null,'↑'), aql40: ar(null,null,'↑') },
]

// Common apparel code letters (H through M) for visual highlighting
export const APPAREL_RANGE_CODES: CodeLetter[] = ['H', 'J', 'K', 'L', 'M']

// ─── FUNCTIONS ──────────────────────────────────────────────────────────────────

export function getCodeLetter(lotSize: number, level: InspectionLevel = 2): CodeLetter {
  if (lotSize < 2) throw new Error('Lot size must be at least 2')
  const row = LOT_SIZE_TABLE.find(r => lotSize >= r.min && lotSize <= r.max)
  if (!row) throw new Error(`No code letter found for lot size ${lotSize}`)
  const key = `level${level}` as 'level1' | 'level2' | 'level3'
  return row[key]
}

export function getSampleSize(codeLetter: CodeLetter): number {
  const size = CODE_SAMPLE_MAP[codeLetter]
  if (size === undefined) throw new Error(`Unknown code letter: ${codeLetter}`)
  return size
}

export function resolveArrow(
  sampleSize: number,
  aqlKey: 'aql10' | 'aql25' | 'aql40'
): { accept: number; reject: number } {
  const startIdx = ACCEPTANCE_TABLE.findIndex(r => r.sampleSize === sampleSize)
  if (startIdx === -1) throw new Error(`No acceptance limits for sample size ${sampleSize}`)

  const entry = ACCEPTANCE_TABLE[startIdx][aqlKey]
  if (entry.arrow === null && entry.accept !== null) {
    return { accept: entry.accept, reject: entry.reject! }
  }

  // Walk up (↑) to find next larger sample size with actual values
  let idx = startIdx + 1
  while (idx < ACCEPTANCE_TABLE.length) {
    const candidate = ACCEPTANCE_TABLE[idx][aqlKey]
    if (candidate.arrow === null && candidate.accept !== null) {
      return { accept: candidate.accept, reject: candidate.reject! }
    }
    idx++
  }

  // Fallback: walk down
  idx = startIdx - 1
  while (idx >= 0) {
    const candidate = ACCEPTANCE_TABLE[idx][aqlKey]
    if (candidate.arrow === null && candidate.accept !== null) {
      return { accept: candidate.accept, reject: candidate.reject! }
    }
    idx--
  }

  throw new Error(`Arrow rule could not be resolved for sample size ${sampleSize} / ${aqlKey}`)
}

export function calculateAQL(lotSize: number, level: InspectionLevel = 2): AQLResult {
  const warnings: string[] = []
  const codeLetter = getCodeLetter(lotSize, level)
  const sampleSize = getSampleSize(codeLetter)

  const major = resolveArrow(sampleSize, 'aql25')
  const minor = resolveArrow(sampleSize, 'aql40')

  if (sampleSize > lotSize) {
    warnings.push(`Sample size (${sampleSize}) exceeds lot size (${lotSize}). Inspect 100%.`)
  }

  return {
    lotSize,
    level,
    codeLetter,
    sampleSize: Math.min(sampleSize, lotSize),
    critical: { accept: 0, reject: 1 },
    major,
    minor,
    warnings,
  }
}

// ─── COMMON SCENARIOS ───────────────────────────────────────────────────────────

export const COMMON_SCENARIOS: CommonScenario[] = [
  { lotSize: 120,   level: 2, codeLetter: 'F', sampleSize: 20,  majorAc: 1,  majorRe: 2,  minorAc: 2,  minorRe: 3 },
  { lotSize: 300,   level: 2, codeLetter: 'H', sampleSize: 50,  majorAc: 3,  majorRe: 4,  minorAc: 5,  minorRe: 6 },
  { lotSize: 500,   level: 2, codeLetter: 'H', sampleSize: 50,  majorAc: 3,  majorRe: 4,  minorAc: 5,  minorRe: 6 },
  { lotSize: 800,   level: 2, codeLetter: 'J', sampleSize: 80,  majorAc: 5,  majorRe: 6,  minorAc: 7,  minorRe: 8 },
  { lotSize: 1500,  level: 2, codeLetter: 'K', sampleSize: 125, majorAc: 7,  majorRe: 8,  minorAc: 10, minorRe: 11 },
  { lotSize: 3000,  level: 2, codeLetter: 'K', sampleSize: 125, majorAc: 7,  majorRe: 8,  minorAc: 10, minorRe: 11 },
  { lotSize: 5000,  level: 2, codeLetter: 'L', sampleSize: 200, majorAc: 10, majorRe: 11, minorAc: 14, minorRe: 15 },
  { lotSize: 15000, level: 2, codeLetter: 'M', sampleSize: 315, majorAc: 14, majorRe: 15, minorAc: 21, minorRe: 22 },
]
