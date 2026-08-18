import "server-only"
import { z } from "zod"
import { AccessLogKind, type Prisma } from "@prisma/client"

import { createTRPCRouter, adminProcedure, protectedProcedure } from "../trpc"

import { ACCESS_LOG_RETENTION_DAYS } from "@/const/access-log"


/** Teto de itens por página na listagem, para não estourar a resposta. */
const MAX_PAGE_SIZE = 200

/**
 * Normaliza a rota antes de gravar: corta querystring/hash e troca segmentos
 * que são id por `:id`. Sem isso, `/forms/abc123` e `/forms/def456` viram duas
 * rotas distintas e o agrupamento por rota perde sentido.
 */
export function normalizePath(rawPath: string): string {
  const withoutQuery = rawPath.split(/[?#]/)[0] ?? rawPath
  const segments = withoutQuery.split("/")

  return segments
    .map((segment) => {
      if (segment.length < 12) return segment
      // cuid/uuid/hash: comprimento alto e sem separadores de palavra.
      if (/^[a-z0-9-]+$/i.test(segment) && /\d/.test(segment)) return ":id"
      return segment
    })
    .join("/")
}

/** Início da janela consultada. Sem `days`, usa a retenção inteira. */
function windowStart(days: number): Date {
  const start = new Date()
  start.setDate(start.getDate() - days)
  return start
}

const periodSchema = z
  .number()
  .int()
  .min(1)
  .max(ACCESS_LOG_RETENTION_DAYS)
  .default(7)

const kindSchema = z.nativeEnum(AccessLogKind).optional()

export const accessLogRouter = createTRPCRouter({
  /**
   * Registra uma navegação de página. Chamado pelo tracker no layout
   * autenticado — é o único ponto de escrita disparado pelo cliente.
   */
  trackPageView: protectedProcedure
    .input(
      z.object({
        path: z.string().min(1).max(512),
        /** Só vem no carregamento inicial, medido por Navigation Timing. */
        durationMs: z.number().int().min(0).max(600_000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.accessLog.create({
        data: {
          kind: AccessLogKind.PAGE_VIEW,
          path: normalizePath(input.path),
          userId: ctx.auth.userId,
          durationMs: input.durationMs,
          userAgent: ctx.headers.get("user-agent")?.slice(0, 512),
        },
      })

      return { ok: true }
    }),

  /**
   * Registros crus, do mais recente para o mais antigo, com paginação por
   * cursor. É a visão "o que aconteceu às 14h32".
   */
  list: adminProcedure
    .input(
      z.object({
        period: periodSchema,
        kind: kindSchema,
        /** Filtro por trecho da rota (case-insensitive). */
        path: z.string().max(512).optional(),
        userId: z.string().max(191).optional(),
        /** Só registros que falharam. */
        onlyErrors: z.boolean().default(false),
        limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.AccessLogWhereInput = {
        createdAt: { gte: windowStart(input.period) },
        ...(input.kind ? { kind: input.kind } : {}),
        ...(input.path
          ? { path: { contains: input.path, mode: "insensitive" } }
          : {}),
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.onlyErrors ? { ok: false } : {}),
      }

      const items = await ctx.db.accessLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        select: {
          id: true,
          kind: true,
          path: true,
          durationMs: true,
          ok: true,
          errorCode: true,
          userAgent: true,
          createdAt: true,
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      })

      const hasMore = items.length > input.limit
      const page = hasMore ? items.slice(0, input.limit) : items

      return {
        items: page,
        nextCursor: hasMore ? page[page.length - 1]?.id : undefined,
      }
    }),

  /**
   * Agregado por rota: é esta consulta que aponta o gargalo. Ordena pela
   * duração média, que é onde a rota lenta aparece independentemente de
   * quantas vezes foi chamada.
   */
  summary: adminProcedure
    .input(
      z.object({
        period: periodSchema,
        kind: kindSchema,
        limit: z.number().int().min(1).max(100).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.AccessLogWhereInput = {
        createdAt: { gte: windowStart(input.period) },
        ...(input.kind ? { kind: input.kind } : {}),
      }

      const grouped = await ctx.db.accessLog.groupBy({
        by: ["path", "kind"],
        where,
        _count: { _all: true },
        _avg: { durationMs: true },
        _max: { durationMs: true },
        orderBy: { _count: { path: "desc" } },
        take: input.limit,
      })

      const rows = grouped.map((row) => ({
        path: row.path,
        kind: row.kind,
        total: row._count._all,
        avgDurationMs:
          row._avg.durationMs === null ? null : Math.round(row._avg.durationMs),
        maxDurationMs: row._max.durationMs,
      }))

      // Ordena no servidor de aplicação: rotas com duração conhecida primeiro,
      // da mais lenta para a mais rápida. Rotas sem medição vão para o fim,
      // ordenadas por volume.
      rows.sort((a, b) => {
        if (a.avgDurationMs === null && b.avgDurationMs === null) {
          return b.total - a.total
        }
        if (a.avgDurationMs === null) return 1
        if (b.avgDurationMs === null) return -1
        return b.avgDurationMs - a.avgDurationMs
      })

      return rows
    }),

  /** Números do topo da tela: volume, usuários distintos e erros no período. */
  overview: adminProcedure
    .input(z.object({ period: periodSchema }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.AccessLogWhereInput = {
        createdAt: { gte: windowStart(input.period) },
      }

      const [pageViews, apiCalls, errors, distinctUsers] = await Promise.all([
        ctx.db.accessLog.count({
          where: { ...where, kind: AccessLogKind.PAGE_VIEW },
        }),
        ctx.db.accessLog.count({
          where: { ...where, kind: AccessLogKind.API_CALL },
        }),
        ctx.db.accessLog.count({ where: { ...where, ok: false } }),
        ctx.db.accessLog.findMany({
          where: { ...where, userId: { not: null } },
          distinct: ["userId"],
          select: { userId: true },
        }),
      ])

      return {
        pageViews,
        /** Lembrete de leitura: só entram chamadas lentas ou com erro. */
        apiCalls,
        errors,
        distinctUsers: distinctUsers.length,
      }
    }),
})
