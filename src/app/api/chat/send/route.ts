import type { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SendMessageBody {
  content: string | null
  userId: string
  roomId: string
  imageUrl: string | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SendMessageBody
    const { content, userId, roomId, imageUrl } = body

    if (!userId || !roomId) {
      return new Response(JSON.stringify({ error: 'userId e roomId são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!content && !imageUrl) {
      return new Response(JSON.stringify({ error: 'Mensagem deve ter conteúdo ou imagem' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validar permissões
    if (roomId.startsWith('group_')) {
      const groupId = roomId.replace('group_', '')
      const membership = await prisma.chat_group_member.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      })

      if (!membership) {
        return new Response(JSON.stringify({ error: 'Você não tem permissão para enviar mensagens neste grupo' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } else if (roomId.startsWith('private_')) {
      // Validar chat privado
      const idPattern = /user_[^_]+/g
      const ids = roomId.match(idPattern) as string[] | null ?? []

      if (!ids.includes(userId)) {
        console.log(`❌ [SEND] ACESSO NEGADO: ${userId} tentou enviar para ${roomId}`)
        return new Response(JSON.stringify({ error: 'Você não tem permissão para enviar mensagens nesta conversa privada' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Criar a mensagem
    const newMessage = await prisma.chat_message.create({
      data: {
        content,
        userId,
        roomId,
        imageUrl,
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
    })

    console.log(`📨 [SEND] Mensagem enviada por ${userId} na sala ${roomId}`)

    return new Response(JSON.stringify({ success: true, message: newMessage }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
