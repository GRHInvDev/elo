import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { createMenuItemSchema, updateMenuItemSchema, menuItemIdSchema } from "@/schemas/menu-item.schema"

export const menuItemRouter = createTRPCRouter({
  // Criar um novo item do menu
  create: protectedProcedure
    .input(createMenuItemSchema)
    .mutation(async ({ ctx, input }) => {
      // Verificar se o restaurante existe
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: input.restaurantId },
      })

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurante não encontrado",
        })
      }

      return ctx.db.menuItem.create({
        data: input,
        include: {
          restaurant: true,
        },
      })
    }),

  // Atualizar um item do menu
  update: protectedProcedure
    .input(updateMenuItemSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.menuItem.update({
        where: { id },
        data,
        include: {
          restaurant: true,
        },
      })
    }),

  // Deletar um item do menu
  delete: protectedProcedure
    .input(menuItemIdSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.menuItem.delete({
        where: { id: input.id },
      })
    }),

  // Buscar um item específico
  byId: protectedProcedure
    .input(menuItemIdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.db.menuItem.findUnique({
        where: { id: input.id },
        include: {
          restaurant: true,
        },
      })
    }),

  // Listar itens por restaurante
  byRestaurant: protectedProcedure
    .input(z.object({ restaurantId: z.string(), date: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      let weekDayFilter = {};
      if (input.date) {
        const weekDay = input.date.getDay(); // 0 = Domingo, 1 = Segunda, ...
        weekDayFilter = { weekDay };
      }
      const items = await ctx.db.menuItem.findMany({
        where: {
          restaurantId: input.restaurantId,
          available: true,
          ...weekDayFilter,
        },
        include: {
          restaurant: true,
          options: {
            include: {
              choices: true,
            },
          },
        },
        orderBy: [
          { category: "asc" },
          { name: "asc" },
        ],
      })
      return items
    }),

  // Listar todas as categorias
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.menuItem.findMany({
      where: { available: true },
      select: { category: true },
      distinct: ["category"],
    })
    return categories.map((item) => item.category).sort()
  }),

  // Listar itens por categoria
  byCategory: protectedProcedure
    .input(z.object({ 
      restaurantId: z.string(),
      category: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.menuItem.findMany({
        where: {
          restaurantId: input.restaurantId,
          available: true,
          ...(input.category && { category: input.category }),
        },
        include: {
          restaurant: true,
        },
        orderBy: { name: "asc" },
      })
    }),
}) 