import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { ClassificationType } from "@prisma/client";

export const classificationRouter = createTRPCRouter({
  // Listar todas as classificações por tipo
  list: protectedProcedure
    .input(z.object({
      type: z.enum(["IMPACT", "CAPACITY", "EFFORT"]).optional()
    }))
    .query(async ({ ctx, input }) => {
      const where = input.type ? { type: input.type } : {};
      
      return await ctx.db.classification.findMany({
        where,
        orderBy: [
          { score: "desc" },
          { label: "asc" }
        ]
      });
    }),

  // Criar nova classificação
  create: protectedProcedure
    .input(z.object({
      label: z.string().min(1),
      score: z.number().min(0).max(10),
      type: z.enum(["IMPACT", "CAPACITY", "EFFORT"])
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.classification.create({
        data: input
      });
    }),

  // Atualizar classificação
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      label: z.string().min(1),
      score: z.number().min(0).max(10)
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.classification.update({
        where: { id: input.id },
        data: {
          label: input.label,
          score: input.score
        }
      });
    }),

  // Deletar classificação
  delete: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.classification.delete({
        where: { id: input.id }
      });
    }),
});
