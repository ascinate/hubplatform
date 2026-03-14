'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Send, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface Comment {
  id: string
  user_name: string
  user_email: string
  text: string
  attachment_url: string
  created_at: string
}

interface CommentModalProps {
  entityType: string
  entityId: string
  title: string
  onClose: () => void
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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function CommentModal({ entityType, entityId, title, onClose }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadComments()
  }, [])

  const loadComments = async () => {
    try {
      const { data } = await api.get(`/comments/?entity_type=${entityType}&entity_id=${entityId}`)
      setComments(data)
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 100)
    } catch {
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      await api.post('/comments/', {
        entity_type: entityType,
        entity_id: entityId,
        text: text.trim(),
      })
      setText('')
      loadComments()
    } catch {
      toast.error('Failed to send comment')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg flex flex-col max-h-[90vh] sm:max-h-[600px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Comments</h2>
            <p className="text-xs text-text-muted">{title}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Comments list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-sm text-text-light">
              No comments yet. Start the conversation!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-primary">
                    {getInitials(comment.user_name || comment.user_email)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {comment.user_name || comment.user_email}
                    </span>
                    <span className="text-[10px] text-text-light">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-text-muted mt-0.5 whitespace-pre-wrap break-words">
                    {comment.text}
                  </p>
                  {comment.attachment_url && (
                    <a
                      href={comment.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
                    >
                      <Paperclip size={11} />
                      Attachment
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a comment... (Enter to send)"
              rows={2}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
            <button
              onClick={handleSend}
              disabled={sending || !text.trim()}
              className="p-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
