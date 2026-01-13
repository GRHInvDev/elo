import { createTRPCRouter, protectedProcedure } from "../trpc"
import { z } from "zod"
import type { InputJsonValue } from "@prisma/client/runtime/library"
import type { ResponseStatus } from "@prisma/client"
import { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { sendEmail } from "@/lib/mail/email-utils"
import { mockEmailSituacaoFormulario, mockEmailRespostaFormulario, mockEmailChatMensagemFormulario } from "@/lib/mail/html-mock"

/**
 * Gera o próximo número sequencial para um novo chamado
 * Começa a partir do número 210
 */
async function getNextFormResponseNumber(db: Prisma.TransactionClient): Promise<number> {
  const lastResponse = await db.formResponse.findFirst({
    where: {
      number: { not: null },
    },
    orderBy: { number: "desc" },
    select: { number: true },
  })

  // Se não há nenhum número ainda, começa do 210
  // Caso contrário, incrementa o último número encontrado
  const lastNumber = lastResponse?.number ?? 209
  return lastNumber + 1
}

export const formResponseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        responses: z.array(z.record(z.string(), z.any())),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Gerar próximo número sequencial
      const nextNumber = await getNextFormResponseNumber(ctx.db)

      const created = await ctx.db.formResponse.create({
        data: {
          number: nextNumber,
          userId: ctx.auth.userId,
          formId: input.formId,
          responses: input.responses as unknown as InputJsonValue[],
          status: "NOT_STARTED",
        },
      })
      try {
        const form = await ctx.db.form.findUnique({
          where: { id: input.formId },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        })

        if (form) {
          const recipients = Array.from(new Set([form.userId, ...form.ownerIds])).filter(id => id && id !== ctx.auth.userId)

          // Criar notificações in-app
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

          // Enviar emails para todos os donos do formulário
          const ownerUserIds = Array.from(new Set([form.userId, ...form.ownerIds])).filter(id => id && id !== ctx.auth.userId)

          if (ownerUserIds.length > 0) {
            const ownerUsers = await ctx.db.user.findMany({
              where: { id: { in: ownerUserIds } },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            })

            // Enviar email para cada dono do formulário
            for (const owner of ownerUsers) {
              if (owner.email) {
                const ownerName = owner.firstName
                  ? `${owner.firstName}${owner.lastName ? ` ${owner.lastName}` : ''}`
                  : (owner.email ?? 'Usuário')

                const emailContent = mockEmailRespostaFormulario(
                  ownerName,
                  input.formId,
                  form.title ?? 'Formulário'
                )

                await sendEmail(
                  owner.email,
                  `Nova solicitação no formulário "${form.title ?? 'Formulário'}"`,
                  emailContent
                ).catch((error) => {
                  console.error(`[FormResponse] Erro ao enviar email de nova solicitação para ${owner.email}:`, error)
                })
              }
            }
          }
        }
      } catch (notificationError) {
        console.error('Erro ao criar/emitter notificações de resposta de formulário:', notificationError)
      }
      return created
    }),

  // Criar chamado manualmente (apenas admins com permissão)
  createManual: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        userId: z.string(), // Usuário para quem o chamado será criado
        responses: z.array(z.record(z.string(), z.any())),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      const roleConfig = (currentUser?.role_config ?? {}) as import("@/types/role-config").RolesConfig // não questione, just aceite

      // Verificar se é sudo ou tem permissão can_create_solicitacoes
      if (!roleConfig.sudo && !(roleConfig.can_create_solicitacoes ?? false)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para criar chamados manualmente",
        })
      }

      // Verificar se o usuário alvo existe
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
      })

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        })
      }

      // Verificar se o formulário existe
      const form = await ctx.db.form.findUnique({
        where: { id: input.formId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      })

      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Formulário não encontrado",
        })
      }

      // Gerar próximo número sequencial
      const nextNumber = await getNextFormResponseNumber(ctx.db)

      // Criar o chamado vinculado ao usuário especificado
      const created = await ctx.db.formResponse.create({
        data: {
          number: nextNumber,
          userId: input.userId, // Usuário alvo, não o criador
          formId: input.formId,
          responses: input.responses as unknown as InputJsonValue[],
          status: "NOT_STARTED",
        },
      })

      // Criar notificações e enviar emails
      try {
        const recipients = Array.from(new Set([form.userId, ...form.ownerIds])).filter(id => id && id !== input.userId)

        // Criar notificações in-app
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
              actionUrl: `/forms/${form.id}`,
              createdAt: now,
              updatedAt: now,
            }))
          })
        }

        // Enviar emails para todos os donos do formulário
        const ownerUserIds = Array.from(new Set([form.userId, ...form.ownerIds])).filter(id => id && id !== input.userId)

        if (ownerUserIds.length > 0) {
          const ownerUsers = await ctx.db.user.findMany({
            where: { id: { in: ownerUserIds } },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          })

          // Enviar email para cada dono do formulário
          for (const owner of ownerUsers) {
            if (owner.email) {
              const ownerName = owner.firstName
                ? `${owner.firstName}${owner.lastName ? ` ${owner.lastName}` : ''}`
                : (owner.email ?? 'Usuário')

              const emailContent = mockEmailRespostaFormulario(
                ownerName,
                input.formId,
                form.title ?? 'Formulário'
              )

              await sendEmail(
                owner.email,
                `Nova solicitação no formulário "${form.title ?? 'Formulário'}"`,
                emailContent
              ).catch((error) => {
                console.error(`[FormResponse] Erro ao enviar email de nova solicitação (manual) para ${owner.email}:`, error)
              })
            }
          }
        }
      } catch (notificationError) {
        console.error('Erro ao criar notificações de resposta de formulário:', notificationError)
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
        take: z.number().optional(),
        skip: z.number().optional(),
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
            return { items: [], totalCount: 0 }
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
            return { items: [], totalCount: 0 }
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

      const [items, totalCount] = await Promise.all([
        ctx.db.formResponse.findMany({
          where,
          include: {
            form: {
              select: {
                id: true,
                title: true,
                description: true,
                userId: true,
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
            FormResponseChat: {
              take: 2,
              orderBy: { createdAt: "desc" },
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
          },
          orderBy,
          take: input.take,
          skip: input.skip,
        }),
        ctx.db.formResponse.count({ where }),
      ])

      return { items, totalCount }
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

      // Enriquecer com último chat e última visualização do usuário logado
      const responseIds = responses.map(r => r.id)
      if (responseIds.length === 0) return responses

      // Buscar mensagens em ordem desc e pegar a mais recente por formResponseId
      const chats = await ctx.db.formResponseChat.findMany({
        where: { formResponseId: { in: responseIds } },
        orderBy: { createdAt: "desc" },
        select: { formResponseId: true, createdAt: true },
      })

      type FormResponseViewFindManyArgs = {
        where: { formResponseId: { in: string[] }; userId: string }
        select: { formResponseId: true; lastViewedAt: true }
      }
      type FormResponseViewClient = {
        findMany: (args: FormResponseViewFindManyArgs) => Promise<Array<{ formResponseId: string; lastViewedAt: Date }>>
        upsert: (args: { where: { userId_formResponseId: { userId: string; formResponseId: string } }; update: { lastViewedAt: Date }; create: { userId: string; formResponseId: string; lastViewedAt: Date } }) => Promise<unknown>
      }
      const formResponseViewClient: FormResponseViewClient = (ctx.db as unknown as { formResponseView: FormResponseViewClient }).formResponseView

      const views = await formResponseViewClient.findMany({
        where: { formResponseId: { in: responseIds }, userId: currentUserId },
        select: { formResponseId: true, lastViewedAt: true },
      })

      const lastChatMap = new Map<string, Date | null>()
      for (const c of chats) {
        if (!lastChatMap.has(c.formResponseId)) {
          lastChatMap.set(c.formResponseId, c.createdAt ?? null)
        }
      }
      const viewMap = new Map<string, Date>(views.map((v) => [v.formResponseId, v.lastViewedAt]))

      return responses.map((r) => {
        const lastChatAt = lastChatMap.get(r.id) ?? null
        const myLastViewedAt = viewMap.get(r.id) ?? null
        const hasNewMessages = !!lastChatAt && (!myLastViewedAt || lastChatAt >= myLastViewedAt)
        // Converter tags de JsonValue para string[] | null
        const tags = Array.isArray(r.tags) ? (r.tags as string[]) : null
        return { ...r, tags, lastChatAt, myLastViewedAt, hasNewMessages }
      })
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

      // Buscar dados completos do formulário e resposta para envio de emails
      const responseWithDetails = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: {
          form: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
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

          // Enviar emails para os destinatários
          if (responseWithDetails) {
            const recipientUserIds = Array.from(recipients)
            const recipientUsers = await ctx.db.user.findMany({
              where: { id: { in: recipientUserIds } },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            })

            const remetenteNome = created.user.firstName && created.user.lastName
              ? `${created.user.firstName} ${created.user.lastName}`
              : (created.user.firstName ?? created.user.email ?? "Usuário")

            const formTitle = responseWithDetails.form.title ?? 'Formulário'

            // Enviar email para cada destinatário
            for (const recipient of recipientUsers) {
              if (recipient.email) {
                const destinatarioNome = recipient.firstName && recipient.lastName
                  ? `${recipient.firstName} ${recipient.lastName}`
                  : (recipient.firstName ?? recipient.email ?? "Usuário")

                const isAutor = recipient.id === responseWithDetails.userId

                const emailContent = mockEmailChatMensagemFormulario(
                  destinatarioNome,
                  remetenteNome,
                  input.message,
                  input.responseId,
                  formTitle,
                  isAutor
                )

                await sendEmail(
                  recipient.email,
                  "Elo | Intranet - Você tem uma nova mensagem em Solicitações",
                  emailContent
                ).catch((error) => {
                  console.error(`[FormResponse] Erro ao enviar email de chat para ${recipient.email}:`, error)
                })
              }
            }
          }
        }
      } catch (notificationError) {
        console.error('Erro ao criar/emitter notificações de chat de formulário:', notificationError)
      }
      return created
    }),

  // Marcar visualização de um chamado (resposta) pelo usuário atual
  markViewed: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.auth.userId
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: { form: { select: { userId: true, ownerIds: true } }, user: { select: { id: true } } },
      })

      if (!response) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Resposta não encontrada" })
      }

      const isOwner = response.form.userId === currentUserId || response.form.ownerIds.includes(currentUserId)
      const isAuthor = response.userId === currentUserId
      if (!isOwner && !isAuthor) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para marcar visualização" })
      }

      type FormResponseViewUpsertArgs = {
        where: { userId_formResponseId: { userId: string; formResponseId: string } }
        update: { lastViewedAt: Date }
        create: { userId: string; formResponseId: string; lastViewedAt: Date }
      }
      type FormResponseViewClient = { upsert: (args: FormResponseViewUpsertArgs) => Promise<unknown> }
      const formResponseViewClient: FormResponseViewClient = (ctx.db as unknown as { formResponseView: FormResponseViewClient }).formResponseView

      await formResponseViewClient.upsert({
        where: { userId_formResponseId: { userId: currentUserId, formResponseId: input.responseId } },
        update: { lastViewedAt: new Date() },
        create: { userId: currentUserId, formResponseId: input.responseId, lastViewedAt: new Date() },
      })

      return { ok: true }
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
          // Ao finalizar o chamado, remover todas as tags
          ...(input.status === "COMPLETED" && { tags: Prisma.JsonNull }),
        },
        include: {
          form: true,
        },
      })

      const user = await ctx.db.user.findUnique({
        where: { id: response.userId },
      })

      if (ret && user && ret.form) {
        const form = ret.form as { id: string; title: string | null }
        const formTitle = form.title ?? "Formulário"
        const formId = form.id
        const responseId = ret.id
        const responseStatus = ret.status

        await sendEmail(
          user.email,
          `Resposta ao formulário "${formTitle}"`,
          mockEmailSituacaoFormulario(user.firstName ?? "", responseStatus, responseId, formId, formTitle),
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

      // Converter tags de JsonValue para string[] | null
      const tags = Array.isArray(response.tags) ? (response.tags as string[]) : null

      return {
        ...response,
        tags,
      }
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

  // ========== TAGS MANAGEMENT ==========

  // Listar todas as tags
  getAllTags: protectedProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.globalConfig.findFirst()
    if (!config?.formResponseTags) {
      return []
    }

    const tags = config.formResponseTags as unknown as Array<{
      id: string
      nome: string
      cor: string
      timestampCreate: string
      countVezesUsadas: number
      ativa: boolean
    }>

    return tags.filter(tag => tag.ativa)
  }),

  // Criar nova tag
  createTag: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(1, "Nome da tag é obrigatório"),
        cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser um hex válido (ex: #FF5733)"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let config = await ctx.db.globalConfig.findFirst()
      config ??= await ctx.db.globalConfig.create({
        data: {
          id: "default",
          shopWebhook: "",
          formResponseTags: [] as unknown as InputJsonValue,
        },
      })

      const existingTags = (config.formResponseTags as unknown as Array<{
        id: string
        nome: string
        cor: string
        timestampCreate: string
        countVezesUsadas: number
        ativa: boolean
      }>) || []

      // Verificar se já existe tag com mesmo nome
      if (existingTags.some(tag => tag.nome.toLowerCase() === input.nome.toLowerCase() && tag.ativa)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe uma tag com este nome"
        })
      }

      const newTag = {
        id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nome: input.nome,
        cor: input.cor,
        timestampCreate: new Date().toISOString(),
        countVezesUsadas: 0,
        ativa: true,
      }

      const updatedTags = [...existingTags, newTag]

      await ctx.db.globalConfig.update({
        where: { id: config.id },
        data: {
          formResponseTags: updatedTags as unknown as InputJsonValue,
        },
      })

      return newTag
    }),

  // Atualizar tag
  updateTag: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nome: z.string().min(1).optional(),
        cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        ativa: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let config = await ctx.db.globalConfig.findFirst()
      config ??= await ctx.db.globalConfig.create({
        data: {
          id: "default",
          shopWebhook: "",
          formResponseTags: [] as unknown as InputJsonValue,
        },
      })

      if (!config.formResponseTags) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag não encontrada"
        })
      }

      const tags = (config.formResponseTags as unknown as Array<{
        id: string
        nome: string
        cor: string
        timestampCreate: string
        countVezesUsadas: number
        ativa: boolean
      }>) || []

      const tagIndex = tags.findIndex(tag => tag.id === input.id)
      if (tagIndex === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag não encontrada"
        })
      }

      // Verificar se nome já existe (se estiver mudando)
      if (input.nome && tags.some((tag) =>
        tag.nome.toLowerCase() === input.nome!.toLowerCase() &&
        tag.id !== input.id &&
        tag.ativa
      )) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe uma tag com este nome"
        })
      }

      const updatedTag = {
        ...tags[tagIndex]!,
        ...(input.nome && { nome: input.nome }),
        ...(input.cor && { cor: input.cor }),
        ...(input.ativa !== undefined && { ativa: input.ativa }),
      }

      tags[tagIndex] = updatedTag

      await ctx.db.globalConfig.update({
        where: { id: config.id },
        data: {
          formResponseTags: tags as unknown as InputJsonValue,
        },
      })

      return updatedTag
    }),

  // Aplicar tag a uma resposta
  applyTag: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
        tagId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se a resposta existe
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
      })

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resposta não encontrada"
        })
      }

      // Verificar se a tag existe e está ativa
      let config = await ctx.db.globalConfig.findFirst()
      config ??= await ctx.db.globalConfig.create({
        data: {
          id: "default",
          shopWebhook: "",
          formResponseTags: [] as unknown as InputJsonValue,
        },
      })

      if (!config.formResponseTags) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag não encontrada"
        })
      }

      const tags = (config.formResponseTags as unknown as Array<{
        id: string
        nome: string
        cor: string
        timestampCreate: string
        countVezesUsadas: number
        ativa: boolean
      }>) || []

      const tag = tags.find(t => t.id === input.tagId && t.ativa)
      if (!tag) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag não encontrada ou inativa"
        })
      }

      // Obter tags atuais da resposta
      const currentTags = (response.tags as unknown as string[]) || []

      // Se a tag já está aplicada, não fazer nada
      if (currentTags.includes(input.tagId)) {
        return { success: true, message: "Tag já estava aplicada" }
      }

      // Adicionar tag
      const updatedTags = [...currentTags, input.tagId]

      // Atualizar contador de uso da tag
      const tagIndex = tags.findIndex(t => t.id === input.tagId)
      if (tagIndex !== -1) {
        tags[tagIndex]!.countVezesUsadas = (tags[tagIndex]!.countVezesUsadas || 0) + 1
      }

      // Atualizar resposta e tags globais
      await Promise.all([
        ctx.db.formResponse.update({
          where: { id: input.responseId },
          data: {
            tags: updatedTags as unknown as InputJsonValue,
          },
        }),
        ctx.db.globalConfig.update({
          where: { id: config.id },
          data: {
            formResponseTags: tags as unknown as InputJsonValue,
          },
        }),
      ])

      return { success: true }
    }),

  // Remover tag de uma resposta
  removeTag: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
        tagId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
      })

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resposta não encontrada"
        })
      }

      const currentTags = (response.tags as unknown as string[]) || []
      const updatedTags = currentTags.filter(tagId => tagId !== input.tagId)

      await ctx.db.formResponse.update({
        where: { id: input.responseId },
        data: {
          tags: updatedTags as unknown as InputJsonValue,
        },
      })

      return { success: true }
    }),
})
