/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod"
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc"
import type { Prisma } from "@prisma/client"

export const kpiRouter = createTRPCRouter({
  // Buscar todos os KPIs ativos
  listActive: adminProcedure
    .query(async ({ ctx }) => {

      const kpis = await ctx.db.kpi.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: {
              suggestions: true,
            },
          },
        },
      })

      return kpis
    }),

  // Buscar KPIs por nome (para busca)
  search: adminProcedure
    .input(z.object({
      query: z.string().min(1),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.kpi.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              name: {
                contains: input.query,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
          ],
        },
        orderBy: { order: "asc" },
        take: 10,
        include: {
          _count: {
            select: {
              suggestions: true,
            },
          },
        },
      })
    }),

  // Criar novo KPI
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      order: z.number().int().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se já existe um KPI com o mesmo nome
      const existingKpi = await ctx.db.kpi.findUnique({
        where: { name: input.name },
      })

      if (existingKpi) {
        throw new Error("Já existe um KPI com este nome")
      }

      const newKpi = await ctx.db.kpi.create({
        data: {
          name: input.name,
          description: input.description,
          order: input.order,
        },
      })

      return newKpi
    }),

  // Atualizar KPI
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      isActive: z.boolean().optional(),
      order: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Se está mudando o nome, verificar se já existe
      if (updateData.name) {
        const existingKpi = await ctx.db.kpi.findFirst({
          where: {
            name: updateData.name,
            id: { not: id },
          },
        })

        if (existingKpi) {
          throw new Error("Já existe um KPI com este nome")
        }
      }

      return ctx.db.kpi.update({
        where: { id },
        data: updateData,
      })
    }),

  // Deletar KPI (soft delete)
  delete: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.kpi.update({
        where: { id: input.id },
        data: { isActive: false },
      })
    }),

  // Buscar KPIs por sugestão
  getBySuggestionId: adminProcedure
    .input(z.object({
      suggestionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {

      const suggestionKpis = await ctx.db.suggestionKpi.findMany({
        where: { suggestionId: input.suggestionId },
        include: {
          kpi: true,
        },
        orderBy: {
          kpi: { order: "asc" },
        },
      })

      return suggestionKpis.map((sk) => sk.kpi)
    }),

  // Vincular KPIs a uma sugestão
  linkToSuggestion: adminProcedure
    .input(z.object({
      suggestionId: z.string(),
      kpiIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.suggestionKpi.deleteMany({
          where: { suggestionId: input.suggestionId },
        })

        if (input.kpiIds.length > 0) {
          await ctx.db.suggestionKpi.createMany({
            data: input.kpiIds.map((kpiId) => ({
              suggestionId: input.suggestionId,
              kpiId,
            })),
          })
        }

        return { success: true }
      } catch (error) {
        console.error('linkToSuggestion error:', error)
        throw error
      }
    }),

  // Desvincular KPIs de uma sugestão
  unlinkFromSuggestion: adminProcedure
    .input(z.object({
      suggestionId: z.string(),
      kpiIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.suggestionKpi.deleteMany({
        where: {
          suggestionId: input.suggestionId,
          kpiId: { in: input.kpiIds },
        },
      })
    }),
})