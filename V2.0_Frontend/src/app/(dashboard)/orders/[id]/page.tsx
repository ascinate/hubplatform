'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ClipboardList,
  Calendar,
  MapPin,
  Package,
  Clock,
  Settings2,
  Plus,
  BarChart3,
  List,
  GitBranch,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn, formatDate, formatNumber } from '@/lib/utils'
import TabPills from '@/components/ui/TabPills'
import PlanModal from '@/components/production/PlanModal'
import DayGrid from '@/components/production/DayGrid'
import CumulativeChart from '@/components/production/CumulativeChart'
import WorkflowOverview from '@/components/tna/WorkflowOverview'
import TaskList from '@/components/tna/TaskList'
import GanttTimeline from '@/components/tna/GanttTimeline'
import StatusUpdateModal from '@/components/tna/StatusUpdateModal'
import CommentModal from '@/components/tna/CommentModal'
import AddStageModal from '@/components/tna/AddStageModal'
import WorkflowProgressBar from '@/components/tna/WorkflowProgressBar'
import OrderStatusBadge from '@/components/tna/OrderStatusBadge'
import StageDrawer from '@/components/tna/StageDrawer'
import WorkflowTimeline from '@/components/tna/WorkflowTimeline'
import OrderDocumentsTab from '@/components/documents/OrderDocumentsTab'
import DocumentActionBar from '@/components/documents/DocumentActionBar'

interface OrderDetail {
  id: string
  po_number: string
  product_name: string
  factory_name?: string
  status: string
  status_display?: string
  quantity: number
  completed_quantity: number
  completion_percent: number
  due_date: string | null
  notes: string
  country?: string
  description?: string
  order_image_url?: string
  created_at: string
}

interface ProductionPlan {
  id: string
  start_date: string
  end_date: string
  planned_lines: number
  daily_pieces_per_line: number
  production_days: number
  total_planned: number
  days: any[]
}

interface ProgressData {
  percent: number
  color: string
  status_label: string
}

