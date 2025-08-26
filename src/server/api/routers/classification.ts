import { z } from "zod"
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc"

export const classificationRouter = createTRPCRouter({
  // Listar todas as classificações ativas por tipo
  listByType: protectedProcedure
    .input(z.object({
      type: z.enum(["IMPACT", "CAPACITY", "EFFORT"])
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.classification.findMany({
        where: {
          type: input.type,
          isActive: true
        },
        orderBy: [
          { order: 'asc' },
          { score: 'desc' }
        ]
      })
    }),

  // Listar todas as classificações (para admin)
  listAll: adminProcedure
    .input(z.object({
      type: z.enum(["IMPACT", "CAPACITY", "EFFORT"]).optional()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.classification.findMany({
        where: input.type ? { type: input.type } : undefined,
        orderBy: [
          { type: 'asc' },
          { order: 'asc' },
          { score: 'desc' }
        ]
      })
    }),

  // Criar nova classificação
  create: adminProcedure
    .input(z.object({
      label: z.string().min(1).max(100),
      score: z.number().int().min(0).max(10),
      type: z.enum(["IMPACT", "CAPACITY", "EFFORT"]),
      order: z.number().int().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Se não especificado, colocar no final
      const maxOrder = await ctx.db.classification.aggregate({
        where: { type: input.type },
        _max: { order: true }
      })

      return await ctx.db.classification.create({
        data: {
          label: input.label,
          score: input.score,
          type: input.type,
          order: input.order ?? ((maxOrder._max.order ?? 0) + 1)
        }
      })
    }),

  // Atualizar classificação
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      label: z.string().min(1).max(100).optional(),
      score: z.number().int().min(0).max(10).optional(),
      order: z.number().int().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      
      return await ctx.db.classification.update({
        where: { id },
        data
      })
    }),

  // Deletar classificação (soft delete)
  delete: adminProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.classification.update({
        where: { id: input.id },
        data: { isActive: false }
      })
    }),

  // Reordenar classificações
  reorder: adminProcedure
    .input(z.object({
      type: z.enum(["IMPACT", "CAPACITY", "EFFORT"]),
      items: z.array(z.object({
        id: z.string(),
        order: z.number().int()
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      // Atualizar ordem de cada item
      const updatePromises = input.items.map(item =>
        ctx.db.classification.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )

      await Promise.all(updatePromises)
      
      return { success: true }
    }),


})
