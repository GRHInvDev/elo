"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Tipos para notificações do browser
 */
interface BrowserNotificationOptions {
  title: string
  body?: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  data?: Record<string, unknown>
  // actions?: NotificationAction[] // Não suportado universalmente
}

/**
 * Hook para gerenciar notificações do browser
 */
export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  // Verificar suporte e permissão inicial
  useEffect(() => {
    if (typeof window === "undefined") return

    const supported = "Notification" in window
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
    }
  }, [])

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn("Notificações do browser não são suportadas neste navegador")
      return "denied"
    }

    // Verificar se estamos em um contexto seguro
    if (typeof window !== "undefined" && !window.isSecureContext) {
      console.warn("Contexto não seguro - notificações requerem HTTPS")
      return "denied"
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error("Erro ao solicitar permissão de notificação:", error)
      return "denied"
    }
  }, [isSupported])

  // Mostrar notificação do browser
  const showNotification = useCallback(
    (options: BrowserNotificationOptions): Notification | null => {
      if (!isSupported || permission !== "granted") {
        console.warn("Permissão para notificações não concedida ou browser não suporta")
        return null
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon ?? "/favicon.ico",
          badge: options.badge,
          tag: options.tag,
          requireInteraction: options.requireInteraction ?? false,
          silent: options.silent ?? false,
          data: options.data,
          // actions: options.actions, // Não suportado universalmente
        })

        // Auto-fechar após 5 segundos se não requerer interação
        if (!options.requireInteraction) {
          setTimeout(() => {
            notification.close()
          }, 5000)
        }

        return notification
      } catch (error) {
        console.error("Erro ao mostrar notificação:", error)
        return null
      }
    },
    [isSupported, permission]
  )

  // Mostrar notificação de mensagem de chat
  const showChatNotification = useCallback(
    (params: {
      senderName: string
      message: string
      roomId: string
      roomName: string
      senderImage?: string
    }) => {
      const { senderName, message, roomId, roomName, senderImage } = params

      return showNotification({
        title: `Nova mensagem ${roomName === "Chat Global" ? "no chat global" : `em ${roomName}`}`,
        body: `${senderName}: ${message}`,
        icon: senderImage ?? "/favicon.ico",
        tag: `chat-${roomId}`,
        requireInteraction: false,
        silent: false,
        data: {
          type: "chat_message",
          roomId,
          roomName,
          senderName,
        },
      })
    },
    [showNotification]
  )

  // Verificar se deve mostrar notificações baseado na página atual
  const shouldShowNotification = useCallback((_roomId: string) => {
    if (typeof window === "undefined") return true

    // Não mostrar notificações se o usuário estiver na página de chat
    if (window.location.pathname === "/chat") {
      return false
    }

    // Não mostrar notificações se o usuário estiver focado na aba
    if (document.hasFocus()) {
      return false
    }

    return true
  }, [])

  // Função de teste para debugging
  const testNotification = useCallback(() => {
    return showNotification({
      title: "Teste de Notificação",
      body: "Esta é uma notificação de teste",
      tag: "test-notification",
      requireInteraction: true,
    })
  }, [showNotification])

  return {
    isSupported,
    permission,
    canShowNotifications: isSupported && permission === "granted",
    requestPermission,
    showNotification,
    showChatNotification,
    shouldShowNotification,
    testNotification,
  }
}
