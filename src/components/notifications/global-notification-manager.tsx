"use client"

import { useEffect } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { useUser } from "@clerk/nextjs"

/**
 * Componente global que gerencia notificações independentemente do dropdown
 * Garante que as notificações funcionem sempre, não apenas quando o dropdown está aberto
 * Agora usa WebSocket para tempo real quando disponível
 */
export function GlobalNotificationManager() {
  const { user } = useUser()

  // Hook que gerencia todas as notificações globalmente com WebSocket (exclusivamente)
  const {
    isWebSocketConnected,
    isUsingWebSocket,
    reconnectWebSocket,
    error
  } = useNotifications({
    limit: 1, // Só precisamos da contagem, não da lista completa
    enableSound: false,
    enableBrowserNotifications: false,
    userId: user?.id,
    enabled: !!user?.id
  })

  // Inicializar servidor WS na instância atual (melhor esforço)
  useEffect(() => {
    void fetch('/api/socket').catch(() => { return undefined })
  }, [])

  // Log do status da conexão WebSocket
  // TEMPORARIAMENTE DESATIVADO - Logs de WebSocket desabilitados
  /*
  useEffect(() => {
    if (isUsingWebSocket) {
      console.log('🔔 Sistema de notificações: WebSocket ativo e funcionando')
    } else if (isWebSocketConnected) {
      console.log('🔔 Sistema de notificações: WebSocket conectado, aguardando registro')
    } else {
      console.log('⚠️ Sistema de notificações: WebSocket não conectado')
    }
  }, [isWebSocketConnected, isUsingWebSocket])
  */

  // Tentar reconectar se houver erro de conexão (melhor esforço)
  useEffect(() => {
    if (error && !isWebSocketConnected) {
      const timeoutId = setTimeout(() => {
        reconnectWebSocket()
      }, 5000)
      return () => clearTimeout(timeoutId)
    }
  }, [error, isWebSocketConnected, reconnectWebSocket])

  // Este componente não renderiza nada visualmente
  // Ele apenas garante que o hook useNotifications esteja sempre ativo
  // e que as notificações sejam processadas globalmente via WebSocket exclusivamente
  return null
}