const detailTabs = [
  { key: 'details', label: 'Order Details' },
  { key: 'tna', label: 'Time & Action' },
  { key: 'production', label: 'Production Status' },
  { key: 'documents', label: 'Documents' },
]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')

  // Production state
  const [productionPlan, setProductionPlan] = useState<ProductionPlan | null>(null)
  const [productionLoading, setProductionLoading] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)

  // T&A state
  const [stages, setStages] = useState<any[]>([])
  const [tnaLoading, setTnaLoading] = useState(false)
  const [tnaView, setTnaView] = useState<'tasks' | 'timeline' | 'gantt'>('tasks')
  const [showAddStage, setShowAddStage] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [commentTask, setCommentTask] = useState<any>(null)

  // Workflow progress state
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [drawerStage, setDrawerStage] = useState<any>(null)
  const [initializingWorkflow, setInitializingWorkflow] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [params.id])

  useEffect(() => {
    if (activeTab === 'production' && order) loadProduction()
    if (activeTab === 'tna' && order) {
      loadWorkflow()
      loadProgress()
    }
  }, [activeTab, order?.id])

  const loadOrder = async () => {
    try {
      const { data } = await api.get(`/production-orders/${params.id}/`)
      setOrder(data)
    } catch {
      toast.error('Failed to load order')
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const loadProduction = async () => {
    setProductionLoading(true)
    try {
      const { data } = await api.get(`/orders/${params.id}/production/`)
      setProductionPlan(data.plan || null)
    } catch {
      setProductionPlan(null)
    } finally {
      setProductionLoading(false)
    }
  }

  const loadWorkflow = async () => {
    setTnaLoading(true)
    try {
      const { data } = await api.get(`/orders/${params.id}/workflow/`)
      setStages(Array.isArray(data) ? data : data.stages || [])
    } catch {
      setStages([])
    } finally {
      setTnaLoading(false)
    }
  }

  const loadProgress = async () => {
    try {
      const { data } = await api.get(`/orders/${params.id}/progress/`)
      setProgress(data)
    } catch {
      setProgress(null)
    }
  }

  const handleInitializeWorkflow = async () => {
    setInitializingWorkflow(true)
    try {
      await api.post(`/orders/${params.id}/workflow/initialize/`)
      toast.success('Workflow initialized with default template')
      loadWorkflow()
      loadProgress()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to initialize workflow')
    } finally {
      setInitializingWorkflow(false)
    }
  }

  const handleStageClick = (stage: any) => {
    if (stage.status === 'pending' || stage.status === 'skipped') return
    setDrawerStage(stage)
  }

  const hasWorkflowStages = stages.some(s => s.status && s.sequence_number > 0)
  const hasDelays = stages.some((s: any) => s.is_delayed)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div ref={exportRef} className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push('/orders')}
        className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Orders
      </button>

      {/* Order header card */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package size={32} className="text-text-light" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">
              Order no. {order.po_number}
            </h1>
            <p className="text-sm text-text-muted mt-0.5">{order.product_name}</p>

            {/* Order Status Badge */}
            {progress && (
              <div className="mt-2">
                <OrderStatusBadge
                  statusLabel={progress.status_label}
                  progressPercent={progress.percent}
                  progressColor={progress.color}
                  dueDate={order.due_date}
                  isDelayed={hasDelays}
                  delayDays={stages.find((s: any) => s.is_delayed)?.delay_days}
                />
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {order.factory_name && (
                <div className="flex items-center gap-1.5 text-sm text-text-muted">
                  <ClipboardList size={14} />
                  <span>{order.factory_name}</span>
                </div>
              )}
              {order.country && (
                <div className="flex items-center gap-1.5 text-sm text-text-muted">
                  <MapPin size={14} />
                  <span>{order.country}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-text-muted">
                <Package size={14} />
                <span>{formatNumber(order.quantity)}</span>
              </div>
              {order.due_date && (
                <div className="flex items-center gap-1.5 text-sm text-text-muted">
                  <Calendar size={14} />
                  <span>{formatDate(order.due_date)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-text-muted">
                <Clock size={14} />
                <span>Created {formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-bold text-primary">{progress?.percent ?? order.completion_percent}%</div>
            <p className="text-xs text-text-muted mt-1">Complete</p>
          </div>
        </div>
      </div>

      {/* Document Actions */}
      <DocumentActionBar
        exportTargetRef={exportRef}
        exportFileName={`Order-${order.po_number}`}
      />

      {/* Sub-tab navigation */}
      <TabPills
        tabs={detailTabs.map((t) => ({ id: t.key, label: t.label }))}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as string)}
      />

      {/* === ORDER DETAILS TAB === */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Order Number</label>
                <p className="text-sm text-text-primary mt-1">{order.po_number}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Product</label>
                <p className="text-sm text-text-primary mt-1">{order.product_name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Status</label>
                <p className="text-sm text-text-primary mt-1 capitalize">{order.status_display || order.status.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Quantity</label>
                <p className="text-sm text-text-primary mt-1">{formatNumber(order.quantity)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Factory</label>
                <p className="text-sm text-text-primary mt-1">{order.factory_name || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Delivery Date</label>
                <p className="text-sm text-text-primary mt-1">{order.due_date ? formatDate(order.due_date, 'long') : '—'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Completed</label>
                <p className="text-sm text-text-primary mt-1">{formatNumber(order.completed_quantity)} / {formatNumber(order.quantity)}</p>
              </div>
              {order.notes && (
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Notes</label>
                  <p className="text-sm text-text-primary mt-1">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === TIME & ACTION TAB === */}
      {activeTab === 'tna' && (
        <>
          {tnaLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stages.length > 0 ? (
            <div className="space-y-4">
              {/* Workflow Progress Bar (gate-logic stages) */}
              {hasWorkflowStages && progress && (
                <WorkflowProgressBar
                  stages={stages}
                  progressPercent={progress.percent}
                  progressColor={progress.color}
                  onStageClick={handleStageClick}
                />
              )}

              {/* Workflow overview (legacy circles) */}
              {!hasWorkflowStages && (
                <WorkflowOverview stages={stages} dueDate={order.due_date} />
              )}

              {/* View toggle + actions */}
              <div className="flex items-center justify-between">
                <TabPills
                  tabs={[
                    { id: 'tasks', label: 'Tasks', icon: <List size={13} /> },
                    ...(hasWorkflowStages ? [{ id: 'timeline', label: 'Timeline', icon: <GitBranch size={13} /> }] : []),
                    { id: 'gantt', label: 'Gantt', icon: <BarChart3 size={13} /> },
                  ]}
                  activeTab={tnaView}
                  onTabChange={(id) => setTnaView(id as 'tasks' | 'timeline' | 'gantt')}
                  compact
                />

                <button
                  onClick={() => setShowAddStage(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus size={13} />
                  Add Stage
                </button>
              </div>

              {/* Views */}
              {tnaView === 'tasks' && (
                <TaskList
                  stages={stages}
                  onTaskClick={(task) => {
                    setCommentTask(task)
                    setShowCommentModal(true)
                  }}
                  onStatusUpdate={(task) => {
                    setSelectedTask(task)
                    setShowStatusModal(true)
                  }}
                />
              )}
              {tnaView === 'timeline' && hasWorkflowStages && (
                <WorkflowTimeline
                  stages={stages}
                  onStageClick={handleStageClick}
                />
              )}
              {tnaView === 'gantt' && (
                <GanttTimeline stages={stages} />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <div className="max-w-md mx-auto">
                <GitBranch size={48} className="mx-auto text-text-light mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Time & Action</h3>
                <p className="text-sm text-text-muted mb-6">
                  Track workflow stages, assign tasks, and monitor progress across the entire order lifecycle.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleInitializeWorkflow}
                    disabled={initializingWorkflow}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Zap size={14} />
                    {initializingWorkflow ? 'Initializing...' : 'Initialize from Template'}
                  </button>
                  <button
                    onClick={() => setShowAddStage(true)}
                    className="px-5 py-2.5 border border-border hover:bg-gray-50 text-text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    Manual Setup
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* === PRODUCTION STATUS TAB === */}
      {activeTab === 'production' && (
        <>
          {productionLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : productionPlan ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  Production Plan — {formatDate(productionPlan.start_date)} to {formatDate(productionPlan.end_date)}
                </h3>
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-gray-50 transition-colors text-text-muted"
                >
                  <Settings2 size={13} />
                  Edit Plan
                </button>
              </div>
              <div className="bg-white rounded-xl border border-border p-5">
                <DayGrid plan={productionPlan} onDayUpdated={loadProduction} />
              </div>
              <div className="bg-white rounded-xl border border-border p-5">
                <CumulativeChart plan={productionPlan} orderQuantity={order.quantity} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <div className="max-w-md mx-auto">
                <Package size={48} className="mx-auto text-text-light mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Production Status</h3>
                <p className="text-sm text-text-muted mb-6">
                  Set up a production plan with daily targets, track actuals, and monitor cumulative progress.
                </p>
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
                >
                  + Set Plan
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* === DOCUMENTS TAB === */}
      {activeTab === 'documents' && order && (
        <OrderDocumentsTab orderId={order.id} poNumber={order.po_number} />
      )}

      {/* === MODALS === */}
      {showPlanModal && order && (
        <PlanModal
          orderId={order.id}
          orderQuantity={order.quantity}
          dueDate={order.due_date}
          onClose={() => setShowPlanModal(false)}
          onCreated={() => {
            setShowPlanModal(false)
            loadProduction()
          }}
        />
      )}

      {showAddStage && order && (
        <AddStageModal
          orderId={order.id}
          onClose={() => setShowAddStage(false)}
          onCreated={() => {
            setShowAddStage(false)
            loadWorkflow()
            loadProgress()
          }}
        />
      )}

      {showStatusModal && selectedTask && (
        <StatusUpdateModal
          task={selectedTask}
          onClose={() => {
            setShowStatusModal(false)
            setSelectedTask(null)
          }}
          onUpdated={() => {
            setShowStatusModal(false)
            setSelectedTask(null)
            loadWorkflow()
            loadProgress()
          }}
        />
      )}

      {showCommentModal && commentTask && (
        <CommentModal
          entityType="task"
          entityId={commentTask.id}
          title={commentTask.name}
          onClose={() => {
            setShowCommentModal(false)
            setCommentTask(null)
          }}
        />
      )}

      {/* Stage Drawer */}
      {drawerStage && order && (
        <StageDrawer
          orderId={order.id}
          stage={drawerStage}
          open={!!drawerStage}
          onClose={() => setDrawerStage(null)}
          onUpdate={() => {
            loadWorkflow()
            loadProgress()
          }}
        />
      )}
    </div>
  )
}
