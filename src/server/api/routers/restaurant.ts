import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { createRestaurantSchema, updateRestaurantSchema, restaurantIdSchema } from "@/schemas/restaurant.schema"

export const restaurantRouter = createTRPCRouter({
  // Criar um novo restaurante
  create: protectedProcedure
    .input(createRestaurantSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.restaurant.create({
        data: input,
      })
    }),

  // Atualizar um restaurante existente
  update: protectedProcedure
    .input(updateRestaurantSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.restaurant.update({
        where: { id },
        data,
      })
    }),

  // Deletar um restaurante
  delete: protectedProcedure
    .input(restaurantIdSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.restaurant.delete({
        where: { id: input.id },
      })
    }),

  // Buscar um restaurante específico
  byId: protectedProcedure
    .input(restaurantIdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.db.restaurant.findUnique({
        where: { id: input.id },
        include: {
          menuItems: {
            where: { available: true },
            orderBy: { category: "asc" },
          },
        },
      })
    }),

  // Listar todos os restaurantes
  list: protectedProcedure
    .input(
      z
        .object({
          city: z.string().optional(),
          active: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.restaurant.findMany({
        where: {
          ...(input?.city && { city: input.city }),
          ...(input?.active !== undefined && { active: input.active }),
        },
        include: {
          menuItems: {
            where: { available: true },
            orderBy: { category: "asc" },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { name: "asc" },
      })
    }),

  // Listar restaurantes ativos com cardápio
  listActive: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.restaurant.findMany({
      where: { active: true },
      include: {
        menuItems: {
          where: { available: true },
          orderBy: { category: "asc" },
        },
      },
      orderBy: { name: "asc" },
    })
  }),

  // Obter cidades disponíveis
  getCities: protectedProcedure.query(async ({ ctx }) => {
    const cities = await ctx.db.restaurant.findMany({
      where: { active: true },
      select: { city: true },
      distinct: ["city"],
    })
    return cities.map((item) => item.city).sort()
  }),
}) 