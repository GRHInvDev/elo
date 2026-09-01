import { createTRPCRouter, protectedProcedure } from "../trpc"
import { z } from "zod"
import { Prisma, type PrismaClient } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { sendEmail } from "@/lib/mail/email-utils"
import { mockEmailSituacaoFormulario, mockEmailRespostaFormulario, mockEmailChatMensagemFormulario, mockEmailTagFormulario } from "@/lib/mail/html-mock"
import { formatFormResponseNumber } from "@/lib/utils/form-response-number"
import type { Field } from "@/lib/form-types"
import { formatSpreadsheetCell } from "@/lib/form-csv-export"
import { buildXlsxBase64FromRows, sanitizeXlsxFilename } from "@/lib/form-xlsx-export"
import type { FormResponseAttendant } from "@/types/form-responses"

const MAX_SPREADSHEET_EXPORT_ROWS = 8_000

function extractAssignedTo(responses: unknown): FormResponseAttendant | null {
  if (!Array.isArray(responses) || responses.length === 0) return null
  const first = responses[0] as Record<string, unknown> | undefined
  if (!first || typeof first !== "object" || !first._assignedTo) return null
  return first._assignedTo as unknown as FormResponseAttendant
}

/**
 * Campos de usuário que podem trafegar para o cliente.
 *
 * NUNCA usar `user: true` em respostas de formulário: o registro completo de
 * User carrega dados sensíveis (role_config, matricula, email_empresarial e o
 * pré-cadastro da Lojinha — CPF, RG, endereço, CEP e telefone). Como estes
 * procedures são consumidos por componentes client (dialog do quadro, modal de
 * edição, botão de status), o retorno vai inteiro para o navegador.
 */
const PUBLIC_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  imageUrl: true,
} satisfies Prisma.UserSelect

/**
 * Mesmo recorte do PUBLIC_USER_SELECT + o flag is_active, usado apenas nos
 * procedures que precisam decidir no servidor se o autor recebe email.
 * is_active é um booleano de status, sem dado sensível.
 */
const NOTIFY_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  is_active: true,
} satisfies Prisma.UserSelect

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Não Iniciado",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Finalizado",
}

interface DispatchTicketEventParams {
  ctx: { db: PrismaClient | Prisma.TransactionClient; auth: { userId: string } }
  responseId: string
  formId: string
  formTitle: string
  formCreatorId: string
  ownerIds: string[]
  authorId: string
  responseNumber?: number | null
  executorId: string
  executorName: string
  eventType: "STATUS_CHANGED" | "ATTENDANT_ASSIGNED" | "ATTENDANT_UNASSIGNED" | "TAG_APPLIED" | "TAG_REMOVED" | "TICKET_EDITED" | "TICKET_CREATED" | "CHAT_MESSAGE"
  systemMessage?: string
  notificationTitle: string
  notificationMessage: string
  emailSubject?: string
  emailContent?: string
}

