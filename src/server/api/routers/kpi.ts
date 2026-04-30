/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc"
import { runSuggestSuccessKpis } from "@/server/ai/suggestion-kpi-suggest"

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
                mode: "insensitive",
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

  /**
   * Sugere KPIs de sucesso com IA: reutiliza KPIs ativos do catálogo e/ou cria novos,
   * depois mescla com os já vinculados à ideia.
   */
  suggestSuccessKpisForIdea: adminProcedure
    .input(z.object({ suggestionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const suggestion = await ctx.db.suggestion.findUnique({
        where: { id: input.suggestionId },
        select: {
          id: true,
          ideaNumber: true,
          problem: true,
          description: true,
          contribution: true,
          aiEnhancement: true,
        },
      })
      if (!suggestion) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ideia não encontrada" })
      }

      const contrib = suggestion.contribution as { type?: string; other?: string } | null
      const contributionSummary =
        contrib?.type === "IDEIA_INOVADORA"
          ? "Ideia inovadora"
          : contrib?.type === "SUGESTAO_MELHORIA"
            ? "Ideia de melhoria"
            : contrib?.type === "SOLUCAO_PROBLEMA"
              ? "Solução de problema"
              : contrib?.type === "OUTRO"
                ? `Outro: ${contrib?.other ?? ""}`
                : "—"

      const morrisonNote =
        suggestion.aiEnhancement &&
        typeof suggestion.aiEnhancement === "object" &&
        "morrison" in suggestion.aiEnhancement
          ? (suggestion.aiEnhancement as { morrison?: { evaluatorNote?: string } }).morrison
              ?.evaluatorNote ?? null
          : null

      const [activeKpis, currentLinks] = await Promise.all([
        ctx.db.kpi.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: { id: true, name: true, description: true },
        }),
        ctx.db.suggestionKpi.findMany({
          where: { suggestionId: input.suggestionId },
          select: { kpiId: true },
        }),
      ])

      const catalogIdSet = new Set(activeKpis.map((k) => k.id))
      const currentIds = new Set(currentLinks.map((l) => l.kpiId))

      const ai = await runSuggestSuccessKpis({
        ideaNumber: suggestion.ideaNumber,
        problem: suggestion.problem,
        description: suggestion.description,
        contributionSummary,
        morrisonNote,
        catalog: activeKpis,
      })

      if ("error" in ai) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message:
            "Geração de KPIs com IA indisponível. Verifique o Azure OpenAI ou tente novamente.",
        })
      }

      const fromCatalog = ai.result.existingKpiIdsToLink.filter((id) => catalogIdSet.has(id))

      const maxOrderAgg = await ctx.db.kpi.aggregate({ _max: { order: true } })
      let orderCursor = (maxOrderAgg._max.order ?? 0) + 1

      const resolvedFromNew: string[] = []
      for (const nk of ai.result.newKpisToCreate) {
        const name = nk.name.trim().slice(0, 100)
        if (name.length < 2) continue

        const existingByName = await ctx.db.kpi.findUnique({
          where: { name },
        })

        if (existingByName) {
          if (existingByName.isActive) {
            resolvedFromNew.push(existingByName.id)
          } else {
            const reactivated = await ctx.db.kpi.update({
              where: { id: existingByName.id },
              data: {
                isActive: true,
                description:
                  nk.description?.trim().slice(0, 500) ?? existingByName.description,
                order: orderCursor,
              },
            })
            orderCursor += 1
            resolvedFromNew.push(reactivated.id)
          }
          continue
        }

        const created = await ctx.db.kpi.create({
          data: {
            name,
            description: nk.description?.trim()
              ? nk.description.trim().slice(0, 500)
              : null,
            order: orderCursor,
          },
        })
        orderCursor += 1
        resolvedFromNew.push(created.id)
      }

      const finalIds = [...new Set([...currentIds, ...fromCatalog, ...resolvedFromNew])]

      await ctx.db.suggestionKpi.deleteMany({
        where: { suggestionId: input.suggestionId },
      })
      if (finalIds.length > 0) {
        await ctx.db.suggestionKpi.createMany({
          data: finalIds.map((kpiId) => ({
            suggestionId: input.suggestionId,
            kpiId,
          })),
        })
      }

      const newlyAddedCount = finalIds.filter((id) => !currentIds.has(id)).length

      return {
        totalLinked: finalIds.length,
        newlyAddedCount,
        linkedFromCatalogCount: fromCatalog.filter((id) => !currentIds.has(id)).length,
        createdOrReactivatedCount: resolvedFromNew.filter((id) => !currentIds.has(id)).length,
      }
    }),
})