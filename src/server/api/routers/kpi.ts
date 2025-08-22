import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const kpiRouter = createTRPCRouter({
  // Listar todos os KPIs
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.kpi.findMany({
        orderBy: { name: "asc" }
      });
    }),

  // Criar novo KPI
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.kpi.create({
        data: input
      });
    }),

  // Deletar KPI
  delete: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.kpi.delete({
        where: { id: input.id }
      });
    }),
});

