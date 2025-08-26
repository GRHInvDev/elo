"use client"

import { useEffect } from "react"
import { useNotifications } from "@/hooks/use-notifications"

/**
 * Componente global que gerencia notificações independentemente do dropdown
 * Garante que as notificações funcionem sempre, não apenas quando o dropdown está aberto
 */
export function GlobalNotificationManager() {
  // Hook que gerencia todas as notificações globalmente
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
    isLoading
  } = useNotifications({
    limit: 20,
    autoRefresh: true,
    refreshInterval: 30000, // 30 segundos
    enableSound: true
  })

  // Efeito para garantir que as notificações sejam sempre atualizadas
  useEffect(() => {
    // Refetch inicial para garantir que as notificações sejam carregadas
    if (!isLoading) {
      refetch()
    }
  }, [refetch, isLoading])

  // Este componente não renderiza nada visualmente
  // Ele apenas garante que o hook useNotifications esteja sempre ativo
  // e que as notificações sejam processadas globalmente
  return null
}
