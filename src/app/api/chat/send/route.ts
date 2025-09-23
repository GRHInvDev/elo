import type { NextRequest } from 'next/server'
import { PrismaClient, NotificationType } from '@prisma/client'

const prisma = new PrismaClient()

interface SendMessageBody {
  content: string | null
  userId: string
  roomId: string
  imageUrl: string | null
}

// Tipos para as notificações
interface PrismaMessage {
  id: string
  content: string | null
  roomId: string
  imageUrl: string | null
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  }
  userId: string
  createdAt: Date
  updatedAt: Date
  groupId: string | null
}

interface SenderUser {
  id: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
}

// Função auxiliar para criar notificações de mensagem
async function createMessageNotifications(message: PrismaMessage, senderUser: SenderUser) {
  const { roomId, id: messageId } = message
  const senderId = senderUser.id

  let recipientUserIds: string[] = []

  if (roomId.startsWith('group_')) {
    // Para grupos: notificar todos os membros exceto o remetente
    const groupId = roomId.replace('group_', '')
    const members = await prisma.chat_group_member.findMany({
      where: { groupId },
      select: { userId: true }
    })
    recipientUserIds = members.map(m => m.userId).filter(id => id !== senderId)
  } else if (roomId.startsWith('private_')) {
    // Para chats privados: notificar apenas o outro usuário
    const idPattern = /user_[^_]+/g
    const ids = roomId.match(idPattern) ?? []
    recipientUserIds = ids.filter(id => id !== senderId).map(id => id.replace('user_', ''))
  } else if (roomId === 'global') {
    // Para chat global: notificar todos os usuários exceto o remetente
    const allUsers = await prisma.user.findMany({
      where: {
        enterprise: { not: 'NA' }
      },
      select: { id: true }
    })
    recipientUserIds = allUsers.map(u => u.id).filter(id => id !== senderId)
  }

  // Buscar email do remetente para criar notificações
  const senderWithEmail = await prisma.user.findUnique({
    where: { id: senderId },
    select: { email: true }
  })

  // Criar notificações em lote
  if (recipientUserIds.length > 0) {
    const notifications = recipientUserIds.map(recipientId => ({
      title: `Nova mensagem ${roomId === 'global' ? 'no chat global' : roomId.startsWith('group_') ? 'no grupo' : 'privada'}`,
      message: `${senderUser.firstName ?? ''} ${senderUser.lastName ?? senderWithEmail?.email ?? 'Usuário'}: ${message.content ?? '[Imagem]'}`,
      type: NotificationType.INFO,
      channel: 'IN_APP' as const,
      userId: recipientId,
      entityId: messageId,
      entityType: 'chat_message',
      actionUrl: `/chat?room=${roomId}`,
      data: {
        roomId,
        messageId,
        senderId,
        senderName: `${senderUser.firstName ?? ''} ${senderUser.lastName ?? senderWithEmail?.email ?? 'Usuário'}`.trim(),
        content: message.content,
        hasImage: !!message.imageUrl
      }
    }))

    await prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true
    })

    console.log(`📢 [NOTIFICATIONS] Criadas ${notifications.length} notificações para sala ${roomId}`)
  }
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

    // Criar notificações para outros usuários (não bloquear o envio)
    createMessageNotifications(newMessage, newMessage.user).catch(error => {
      console.error('Erro ao criar notificações:', error)
    })

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
