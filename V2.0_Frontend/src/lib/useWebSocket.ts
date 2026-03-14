'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseWebSocketOptions {
  roomId: string | null
  token: string | null
  onMessage?: (data: any) => void
}

interface UseWebSocketReturn {
  sendMessage: (data: any) => void
  isConnected: boolean
  lastMessage: any | null
}

const WS_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/^https?/, 'wss').replace(/\/api\/?$/, '')
  : 'wss://app.sankalphub.in'

export function useWebSocket({ roomId, token, onMessage }: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const reconnectAttempt = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const cleanup = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (!roomId || !token) return

    cleanup()

    const url = `${WS_BASE}/ws/collaboration/${roomId}/?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      reconnectAttempt.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        onMessageRef.current?.(data)
      } catch {
        // ignore non-JSON messages
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      // Auto-reconnect with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000)
      reconnectAttempt.current += 1
      reconnectTimer.current = setTimeout(() => {
        connect()
      }, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [roomId, token, cleanup])

  useEffect(() => {
    connect()
    return cleanup
  }, [connect, cleanup])

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { sendMessage, isConnected, lastMessage }
}
