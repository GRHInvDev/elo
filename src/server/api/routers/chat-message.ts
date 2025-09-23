import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const getMessagesSchema = z.object({
  roomId: z.string().default("global"),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

const sendMessageSchema = z.object({
  content: z.string().min(1, "Mensagem não pode estar vazia").max(2000, "Mensagem muito longa"),
  roomId: z.string().default("global"),
})

export const chatMessageRouter = createTRPCRouter({
  // Buscar mensagens de uma sala com paginação
  getMessages: protectedProcedure
    .input(getMessagesSchema)
    .query(async ({ ctx, input }) => {
      const { roomId, limit, offset } = input

      const messages = await ctx.db.chat_message.findMany({
        where: {
          roomId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
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

      // Retornar mensagens em ordem cronológica (mais antiga primeiro)
      return messages.reverse()
    }),

  // Buscar últimas mensagens de uma sala (para carregamento inicial)
  getRecentMessages: protectedProcedure
    .input(z.object({
      roomId: z.string().default("global"),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { roomId, limit } = input

      const messages = await ctx.db.chat_message.findMany({
        where: {
          roomId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
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

      return messages.reverse()
    }),

  // Criar uma nova mensagem (usado principalmente pelo WebSocket, mas disponível via API)
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const { content, roomId } = input
      const userId = ctx.auth.userId

      const message = await ctx.db.chat_message.create({
        data: {
          content,
          userId,
          roomId,
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

      return message
    }),

  // Buscar estatísticas do chat (número de mensagens, usuários ativos, etc.)
  getStats: protectedProcedure
    .input(z.object({
      roomId: z.string().default("global"),
    }))
    .query(async ({ ctx, input }) => {
      const { roomId } = input

      // Contar total de mensagens na sala
      const totalMessages = await ctx.db.chat_message.count({
        where: { roomId },
      })

      // Contar usuários únicos que enviaram mensagens na sala
      const activeUsers = await ctx.db.chat_message.findMany({
        where: { roomId },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      })

      // Buscar última mensagem
      const lastMessage = await ctx.db.chat_message.findFirst({
        where: { roomId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      return {
        totalMessages,
        activeUsersCount: activeUsers.length,
        lastMessage,
      }
    }),

  // Buscar salas disponíveis (por enquanto apenas global, mas preparado para múltiplas salas)
  getRooms: protectedProcedure
    .query(async ({ ctx: _ctx }) => {
      // Por enquanto, retornar apenas a sala global
      // Futuramente pode buscar salas dinâmicas do banco
      return [
        {
          id: 'global',
          name: 'Chat Global',
          description: 'Sala de chat geral da empresa',
          type: 'global',
        },
      ]
    }),

  // Buscar grupos de chat do usuário logado
  getUserGroups: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.auth.userId

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return ctx.db.chat_group.findMany({
        where: {
          isActive: true,
          members: {
            some: {
              userId,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  imageUrl: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),
})
