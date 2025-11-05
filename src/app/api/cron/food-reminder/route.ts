import { PrismaClient } from '@prisma/client'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const prisma = new PrismaClient()

export async function GET(_req: NextRequest) {
  try {
    // Selecionar usuários elegíveis (preferência ativa)
    const users = await prisma.user.findMany({
      where: {
        notificationPreferences: {
          is: { foodOrderNotifications: true }
        }
      },
      select: { id: true }
    })

    const userIds = users.map(u => u.id)
    if (userIds.length === 0) {
      return new Response('No recipients', { status: 200 })
    }

    const now = new Date()
    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        title: 'Lembrete: pedir comida',
        message: 'Não se esqueça de fazer seu pedido antes das 09:00.',
        type: 'INFO',
        channel: 'IN_APP',
        userId,
        entityType: 'food_order',
        actionUrl: '/food',
        createdAt: now,
        updatedAt: now,
      }))
    })

    // Emitir atualização de contagem em lote (melhor esforço)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    if (baseUrl) {
      await fetch(`${baseUrl}/api/socket/emit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ unreadCounts: userIds.map(userId => ({ userId })) })
      }).catch(() => undefined)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Cron food-reminder error:', error)
    return new Response('Failed', { status: 500 })
  }
}