async function dispatchTicketEvent(params: DispatchTicketEventParams) {
  const {
    ctx,
    responseId,
    formId,
    formCreatorId,
    ownerIds,
    authorId,
    responseNumber,
    executorId,
    systemMessage,
    notificationTitle,
    notificationMessage,
    emailSubject,
    emailContent,
  } = params

  const numLabel = formatFormResponseNumber(responseNumber)
  const fullTitle = numLabel ? `${notificationTitle} (${numLabel})` : notificationTitle

  if (systemMessage) {
    try {
      await ctx.db.formResponseChat.create({
        data: {
          formResponseId: responseId,
          userId: executorId,
          message: systemMessage,
        },
      })
    } catch (chatError) {
      console.error("[dispatchTicketEvent] Erro ao registrar mensagem de sistema no chat:", chatError)
    }
  }

  const responsibles = Array.from(new Set([formCreatorId, ...ownerIds])).filter(Boolean)
  const now = new Date()

  if (authorId && authorId !== executorId) {
    try {
      await ctx.db.notification.create({
        data: {
          title: fullTitle,
          message: notificationMessage,
          type: "INFO",
          channel: "IN_APP",
          userId: authorId,
          entityId: responseId,
          entityType: "form_response",
          actionUrl: `/forms/my-responses`,
          createdAt: now,
          updatedAt: now,
        },
      })
    } catch (notifError) {
      console.error("[dispatchTicketEvent] Erro ao notificar autor:", notifError)
    }
  }

  // Notificar responsáveis se não forem o executor
  const otherResponsibles = responsibles.filter((id) => id !== executorId && id !== authorId)
  if (otherResponsibles.length > 0) {
    try {
      await ctx.db.notification.createMany({
        data: otherResponsibles.map((userId) => ({
          title: fullTitle,
          message: notificationMessage,
          type: "INFO",
          channel: "IN_APP",
          userId,
          entityId: responseId,
          entityType: "form_response",
          actionUrl: `/forms/${formId}/responses`,
          createdAt: now,
          updatedAt: now,
        })),
      })
    } catch (notifError) {
      console.error("[dispatchTicketEvent] Erro ao notificar responsáveis:", notifError)
    }
  }

  // 3. Disparo de e-mail (se assunto e template fornecidos)
  if (emailSubject && emailContent && authorId && authorId !== executorId) {
    try {
      const author = await ctx.db.user.findUnique({
        where: { id: authorId },
        select: { email: true, is_active: true },
      })
      if (author?.email && author.is_active) {
        await sendEmail(author.email, emailSubject, emailContent).catch((e: unknown) =>
          console.error("[dispatchTicketEvent] Erro ao enviar email:", e)
        )
      }
    } catch (emailError) {
      console.error("[dispatchTicketEvent] Erro na rotina de email:", emailError)
    }
  }
}

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
          responses: input.responses,
          status: "NOT_STARTED",
        },
      })
      try {
        const form = await ctx.db.form.findUnique({
          where: { id: input.formId },
          include: {
            user: { select: NOTIFY_USER_SELECT },
          },
        })

        if (form) {
          const authorUser = await ctx.db.user.findUnique({
            where: { id: ctx.auth.userId },
            select: { firstName: true, lastName: true, email: true },
          })
          const authorName = authorUser?.firstName
            ? `${authorUser.firstName}${authorUser.lastName ? ` ${authorUser.lastName}` : ""}`.trim()
            : (authorUser?.email ?? "Solicitante")

          const formTitle = form.title ?? "Formulário"

          await dispatchTicketEvent({
            ctx,
            responseId: created.id,
            formId: form.id,
            formTitle,
            formCreatorId: form.userId,
            ownerIds: form.ownerIds ?? [],
            authorId: ctx.auth.userId,
            responseNumber: nextNumber,
            executorId: ctx.auth.userId,
            executorName: authorName,
            eventType: "TICKET_CREATED",
            systemMessage: `[SISTEMA] Chamado aberto por **${authorName}**.`,
            notificationTitle: "Novo chamado recebido",
            notificationMessage: `${authorName} enviou uma nova solicitação em "${formTitle}".`,
          })

          // Enviar emails para todos os donos do formulário
          const ownerUserIds = Array.from(new Set([form.userId, ...form.ownerIds])).filter((id) => id && id !== ctx.auth.userId)
          if (ownerUserIds.length > 0) {
            const ownerUsers = await ctx.db.user.findMany({
              where: { id: { in: ownerUserIds }, is_active: true },
              select: { firstName: true, lastName: true, email: true },
            })
            for (const owner of ownerUsers) {
              if (owner.email) {
                const ownerName = owner.firstName
                  ? `${owner.firstName}${owner.lastName ? ` ${owner.lastName}` : ""}`.trim()
                  : (owner.email ?? "Responsável")
                const chamadoLabel = formatFormResponseNumber(nextNumber)
                await sendEmail(
                  owner.email,
                  chamadoLabel
                    ? `Elo | Intranet - Novo chamado ${chamadoLabel} em "${formTitle}"`
                    : `Elo | Intranet - Nova solicitação em "${formTitle}"`,
                  mockEmailRespostaFormulario(ownerName, form.id, formTitle, nextNumber),
                ).catch((e: unknown) => console.error("[FormResponse.create] Erro ao enviar email:", e))
              }
            }
          }
        }
      } catch (notifError) {
        console.error("Erro ao processar notificações de criação de formulário:", notifError)
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
          responses: input.responses,
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
              is_active: true,
            }
          })

          // Enviar email para cada dono do formulário
          for (const owner of ownerUsers) {
            if (owner.email && owner.is_active) {
              const ownerName = owner.firstName
                ? `${owner.firstName}${owner.lastName ? ` ${owner.lastName}` : ''}`
                : (owner.email ?? 'Usuário')

              const chamadoLabel = formatFormResponseNumber(created.number)
              const emailContent = mockEmailRespostaFormulario(
                ownerName,
                input.formId,
                form.title ?? 'Formulário',
                created.number,
              )

              await sendEmail(
                owner.email,
                chamadoLabel
                  ? `Nova solicitação ${chamadoLabel} no formulário "${form.title ?? 'Formulário'}"`
                  : `Nova solicitação no formulário "${form.title ?? 'Formulário'}"`,
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
        number: z.number().optional(),
        tagIds: z.array(z.string()).optional(),
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

      // Filtro por número do chamado
      if (input.number !== undefined) {
        where.number = input.number
      }

      // Filtro por tags
      if (input.tagIds && input.tagIds.length > 0) {
        where.tags = {
          array_contains: input.tagIds,
        }
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

  /**
   * Exporta respostas em planilha .xlsx (base64). Só responsáveis do formulário;
   * o formulário precisa ter `spreadsheetExportEnabled`.
   */
  exportSpreadsheetXlsx: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        fieldIds: z.array(z.string()).min(1, "Selecione ao menos um campo do formulário"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.auth.userId

      const form = await ctx.db.form.findUnique({
        where: { id: input.formId },
        select: {
          userId: true,
          ownerIds: true,
          title: true,
          fields: true,
          spreadsheetExportEnabled: true,
        },
      })

      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Formulário não encontrado",
        })
      }

      if (!form.spreadsheetExportEnabled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "A exportação em planilha não está habilitada para este formulário",
        })
      }

      const isOwner = form.userId === currentUserId || form.ownerIds.includes(currentUserId)
      if (!isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas responsáveis pelo formulário podem exportar as respostas",
        })
      }

      const fields = form.fields as unknown as Field[]
      const selectedFields = input.fieldIds
        .map((id) => fields.find((f) => f.id === id))
        .filter((f): f is Field => Boolean(f))

      if (selectedFields.length !== input.fieldIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Um ou mais campos selecionados não pertencem a este formulário",
        })
      }

      const where: Prisma.FormResponseWhereInput = {
        formId: input.formId,
      }

      if (input.startDate ?? input.endDate) {
        where.createdAt = {}
        if (input.startDate) {
          where.createdAt.gte = input.startDate
        }
        if (input.endDate) {
          const endDate = new Date(input.endDate)
          endDate.setHours(23, 59, 59, 999)
          where.createdAt.lte = endDate
        }
      }

      const rows = await ctx.db.formResponse.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              setor: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: MAX_SPREADSHEET_EXPORT_ROWS,
      })

      const staticHeaders = ["Número", "Data envio", "Status", "Respondente", "E-mail", "Setor"] as const
      const fieldHeaders = selectedFields.map((f) => f.label.replace(/\r?\n/g, " "))
      const headers = [...staticHeaders, ...fieldHeaders]

      const statusPt: Record<string, string> = {
        NOT_STARTED: "Não iniciado",
        IN_PROGRESS: "Em andamento",
        COMPLETED: "Concluído",
      }

      const bodyRows: string[][] = rows.map((r) => {
        const data = (r.responses[0] as Record<string, unknown> | undefined) ?? {}
        const displayName = [r.user.firstName, r.user.lastName].filter(Boolean).join(" ").trim() || r.user.email
        const staticCells = [
          r.number != null ? String(r.number) : "",
          r.createdAt.toISOString(),
          statusPt[r.status] ?? r.status,
          displayName,
          r.user.email,
          r.user.setor ?? "",
        ]
        const fieldCells = selectedFields.map((f) => formatSpreadsheetCell(data[f.name]))
        return [...staticCells, ...fieldCells]
      })

      const xlsxBase64 = buildXlsxBase64FromRows(headers, bodyRows, "Respostas")

      return {
        xlsxBase64,
        filename: sanitizeXlsxFilename(`${form.title ?? "formulario"}-export`),
        truncated: rows.length >= MAX_SPREADSHEET_EXPORT_ROWS,
        rowCount: rows.length,
      }
    }),

  /**
   * Exporta respostas agrupadas por usuário em planilha .xlsx (base64).
   * Colunas: Respondente, E-mail, Setor, Total de envios, Número, Data envio, Status + campos selecionados.
   */
  exportByUserXlsx: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        fieldIds: z.array(z.string()).min(1, "Selecione ao menos um campo do formulário"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.auth.userId

      const form = await ctx.db.form.findUnique({
        where: { id: input.formId },
        select: {
          userId: true,
          ownerIds: true,
          title: true,
          fields: true,
          spreadsheetExportEnabled: true,
        },
      })

      if (!form) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Formulário não encontrado" })
      }

      if (!form.spreadsheetExportEnabled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "A exportação em planilha não está habilitada para este formulário",
        })
      }

      const isOwner = form.userId === currentUserId || form.ownerIds.includes(currentUserId)
      if (!isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas responsáveis pelo formulário podem exportar as respostas",
        })
      }

      const fields = form.fields as unknown as Field[]
      const selectedFields = input.fieldIds
        .map((id) => fields.find((f) => f.id === id))
        .filter((f): f is Field => Boolean(f))

      if (selectedFields.length !== input.fieldIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Um ou mais campos selecionados não pertencem a este formulário",
        })
      }

      const where: Prisma.FormResponseWhereInput = { formId: input.formId }

      if (input.startDate ?? input.endDate) {
        where.createdAt = {}
        if (input.startDate) where.createdAt.gte = input.startDate
        if (input.endDate) {
          const endDate = new Date(input.endDate)
          endDate.setHours(23, 59, 59, 999)
          where.createdAt.lte = endDate
        }
      }

      const rows = await ctx.db.formResponse.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              setor: true,
            },
          },
        },
        orderBy: [
          { user: { firstName: "asc" } },
          { user: { lastName: "asc" } },
          { createdAt: "asc" },
        ],
        take: MAX_SPREADSHEET_EXPORT_ROWS,
      })

      // Pré-calcula total de envios por userId dentro do período
      const userCounts = new Map<string, number>()
      for (const r of rows) {
        userCounts.set(r.userId, (userCounts.get(r.userId) ?? 0) + 1)
      }

      const staticHeaders = ["Respondente", "E-mail", "Setor", "Total de envios", "Número", "Data envio", "Status"] as const
      const fieldHeaders = selectedFields.map((f) => f.label.replace(/\r?\n/g, " "))
      const headers = [...staticHeaders, ...fieldHeaders]

      const statusPt: Record<string, string> = {
        NOT_STARTED: "Não iniciado",
        IN_PROGRESS: "Em andamento",
        COMPLETED: "Concluído",
      }

      const bodyRows: string[][] = rows.map((r) => {
        const data = (r.responses[0] as Record<string, unknown> | undefined) ?? {}
        const displayName = [r.user.firstName, r.user.lastName].filter(Boolean).join(" ").trim() || r.user.email
        const staticCells = [
          displayName,
          r.user.email,
          r.user.setor ?? "",
          String(userCounts.get(r.userId) ?? 1),
          r.number != null ? String(r.number) : "",
          r.createdAt.toISOString(),
          statusPt[r.status] ?? r.status,
        ]
        const fieldCells = selectedFields.map((f) => formatSpreadsheetCell(data[f.name]))
        return [...staticCells, ...fieldCells]
      })

      const xlsxBase64 = buildXlsxBase64FromRows(headers, bodyRows, "Por usuário")

      return {
        xlsxBase64,
        filename: sanitizeXlsxFilename(`${form.title ?? "formulario"}-por-usuario`),
        truncated: rows.length >= MAX_SPREADSHEET_EXPORT_ROWS,
        rowCount: rows.length,
      }
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
          number: z.number().optional(),
          tagIds: z.array(z.string()).optional(),
          formIds: z.array(z.string()).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.auth.userId

      // Construir where clause: formulários em que o usuário é responsável (criador ou owner)
      const where: Prisma.FormResponseWhereInput = {
        form: {
          OR: [
            { userId: currentUserId },
            { ownerIds: { has: currentUserId } },
          ],
        },
      }

      // Filtro por formulário(s): restringe aos formulários selecionados (ainda dentro dos que o usuário tem acesso)
      if (input?.formIds && input.formIds.length > 0) {
        where.formId = { in: input.formIds }
      }

      // Filtro por número do chamado
      if (input?.number !== undefined) {
        where.number = input.number
      }

      // Filtro por tags
      if (input?.tagIds && input.tagIds.length > 0) {
        where.tags = {
          array_contains: input.tagIds,
        }
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
        const assignedTo = extractAssignedTo(r.responses)
        return { ...r, tags, assignedTo, lastChatAt, myLastViewedAt, hasNewMessages }
      })
    }),

  listQueueInfinite: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(25),
          cursor: z.string().optional(),
          status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).optional(),
          search: z.string().optional(),
          tagIds: z.array(z.string()).optional(),
          formIds: z.array(z.string()).optional(),
          userIds: z.array(z.string()).optional(),
          setores: z.array(z.string()).optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          number: z.number().optional(),
          hasResponse: z.boolean().optional(),
          priority: z.enum(["ASC", "DESC"]).default("DESC"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 25
      const currentUserId = ctx.auth.userId

      const where: Prisma.FormResponseWhereInput = {
        form: {
          OR: [
            { userId: currentUserId },
            { ownerIds: { has: currentUserId } },
          ],
        },
      }

      if (input?.status) {
        where.status = input.status
      }

      if (input?.formIds && input.formIds.length > 0) {
        where.formId = { in: input.formIds }
      }

      if (input?.userIds && input.userIds.length > 0) {
        where.userId = { in: input.userIds }
      }

      if (input?.setores && input.setores.length > 0) {
        where.user = {
          setor: { in: input.setores },
        }
      }

      if (input?.startDate || input?.endDate) {
        where.createdAt = {}
        if (input.startDate) where.createdAt.gte = input.startDate
        if (input.endDate) where.createdAt.lte = input.endDate
      }

      if (input?.number != null) {
        where.number = input.number
      }

      if (input?.hasResponse !== undefined) {
        if (input.hasResponse) {
          where.FormResponseChat = { some: {} }
        } else {
          where.FormResponseChat = { none: {} }
        }
      }

      if (input?.tagIds && input.tagIds.length > 0) {
        where.tags = {
          array_contains: input.tagIds,
        }
      }

      if (input?.search) {
        const q = input.search.trim()
        const num = parseInt(q.replace(/\D/g, ""), 10)
        where.AND = [
          {
            OR: [
              { form: { title: { contains: q, mode: "insensitive" } } },
              { user: { firstName: { contains: q, mode: "insensitive" } } },
              { user: { lastName: { contains: q, mode: "insensitive" } } },
              { user: { email: { contains: q, mode: "insensitive" } } },
              ...(!isNaN(num) ? [{ number: num }] : []),
            ],
          },
        ]
      }

      const orderBy: Prisma.FormResponseOrderByWithRelationInput =
        input?.priority === "ASC" ? { createdAt: "asc" } : { createdAt: "desc" }

      const items = await ctx.db.formResponse.findMany({
        take: limit + 1,
        where,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        orderBy,
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
      })

      let nextCursor: string | undefined = undefined
      if (items.length > limit) {
        const nextItem = items.pop()
        nextCursor = nextItem?.id
      }

      const responseIds = items.map((r) => r.id)
      if (responseIds.length === 0) {
        return {
          items: [],
          nextCursor: undefined,
        }
      }

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
        findMany: (
          args: FormResponseViewFindManyArgs,
        ) => Promise<Array<{ formResponseId: string; lastViewedAt: Date }>>
      }
      const formResponseViewClient: FormResponseViewClient = (
        ctx.db as unknown as { formResponseView: FormResponseViewClient }
      ).formResponseView

      const views = await formResponseViewClient
        .findMany({
          where: { formResponseId: { in: responseIds }, userId: currentUserId },
          select: { formResponseId: true, lastViewedAt: true },
        })
        .catch(() => [])

      const lastChatMap = new Map<string, Date | null>()
      for (const c of chats) {
        if (!lastChatMap.has(c.formResponseId)) {
          lastChatMap.set(c.formResponseId, c.createdAt ?? null)
        }
      }
      const viewMap = new Map<string, Date>(views.map((v) => [v.formResponseId, v.lastViewedAt]))

      const enriched = items.map((r) => {
        const lastChatAt = lastChatMap.get(r.id) ?? null
        const myLastViewedAt = viewMap.get(r.id) ?? null
        const hasNewMessages = !!lastChatAt && (!myLastViewedAt || lastChatAt >= myLastViewedAt)
        const tags = Array.isArray(r.tags) ? (r.tags as string[]) : null
        const assignedTo = extractAssignedTo(r.responses)
        return { ...r, tags, assignedTo, lastChatAt, myLastViewedAt, hasNewMessages }
      })

      return {
        items: enriched,
        nextCursor,
      }
    }),

  getQueueKpis: protectedProcedure
    .input(
      z
        .object({
          tagIds: z.array(z.string()).optional(),
          formIds: z.array(z.string()).optional(),
          userIds: z.array(z.string()).optional(),
          setores: z.array(z.string()).optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          search: z.string().optional(),
          number: z.number().optional(),
          hasResponse: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.auth.userId
      const where: Prisma.FormResponseWhereInput = {
        form: {
          OR: [
            { userId: currentUserId },
            { ownerIds: { has: currentUserId } },
          ],
        },
      }

      if (input?.formIds && input.formIds.length > 0) {
        where.formId = { in: input.formIds }
      }

      if (input?.userIds && input.userIds.length > 0) {
        where.userId = { in: input.userIds }
      }

      if (input?.setores && input.setores.length > 0) {
        where.user = {
          setor: { in: input.setores },
        }
      }

      if (input?.startDate || input?.endDate) {
        where.createdAt = {}
        if (input.startDate) where.createdAt.gte = input.startDate
        if (input.endDate) where.createdAt.lte = input.endDate
      }

      if (input?.number != null) {
        where.number = input.number
      }

      if (input?.hasResponse !== undefined) {
        if (input.hasResponse) {
          where.FormResponseChat = { some: {} }
        } else {
          where.FormResponseChat = { none: {} }
        }
      }

      if (input?.tagIds && input.tagIds.length > 0) {
        where.tags = {
          array_contains: input.tagIds,
        }
      }

      if (input?.search) {
        const q = input.search.trim()
        const num = parseInt(q.replace(/\D/g, ""), 10)
        where.AND = [
          {
            OR: [
              { form: { title: { contains: q, mode: "insensitive" } } },
              { user: { firstName: { contains: q, mode: "insensitive" } } },
              { user: { lastName: { contains: q, mode: "insensitive" } } },
              { user: { email: { contains: q, mode: "insensitive" } } },
              ...(!isNaN(num) ? [{ number: num }] : []),
            ],
          },
        ]
      }

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const yesterday24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const [notStarted, inProgress, done, recentDone, aging] = await Promise.all([
        ctx.db.formResponse.count({ where: { ...where, status: "NOT_STARTED" } }),
        ctx.db.formResponse.count({ where: { ...where, status: "IN_PROGRESS" } }),
        ctx.db.formResponse.count({ where: { ...where, status: "COMPLETED" } }),
        ctx.db.formResponse.count({
          where: {
            ...where,
            status: "COMPLETED",
            updatedAt: { gte: todayStart },
          },
        }),
        ctx.db.formResponse.count({
          where: {
            ...where,
            status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
            createdAt: { lte: yesterday24h },
          },
        }),
      ])

      return { notStarted, inProgress, done, recentDone, aging }
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
            data: Array.from(recipients).map((userId) => ({
              title: "Nova mensagem no formulário",
              message: input.message,
              type: "COMMENT_ADDED",
              channel: "IN_APP",
              userId,
              entityId: input.responseId,
              entityType: "form_response",
              actionUrl: userId === response.userId ? "/forms/my-responses" : `/forms/${response.formId}/responses`,
              createdAt: now,
              updatedAt: now,
            })),
          })

          // Enviar emails para os destinatários
          if (responseWithDetails) {
            const recipientUserIds = Array.from(recipients)
            const recipientUsers = await ctx.db.user.findMany({
              where: { 
                id: { in: recipientUserIds },
                is_active: true,
              },
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

                const chamadoLabel = formatFormResponseNumber(responseWithDetails.number)
                const emailContent = mockEmailChatMensagemFormulario(
                  destinatarioNome,
                  remetenteNome,
                  input.message,
                  input.responseId,
                  formTitle,
                  isAutor,
                  responseWithDetails.number,
                )

                await sendEmail(
                  recipient.email,
                  chamadoLabel
                    ? `Elo | Intranet - Nova mensagem ${chamadoLabel} em Solicitações`
                    : "Elo | Intranet - Você tem uma nova mensagem em Solicitações",
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
    const items = await ctx.db.formResponse.findMany({
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
    return items.map((r) => ({
      ...r,
      assignedTo: extractAssignedTo(r.responses),
    }))
  }),

  assumeResponse: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
        attendantUserId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.auth.userId
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: {
          form: { select: { id: true, title: true, userId: true, ownerIds: true } },
          user: { select: NOTIFY_USER_SELECT },
        },
      })

      if (!response) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chamado não encontrado" })
      }

      const isOwner = response.form.userId === currentUserId || response.form.ownerIds.includes(currentUserId)
      if (!isOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas responsáveis pelo formulário podem assumir chamados" })
      }

      const targetUserId = input.attendantUserId ?? currentUserId
      const targetUser = await ctx.db.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
          setor: true,
        },
      })

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário atendente não encontrado" })
      }

      const attendantName = targetUser.firstName
        ? `${targetUser.firstName}${targetUser.lastName ? ` ${targetUser.lastName}` : ""}`.trim()
        : targetUser.email

      const attendantData: FormResponseAttendant = {
        userId: targetUser.id,
        name: attendantName,
        email: targetUser.email,
        imageUrl: targetUser.imageUrl,
        setor: targetUser.setor,
        assignedAt: new Date().toISOString(),
      }

      const currentResponses = Array.isArray(response.responses) ? [...response.responses] : [{}]
      const firstObj = (currentResponses[0] as Record<string, unknown> | undefined) ?? {}
      currentResponses[0] = {
        ...firstObj,
        _assignedTo: attendantData,
      }

      const nextStatus = response.status === "NOT_STARTED" ? "IN_PROGRESS" : response.status

      const updated = await ctx.db.formResponse.update({
        where: { id: input.responseId },
        data: {
          responses: currentResponses as unknown as Prisma.InputJsonValue[],
          status: nextStatus,
          updatedAt: new Date(),
        },
        include: {
          form: true,
          user: { select: NOTIFY_USER_SELECT },
        },
      })

      const executorUser = await ctx.db.user.findUnique({
        where: { id: currentUserId },
        select: { firstName: true, lastName: true, email: true },
      })
      const executorName = executorUser?.firstName
        ? `${executorUser.firstName}${executorUser.lastName ? ` ${executorUser.lastName}` : ""}`.trim()
        : (executorUser?.email ?? "Responsável")

      const attendanceSystemMessage =
        targetUserId === currentUserId
          ? `[ATENDIMENTO] **${attendantName}** assumiu o atendimento deste chamado.`
          : `[ATENDIMENTO] O atendimento do chamado foi atribuído para **${attendantName}** por **${executorName}**.`

      await dispatchTicketEvent({
        ctx,
        responseId: input.responseId,
        formId: response.form.id,
        formTitle: response.form.title ?? "Formulário",
        formCreatorId: response.form.userId,
        ownerIds: response.form.ownerIds ?? [],
        authorId: response.userId,
        responseNumber: response.number,
        executorId: currentUserId,
        executorName,
        eventType: "ATTENDANT_ASSIGNED",
        systemMessage: attendanceSystemMessage,
        notificationTitle: "Atendente atribuído ao chamado",
        notificationMessage: `${attendantName} agora é o atendente responsável pela solicitação em "${response.form.title ?? "Formulário"}".`,
      })

      return {
        ...updated,
        assignedTo: attendantData,
      }
    }),

  unassignResponse: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.auth.userId
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: {
          form: { select: { id: true, title: true, userId: true, ownerIds: true } },
          user: { select: NOTIFY_USER_SELECT },
        },
      })

      if (!response) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chamado não encontrado" })
      }

      const isOwner = response.form.userId === currentUserId || response.form.ownerIds.includes(currentUserId)
      if (!isOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas responsáveis pelo formulário podem liberar chamados" })
      }

      const currentResponses = Array.isArray(response.responses) ? [...response.responses] : [{}]
      const firstObj = (currentResponses[0] as Record<string, unknown> | undefined) ?? {}
      const restObj = { ...firstObj }
      delete restObj._assignedTo
      currentResponses[0] = restObj

      const updated = await ctx.db.formResponse.update({
        where: { id: input.responseId },
        data: {
          responses: currentResponses as unknown as Prisma.InputJsonValue[],
          updatedAt: new Date(),
        },
        include: {
          form: true,
          user: { select: NOTIFY_USER_SELECT },
        },
      })

      const executorUser = await ctx.db.user.findUnique({
        where: { id: currentUserId },
        select: { firstName: true, lastName: true, email: true },
      })
      const executorName = executorUser?.firstName
        ? `${executorUser.firstName}${executorUser.lastName ? ` ${executorUser.lastName}` : ""}`.trim()
        : (executorUser?.email ?? "Responsável")

      await dispatchTicketEvent({
        ctx,
        responseId: input.responseId,
        formId: response.form.id,
        formTitle: response.form.title ?? "Formulário",
        formCreatorId: response.form.userId,
        ownerIds: response.form.ownerIds ?? [],
        authorId: response.userId,
        responseNumber: response.number,
        executorId: currentUserId,
        executorName,
        eventType: "ATTENDANT_UNASSIGNED",
        systemMessage: `[ATENDIMENTO] O atendimento do chamado foi liberado por **${executorName}** e está disponível para a equipe.`,
        notificationTitle: "Atendimento do chamado liberado",
        notificationMessage: `O atendimento da solicitação em "${response.form.title ?? "Formulário"}" foi liberado.`,
      })

      return {
        ...updated,
        assignedTo: null,
      }
    }),

  getFormResponsibles: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const form = await ctx.db.form.findUnique({
        where: { id: input.formId },
        select: { userId: true, ownerIds: true },
      })
      if (!form) return []
      const userIds = Array.from(new Set([form.userId, ...form.ownerIds])).filter(Boolean)
      return await ctx.db.user.findMany({
        where: { id: { in: userIds }, is_active: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
          setor: true,
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
        include: { form: { select: { id: true, title: true, userId: true, ownerIds: true } } },
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

      // Se o status não mudou e o comentário não mudou, retorna sem disparar evento de alteração
      const isStatusChanged = response.status !== input.status
      const isCommentChanged = input.statusComment !== undefined && input.statusComment !== response.statusComment

      if (!isStatusChanged && !isCommentChanged) {
        return {
          ...response,
          assignedTo: extractAssignedTo(response.responses),
        }
      }

      // Se apenas o comentário mudou sem alteração de status, atualiza sem disparar mensagem de STATUS_CHANGED
      if (!isStatusChanged && isCommentChanged) {
        const updated = await ctx.db.formResponse.update({
          where: { id: input.responseId },
          data: {
            statusComment: input.statusComment,
            updatedAt: new Date(),
          },
          include: {
            form: true,
            user: { select: NOTIFY_USER_SELECT },
          },
        })
        return {
          ...updated,
          assignedTo: extractAssignedTo(updated.responses),
        }
      }

      const executor = await ctx.db.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true, setor: true }
      })

      const executorNome = executor?.firstName
        ? `${executor.firstName}${executor.lastName ? ` ${executor.lastName}` : ''}`.trim()
        : (executor?.email ?? 'Um administrador')

      const currentResponses = Array.isArray(response.responses) ? [...response.responses] : [{}]
      const firstObj = (currentResponses[0] as Record<string, unknown> | undefined) ?? {}
      let updatedResponses = currentResponses

      if (!firstObj._assignedTo && (input.status === "IN_PROGRESS" || input.status === "COMPLETED") && executor) {
        currentResponses[0] = {
          ...firstObj,
          _assignedTo: {
            userId: executor.id,
            name: executorNome,
            email: executor.email,
            imageUrl: executor.imageUrl,
            setor: executor.setor,
            assignedAt: new Date().toISOString(),
          },
        }
        updatedResponses = currentResponses
      }

      const ret = await ctx.db.formResponse.update({
        where: { id: input.responseId },
        data: {
          responses: updatedResponses as unknown as Prisma.InputJsonValue[],
          status: input.status,
          statusComment: input.statusComment,
          updatedAt: new Date(),
          // Ao finalizar o chamado, remover todas as tags
          ...(input.status === "COMPLETED" && { tags: Prisma.JsonNull }),
        },
        include: {
          form: true,
          user: { select: NOTIFY_USER_SELECT }, // Incluir autor para notificação
        },
      })

      const statusLabel = STATUS_LABELS[input.status] ?? input.status
      const formTitle = response.form.title ?? "Formulário"
      const author = (ret as unknown as { user?: { firstName?: string | null; email?: string | null } }).user

      await dispatchTicketEvent({
        ctx,
        responseId: ret.id,
        formId: response.form.id,
        formTitle,
        formCreatorId: response.form.userId,
        ownerIds: response.form.ownerIds ?? [],
        authorId: response.userId,
        responseNumber: ret.number,
        executorId: currentUserId,
        executorName: executorNome,
        eventType: "STATUS_CHANGED",
        systemMessage: `[STATUS] O status do chamado foi alterado para **${statusLabel}** por **${executorNome}**${input.statusComment ? `.\n\n> 💬 *Observação:* ${input.statusComment}` : "."}`,
        notificationTitle: "Status do chamado atualizado",
        notificationMessage: `${executorNome} alterou o status da sua solicitação em "${formTitle}" para ${statusLabel}.`,
        emailSubject: `Atualização na sua solicitação: ${statusLabel}`,
        emailContent: mockEmailSituacaoFormulario(author?.firstName ?? "Solicitante", input.status, ret.id, response.form.id, formTitle),
      })

      return {
        ...ret,
        assignedTo: extractAssignedTo(ret.responses),
      }
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
              user: { select: PUBLIC_USER_SELECT },
            },
          },
          user: { select: PUBLIC_USER_SELECT },
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
      const assignedTo = extractAssignedTo(response.responses)

      return {
        ...response,
        tags,
        assignedTo,
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
          form: {
            select: {
              id: true,
              title: true,
              userId: true,
              ownerIds: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              is_active: true,
            },
          },
        },
      })

      if (!existingResponse) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resposta não encontrada",
        })
      }

      const currentUser = await ctx.db.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role_config: true,
        },
      })

      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      const roleConfig = (currentUser?.role_config ?? {}) as import("@/types/role-config").RolesConfig
      const isAdmin = roleConfig.sudo || (roleConfig.can_create_solicitacoes ?? false)
      const isOwner =
        isAdmin ||
        existingResponse.form.userId === currentUserId ||
        existingResponse.form.ownerIds.includes(currentUserId)
      const isAuthor = existingResponse.userId === currentUserId

      if (!isOwner && !isAuthor) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar esta resposta",
        })
      }

      if (isAuthor && !isOwner && existingResponse.status === "COMPLETED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Esta solicitação já foi finalizada e não pode mais ser editada pelo solicitante.",
        })
      }

      const editorName = currentUser?.firstName
        ? `${currentUser.firstName}${currentUser.lastName ? ` ${currentUser.lastName}` : ""}`.trim()
        : (currentUser?.email ?? "Administrador")

      const now = new Date()
      const isEditedByStaff = currentUserId !== existingResponse.userId

      // Enriquecer o payload de respostas com metadados de auditoria de última edição
      const updatedResponses = input.responses.map((resp, idx) => {
        if (idx === 0) {
          const currentAudit = (resp._lastEdit as Record<string, unknown> | undefined) ?? {}
          return {
            ...resp,
            _lastEdit: {
              ...currentAudit,
              editorId: currentUserId,
              editorName,
              isStaff: isEditedByStaff,
              editedAt: now.toISOString(),
            },
          }
        }
        return resp
      })

      const updated = await ctx.db.formResponse.update({
        where: { id: input.responseId },
        data: {
          responses: updatedResponses,
          updatedAt: now,
        },
        include: {
          form: true,
          user: {
            select: PUBLIC_USER_SELECT,
          },
        },
      })

      await dispatchTicketEvent({
        ctx,
        responseId: input.responseId,
        formId: existingResponse.form.id,
        formTitle: existingResponse.form.title ?? "Formulário",
        formCreatorId: existingResponse.form.userId,
        ownerIds: existingResponse.form.ownerIds ?? [],
        authorId: existingResponse.userId,
        responseNumber: existingResponse.number,
        executorId: currentUserId,
        executorName: editorName,
        eventType: "TICKET_EDITED",
        systemMessage: isEditedByStaff
          ? `[EDICAO] As informações deste chamado foram atualizadas por **${editorName}** (Equipe de Atendimento).`
          : `[EDICAO] O solicitante **${editorName}** atualizou as respostas deste chamado.`,
        notificationTitle: "Chamado editado",
        notificationMessage: `${editorName} editou as informações da solicitação em "${existingResponse.form.title ?? "Formulário"}".`,
      })

      return updated
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

    return tags.filter((tag) => tag?.ativa)
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
          formResponseTags: [],
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
          formResponseTags: updatedTags,
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
          formResponseTags: [],
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
          formResponseTags: tags,
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
          formResponseTags: [],
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
      const [updatedResponse] = await Promise.all([
        ctx.db.formResponse.update({
          where: { id: input.responseId },
          data: {
            tags: updatedTags,
          },
          include: {
            user: { select: NOTIFY_USER_SELECT },
            form: true,
          }
        }),
        ctx.db.globalConfig.update({
          where: { id: config.id },
          data: {
            formResponseTags: tags,
          },
        }),
      ])

      const executor = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { firstName: true, lastName: true, email: true }
      })
      const executorNome = executor?.firstName
        ? `${executor.firstName}${executor.lastName ? ` ${executor.lastName}` : ''}`.trim()
        : (executor?.email ?? 'Um administrador')

      const formTitle = updatedResponse.form.title ?? "Formulário"

      await dispatchTicketEvent({
        ctx,
        responseId: updatedResponse.id,
        formId: updatedResponse.form.id,
        formTitle,
        formCreatorId: updatedResponse.form.userId,
        ownerIds: updatedResponse.form.ownerIds ?? [],
        authorId: updatedResponse.userId,
        responseNumber: updatedResponse.number,
        executorId: ctx.auth.userId,
        executorName: executorNome,
        eventType: "TAG_APPLIED",
        systemMessage: `[TAG] Tag **${tag.nome}** vinculada ao chamado por **${executorNome}**.`,
        notificationTitle: "Tag adicionada à solicitação",
        notificationMessage: `${executorNome} vinculou a tag "${tag.nome}" ao chamado em "${formTitle}".`,
        emailSubject: `Tag adicionada: ${tag.nome}`,
        emailContent: mockEmailTagFormulario(
          updatedResponse.user.firstName ?? "Usuário",
          executorNome,
          tag.nome,
          updatedResponse.id,
          updatedResponse.formId,
          formTitle,
        ),
      })

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
        include: { form: true },
      })

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resposta não encontrada"
        })
      }

      const currentTags = (response.tags as unknown as string[]) || []
      const updatedTags = currentTags.filter(tagId => tagId !== input.tagId)

      const [updatedResponse] = await Promise.all([
        ctx.db.formResponse.update({
          where: { id: input.responseId },
          data: {
            tags: updatedTags,
          },
          include: {
            user: { select: PUBLIC_USER_SELECT },
            form: true,
          }
        }),
      ])

      const executor = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { firstName: true, lastName: true, email: true }
      })
      const executorNome = executor?.firstName
        ? `${executor.firstName}${executor.lastName ? ` ${executor.lastName}` : ''}`.trim()
        : (executor?.email ?? 'Um administrador')

      // Buscar nome da tag
      const config = await ctx.db.globalConfig.findFirst()
      const tags = (config?.formResponseTags as unknown as Array<{ id: string, nome: string }>) || []
      const tag = tags.find(t => t.id === input.tagId)
      const tagName = tag?.nome ?? 'Tag'

      const formTitle = updatedResponse.form.title ?? "Formulário"

      await dispatchTicketEvent({
        ctx,
        responseId: updatedResponse.id,
        formId: updatedResponse.form.id,
        formTitle,
        formCreatorId: updatedResponse.form.userId,
        ownerIds: updatedResponse.form.ownerIds ?? [],
        authorId: updatedResponse.userId,
        responseNumber: updatedResponse.number,
        executorId: ctx.auth.userId,
        executorName: executorNome,
        eventType: "TAG_REMOVED",
        systemMessage: `[TAG] Tag **${tagName}** desvinculada do chamado por **${executorNome}**.`,
        notificationTitle: "Tag removida da solicitação",
        notificationMessage: `${executorNome} removeu a tag "${tagName}" da solicitação em "${formTitle}".`,
      })

      return { success: true }
    }),

  getTags: protectedProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.globalConfig.findFirst({
      where: { id: "default" }
    })
    return (config?.formResponseTags as unknown as Array<{ id: string, nome: string, cor?: string, countVezesUsadas?: number }>) || []
  }),
})
