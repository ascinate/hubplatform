'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  FileDown,
  Plus,
  Eye,
  FlaskConical,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import SubmissionForm from '@/components/lab-testing/SubmissionForm'
import QualityScorecard from '@/components/lab-testing/QualityScorecard'
import FailureTrendChart from '@/components/lab-testing/FailureTrendChart'

interface LabTest {
  id: string
  sample_id: string
  test_name: string
  test_type: string
  status: string
  status_display?: string
  submitted_at: string
}

interface SummaryData {
  total_samples?: number
  pending_tests?: number
  passed_tests?: number
  failed_tests?: number
}

const statusBadge: Record<string, string> = {
  passed: 'bg-green-50 text-success border border-green-200',
  failed: 'bg-red-50 text-danger border border-red-200',
  pending: 'bg-yellow-50 text-warning border border-yellow-200',
  hold: 'bg-yellow-50 text-warning border border-yellow-200',
}

export default function LabTestingPage() {
  const [labTests, setLabTests] = useState<LabTest[]>([])
  const [summary, setSummary] = useState<SummaryData>({})
  const [loading, setLoading] = useState(true)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [summaryRes, testsRes] = await Promise.all([
        api.get('/analytics/summary/'),
        api.get('/lab-tests/', { params: { ordering: '-submitted_at' } }),
      ])
      setSummary(summaryRes.data)
      const list = testsRes.data.results || testsRes.data
      setLabTests(list)
    } catch {
      toast.error('Failed to load lab testing data')
    } finally {
      setLoading(false)
    }
  }

  const totalSamples = summary.total_samples ?? labTests.length
  const pendingTests = summary.pending_tests ?? labTests.filter((t) => t.status === 'pending').length
  const passedTests = summary.passed_tests ?? labTests.filter((t) => t.status === 'passed').length
  const failedTests = summary.failed_tests ?? labTests.filter((t) => t.status === 'failed').length
  const passRate = totalSamples > 0 ? Math.round((passedTests / totalSamples) * 100) : 0

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const kpiCards = [
    {
      label: 'Total Samples',
      value: totalSamples,
      icon: Package,
      accent: '',
      iconBg: 'bg-gray-100',
      iconColor: 'text-text-muted',
    },
    {
      label: 'Pending Tests',
      value: pendingTests,
      icon: Clock,
      accent: 'border-l-4 border-l-warning',
      iconBg: 'bg-orange-50',
      iconColor: 'text-warning',
    },
    {
      label: 'Passed Quality',
      value: `${passedTests}`,
      icon: CheckCircle,
      accent: 'border-l-4 border-l-success',
      iconBg: 'bg-green-50',
      iconColor: 'text-success',
    },
    {
      label: 'Failed Tests',
      value: failedTests,
      icon: XCircle,
      accent: 'border-l-4 border-l-danger',
      iconBg: 'bg-red-50',
      iconColor: 'text-danger',
    },
  ]

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col space-y-4 lg:space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
        <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Lab Testing</h1>
        <div className="flex items-center gap-3">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm text-text-muted hover:bg-gray-50 transition-all shadow-sm">
            <FileDown size={16} />
            Export PDF
          </button>
          <button
            onClick={scrollToForm}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-all shadow-sm"
          >
            <Plus size={16} />
            New Submission
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 flex-shrink-0">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={cn('bg-white rounded-xl border border-border p-4 transition-all hover:shadow-md', card.accent)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">{card.label}</p>
                <p className="text-xl font-bold text-text-primary mt-1">{card.value}</p>
              </div>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', card.iconBg)}>
                <card.icon size={18} className={card.iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 overflow-hidden">
        {/* Left column: Form */}
        <div className="lg:col-span-4 flex flex-col overflow-hidden">
          <SubmissionForm onSubmitted={loadData} />
        </div>

        {/* Right column: Analytics & Reports */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
          {/* Graphs - Top Half (50%) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
            <FailureTrendChart 
              title="Failure Analytics"
              data={
                labTests.length > 0
                  ? Object.entries(
                    labTests.reduce((acc, t) => {
                      const category = t.test_type || t.test_name || 'Other'
                      acc[category] = (acc[category] || 0) + (t.status === 'failed' ? 1 : 0)
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([name, value]) => ({ name, value }))
                  : []
              } 
            />
            <QualityScorecard passed={passedTests} total={totalSamples} />
          </div>

          {/* Recent Lab Submissions - Bottom Half (50%) */}
          <div className="flex-1 min-h-0 bg-white rounded-xl border border-border flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex-shrink-0 flex items-center justify-between bg-gray-50/30">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-tight">Recent Lab Submissions</h3>
              <span className="text-[10px] font-bold text-text-muted">{labTests.length} Total</span>
            </div>
            
            {/* Table Area - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Mobile card view */}
              <div className="lg:hidden p-4 space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : labTests.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <FlaskConical size={40} className="mx-auto text-text-light mb-3" />
                    <p className="text-sm">No lab submissions yet.</p>
                  </div>
                ) : (
                  labTests.map((test) => (
                    <div key={test.id} className="bg-gray-50 rounded-lg p-4 pb-3 space-y-2 border border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-primary">{test.sample_id}</span>
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', statusBadge[test.status] || 'bg-gray-50 text-text-muted border border-gray-200')}>
                          {test.status_display || test.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted font-medium">{test.test_name}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-border/30">
                        <span className="text-[10px] text-text-muted">{formatDate(test.submitted_at)}</span>
                        <button className="flex items-center gap-1.5 text-xs text-primary font-bold hover:text-primary-hover transition-colors">
                          <Eye size={12} />
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop table */}
              <table className="hidden lg:table w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-white shadow-sm">
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                      Sample ID
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                      Lab Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : labTests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                        <FlaskConical size={32} className="mx-auto text-text-light mb-3 opacity-50" />
                        <p className="text-sm font-medium">No lab submissions found</p>
                      </td>
                    </tr>
                  ) : (
                    labTests.map((test) => (
                      <tr key={test.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <td className="px-4 py-3.5 text-sm font-bold text-text-primary">
                          {test.sample_id}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-text-muted font-medium">{test.test_name}</td>
                        <td className="px-4 py-3.5 text-sm text-text-muted font-medium">
                          {formatDate(test.submitted_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap',
                              statusBadge[test.status] || 'bg-gray-50 text-text-muted border border-gray-200'
                            )}
                          >
                            {test.status_display || test.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button className="flex items-center gap-1.5 text-sm text-primary font-bold hover:text-primary-hover transition-colors opacity-0 group-hover:opacity-100">
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
