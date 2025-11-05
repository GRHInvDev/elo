import type { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(_request: NextRequest) {
  try {
    // WebSocket removido: retornar vazio para status online
    const onlineUserIds: string[] = []

    // Buscar dados completos dos usuários online (excluindo Sistema)
    const onlineUsersDetails = await prisma.user.findMany({
      where: {
        id: { in: onlineUserIds },
        setor: { not: 'Sistema' }, // Excluir setor Sistema
        role_config: {
          path: ['isTotem'],
          equals: false, // Excluir usuários Totem
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        imageUrl: true,
        enterprise: true,
        setor: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    })

    // Retornar apenas IDs dos usuários realmente online
    const finalOnlineUserIds = onlineUsersDetails.map(user => user.id)

    console.log(`👥 [PRESENÇA] ${finalOnlineUserIds.length} usuários online:`, finalOnlineUserIds)

    return new Response(JSON.stringify({
      onlineUserIds: finalOnlineUserIds,
      totalOnline: finalOnlineUserIds.length,
      details: onlineUserIds,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('❌ [PRESENÇA] Erro ao buscar usuários online:', error)

    // Fallback: retornar lista vazia em caso de erro
    return new Response(JSON.stringify({
      onlineUserIds: [],
      totalOnline: 0,
      error: 'Sistema temporariamente indisponível'
    }), {
      status: 200, // Retornar 200 mesmo com erro para não quebrar UI
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
