'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { useWebSocket } from '@/lib/useWebSocket'
import RoomList from './RoomList'
import MessageThread from './MessageThread'
import ContextPanel, { type Participant } from './ContextPanel'

export interface Room {
  id: string
  room_type: 'po' | 'factory' | 'inspection'
  name: string
  is_active: boolean
  entity_name: string
  entity_id: string | null
  unread_count: number
  participant_count: number
  last_message: {
    text: string
    sender_name: string
    created_at: string
    message_type: string
  } | null
  created_at: string
}

export interface Message {
  id: string
  sender_id?: string
  sender: string
  sender_name: string
  sender_email: string
  sender_role: string
  message_type: string
  text: string
  attachment?: string
  attachment_url?: string | null
  attachment_name?: string
  metadata: Record<string, any>
  created_at: string
}

export default function CollaborationHub() {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('sankalp_access_token')
    : null

  const handleWsMessage = useCallback((data: any) => {
    if (data.type === 'message') {
      setMessages(prev => {
        // Deduplicate
        if (prev.some(m => m.id === data.id)) return prev
        return [...prev, {
          id: data.id,
          sender: data.sender_id,
          sender_id: data.sender_id,
          sender_name: data.sender_name,
          sender_email: data.sender_email,
          sender_role: data.sender_role,
          message_type: data.message_type,
          text: data.text,
          attachment_url: data.attachment_url,
          attachment_name: data.attachment_name,
          metadata: data.metadata || {},
          created_at: data.created_at,
        }]
      })
    }
  }, [])

  const { sendMessage: wsSend, isConnected } = useWebSocket({
    roomId: selectedRoom?.id || null,
    token,
    onMessage: handleWsMessage,
  })

  // Load rooms
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const { data } = await api.get('/collaboration/rooms/')
        const roomList = data.results || data || []
        setRooms(roomList)

        // Auto-select from query params
        const qRoomType = searchParams.get('room_type')
        const qEntityId = searchParams.get('entity_id')
        if (qRoomType && qEntityId) {
          const match = roomList.find(
            (r: Room) => r.room_type === qRoomType && r.entity_id === qEntityId
          )
          if (match) setSelectedRoom(match)
        }
      } catch {
        // API may not be ready
      } finally {
        setLoadingRooms(false)
      }
    }
    loadRooms()
  }, [searchParams])

  // Load messages when room changes
  useEffect(() => {
    if (!selectedRoom) {
      setMessages([])
      return
    }
    const loadMessages = async () => {
      setLoadingMessages(true)
      try {
        const { data } = await api.get(`/collaboration/rooms/${selectedRoom.id}/messages/`)
        setMessages(data.results || data || [])
        // Mark as read
        api.post(`/collaboration/rooms/${selectedRoom.id}/mark_read/`).catch(() => {})
      } catch {
        setMessages([])
      } finally {
        setLoadingMessages(false)
      }
    }
    loadMessages()
  }, [selectedRoom?.id])

  // Load participants when room changes
  useEffect(() => {
    if (!selectedRoom) {
      setParticipants([])
      return
    }
    const loadParticipants = async () => {
      try {
        const { data } = await api.get(`/collaboration/rooms/${selectedRoom.id}/participants/`)
        setParticipants(data.results || data || [])
      } catch {
        setParticipants([])
      }
    }
    loadParticipants()
  }, [selectedRoom?.id])

  const handleSendText = useCallback((text: string, metadata?: Record<string, any>) => {
    if (!selectedRoom) return
    // Send via WebSocket if connected, REST fallback
    if (isConnected) {
      wsSend({ type: 'message', text, message_type: 'text', metadata: metadata || {} })
    } else {
      api.post(`/collaboration/rooms/${selectedRoom.id}/send_message/`, {
        text, message_type: 'text', metadata: metadata || {},
      }).then(({ data }) => {
        setMessages(prev => [...prev, data])
      }).catch(() => {})
    }
  }, [selectedRoom, isConnected, wsSend])

  const handleUpload = useCallback(async (file: File, caption: string) => {
    if (!selectedRoom) return
    const form = new FormData()
    form.append('attachment', file)
    form.append('text', caption)
    form.append('message_type', 'photo')
    try {
      const { data } = await api.post(
        `/collaboration/rooms/${selectedRoom.id}/upload/`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setMessages(prev => [...prev, data])
    } catch {
      // handle error
    }
  }, [selectedRoom])

  const handleTyping = useCallback((isTyping: boolean) => {
    if (isConnected) {
      wsSend({ type: 'typing', is_typing: isTyping })
    }
  }, [isConnected, wsSend])

  if (loadingRooms) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-12 text-center">
        <MessageSquare size={48} className="mx-auto text-text-light mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">No Collaboration Rooms</h3>
        <p className="text-sm text-text-muted">
          Rooms are created automatically when Production Orders or Factories are added.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] bg-white rounded-xl border border-border overflow-hidden">
      {/* Left: Room List */}
      <RoomList
        rooms={rooms}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
      />

      {/* Center: Messages */}
      <MessageThread
        room={selectedRoom}
        messages={messages}
        loading={loadingMessages}
        isConnected={isConnected}
        currentUserId={user?.id || ''}
        onSendText={handleSendText}
        onUpload={handleUpload}
        onTyping={handleTyping}
        participants={participants}
      />

      {/* Right: Context Panel */}
      {selectedRoom && (
        <ContextPanel
          room={selectedRoom}
          messages={messages}
          participants={participants}
        />
      )}
    </div>
  )
}
