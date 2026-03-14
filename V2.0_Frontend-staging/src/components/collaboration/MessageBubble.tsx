'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Image as ImageIcon, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message } from './CollaborationHub'

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderTextWithMentions(text: string, metadata: Record<string, any>, isOwn: boolean): React.ReactNode {
  const mentions: Array<{ user_id: string; user_name: string }> = metadata?.mentions || []
  if (mentions.length === 0) return text

  const pattern = mentions.map(m => `@${escapeRegex(m.user_name)}`).join('|')
  const regex = new RegExp(`(${pattern})`, 'g')
  const parts = text.split(regex)

  return parts.map((part, i) => {
    if (mentions.some(m => `@${m.user_name}` === part)) {
      return (
        <span key={i} className={cn('font-semibold', isOwn ? 'text-blue-300' : 'text-primary')}>
          {part}
        </span>
      )
    }
    return part
  })
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-purple-600',
  org_admin: 'text-purple-600',
  brand: 'text-primary',
  factory: 'text-blue-600',
  third_party: 'text-green-600',
  user: 'text-text-muted',
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [showFullImage, setShowFullImage] = useState(false)

  // System messages
  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center">
        <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] text-text-muted italic">
          {message.text}
        </span>
      </div>
    )
  }

  // Approval response
  if (message.message_type === 'approval_response') {
    const isApproved = message.metadata?.status === 'approved'
    return (
      <div className="flex justify-center">
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
          isApproved ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        )}>
          {isApproved ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {message.sender_name} {isApproved ? 'approved' : 'rejected'}: {message.text.replace(/^(Approved|Rejected): /, '')}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-text-muted">
            {getInitials(message.sender_name)}
          </span>
        </div>
      )}

      {/* Bubble */}
      <div className={cn('max-w-[70%] min-w-[120px]', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender info */}
        {!isOwn && (
          <div className="flex items-center gap-1.5 mb-0.5 px-1">
            <span className="text-[10px] font-semibold text-text-primary">{message.sender_name}</span>
            {message.sender_role && (
              <span className={cn('text-[9px] font-medium uppercase', ROLE_COLORS[message.sender_role] || 'text-text-muted')}>
                {message.sender_role.replace('_', ' ')}
              </span>
            )}
          </div>
        )}

        <div className={cn(
          'rounded-xl px-3 py-2',
          isOwn ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200',
          message.message_type === 'approval_request' && 'border-amber-200 bg-amber-50',
          message.message_type === 'inspection_activation' && 'border-blue-200 bg-blue-50',
        )}>
          {/* Photo message */}
          {message.message_type === 'photo' && message.attachment_url && (
            <div className="mb-1.5">
              <img
                src={message.attachment_url}
                alt={message.attachment_name || 'Photo'}
                className="rounded-lg max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowFullImage(true)}
              />
            </div>
          )}

          {/* Document message */}
          {message.message_type === 'document' && (
            <div className="flex items-center gap-2 mb-1.5 p-2 bg-gray-50 rounded-lg">
              <FileText size={16} className="text-text-muted shrink-0" />
              <span className="text-xs truncate">{message.attachment_name || 'Document'}</span>
            </div>
          )}

          {/* Approval request */}
          {message.message_type === 'approval_request' && (
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={12} className="text-amber-600" />
              <span className="text-[10px] font-semibold text-amber-700 uppercase">Approval Request</span>
            </div>
          )}

          {/* Inspection activation */}
          {message.message_type === 'inspection_activation' && (
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={12} className="text-blue-600" />
              <span className="text-[10px] font-semibold text-blue-700 uppercase">Inspection Activation</span>
            </div>
          )}

          {/* Text */}
          {message.text && (
            <p className={cn(
              'text-xs leading-relaxed whitespace-pre-wrap',
              isOwn && message.message_type === 'text' ? 'text-white' : '',
              message.message_type === 'approval_request' && 'text-text-primary',
              message.message_type === 'inspection_activation' && 'text-text-primary',
            )}>
              {renderTextWithMentions(message.text, message.metadata, isOwn)}
            </p>
          )}

          {/* Time */}
          <p className={cn(
            'text-[9px] mt-1',
            isOwn ? 'text-gray-400' : 'text-text-light',
            (message.message_type === 'approval_request' || message.message_type === 'inspection_activation') && 'text-text-light'
          )}>
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>

      {/* Full image overlay */}
      {showFullImage && message.attachment_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setShowFullImage(false)}
        >
          <img
            src={message.attachment_url}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] rounded-lg"
          />
        </div>
      )}
    </div>
  )
}
