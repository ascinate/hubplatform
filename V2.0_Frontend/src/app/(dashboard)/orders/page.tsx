'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  Flame,
  AlertTriangle,
  CheckCircle,
  Package,
  Truck,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Copy,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn, formatDate, formatNumber } from '@/lib/utils'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useConfirm } from '@/hooks/useConfirm'

interface OrderStats {
  active: number
  urgent: number
  warning: number
  on_track: number
  delivered: number
}

interface Order {
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
  created_by_name?: string
  country?: string
  order_image_url?: string
  created_at: string
}

const statusCards = [
  { key: 'active', label: 'Active Orders', icon: Package, color: 'text-text-primary', bg: 'bg-white', border: 'border-border' },
  { key: 'urgent', label: 'Urgent', icon: Flame, color: 'text-danger', bg: 'bg-danger-light', border: 'border-danger/20' },
  { key: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-light', border: 'border-warning/20' },
  { key: 'on_track', label: 'On Track', icon: CheckCircle, color: 'text-info', bg: 'bg-info-light', border: 'border-info/20' },
  { key: 'delivered', label: 'Delivered', icon: Truck, color: 'text-success', bg: 'bg-success-light', border: 'border-success/20' },
]

const statusBadgeColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-warning-light text-warning',
  on_track: 'bg-info-light text-info',
  warning: 'bg-warning-light text-warning',
  urgent: 'bg-danger-light text-danger',
  completed: 'bg-success-light text-success',
  delivered: 'bg-success-light text-success',
  on_hold: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-100 text-gray-400',
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats>({ active: 0, urgent: 0, warning: 0, on_track: 0, delivered: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10
  const { confirm, modalProps } = useConfirm()

  useEffect(() => {
    loadOrders()
    loadStats()
  }, [page, statusFilter])

  const loadOrders = async () => {
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize }
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const { data } = await api.get('/production-orders/', { params })
      setOrders(data.results || data)
      setTotalCount(data.count || (data.results?.length ?? data.length))
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data } = await api.get('/analytics/summary/')
      setStats({
        active: data.total_orders - data.completed_orders,
        urgent: 0,
        warning: 0,
        on_track: data.pending_orders,
        delivered: data.completed_orders,
      })
    } catch {
      // Stats will show 0s
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    const ok = await confirm({
      title: 'Delete Order',
      message: 'Are you sure you want to delete this order? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/production-orders/${orderId}/`)
      toast.success('Order deleted')
      loadOrders()
      loadStats()
    } catch {
      toast.error('Failed to delete order')
    }
  }

  const handleCopyOrder = async (orderId: string) => {
    try {
      const { data: original } = await api.get(`/production-orders/${orderId}/`)
      await api.post('/production-orders/', {
        po_number: `${original.po_number}_COPY_${Date.now()}`,
        product_name: original.product_name,
        color: original.color || '',
        gender: original.gender || '',
        factory: original.factory,
        quantity: original.quantity,
        due_date: original.due_date,
        status: 'pending',
        description: original.description || '',
        notes: original.notes || '',
      })
      toast.success('Order duplicated')
      loadOrders()
      loadStats()
    } catch {
      toast.error('Failed to duplicate order')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadOrders()
  }

  const filteredOrders = useMemo(() => {
    if (!search) return orders
    const q = search.toLowerCase()
    return orders.filter(
      (o) =>
        o.po_number.toLowerCase().includes(q) ||
        o.product_name.toLowerCase().includes(q) ||
        (o.factory_name || '').toLowerCase().includes(q)
    )
  }, [orders, search])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-text-primary">My Orders</h1>
        <button
          onClick={() => router.push('/orders/new')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          New Order
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {statusCards.map((card) => (
          <button
            key={card.key}
            onClick={() => {
              setStatusFilter(statusFilter === card.key ? null : card.key)
              setPage(1)
            }}
            className={cn(
              'flex items-center gap-3 p-3 lg:p-4 rounded-xl border transition-all hover:shadow-card',
              card.bg,
              card.border,
              statusFilter === card.key && 'ring-2 ring-primary shadow-card'
            )}
          >
            <card.icon size={20} className={cn(card.color, 'flex-shrink-0')} />
            <div className="text-left">
              <p className="text-xl lg:text-2xl font-bold text-text-primary">
                {stats[card.key as keyof OrderStats]}
              </p>
              <p className="text-[10px] lg:text-xs text-text-muted">{card.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Order No., Supplier, Factory"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </form>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm text-text-muted hover:bg-gray-50 transition-colors">
          <Filter size={14} />
          Filter
        </button>
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-muted">
            No orders found. Create your first order to get started.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/orders/${order.id}`)}
              className="bg-white rounded-xl border border-border p-4 shadow-sm active:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-info">{order.po_number}</p>
                  <p className="text-xs text-text-muted mt-0.5 truncate">{order.product_name}</p>
                </div>
                <span className={cn(
                  'inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2',
                  statusBadgeColors[order.status] || 'bg-gray-100 text-gray-600'
                )}>
                  {order.status_display || order.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-[10px] text-text-light uppercase">Factory</p>
                  <p className="text-sm font-medium text-text-primary truncate">{order.factory_name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-light uppercase">Delivery</p>
                  <p className="text-sm font-medium text-text-primary">{order.due_date ? formatDate(order.due_date) : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-light uppercase">Qty</p>
                  <p className="text-sm font-medium text-text-primary">{formatNumber(order.quantity)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-light uppercase">Progress</p>
                  <p className="text-sm font-medium text-text-primary">{order.completion_percent}%</p>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={cn(
                    'h-full rounded-full',
                    order.completion_percent >= 80 ? 'bg-success' : order.completion_percent >= 40 ? 'bg-warning' : 'bg-primary'
                  )}
                  style={{ width: `${Math.min(order.completion_percent, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border-light">
                <button onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.id}`) }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs text-text-muted transition-colors">
                  <Eye size={14} /> View
                </button>
                <button onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.id}/edit`) }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs text-text-muted transition-colors">
                  <Edit size={14} /> Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleCopyOrder(order.id) }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs text-text-muted transition-colors">
                  <Copy size={14} /> Copy
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id) }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-xs text-danger transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Order No.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Factory</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Delivery Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Progress</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Qty</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading orders...
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    No orders found. Create your first order to get started.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-info hover:underline">
                        {order.po_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">{order.product_name}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{order.factory_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {order.due_date ? formatDate(order.due_date) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              order.completion_percent >= 80 ? 'bg-success' : order.completion_percent >= 40 ? 'bg-warning' : 'bg-primary'
                            )}
                            style={{ width: `${Math.min(order.completion_percent, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted font-medium min-w-[32px]">
                          {order.completion_percent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                        statusBadgeColors[order.status] || 'bg-gray-100 text-gray-600'
                      )}>
                        {order.status_display || order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {formatNumber(order.quantity)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button title="View" onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.id}`) }} className="p-1.5 rounded hover:bg-gray-100 text-text-muted hover:text-info transition-colors">
                          <Eye size={15} />
                        </button>
                        <button title="Edit" onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.id}/edit`) }} className="p-1.5 rounded hover:bg-gray-100 text-text-muted hover:text-primary transition-colors">
                          <Edit size={15} />
                        </button>
                        <button title="Copy" onClick={(e) => { e.stopPropagation(); handleCopyOrder(order.id) }} className="p-1.5 rounded hover:bg-gray-100 text-text-muted hover:text-indigo-500 transition-colors">
                          <Copy size={15} />
                        </button>
                        <button title="Delete" onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id) }} className="p-1.5 rounded hover:bg-gray-100 text-text-muted hover:text-danger transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-light">
            <span className="text-sm text-text-muted">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-sm font-medium">{page}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile pagination */}
      {totalPages > 1 && (
        <div className="lg:hidden flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 py-1 text-sm font-medium">{page}/{totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal {...modalProps} />
    </div>
  )
}
