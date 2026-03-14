'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Users } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

interface ChatMessage {
  id: string
  message: string
  sender_name: string
  sender_email: string
  created_at: string
}

interface MessageAreaProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  currentUserEmail: string
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function MessageArea({
  messages,
  onSendMessage,
  currentUserEmail,
}: MessageAreaProps) {
  const [draft, setDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onSendMessage(trimmed)
    setDraft('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            PO-2024-8842 / Execution Discussion
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Global Garments Ltd. &middot; Stitching &amp; Assembly Phase
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full">
          <Users size={14} className="text-primary" />
          <span className="text-xs font-medium text-primary">12 Active Members</span>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <Users size={40} className="text-text-light mb-3" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_email === currentUserEmail
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 max-w-[75%]',
                  isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0',
                    isOwn
                      ? 'bg-primary text-white'
                      : 'bg-sidebar-dark text-white'
                  )}
                >
                  {getInitials(msg.sender_name)}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    'rounded-xl px-4 py-2.5 min-w-0',
                    isOwn
                      ? 'bg-sidebar-dark text-white rounded-tr-sm'
                      : 'bg-white border border-border text-text-primary rounded-tl-sm'
                  )}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        isOwn ? 'text-white/80' : 'text-text-primary'
                      )}
                    >
                      {msg.sender_name}
                    </span>
                    <span
                      className={cn(
                        'text-[10px]',
                        isOwn ? 'text-white/50' : 'text-text-muted'
                      )}
                    >
                      {formatTimestamp(msg.created_at)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-sm leading-relaxed break-words',
                      isOwn ? 'text-white/95' : 'text-text-primary'
                    )}
                  >
                    {msg.message}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-white px-6 py-4">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            rows={2}
            placeholder="Type a message... (Shift+Enter for new line)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg transition-colors flex-shrink-0',
              draft.trim()
                ? 'bg-primary hover:bg-primary-hover text-white'
                : 'bg-gray-100 text-text-muted cursor-not-allowed'
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
