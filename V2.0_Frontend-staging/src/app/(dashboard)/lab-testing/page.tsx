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
      value: `${passedTests} (${passRate}%)`,
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
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Lab Testing</h1>
        <div className="flex items-center gap-3">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm text-text-muted hover:bg-gray-50 transition-colors">
            <FileDown size={16} />
            Export PDF
          </button>
          <button
            onClick={scrollToForm}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Submission
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={cn('bg-white rounded-xl border border-border p-5', card.accent)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">{card.label}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{card.value}</p>
              </div>
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', card.iconBg)}>
                <card.icon size={20} className={card.iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left column */}
        <div className="col-span-1 space-y-6">
          <div ref={formRef}>
            <SubmissionForm onSubmitted={loadData} />
          </div>
          <QualityScorecard passed={passedTests} total={totalSamples} />
        </div>

        {/* Right column */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <FailureTrendChart data={
            labTests.length > 0
              ? Object.entries(
                  labTests.reduce((acc, t) => {
                    const category = t.test_type || t.test_name || 'Other'
                    acc[category] = (acc[category] || 0) + (t.status === 'failed' ? 1 : 0)
                    return acc
                  }, {} as Record<string, number>)
                ).map(([name, value]) => ({ name, value }))
              : []
          } />

          {/* Recent Lab Submissions table */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-text-primary">Recent Lab Submissions</h3>
            </div>
            {/* Mobile card view */}
            <div className="lg:hidden p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : labTests.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <FlaskConical size={40} className="mx-auto text-text-light mb-3" />
                  <p className="text-sm">No lab submissions yet. Submit your first sample above.</p>
                </div>
              ) : (
                labTests.map((test) => (
                  <div key={test.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{test.sample_id}</span>
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', statusBadge[test.status] || 'bg-gray-50 text-text-muted border border-gray-200')}>
                        {test.status_display || test.status}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">{test.test_name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">{formatDate(test.submitted_at)}</span>
                      <button className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover transition-colors">
                        <Eye size={14} />
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop table */}
            <table className="hidden lg:table w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                    Sample ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                    Lab Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : labTests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                      <FlaskConical size={40} className="mx-auto text-text-light mb-3" />
                      <p className="text-sm">No lab submissions yet. Submit your first sample above.</p>
                    </td>
                  </tr>
                ) : (
                  labTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-text-primary">
                        {test.sample_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">{test.test_name}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {formatDate(test.submitted_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                            statusBadge[test.status] || 'bg-gray-50 text-text-muted border border-gray-200'
                          )}
                        >
                          {test.status_display || test.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover transition-colors">
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
  )
}
