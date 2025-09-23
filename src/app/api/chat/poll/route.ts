import type { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const lastMessageId = searchParams.get('lastMessageId')

    if (!roomId) {
      return new Response(JSON.stringify({ error: 'roomId é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const whereClause: {
      roomId: string
      createdAt?: { gt: Date }
    } = {
      roomId,
    }

    // Se temos um lastMessageId, buscar apenas mensagens mais recentes
    if (lastMessageId) {
      const lastMessage = await prisma.chat_message.findUnique({
        where: { id: lastMessageId },
        select: { createdAt: true },
      })

      if (lastMessage) {
        whereClause.createdAt = {
          gt: lastMessage.createdAt,
        }
      }
    }

    const messages = await prisma.chat_message.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
      take: 50, // Limitar para não sobrecarregar
    })

    console.log(`📊 [POLL] Buscando mensagens para ${roomId}, retornando ${messages.length} mensagens`)

    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro no polling de mensagens:', error)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
