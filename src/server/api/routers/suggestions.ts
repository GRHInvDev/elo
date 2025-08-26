import { createTRPCRouter, protectedProcedure, middleware } from "../trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import type { InputJsonValue } from "@prisma/client/runtime/library"
import { sendEmail } from "@/lib/mail/email-utils"
import { mockEmailNotificacaoSugestao } from "@/lib/mail/html-mock"

const StatusEnum = z.enum(["NEW","IN_REVIEW","APPROVED","IN_PROGRESS","DONE","NOT_IMPLEMENTED"])

const ScoreItem = z.object({
  label: z.string(),
  score: z.number(),
})

// Middleware para admin inline
const adminMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Você deve estar logado para acessar esta funcionalidade.",
    })
  }

  const user = await ctx.db.user.findUnique({
    where: { id: ctx.auth.userId },
    select: { role: true, email: true },
  })

  if (!user || user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN", 
      message: "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: {
        ...user,
        id: ctx.auth.userId,
      },
    },
  })
})

// Procedure protegido para admins
const adminProcedure = protectedProcedure.use(adminMiddleware)

export const suggestionRouter = createTRPCRouter({
  // Criar sugestão (caixa)
  create: protectedProcedure
    .input(z.object({
      submittedName: z.string().trim().optional(),
      submittedSector: z.string().trim().optional(),
      description: z.string().trim().min(1),
      contribution: z.object({
        type: z.enum(["IDEIA_INOVADORA","SUGESTAO_MELHORIA","SOLUCAO_PROBLEMA","OUTRO"]),
        other: z.string().trim().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const me = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { enterprise: true },
      })

      const last = await ctx.db.suggestion.findFirst({
        orderBy: { ideaNumber: "desc" },
        select: { ideaNumber: true },
      })
      const ideaNumber = (last?.ideaNumber ?? 99) + 1

      return ctx.db.suggestion.create({
        data: {
          ideaNumber,
          userId: ctx.auth.userId,
          submittedName: input.submittedName ?? null,
          submittedSector: input.submittedSector ?? null,
          description: input.description,
          contribution: input.contribution as InputJsonValue,
          dateRef: new Date(),
          status: "NEW",
        },
      })
    }),

  // Listagem para admin (filtros simples)
  list: adminProcedure
    .input(z.object({
      status: z.array(StatusEnum).optional(),
      search: z.string().optional(),
      take: z.number().min(1).max(100).default(50),
      skip: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where = {
        status: input?.status ? { in: input.status } : undefined,
        description: input?.search
          ? { contains: input.search, mode: Prisma.QueryMode.insensitive }
          : undefined,
      }
      return ctx.db.suggestion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input?.take,
        skip: input?.skip,
        select: {
          id: true,
          ideaNumber: true,
          submittedName: true,
          submittedSector: true,
          isNameVisible: true,
          description: true,
          contribution: true,
          dateRef: true,
          impact: true,
          capacity: true,
          effort: true,
          finalScore: true,
          finalClassification: true,
          status: true,
          rejectionReason: true,
          analystId: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              setor: true,
            },
          },
          analyst: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })
    }),

  // Kanban
  listKanban: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.suggestion.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ideaNumber: true,
        description: true,
        submittedName: true,
        status: true,
        createdAt: true,
      },
    })
  }),

  // Atualizações do admin (impact/capacity/effort/kpis/status/reason/analyst)
  updateAdmin: adminProcedure
    .input(z.object({
      id: z.string(),
      impact: ScoreItem.optional(),
      capacity: ScoreItem.optional(),
      effort: ScoreItem.optional(),
      kpis: z.array(z.string()).optional(),
      status: StatusEnum.optional(),
      rejectionReason: z.string().optional(),
      analystId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const prev = await ctx.db.suggestion.findUnique({
        where: { id: input.id },
        select: { impact: true, capacity: true, effort: true },
      })

      const prevImpact = prev?.impact as unknown as { score?: number } | null
      const prevCapacity = prev?.capacity as unknown as { score?: number } | null
      const prevEffort = prev?.effort as unknown as { score?: number } | null

      const impactScore = input.impact?.score ?? prevImpact?.score ?? null
      const capacityScore = input.capacity?.score ?? prevCapacity?.score ?? null
      const effortScore = input.effort?.score ?? prevEffort?.score ?? null

      const finalScore =
        [impactScore, capacityScore, effortScore].every((v) => typeof v === "number")
          ? (impactScore! + capacityScore! - effortScore!)
          : null

      const finalClassification =
        typeof finalScore === "number"
          ? (finalScore >= 15
              ? { label: "Aprovar para Gestores", range: "15-20" }
              : finalScore >= 10
                ? { label: "Ajustar e incubar", range: "10-14" }
                : { label: "Descartar com justificativa clara", range: "0-9" })
          : null

      // Buscar dados da sugestão e usuário antes da atualização
      const suggestionData = await ctx.db.suggestion.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          analyst: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      if (!suggestionData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sugestão não encontrada"
        })
      }

      // Executar a atualização
      const updatedSuggestion = await ctx.db.suggestion.update({
        where: { id: input.id },
        data: {
          impact: (input.impact ?? prevImpact ?? null) as InputJsonValue,
          capacity: (input.capacity ?? prevCapacity ?? null) as InputJsonValue,
          effort: (input.effort ?? prevEffort ?? null) as InputJsonValue,
          kpis: (input.kpis ?? null) as InputJsonValue,
          status: input.status,
          rejectionReason: input.rejectionReason,
          analystId: input.analystId ?? ctx.auth.userId, // Usar analystId fornecido ou fallback para usuário atual
          finalScore,
          finalClassification: finalClassification as InputJsonValue,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          analyst: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      // Enviar email de notificação se o status foi alterado
      if (input.status && input.status !== suggestionData.status) {
        if (input.status === "NOT_IMPLEMENTED" && !input.rejectionReason) {
        } else {
          try {
            const nomeUsuario = `${suggestionData.user.firstName ?? ''} ${suggestionData.user.lastName ?? ''}`.trim() ?? 'Usuário'
            const nomeResponsavel = `${updatedSuggestion.analyst?.firstName ?? ''} ${updatedSuggestion.analyst?.lastName ?? ''}`.trim() ?? 'Admin'

            // Mapear status para português
            const statusMapping = {
              "NEW": "Nova",
              "IN_REVIEW": "Em avaliação",
              "APPROVED": "Aprovada",
              "IN_PROGRESS": "Em execução",
              "DONE": "Concluída",
              "NOT_IMPLEMENTED": "Não implementada"
            }

            const statusPortugues = statusMapping[input.status] || input.status

            // Enviar email apenas para o usuário que criou a sugestão
            await sendEmail(
              suggestionData.user.email,
              `Atualização da Sugestão #${suggestionData.ideaNumber}`,
              mockEmailNotificacaoSugestao(
                nomeUsuario,
                nomeResponsavel,
                suggestionData.ideaNumber,
                statusPortugues,
                input.rejectionReason
              )
            )

          } catch (emailError) {
            console.error("Erro ao enviar email de notificação:", emailError)
            // Não falhar a operação se o email não puder ser enviado
          }
        }
      }

      return updatedSuggestion
    }),

  // Enviar notificação por email quando motivo for salvo
  sendRejectionNotification: adminProcedure
    .input(z.object({
      suggestionId: z.string(),
      rejectionReason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Buscar dados da sugestão e usuário
      const suggestionData = await ctx.db.suggestion.findUnique({
        where: { id: input.suggestionId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          analyst: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      if (!suggestionData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sugestão não encontrada"
        })
      }

      if (suggestionData.status !== "NOT_IMPLEMENTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta sugestão não está marcada como 'Não implementada'"
        })
      }

      try {
        const nomeUsuario = `${suggestionData.user.firstName ?? ''} ${suggestionData.user.lastName ?? ''}`.trim() ?? 'Usuário'
        const nomeResponsavel = `${suggestionData.analyst?.firstName ?? ''} ${suggestionData.analyst?.lastName ?? ''}`.trim() ?? 'Admin'

        // Enviar email apenas para o usuário que criou a sugestão
        await sendEmail(
          suggestionData.user.email,
          `Atualização da Sugestão #${suggestionData.ideaNumber}`,
          mockEmailNotificacaoSugestao(
            nomeUsuario,
            nomeResponsavel,
            suggestionData.ideaNumber,
            "Não implementada",
            input.rejectionReason
          )
          // Removido CC para o admin - apenas notificação para o usuário
        )

        return { success: true, message: "Notificação enviada com sucesso" }
      } catch (emailError) {
        console.error("Erro ao enviar email de rejeição:", emailError)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao enviar notificação por email"
        })
      }
    }),
})
