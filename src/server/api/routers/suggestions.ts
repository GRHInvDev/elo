import { createTRPCRouter, protectedProcedure, middleware } from "../trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import type { InputJsonValue } from "@prisma/client/runtime/library"

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
      description: z.string().trim().min(1),
      contribution: z.object({
        type: z.enum(["IDEIA_INOVADORA","SUGESTAO_MELHORIA","SOLUCAO_PROBLEMA","OUTRO"]),
        other: z.string().trim().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
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
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              setor: true, // Adicionar o campo setor
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

  // Atualizações do admin (impact/capacity/effort/kpis/status/reason)
  updateAdmin: adminProcedure
    .input(z.object({
      id: z.string(),
      impact: ScoreItem.optional(),
      capacity: ScoreItem.optional(),
      effort: ScoreItem.optional(),
      kpis: z.array(z.string()).optional(),
      status: StatusEnum.optional(),
      rejectionReason: z.string().optional(),
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

      return ctx.db.suggestion.update({
        where: { id: input.id },
        data: {
          impact: (input.impact ?? prevImpact ?? null) as InputJsonValue,
          capacity: (input.capacity ?? prevCapacity ?? null) as InputJsonValue,
          effort: (input.effort ?? prevEffort ?? null) as InputJsonValue,
          kpis: (input.kpis ?? null) as InputJsonValue,
          status: input.status,
          rejectionReason: input.rejectionReason,
          analystId: ctx.auth.userId,
          finalScore,
          finalClassification: finalClassification as InputJsonValue,
        },
      })
    }),
})
