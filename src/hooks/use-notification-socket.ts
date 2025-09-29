import { useEffect, useCallback, useState } from 'react'
import { useWebSocket } from './use-websocket'
import { useBrowserNotifications } from './use-browser-notifications'
import { api } from '@/trpc/react'
import type { Notification } from '@prisma/client'

interface NotificationSocketData {
  type: 'new' | 'update' | 'delete'
  notification: Notification
  unreadCount?: number
}

interface UseNotificationSocketOptions {
  userId?: string
  enabled?: boolean
  onNotification?: (data: NotificationSocketData) => void
  onUnreadCountChange?: (count: number) => void
  enableSound?: boolean
  enableBrowserNotifications?: boolean
}

interface UseNotificationSocketReturn {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  unreadCount: number
  reconnect: () => void
}

/**
 * Hook específico para gerenciar notificações via WebSocket
 * Substitui o polling por tempo real
 */
export function useNotificationSocket(options: UseNotificationSocketOptions = {}): UseNotificationSocketReturn {
  const {
    userId,
    enabled = true,
    onNotification,
    onUnreadCountChange,
    enableSound = true,
    enableBrowserNotifications = true
  } = options

  const [unreadCount, setUnreadCount] = useState(0)

  // Hook para notificações do browser
  const { showChatNotification, shouldShowNotification } = useBrowserNotifications()

  // Hook WebSocket genérico
  const { isConnected, isConnecting, error, emit, on, off, connect } = useWebSocket({
    autoConnect: enabled
  })

  // Buscar contagem inicial de notificações não lidas
  const { data: initialCount } = api.notification.list.useQuery(
    { limit: 1, unreadOnly: true },
    { enabled: enabled && !!userId }
  )

  // Atualizar contagem inicial
  useEffect(() => {
    if (initialCount?.unreadCount !== undefined) {
      setUnreadCount(initialCount.unreadCount)
      onUnreadCountChange?.(initialCount.unreadCount)
    }
  }, [initialCount?.unreadCount, onUnreadCountChange])

  // Sistema de som para notificações
  const playNotificationSound = useCallback(() => {
    if (!enableSound) return

    try {
      // Tentar tocar arquivo de som primeiro
      const audio = new Audio('/notification-sound.mp3')

      // Configurações do áudio
      audio.volume = 0.4 // Volume médio
      audio.preload = 'auto'

      // Evento quando o arquivo estiver carregado
      audio.addEventListener('canplaythrough', () => {
        audio.play().catch(error => {
          console.warn('Erro ao tocar arquivo de som, tentando fallback:', error)
          playFallbackSound()
        })
      })

      // Fallback se o arquivo não carregar
      audio.addEventListener('error', () => {
        console.warn('Arquivo de som não encontrado, usando som gerado')
        playFallbackSound()
      })

      // Tentar carregar o arquivo
      audio.load()

    } catch (error) {
      console.error('Erro ao inicializar áudio, usando fallback:', error)
      playFallbackSound()
    }
  }, [enableSound])

  // Som de fallback usando Web Audio API
  const playFallbackSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) {
        console.warn('Web Audio API não suportado')
        return
      }

      const audioContext = new AudioContextClass()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800 // Frequência do som
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.error('Erro ao tocar som de fallback:', error)
    }
  }

  // Registrar usuário para receber notificações
  useEffect(() => {
    if (isConnected && userId && enabled) {
      console.log('📡 Registrando usuário para notificações:', userId)
      emit('joinNotifications', { userId })
    }
  }, [isConnected, userId, enabled, emit])

  // Handlers para eventos do WebSocket
  useEffect(() => {
    if (!enabled) return

    const handleNewNotification = (...args: unknown[]) => {
      const data = args[0] as NotificationSocketData
      console.log('🔔 Nova notificação recebida:', data)

      if (data.type === 'new') {
        // Tocar som se habilitado
        if (enableSound) {
          playNotificationSound()
        }

        // Mostrar popup se disponível
        if (typeof window !== 'undefined' && 'showNotificationPopup' in window) {
          const showNotificationPopup = (window as unknown as { showNotificationPopup?: (params: Record<string, unknown>) => void }).showNotificationPopup
          if (showNotificationPopup) {
            showNotificationPopup({
              title: data.notification.title,
              message: data.notification.message,
              type: data.notification.type?.toLowerCase() || 'info',
              duration: 5000,
              actionUrl: data.notification.actionUrl
            })
          }
        }

        // Mostrar notificação do browser para mensagens de chat
        if (enableBrowserNotifications && data.notification.entityType === 'chat_message') {
          const notificationData = data.notification.data as {
            roomId?: string
            messageId?: string
            senderId?: string
            senderName?: string
            content?: string
            hasImage?: boolean
          }

          if (notificationData?.roomId && shouldShowNotification(notificationData.roomId)) {
            showChatNotification({
              senderName: notificationData.senderName ?? 'Usuário',
              message: notificationData.hasImage ? '[Imagem]' : (notificationData.content ?? 'Nova mensagem'),
              roomId: notificationData.roomId,
              roomName: data.notification.title?.includes('global')
                ? 'Chat Global'
                : data.notification.title?.includes('privada')
                  ? 'Chat Privado'
                  : 'Grupo',
            })
          }
        }

        setUnreadCount(prev => {
          const newCount = prev + 1
          onUnreadCountChange?.(newCount)
          return newCount
        })
      } else if (data.type === 'update' && data.notification.isRead) {
        // Se uma notificação foi marcada como lida, decrementar contador
        setUnreadCount(prev => {
          const newCount = Math.max(0, prev - 1)
          onUnreadCountChange?.(newCount)
          return newCount
        })
      } else if (data.type === 'delete') {
        // Se uma notificação foi deletada e era não lida, decrementar contador
        if (!data.notification.isRead) {
          setUnreadCount(prev => {
            const newCount = Math.max(0, prev - 1)
            onUnreadCountChange?.(newCount)
            return newCount
          })
        }
      }

      // Se foi fornecido um callback customizado
      onNotification?.(data)
    }

    const handleUnreadCountUpdate = (...args: unknown[]) => {
      const data = args[0] as { count: number }
      console.log('🔢 Contagem de notificações atualizada:', data.count)
      setUnreadCount(data.count)
      onUnreadCountChange?.(data.count)
    }

    const handleNotificationError = (...args: unknown[]) => {
      const error = args[0] as { message: string }
      console.error('❌ Erro nas notificações:', error.message)
    }

    // Registrar listeners
    on('notification', handleNewNotification)
    on('unreadCountUpdate', handleUnreadCountUpdate)
    on('notificationError', handleNotificationError)

    // Cleanup
    return () => {
      off('notification', handleNewNotification)
      off('unreadCountUpdate', handleUnreadCountUpdate)
      off('notificationError', handleNotificationError)
    }
  }, [enabled, on, off, onNotification, onUnreadCountChange])

  const reconnect = useCallback(() => {
    connect()
  }, [connect])

  return {
    isConnected,
    isConnecting,
    error,
    unreadCount,
    reconnect
  }
}
