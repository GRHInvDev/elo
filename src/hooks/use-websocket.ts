import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

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
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001',
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
    if (socketRef.current?.connected) return

    setIsConnecting(true)
    setError(null)

    try {
      const newSocket = io(url, {
        autoConnect: false,
        reconnection,
        reconnectionAttempts,
        reconnectionDelay
      })

      newSocket.on('connect', () => {
        console.log('🔗 WebSocket conectado')
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
      })

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket desconectado:', reason)
        setIsConnected(false)
        setIsConnecting(false)
      })

      newSocket.on('connect_error', (err) => {
        console.error('❌ Erro na conexão WebSocket:', err)
        setError(err.message)
        setIsConnecting(false)
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 WebSocket reconectado após ${attemptNumber} tentativas`)
        setIsConnected(true)
        setError(null)
      })

      newSocket.on('reconnect_error', (err) => {
        console.error('❌ Erro ao reconectar WebSocket:', err)
        setError(`Falha na reconexão: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      })

      socketRef.current = newSocket
      setSocket(newSocket)

      newSocket.connect()
    } catch (err) {
      console.error('❌ Erro ao criar conexão WebSocket:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setIsConnecting(false)
    }
  }, [url, reconnection, reconnectionAttempts, reconnectionDelay])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Desconectando WebSocket')
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
      console.warn('⚠️ Tentativa de emitir evento sem conexão WebSocket:', event)
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
