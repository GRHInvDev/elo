import { useState, useEffect, useCallback } from "react"
import { api } from "@/trpc/react"
import { useBrowserNotifications } from "./use-browser-notifications"
import { useNotificationSocket } from "./use-notification-socket"
import type { UseNotificationsReturn } from "@/types/notification-types"

interface UseNotificationsProps {
  limit?: number
  unreadOnly?: boolean
  enableSound?: boolean
  userId?: string
  enabled?: boolean
}

export const useNotifications = ({
  limit = 20,
  unreadOnly = false,
  enableSound = true,
  enableBrowserNotifications = true,
  userId,
  enabled = true
}: UseNotificationsProps & { enableBrowserNotifications?: boolean } = {}): UseNotificationsReturn => {
  const [offset, setOffset] = useState(0)

  // Hook para notificações do browser
  const { showChatNotification, shouldShowNotification } = useBrowserNotifications()

  // Hook para WebSocket de notificações (sempre habilitado quando userId está disponível)
  const {
    isConnected: isWebSocketConnected,
    isConnecting: isWebSocketConnecting,
    error: websocketError,
    unreadCount: websocketUnreadCount,
    reconnect: reconnectWebSocket
  } = useNotificationSocket({
    userId,
    enabled: enabled && !!userId,
    onNotification: (data) => {
      // TEMPORARIAMENTE DESATIVADO - Logs de notificações desabilitados
      // console.log('📡 Nova notificação recebida via WebSocket:', data)
      // Forçar refetch para atualizar a lista
      void refetch()
    },
    onUnreadCountChange: (count) => {
      // TEMPORARIAMENTE DESATIVADO - Logs de notificações desabilitados
      // console.log('🔢 Contagem de notificações atualizada:', count)
    }
  })

  // Query para buscar notificações (sempre atual quando WebSocket não está disponível)
  const notificationsQuery = api.notification.list.useQuery({
    limit,
    offset,
    unreadOnly
  }, {
    // Desabilitar query automática se WebSocket estiver conectado ou se notificações estiverem desabilitadas
    enabled: enabled && (!isWebSocketConnected || isWebSocketConnecting)
  })

  const notificationsData = notificationsQuery.data
  const isLoading = notificationsQuery.isLoading || isWebSocketConnecting
  const refetch = notificationsQuery.refetch
  const error = notificationsQuery.error ?? websocketError

  // Mutations
  const markAsReadMutation = api.notification.markAsRead.useMutation()
  const markAllAsReadMutation = api.notification.markAllAsRead.useMutation()
  const deleteMutation = api.notification.delete.useMutation()

  // Funções de manipulação (sempre dependem do WebSocket para atualizações)
  const markAsRead = async (id: string): Promise<void> => {
    try {
      await markAsReadMutation.mutateAsync({ id })
      // WebSocket vai emitir a atualização automaticamente
      // Forçar refetch para garantir consistência
      void refetch()
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      throw error
    }
  }

  const markAllAsRead = async (): Promise<void> => {
    try {
      await markAllAsReadMutation.mutateAsync()
      // WebSocket vai emitir a atualização automaticamente
      // Forçar refetch para garantir consistência
      void refetch()
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
      throw error
    }
  }

  const deleteNotification = async (id: string): Promise<void> => {
    try {
      await deleteMutation.mutateAsync({ id })
      // WebSocket vai emitir a atualização automaticamente
      // Forçar refetch para garantir consistência
      void refetch()
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
      throw error
    }
  }

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

  // Som de fallback usando Web Audio API (caso o arquivo não exista)
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

  // Handler para notificações recebidas via WebSocket
  useEffect(() => {
    // Esta lógica agora é tratada pelo onNotification callback no useNotificationSocket
    // As notificações chegam em tempo real e disparam sons/popups diretamente
  }, [])

  const loadMore = (): void => {
    if (notificationsData && notificationsData.notifications.length === limit) {
      setOffset(prev => prev + limit)
    }
  }

  const resetOffset = (): void => {
    setOffset(0)
  }

  // Dados processados
  const notifications = (notificationsData?.notifications ?? []).map(notification => ({
    ...notification,
    actionUrl: notification.actionUrl ?? undefined,
    entityId: notification.entityId ?? undefined,
    entityType: notification.entityType ?? undefined
  }))
  const total = notificationsData?.total ?? 0
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const unreadCount = notificationsData?.unreadCount ?? 0
  const hasMore = notifications.length < total

  return {
    // Dados
    notifications,
    total,
    unreadCount: websocketUnreadCount,
    hasMore,

    // Estados
    isLoading,
    error,
    isWebSocketConnected,
    isUsingWebSocket: isWebSocketConnected,

    // Ações
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    resetOffset,
    refetch,
    reconnectWebSocket,

    // Estados das mutations
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}

// Hook específico para contagem de notificações não lidas (para ícones/badges)
export const useNotificationCount = (userId?: string) => {
  // Usar WebSocket para contagem em tempo real
  const { unreadCount, isConnected, isConnecting } = useNotificationSocket({
    userId,
    enabled: !!userId
  })

  return {
    unreadCount,
    isLoading: isConnecting,
    isWebSocketConnected: isConnected
  }
}