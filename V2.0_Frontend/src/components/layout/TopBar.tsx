'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Bell, LogOut, User, ChevronDown, Check,
  ClipboardCheck, Clock, AlertTriangle, CheckCircle, Edit3, XCircle
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { getInitials, cn } from '@/lib/utils'
import api from '@/lib/api'
import TrialCountdown from '@/components/layout/TrialCountdown'

interface NotifItem {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  entity_type: string
  entity_id: string
  created_at: string
}

interface TopBarProps {
  backHref?: string
  backLabel?: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const NOTIF_ICONS: Record<string, typeof Bell> = {
  task_assigned: ClipboardCheck,
  task_reminder: Clock,
  task_overdue: AlertTriangle,
  task_completed: CheckCircle,
  task_updated: Edit3,
  task_cancelled: XCircle,
}

export default function TopBar({ backHref, backLabel }: TopBarProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotifItem[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count/')
      setUnreadCount(data.unread_count || data.count || 0)
    } catch (e) {
      void e
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  const loadNotifications = async () => {
    setNotifLoading(true)
    try {
      const { data } = await api.get('/notifications/')
      setNotifications(data)
    } catch (e) {
      void e
    } finally {
      setNotifLoading(false)
    }
  }

  const toggleNotifications = () => {
    if (!showNotifications) {
      loadNotifications()
    }
    setShowNotifications(!showNotifications)
    setShowUserMenu(false)
  }

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read/`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (e) {
      void e
    }
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all/')
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (e) {
      void e
    }
  }

  const handleNotifClick = (notif: NotifItem) => {
    if (!notif.read) markAsRead(notif.id)
    if (notif.entity_type === 'task') {
      router.push('/tasks')
      setShowNotifications(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {backHref && (
          <button
            onClick={() => router.push(backHref)}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            {backLabel || 'Back'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <TrialCountdown />
        <div className="relative" ref={notifRef}>
          <button
            onClick={toggleNotifications}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} className="text-text-muted" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-xl shadow-elevated border border-border-light z-50 max-h-[400px] flex flex-col">
              <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline font-medium">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1">
                {notifLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-light">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Icon = NOTIF_ICONS[notif.type] || Bell
                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          'px-4 py-3 border-b border-border-light last:border-0 hover:bg-gray-50 transition-colors cursor-pointer',
                          !notif.read && 'bg-primary/5'
                        )}
                        onClick={() => handleNotifClick(notif)}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon size={14} className="text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-text-primary truncate">
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-text-light mt-1">{timeAgo(notif.created_at)}</p>
                          </div>
                          {!notif.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notif.id)
                              }}
                              className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                              title="Mark as read"
                            >
                              <Check size={12} className="text-text-muted" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {user?.full_name ? getInitials(user.full_name) : 'U'}
              </span>
            </div>
            <ChevronDown size={14} className="text-text-muted" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-elevated border border-border-light py-2 z-50">
              <div className="px-4 py-2 border-b border-border-light">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { router.push('/settings'); setShowUserMenu(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors"
              >
                <User size={16} />
                Profile & Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-gray-50 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
