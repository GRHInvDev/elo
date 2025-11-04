import { createChatServer, notificationUsers } from '@/server/websocket/chat-server'
import { initializeNotificationWebSocketService } from '@/server/services/notification-websocket-service'
import type { NextRequest } from 'next/server'
import type { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'

export const runtime = 'nodejs'

let io: Server | null

type EmitBody =
  | {
      userId: string
      type: 'notification:new' | 'notification:update' | 'notification:delete' | 'unreadCount'
      payload?: unknown
    }
  | {
      notifications?: Array<{ userId: string; type?: 'new' | 'update' | 'delete'; notification: Record<string, unknown> }>
      unreadCounts?: Array<{ userId: string; count?: number }>
    }

export async function POST(req: NextRequest) {
  try {
    const text = await req.text()
    if (text.length > 50_000) {
      return new Response('Payload too large', { status: 413 })
    }

    const body = text ? (JSON.parse(text) as EmitBody) : ({} as EmitBody)

    // Garantir servidor iniciado
    if (!io) {
      io = createChatServer()
      initializeNotificationWebSocketService(io)
    }

    const prisma = new PrismaClient()

    const emitToUser = async (userId: string, event: 'notification' | 'unreadCountUpdate', data: unknown) => {
      const entry = Array.from(notificationUsers.entries()).find(([_sid, uid]) => uid === userId)
      const socketId = entry?.[0]
      if (socketId) {
        io!.to(socketId).emit(event === 'notification' ? 'notification' : 'unreadCountUpdate', data as never)
      }
    }

    // Caso 1: single emit
    if ('userId' in body && typeof body.userId === 'string') {
      if (body.type === 'unreadCount') {
        const count = await prisma.notification.count({ where: { userId: body.userId, isRead: false } })
        await emitToUser(body.userId, 'unreadCountUpdate', { count })
      } else if (body.type?.startsWith('notification')) {
        const payload = (body.payload ?? {}) as Record<string, unknown>
        const type = (body.type.split(':')[1] ?? 'new') as 'new' | 'update' | 'delete'
        await emitToUser(body.userId, 'notification', {
          type,
          notification: payload,
        })
        // Atualizar contagem após nova notificação
        if (type === 'new') {
          const count = await prisma.notification.count({ where: { userId: body.userId, isRead: false } })
          await emitToUser(body.userId, 'unreadCountUpdate', { count })
        }
      }

      return new Response('OK', { status: 200 })
    }

    // Caso 2: bulk emit
    const notifications = 'notifications' in body && Array.isArray(body.notifications) ? body.notifications : []
    const unreadCounts = 'unreadCounts' in body && Array.isArray(body.unreadCounts) ? body.unreadCounts : []

    await Promise.all([
      ...notifications.map(async (n) => {
        await emitToUser(n.userId, 'notification', {
          type: n.type ?? 'new',
          notification: n.notification,
        })
      }),
      ...unreadCounts.map(async (u) => {
        const count = typeof u.count === 'number'
          ? u.count
          : await prisma.notification.count({ where: { userId: u.userId, isRead: false } })
        await emitToUser(u.userId, 'unreadCountUpdate', { count })
      })
    ])

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('POST /api/socket/emit error:', error)
    return new Response('Failed', { status: 500 })
  }
}


