'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import MessageBubble from './MessageBubble'
import MessageComposer from './MessageComposer'
import TypingIndicator from './TypingIndicator'
import type { Room, Message } from './CollaborationHub'
import type { Participant } from './ContextPanel'

interface MessageThreadProps {
  room: Room | null
  messages: Message[]
  loading: boolean
  isConnected: boolean
  currentUserId: string
  onSendText: (text: string, metadata?: Record<string, any>) => void
  onUpload: (file: File, caption: string) => void
  onTyping: (isTyping: boolean) => void
  participants: Participant[]
}

export default function MessageThread({
  room, messages, loading, isConnected, currentUserId,
  onSendText, onUpload, onTyping, participants,
}: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map())

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/30">
        <div className="text-center">
          <MessageSquare size={40} className="mx-auto text-text-light mb-3" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">Select a Room</h3>
          <p className="text-xs text-text-muted">Choose a room from the left to start collaborating</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">{room.name}</h3>
          <p className="text-[10px] text-text-muted">
            {room.participant_count} participant{room.participant_count !== 1 ? 's' : ''}
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium',
          isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        )}>
          {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/30">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs text-text-muted">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender === currentUserId || msg.sender_id === currentUserId}
            />
          ))
        )}
        {typingUsers.size > 0 && (
          <TypingIndicator users={Array.from(typingUsers.values())} />
        )}
      </div>

      {/* Composer */}
      <MessageComposer
        onSendText={onSendText}
        onUpload={onUpload}
        onTyping={onTyping}
        disabled={!room}
        participants={participants}
      />
    </div>
  )
}
