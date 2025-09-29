import { createChatServer } from '@/server/websocket/chat-server'
import { initializeNotificationWebSocketService } from '@/server/services/notification-websocket-service'
import type { NextRequest } from 'next/server'
import type { Server } from 'socket.io'

let io: Server | null

export async function GET(req: NextRequest) {
  // Evitar inicialização múltipla
  if (io) {
    return new Response('Socket.IO server already running', { status: 200 })
  }

  try {
    // Criar servidor WebSocket
    io = createChatServer()

    // Inicializar serviço de notificações WebSocket
    initializeNotificationWebSocketService(io)

    console.log('🚀 Servidor WebSocket inicializado com sucesso')

    return new Response('Socket.IO server started', { status: 200 })
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor WebSocket:', error)
    return new Response('Failed to start Socket.IO server', { status: 500 })
  }
}