'use client'

import { Suspense, useEffect, useState } from 'react'
import {
  Search,
  CheckCircle,
  Diamond,
  Settings,
  Filter,
  Users,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import api from '@/lib/api'
import { cn, formatNumber } from '@/lib/utils'
import CollaborationHub from '@/components/collaboration/CollaborationHub'

interface LiveboardData {
  total_inspections: number
  total_lab_tests: number
  passed_lab_tests: number
  avg_defect_rate: number
  failed_inspections: number
}

const kpiCards = [
  { key: 'inspections', label: 'INSPECTIONS', icon: Search, iconColor: 'text-teal-500' },
  { key: 'passed', label: 'PASSED', icon: CheckCircle, iconColor: 'text-emerald-500' },
  { key: 'pieces', label: 'PIECES CHECKED', icon: Diamond, iconColor: 'text-blue-500' },
  { key: 'defect_rate', label: 'DEFECT RATE', icon: Settings, iconColor: 'text-pink-500' },
]

const defectsByCodeData = [
  { code: 'G-MN-01', name: 'Loose Thread', count: 45 },
  { code: 'MAT-004', name: 'Color Stain / Fading', count: 38 },
  { code: 'CON-001', name: 'Seam Breakage / Broken Stitch', count: 32 },
  { code: 'G-MJ-03', name: 'Size Mismatch', count: 28 },
  { code: 'MAT-001', name: 'Fabric Tear / Delamination', count: 22 },
  { code: 'G-MJ-07', name: 'Button Missing', count: 18 },
  { code: 'CON-002', name: 'Zipper Malfunction', count: 15 },
  { code: 'PRN-001', name: 'Print / Label Error', count: 12 },
  { code: 'G-MN-04', name: 'Hem Issue', count: 9 },
  { code: 'G-MJ-17', name: 'Wrong Label', count: 6 },
]

const evolutionData = [
  { month: 'Sep', 'Loose Thread': 30, 'Color Stain': 25, 'Broken Stitch': 20, 'Size Mismatch': 15, 'Fabric Tear': 10 },
  { month: 'Oct', 'Loose Thread': 35, 'Color Stain': 28, 'Broken Stitch': 22, 'Size Mismatch': 18, 'Fabric Tear': 14 },
  { month: 'Nov', 'Loose Thread': 40, 'Color Stain': 32, 'Broken Stitch': 28, 'Size Mismatch': 22, 'Fabric Tear': 18 },
  { month: 'Dec', 'Loose Thread': 38, 'Color Stain': 35, 'Broken Stitch': 30, 'Size Mismatch': 25, 'Fabric Tear': 20 },
  { month: 'Jan', 'Loose Thread': 42, 'Color Stain': 36, 'Broken Stitch': 31, 'Size Mismatch': 27, 'Fabric Tear': 21 },
  { month: 'Feb', 'Loose Thread': 45, 'Color Stain': 38, 'Broken Stitch': 32, 'Size Mismatch': 28, 'Fabric Tear': 22 },
]

const evolutionLineColors = ['#1ABC9C', '#E91E63', '#E67E22', '#2E86C1', '#27AE60']
const evolutionDefects = ['Loose Thread', 'Color Stain', 'Broken Stitch', 'Size Mismatch', 'Fabric Tear']

const countriesData = [
  { country: 'Bangladesh', rate: 4.2 },
  { country: 'India', rate: 3.8 },
  { country: 'Vietnam', rate: 2.9 },
  { country: 'China', rate: 2.1 },
  { country: 'Turkey', rate: 1.5 },
]

const suppliersData = [
  { supplier: 'Apex Textiles', rate: 5.1 },
  { supplier: 'Global Garments', rate: 3.9 },
  { supplier: 'Oceanic Exports', rate: 3.2 },
  { supplier: 'Elite Fabrics', rate: 2.4 },
  { supplier: 'Standard Mills', rate: 1.8 },
]

// --- New data: Product category defect distribution ---
const categoryDefectData = [
  { name: 'Garments', value: 245, color: '#E67E22' },
  { name: 'Gloves', value: 89, color: '#27AE60' },
  { name: 'Footwear', value: 134, color: '#2E86C1' },
  { name: 'Headwear', value: 56, color: '#F39C12' },
  { name: 'Accessories', value: 42, color: '#E91E63' },
  { name: 'Bags', value: 31, color: '#1ABC9C' },
]

// --- New data: Severity distribution ---
const severityDistributionData = [
  { name: 'Critical', value: 12, color: '#E74C3C' },
  { name: 'Major', value: 48, color: '#E67E22' },
  { name: 'Minor', value: 165, color: '#2E86C1' },
  { name: 'Cosmetic', value: 38, color: '#9B59B6' },
]
const severityTotal = severityDistributionData.reduce((s, d) => s + d.value, 0)

// --- New data: Supplier correlation (scatter/bubble) ---
const supplierCorrelationData = [
  { supplier: 'Apex Textiles', inspections: 45, defectRate: 5.1, orderVolume: 12000 },
  { supplier: 'Global Garments', inspections: 62, defectRate: 3.9, orderVolume: 18500 },
  { supplier: 'Oceanic Exports', inspections: 38, defectRate: 3.2, orderVolume: 9800 },
  { supplier: 'Elite Fabrics', inspections: 71, defectRate: 2.4, orderVolume: 22000 },
  { supplier: 'Standard Mills', inspections: 55, defectRate: 1.8, orderVolume: 15000 },
  { supplier: 'Pacific Stitch', inspections: 29, defectRate: 4.5, orderVolume: 7500 },
  { supplier: 'Metro Textiles', inspections: 48, defectRate: 2.9, orderVolume: 13200 },
  { supplier: 'Prime Garments', inspections: 34, defectRate: 6.2, orderVolume: 8900 },
]

// Custom pie label renderer (hide if slice < 5%)
const renderPieLabel = ({ name, percent, x, y, midAngle }: any) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = 10
  const nx = x + radius * Math.cos(-midAngle * RADIAN)
  const ny = y + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={nx} y={ny} fill="#333" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={500}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// Custom scatter tooltip
const ScatterTooltipContent = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-text-primary mb-1">{d.supplier}</p>
      <p className="text-text-muted">Inspections: <span className="font-medium text-text-primary">{d.inspections}</span></p>
      <p className="text-text-muted">Defect Rate: <span className="font-medium text-text-primary">{d.defectRate}%</span></p>
      <p className="text-text-muted">Order Volume: <span className="font-medium text-text-primary">{formatNumber(d.orderVolume)}</span></p>
    </div>
  )
}

