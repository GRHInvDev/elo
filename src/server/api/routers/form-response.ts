import { createTRPCRouter, protectedProcedure } from "../trpc"
import { z } from "zod"
import type { InputJsonValue } from "@prisma/client/runtime/library"
import type { ResponseStatus, Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { sendEmail } from "@/lib/mail/email-utils"
import { mockEmailSituacaoFormulario } from "@/lib/mail/html-mock"

export const formResponseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        responses: z.array(z.record(z.string(), z.any())),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db.formResponse.create({
        data: {
          userId: ctx.auth.userId,
          formId: input.formId,
          responses: input.responses as unknown as InputJsonValue[],
          status: "NOT_STARTED",
        },
      })
      try {
        const form = await ctx.db.form.findUnique({
          where: { id: input.formId },
          select: { userId: true, ownerIds: true, title: true }
        })
        if (form) {
          const recipients = Array.from(new Set([form.userId, ...form.ownerIds])).filter(id => id && id !== ctx.auth.userId)
          if (recipients.length > 0) {
            const now = new Date()
            await ctx.db.notification.createMany({
              data: recipients.map(userId => ({
                title: `Nova resposta no formulário`,
                message: form.title ?? 'Formulário',
                type: 'INFO',
                channel: 'IN_APP',
                userId,
                entityId: created.id,
                entityType: 'form_response',
                actionUrl: `/forms/${form.userId}`,
                createdAt: now,
                updatedAt: now,
              }))
            })
          }
        }
      } catch (notificationError) {
        console.error('Erro ao criar/emitter notificações de resposta de formulário:', notificationError)
      }
      return created
    }),

  listByForm: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        priority: z.enum(["ASC", "DESC"]).optional(),
        userIds: z.array(z.string()).optional(),
        setores: z.array(z.string()).optional(),
        hasResponse: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.auth.userId
      // Verificar se o usuário é o dono do formulário
      const form = await ctx.db.form.findUnique({
        where: { id: input.formId },
        select: { userId: true, ownerIds: true },
      })

      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Formulário não encontrado",
        })
      }

      const isOwner = form.userId === currentUserId || (form.ownerIds).includes(currentUserId)

      // Construir where clause
      const where: Prisma.FormResponseWhereInput = {
        formId: input.formId,
      }

      // Se não for o dono, só pode ver suas próprias respostas
      if (!isOwner) {
        where.userId = ctx.auth.userId
      }

      // Filtro por data
      if (input?.startDate ?? input?.endDate) {
        where.createdAt = {}
        if (input.startDate) {
          where.createdAt.gte = input.startDate
        }
        if (input.endDate) {
          // Adicionar 23:59:59 ao final do dia
          const endDate = new Date(input.endDate)
          endDate.setHours(23, 59, 59, 999)
          where.createdAt.lte = endDate
        }
      }

      // Filtro por usuários e setores
      const userIdsToFilter: string[] = []
      
      if (input?.userIds && input.userIds.length > 0) {
        userIdsToFilter.push(...input.userIds)
      }

      if (input?.setores && input.setores.length > 0) {
        const usersInSetores = await ctx.db.user.findMany({
          where: {
            setor: { in: input.setores },
          },
          select: { id: true },
        })
        const userIdsFromSetores = usersInSetores.map((u) => u.id)
        userIdsToFilter.push(...userIdsFromSetores)
      }

      if (userIdsToFilter.length > 0) {
        // Remover duplicatas
        const uniqueUserIds = [...new Set(userIdsToFilter)]
        // Se não for owner, ainda precisa respeitar o filtro de userId
        if (isOwner) {
          where.userId = { in: uniqueUserIds }
        } else {
          // Se não for owner e os filtros não incluem o usuário atual, retornar vazio
          if (!uniqueUserIds.includes(ctx.auth.userId)) {
            return []
          }
        }
      }

      // Filtro por respondido (baseado na existência de mensagens no chat)
      let responseIdsFilter: string[] | null = null
      if (input?.hasResponse !== undefined) {
        const responsesWithChat = await ctx.db.formResponseChat.findMany({
          select: { formResponseId: true },
          distinct: ["formResponseId"],
        })
        const responseIdsWithChat = responsesWithChat.map((r) => r.formResponseId)

        if (input.hasResponse) {
          if (responseIdsWithChat.length > 0) {
            responseIdsFilter = responseIdsWithChat
          } else {
            return []
          }
        } else {
          if (responseIdsWithChat.length > 0) {
            responseIdsFilter = responseIdsWithChat
          }
        }
      }

      // Aplicar filtro de respondido se necessário
      if (responseIdsFilter !== null) {
        if (input?.hasResponse) {
          where.id = { in: responseIdsFilter }
        } else {
          where.id = { notIn: responseIdsFilter }
        }
      }

      // Determinar ordenação
      const orderBy: Prisma.FormResponseOrderByWithRelationInput = input?.priority === "ASC"
        ? { createdAt: "asc" }
        : { createdAt: "desc" }

      return await ctx.db.formResponse.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
              setor: true,
            },
          },
        },
        orderBy,
      })
    }),

  listKanBan: protectedProcedure
    .input(
      z
        .object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          priority: z.enum(["ASC", "DESC"]).optional(),
          userIds: z.array(z.string()).optional(),
          setores: z.array(z.string()).optional(),
          hasResponse: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.auth.userId

      // Construir where clause
      const where: Prisma.FormResponseWhereInput = {
        form: {
          OR: [
            { userId: currentUserId },
            { ownerIds: { has: currentUserId } },
          ],
        },
      }

      // Filtro por data
      if (input?.startDate ?? input?.endDate) {
        where.createdAt = {}
        if (input.startDate) {
          where.createdAt.gte = input.startDate
        }
        if (input.endDate) {
          // Adicionar 23:59:59 ao final do dia
          const endDate = new Date(input.endDate)
          endDate.setHours(23, 59, 59, 999)
          where.createdAt.lte = endDate
        }
      }

      // Filtro por usuários e setores
      const userIdsToFilter: string[] = []
      
      if (input?.userIds && input.userIds.length > 0) {
        userIdsToFilter.push(...input.userIds)
      }

      if (input?.setores && input.setores.length > 0) {
        const usersInSetores = await ctx.db.user.findMany({
          where: {
            setor: { in: input.setores },
          },
          select: { id: true },
        })
        const userIdsFromSetores = usersInSetores.map((u) => u.id)
        userIdsToFilter.push(...userIdsFromSetores)
      }

      if (userIdsToFilter.length > 0) {
        // Remover duplicatas
        const uniqueUserIds = [...new Set(userIdsToFilter)]
        where.userId = { in: uniqueUserIds }
      }

      // Filtro por respondido (baseado na existência de mensagens no chat)
      // Este filtro precisa ser aplicado após os outros, então vamos buscar os IDs primeiro
      let responseIdsFilter: string[] | null = null
      if (input?.hasResponse !== undefined) {
        const responsesWithChat = await ctx.db.formResponseChat.findMany({
          select: { formResponseId: true },
          distinct: ["formResponseId"],
        })
        const responseIdsWithChat = responsesWithChat.map((r) => r.formResponseId)

        if (input.hasResponse) {
          // Apenas respostas que têm mensagens
          if (responseIdsWithChat.length > 0) {
            responseIdsFilter = responseIdsWithChat
          } else {
            // Se não há respostas com chat, retornar vazio
            return []
          }
        } else {
          // Para não respondidos, vamos buscar todos os IDs e filtrar depois
          // Se houver respostas com chat, vamos excluí-las
          if (responseIdsWithChat.length > 0) {
            responseIdsFilter = responseIdsWithChat
          }
        }
      }

      // Aplicar filtro de respondido se necessário
      if (responseIdsFilter !== null) {
        if (input?.hasResponse) {
          // Respondidos: incluir apenas os IDs que têm chat
          where.id = { in: responseIdsFilter }
        } else {
          // Não respondidos: excluir os IDs que têm chat
          where.id = { notIn: responseIdsFilter }
        }
      }

      // Determinar ordenação
      const orderBy: Prisma.FormResponseOrderByWithRelationInput = input?.priority === "ASC"
        ? { createdAt: "asc" }
        : { createdAt: "desc" }

      const responses = await ctx.db.formResponse.findMany({
        where,
        include: {
          form: {
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
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
              setor: true,
            },
          },
        },
        orderBy,
      })

      return responses
    }),

  getChat: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.formResponseChat.findMany({
        where: {
          formResponseId: input.responseId,
        },
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
        orderBy: {
          createdAt: "asc",
        },
      })
    }),

  sendChatMessage: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.auth.userId
      // Verificar se a resposta existe
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: {
          form: { select: { userId: true, ownerIds: true } },
          user: { select: { id: true } },
        },
      })

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resposta não encontrada",
        })
      }

      // Verificar se o usuário é o dono do formulário ou o autor da resposta
      const isOwner = response.form.userId === currentUserId || (response.form.ownerIds).includes(currentUserId)
      if (!isOwner && response.userId !== currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para enviar mensagens neste chat",
        })
      }

      const created = await ctx.db.formResponseChat.create({
        data: {
          userId: ctx.auth.userId,
          formResponseId: input.responseId,
          message: input.message,
        },
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
      })
      try {
        const recipients = new Set<string>()
        recipients.add(response.userId)
        recipients.add(response.form.userId)
        response.form.ownerIds.forEach(id => recipients.add(id))
        recipients.delete(currentUserId)

        if (recipients.size > 0) {
          const now = new Date()
          await ctx.db.notification.createMany({
            data: Array.from(recipients).map(userId => ({
              title: 'Nova mensagem no formulário',
              message: input.message,
              type: 'COMMENT_ADDED',
              channel: 'IN_APP',
              userId,
              entityId: input.responseId,
              entityType: 'form_response',
              actionUrl: `/forms/${response.form.userId}`,
              createdAt: now,
              updatedAt: now,
            }))
          })
        }
      } catch (notificationError) {
        console.error('Erro ao criar/emitter notificações de chat de formulário:', notificationError)
      }
      return created
    }),

  listUserResponses: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.formResponse.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      include: {
        form: {
          select: {
            id: true,
            userId: true,
            title: true,
            description: true,
          },
        },
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
      orderBy: {
        createdAt: "desc",
      },
    })
  }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
        status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
        statusComment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId: string = ctx.auth.userId
      // Verificar se a resposta existe
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: { form: { select: { userId: true, ownerIds: true } } },
      })

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resposta não encontrada",
        })
      }

      // Verificar se o usuário é o dono do formulário
      const isOwner = response.form.userId === currentUserId || response.form.ownerIds.includes(currentUserId)
      if (!isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o dono do formulário pode atualizar o status",
        })
      }

      const ret = await ctx.db.formResponse.update({
        where: { id: input.responseId },
        data: {
          status: input.status as ResponseStatus,
          statusComment: input.statusComment,
          updatedAt: new Date(),
        },
        include: {
          form: true,
        },
      })

      const user = await ctx.db.user.findUnique({
        where: { id: response.userId },
      })

      if (ret && user) {
        await sendEmail(
          user.email,
          `Resposta ao formulário "${ret.form.title}"`,
          mockEmailSituacaoFormulario(user.firstName ?? "", ret.status, ret.id, ret.form.id, ret.form.title),
        )
      }

      return ret
    }),

  getById: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const currentUserId: string = ctx.auth.userId
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: {
          form: {
            select: {
              id: true,
              title: true,
              description: true,
              fields: true,
              userId: true,
              ownerIds: true,
              user: true,
            },
          },
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
      })

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resposta não encontrada",
        })
      }

      // Verificar se o usuário é o dono do formulário ou o autor da resposta
      const isOwner = response.form.userId === currentUserId || response.form.ownerIds.includes(currentUserId)
      if (!isOwner && response.userId !== currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para visualizar esta resposta",
        })
      }

      return response
    }),

  update: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
        responses: z.array(z.record(z.string(), z.any())),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId: string = ctx.auth.userId
      // Verificar se a resposta existe
      const existingResponse = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: {
          form: { select: { userId: true, ownerIds: true } },
          user: { select: { id: true } },
        },
      })

      if (!existingResponse) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resposta não encontrada",
        })
      }

      // Verificar se o usuário é o dono do formulário ou o autor da resposta
      const isOwner = existingResponse.form.userId === currentUserId || existingResponse.form.ownerIds.includes(currentUserId)
      if (!isOwner && existingResponse.userId !== currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar esta resposta",
        })
      }

      return await ctx.db.formResponse.update({
        where: { id: input.responseId },
        data: {
          responses: input.responses as unknown as InputJsonValue[],
          updatedAt: new Date(),
        },
        include: {
          form: true,
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
      })
    }),
})
