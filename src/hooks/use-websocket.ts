import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'

interface UseWebSocketOptions {
  url?: string
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

interface UseWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => void
  disconnect: () => void
  emit: (event: string, data?: unknown) => void
  on: (event: string, callback: (...args: unknown[]) => void) => void
  off: (event: string, callback?: (...args: unknown[]) => void) => void
}

/**
 * Hook genérico para gerenciar conexões WebSocket
 * @param options - Opções de configuração do WebSocket
 * @returns Objeto com socket e métodos de controle
 */

const NEXT_PUBLIC_WS_URL = 'https://intranet.boxdistribuidor.com.br/'

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  // Usar a URL do Next.js se NEXT_PUBLIC_WS_URL não estiver definido
  const defaultUrl = NEXT_PUBLIC_WS_URL 
  const {
    url = defaultUrl,
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000
  } = options

  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const connect = useCallback(() => {
    try {
      if (socketRef.current?.connected) return
      setIsConnecting(true)
      setError(null)

      const socketInstance = io(url, {
        transports: ['websocket', 'polling'],
        reconnection,
        reconnectionAttempts,
        reconnectionDelay,
        withCredentials: false,
      })

      socketRef.current = socketInstance
      setSocket(socketInstance)

      socketInstance.on('connect', () => {
        setIsConnected(true)
        setIsConnecting(false)
      })

      socketInstance.on('connect_error', (err: unknown) => {
        setError((err as Error)?.message ?? 'Erro de conexão')
        setIsConnecting(false)
        setIsConnected(false)
      })

      socketInstance.on('disconnect', () => {
        setIsConnected(false)
      })
    } catch (e) {
      setError((e as Error)?.message ?? 'Erro ao inicializar WebSocket')
      setIsConnecting(false)
      setIsConnected(false)
    }
  }, [url, reconnection, reconnectionAttempts, reconnectionDelay])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [])

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
    }
  }, [])

  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])

  const off = useCallback((event: string, callback?: (...args: unknown[]) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback)
      } else {
        socketRef.current.off(event)
      }
    }
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emit,
    on,
    off
  }
}
