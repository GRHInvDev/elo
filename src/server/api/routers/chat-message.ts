import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

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

  // Buscar conversas ativas (salas com mensagens recentes)
  getActiveConversations: protectedProcedure
    .query(async ({ ctx }) => {
      const clerkUserId = ctx.auth.userId
      console.log('🔍 [getActiveConversations] Iniciando busca para usuário:', clerkUserId)

      // Buscar o ID do banco correspondente ao ID do Clerk
      const currentUser = await ctx.db.user.findUnique({
        where: { id: clerkUserId },
        select: { id: true }
      })

      if (!currentUser) {
        console.log('❌ [getActiveConversations] Usuário não encontrado:', clerkUserId)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado"
        })
      }

      const userId = currentUser.id // ID do banco
      console.log('✅ [getActiveConversations] Usuário encontrado. Clerk ID:', clerkUserId, 'Banco ID:', userId)

      // Buscar últimas mensagens de todas as salas que o usuário tem acesso
      // 1. Chat global (sempre disponível)
      // 2. Grupos onde o usuário é membro

      const conversations: Array<{
        roomId: string
        roomName: string
        roomType: 'global' | 'group' | 'private'
        lastMessage: {
          content: string | null
          createdAt: Date
          user: {
            firstName: string | null
            lastName: string | null
          }
        } | null
        memberCount?: number
      }> = []

      // Adicionar chat global
      const globalLastMessage = await ctx.db.chat_message.findFirst({
        where: { roomId: 'global' },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      conversations.push({
        roomId: 'global',
        roomName: 'Chat Global',
        roomType: 'global',
        lastMessage: globalLastMessage ? {
          content: globalLastMessage.content,
          createdAt: globalLastMessage.createdAt,
          user: globalLastMessage.user,
        } : null,
      })

      // Grupos são exibidos apenas na aba "Grupos", não em "Conversas"

      // Buscar chats privados com mensagens recentes
      // Buscar todas as mensagens privadas e filtrar no código
      const allPrivateMessages = await ctx.db.chat_message.findMany({
        where: {
          roomId: {
            startsWith: 'private_',
          },
        },
        select: {
          roomId: true,
          userId: true,
        },
        distinct: ['roomId'],
      })

      console.log('📝 [getActiveConversations] Mensagens privadas encontradas:', allPrivateMessages.length)
      console.log('📝 [getActiveConversations] RoomIds únicos:', allPrivateMessages.map(m => m.roomId))

      // Filtrar apenas roomIds onde o usuário atual participou
      const userPrivateRoomIds = allPrivateMessages
        .filter(msg => {
          // Verificar se o usuário enviou mensagens nesta sala
          if (msg.userId === userId) {
            console.log('✅ [getActiveConversations] Usuário enviou mensagem nesta sala:', msg.roomId, 'userId:', msg.userId)
            return true
          }

          // Verificar se o roomId contém o ID do Clerk do usuário (como destinatário)
          const idPattern = /user_[^_]+/g
          const matches = msg.roomId.match(idPattern) ?? []
          const isRecipient = matches.some((match: string) => match === `user_${clerkUserId}`)

          if (isRecipient) {
            console.log('✅ [getActiveConversations] Usuário é destinatário nesta sala:', msg.roomId, 'matches:', matches, 'clerkUserId:', clerkUserId)
          } else {
            console.log('❌ [getActiveConversations] Usuário NÃO é destinatário nesta sala:', msg.roomId, 'matches:', matches, 'clerkUserId:', clerkUserId)
          }

          return isRecipient
        })
        .map(msg => msg.roomId)

      console.log('🎯 [getActiveConversations] RoomIds filtrados para o usuário:', userPrivateRoomIds)

      const privateRoomIds = [...new Set(userPrivateRoomIds)]

      // Para cada roomId único, buscar a última mensagem
      for (const roomId of privateRoomIds) {
        const lastMessage = await ctx.db.chat_message.findFirst({
          where: { roomId },
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                id: true,
              },
            },
          },
        })

        if (lastMessage) {
          console.log('💬 [getActiveConversations] Processando roomId:', roomId, 'com última mensagem')

          // Extrair o ID do Clerk do outro usuário do roomId
          const idPattern = /user_[^_]+/g
          const matches = roomId.match(idPattern) ?? []
          console.log('🔍 [getActiveConversations] Matches encontrados no roomId:', matches)

          const otherClerkId = matches.find((id: string) => id !== clerkUserId)
          console.log('👤 [getActiveConversations] Other clerk ID extraído:', otherClerkId, 'de matches:', matches, 'vs clerkUserId:', clerkUserId)

          if (otherClerkId) {
            // Buscar informações do outro usuário usando ID do Clerk
            const otherUser = await ctx.db.user.findUnique({
              where: { id: otherClerkId },
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            })

            console.log('👥 [getActiveConversations] Outro usuário encontrado:', otherUser ? 'SIM' : 'NÃO', 'para ID:', otherClerkId)

            if (otherUser) {
              const otherUserName = [otherUser.firstName, otherUser.lastName]
                .filter(Boolean)
                .join(' ') || otherUser.email

              console.log('✅ [getActiveConversations] Adicionando conversa privada:', {
                roomId,
                roomName: otherUserName,
                roomType: 'private'
              })

              conversations.push({
                roomId,
                roomName: otherUserName,
                roomType: 'private' as const,
                lastMessage: {
                  content: lastMessage.content,
                  createdAt: lastMessage.createdAt,
                  user: {
                    firstName: lastMessage.user.firstName,
                    lastName: lastMessage.user.lastName,
                  },
                },
              })
            } else {
              console.log('❌ [getActiveConversations] Outro usuário não encontrado no banco para ID:', otherClerkId)
            }
          } else {
            console.log('❌ [getActiveConversations] Não foi possível extrair otherClerkId do roomId:', roomId)
          }
        }
      }

      // Filtrar apenas conversas que têm mensagens e ordenar por data da última mensagem
      const filteredConversations = conversations
        .filter(conv => conv.lastMessage !== null)
        .sort((a, b) => {
          const dateA = a.lastMessage?.createdAt ?? new Date(0)
          const dateB = b.lastMessage?.createdAt ?? new Date(0)
          return dateB.getTime() - dateA.getTime() // Mais recentes primeiro
        })
        .slice(0, 10) // Limitar a 10 conversas ativas

      console.log('🎉 [getActiveConversations] Resultado final - Conversas encontradas:', filteredConversations.length)
      console.log('📋 [getActiveConversations] Detalhes das conversas:', filteredConversations.map(c => ({
        roomId: c.roomId,
        roomName: c.roomName,
        roomType: c.roomType,
        hasLastMessage: !!c.lastMessage
      })))

      return filteredConversations
    }),

  // Buscar estatísticas globais do chat (para admin)
  getGlobalStats: protectedProcedure
    .query(async ({ ctx }) => {
      // Verificar se usuário tem acesso admin
      if (!ctx.auth.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autorizado"
        })
      }

      // Contar mensagens totais
      const totalMessages = await ctx.db.chat_message.count()

      // Contar usuários únicos que enviaram mensagens
      const activeUsers = await ctx.db.chat_message.findMany({
        select: {
          userId: true,
        },
        distinct: ['userId'],
      })
      const activeUsersCount = activeUsers.length

      // Contar grupos ativos
      const activeGroupsCount = await ctx.db.chat_group.count({
        where: { isActive: true }
      })

      // Buscar última mensagem global
      const lastMessage = await ctx.db.chat_message.findFirst({
        where: { roomId: 'global' },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      return {
        totalMessages,
        activeUsersCount,
        activeGroupsCount,
        lastMessage,
      }
    }),
})