export default function LiveboardPage() {
  const [mode, setMode] = useState<'tna' | 'inspection'>('inspection')
  const [data, setData] = useState<LiveboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (mode === 'inspection') loadData()
  }, [mode])

  const loadData = async () => {
    try {
      const { data: summary } = await api.get('/analytics/summary/')
      setData(summary)
    } catch {
      // Will show empty state
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-text-primary">My Liveboard</h1>
        {mode === 'inspection' && (
          <div className="flex items-center gap-2">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-text-muted hover:bg-gray-50">
              <Filter size={14} />
              Filters
            </button>
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode('tna')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            mode === 'tna' ? 'bg-text-primary text-white' : 'bg-white text-text-muted border border-border'
          )}
        >
          <Users size={14} />
          Collaboration
        </button>
        <button
          onClick={() => setMode('inspection')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            mode === 'inspection' ? 'bg-primary text-white' : 'bg-white text-text-muted border border-border'
          )}
        >
          Inspection
        </button>
      </div>

      {/* Collaboration Hub */}
      {mode === 'tna' && (
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <CollaborationHub />
        </Suspense>
      )}

      {/* Inspection Analytics */}
      {mode === 'inspection' && (
        <>
          {/* KPI Cards — Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 lg:gap-4">
            {kpiCards.map((card) => {
              let value = '0'
              if (data) {
                switch (card.key) {
                  case 'inspections': value = String(data.total_inspections || 0); break
                  case 'passed': value = String(data.passed_lab_tests || 0); break
                  case 'pieces': value = formatNumber(data.total_lab_tests || 0); break
                  case 'defect_rate': value = `${data.avg_defect_rate || 0}%`; break
                }
              }
              return (
                <div key={card.key} className="rounded-xl p-5 bg-white border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <card.icon size={20} className={card.iconColor} />
                  </div>
                  <p className="text-3xl font-bold text-text-primary">{loading ? '—' : value}</p>
                  <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">{card.label}</p>
                </div>
              )
            })}
          </div>

          {/* KPI Cards — Row 2 (New) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 lg:gap-4">
            {/* Supplier Pass Rate */}
            <div className="rounded-xl p-5 bg-white border border-border">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp size={20} className="text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-text-primary">87.3%</p>
              <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">SUPPLIER PASS RATE</p>
            </div>

            {/* Severity Breakdown */}
            <div className="rounded-xl p-5 bg-white border border-border">
              <div className="flex items-center justify-between mb-3">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-red-600">12</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[9px] text-text-muted uppercase">Crit</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-orange-500">48</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-[9px] text-text-muted uppercase">Major</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-blue-500">165</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[9px] text-text-muted uppercase">Minor</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-muted mt-2 uppercase tracking-wider">SEVERITY BREAKDOWN</p>
            </div>

            {/* OQR% */}
            <div className="rounded-xl p-5 bg-white border border-border">
              <div className="flex items-center justify-between mb-3">
                <ShieldCheck size={20} className="text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-text-primary">2.4%</p>
              <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">OQR% <span className="normal-case">(Outgoing Quality Risk)</span></p>
            </div>

            {/* FP AQL% */}
            <div className="rounded-xl p-5 bg-white border border-border">
              <div className="flex items-center justify-between mb-3">
                <BarChart3 size={20} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-text-primary">91.7%</p>
              <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">FP AQL% <span className="normal-case">(First-Pass Rate)</span></p>
            </div>
          </div>

          {/* Charts — Row 1 (existing) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-white rounded-xl border border-border p-6 min-h-[300px]">
              <h3 className="text-sm font-semibold text-text-primary mb-4">TOP 10 DEFECTS BY CODE</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={defectsByCodeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="code" interval={0} tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
                        <p className="font-semibold text-text-primary">{d.code}</p>
                        <p className="text-text-muted">{d.name}</p>
                        <p className="text-text-primary mt-1 font-medium">Count: {d.count}</p>
                      </div>
                    )
                  }} />
                  <Bar dataKey="count" fill="#1ABC9C" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-border p-6 min-h-[300px]">
              <h3 className="text-sm font-semibold text-text-primary mb-4">EVOLUTION OF TOP 5 DEFECTS</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend verticalAlign="bottom" />
                  {evolutionDefects.map((defect, index) => (
                    <Line
                      key={defect}
                      type="monotone"
                      dataKey={defect}
                      stroke={evolutionLineColors[index]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-border p-6 min-h-[300px]">
              <h3 className="text-sm font-semibold text-text-primary mb-4">TOP 5 COUNTRIES IN DEFECT RATE</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={countriesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="country" type="category" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#E67E22" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-border p-6 min-h-[300px]">
              <h3 className="text-sm font-semibold text-text-primary mb-4">TOP 5 SUPPLIERS IN DEFECT RATE</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={suppliersData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="supplier" type="category" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#E91E63" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts — Row 2 (New: Pie, Donut, Scatter) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Pie: Defect Distribution by Product Category */}
            <div className="bg-white rounded-xl border border-border p-6 min-h-[340px]">
              <h3 className="text-sm font-semibold text-text-primary mb-4">DEFECTS BY PRODUCT CATEGORY</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={categoryDefectData}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    dataKey="value"
                    label={renderPieLabel}
                    labelLine={false}
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {categoryDefectData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} defects`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Donut: Defect Severity Distribution */}
            <div className="bg-white rounded-xl border border-border p-6 min-h-[340px]">
              <h3 className="text-sm font-semibold text-text-primary mb-4">DEFECT SEVERITY DISTRIBUTION</h3>
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={severityDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={0}
                    >
                      {severityDistributionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        const pct = ((Number(value) / severityTotal) * 100).toFixed(1)
                        return [`${value} (${pct}%)`, name]
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ height: 200 }}>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">{severityTotal}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Defects</p>
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-2">
                {severityDistributionData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] text-text-muted">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scatter/Bubble: Supplier Defect Rate vs Inspection Volume */}
            <div className="bg-white rounded-xl border border-border p-6 min-h-[340px]">
              <h3 className="text-sm font-semibold text-text-primary mb-1">SUPPLIER: DEFECT RATE vs VOLUME</h3>
              <p className="text-[10px] text-text-muted mb-3">Bubble size = order volume</p>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="inspections"
                    name="Inspections"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Inspections', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#888' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="defectRate"
                    name="Defect Rate %"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Defect Rate %', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#888' }}
                  />
                  <ZAxis
                    type="number"
                    dataKey="orderVolume"
                    range={[60, 400]}
                    name="Order Volume"
                  />
                  <Tooltip content={<ScatterTooltipContent />} />
                  <Scatter
                    data={supplierCorrelationData}
                    fill="#E67E22"
                    fillOpacity={0.65}
                    stroke="#E67E22"
                    strokeWidth={1}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
