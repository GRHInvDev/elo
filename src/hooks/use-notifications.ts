import { useState, useEffect, useRef } from "react"
import { NotificationType } from "@prisma/client"
import { api } from "@/trpc/react"
import type { UseNotificationsReturn } from "@/types/notification-types"

interface UseNotificationsProps {
  limit?: number
  unreadOnly?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  enableSound?: boolean
}

export const useNotifications = ({
  limit = 20,
  unreadOnly = false,
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos
  enableSound = true
}: UseNotificationsProps = {}): UseNotificationsReturn => {
  const [offset, setOffset] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [lastUnreadCount, setLastUnreadCount] = useState(0)

  try {
    // Query para buscar notificações
    const notificationsQuery = api.notification.list.useQuery({
      limit,
      offset,
      unreadOnly
    })
    
    const notificationsData = notificationsQuery.data
    const isLoading = notificationsQuery.isLoading || false
    const refetch = notificationsQuery.refetch
    const error = notificationsQuery.error

    // Mutations
    const markAsReadMutation = api.notification.markAsRead.useMutation()
    const markAllAsReadMutation = api.notification.markAllAsRead.useMutation()
    const deleteMutation = api.notification.delete.useMutation()

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      void refetch()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refetch])

  // Funções de manipulação
  const markAsRead = async (id: string) => {
    try {
      await markAsReadMutation.mutateAsync({ id })
      await refetch() // Refresh após marcar como lida
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      throw error
    }
  }

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync()
      await refetch() // Refresh após marcar todas como lidas
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
      throw error
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id })
      await refetch() // Refresh após deletar
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
      throw error
    }
  }

  // Sistema de som para notificações
  const playNotificationSound = () => {
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
  }

  // Som de fallback usando Web Audio API (caso o arquivo não exista)
  const playFallbackSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
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

  // Verificar se há novas notificações para tocar som e mostrar popup
  useEffect(() => {
    const currentUnreadCount = notificationsData?.unreadCount || 0

    if (currentUnreadCount > lastUnreadCount) {
      // Tocar som se habilitado
      if (enableSound) {
        playNotificationSound()
      }

      // Mostrar popup se disponível
      if (typeof window !== 'undefined' && (window as any).showNotificationPopup) {
        const latestNotification = notificationsData?.notifications?.[0]
        if (latestNotification) {
          ;(window as any).showNotificationPopup({
            title: latestNotification.title,
            message: latestNotification.message,
            type: latestNotification.type?.toLowerCase() || 'info',
            duration: 5000,
            actionUrl: latestNotification.actionUrl
          })
        }
      }
    }

    setLastUnreadCount(currentUnreadCount)
  }, [notificationsData?.unreadCount, lastUnreadCount, enableSound, notificationsData?.notifications])

  const loadMore = () => {
    if (notificationsData && notificationsData.notifications.length === limit) {
      setOffset(prev => prev + limit)
    }
  }

  const resetOffset = () => {
    setOffset(0)
  }

    // Dados processados
    const notifications = notificationsData?.notifications || []
    const total = notificationsData?.total || 0
    const unreadCount = notificationsData?.unreadCount || 0
    const hasMore = notifications.length < total

    return {
      // Dados
      notifications,
      total,
      unreadCount,
      hasMore,

      // Estados
      isLoading,
      error,

      // Ações
      markAsRead,
      markAllAsRead,
      deleteNotification,
      loadMore,
      resetOffset,
      refetch,

      // Estados das mutations
      isMarkingAsRead: markAsReadMutation.isPending || false,
      isMarkingAllAsRead: markAllAsReadMutation.isPending || false,
      isDeleting: deleteMutation.isPending || false
    }
  } catch (err) {
    // Fallback em caso de erro no tRPC
    console.error('Erro no hook useNotifications:', err)
    return {
      notifications: [],
      total: 0,
      unreadCount: 0,
      hasMore: false,
      isLoading: false,
      error: err,
      markAsRead: async () => {},
      markAllAsRead: async () => {},
      deleteNotification: async () => {},
      loadMore: () => {},
      resetOffset: () => {},
      refetch: async () => ({}),
      isMarkingAsRead: false,
      isMarkingAllAsRead: false,
      isDeleting: false
    }
  }
}

// Hook específico para contagem de notificações não lidas (para ícones/badges)
export const useNotificationCount = () => {
  try {
    const notificationQuery = api.notification.list.useQuery({
      limit: 1,
      unreadOnly: true
    })

    return {
      unreadCount: notificationQuery.data?.unreadCount || 0,
      isLoading: notificationQuery.isLoading || false,
      refetch: notificationQuery.refetch
    }
  } catch (err) {
    console.error('Erro no hook useNotificationCount:', err)
    return {
      unreadCount: 0,
      isLoading: false,
      refetch: async () => ({})
    }
  }
}
