import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { createFoodOrderSchema, updateFoodOrderSchema, foodOrderIdSchema, getOrdersByDateSchema, getOrdersByRestaurantSchema } from "@/schemas/food-order.schema"
import { type Prisma } from "@prisma/client"

export const foodOrderRouter = createTRPCRouter({
  // Criar um novo pedido
  create: protectedProcedure
    .input(createFoodOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId
      const now = new Date()
      const orderTime = now // Removido ajuste duplo, cliente já envia com fuso correto

      // Verificar se já existe um pedido para este usuário nesta data
      const existingOrder = await ctx.db.foodOrder.findUnique({
        where: {
          userId_orderDate: {
            userId,
            orderDate: new Date(input.orderDate.setHours(0, 0, 0, 0)),
          },
        },
      })

      if (existingOrder) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Você já fez um pedido para esta data",
        })
      }

      // Verificar se o item do menu existe e está disponível
      const menuItem = await ctx.db.menuItem.findUnique({
        where: { id: input.menuItemId },
        include: { restaurant: true },
      })

      if (!menuItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item do menu não encontrado",
        })
      }

      if (!menuItem.available) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este item não está disponível",
        })
      }

      // Verificar se o restaurante está ativo
      if (!menuItem.restaurant.active) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este restaurante não está ativo",
        })
      }

      // Criação do pedido
      const createdOrder = await ctx.db.foodOrder.create({
        data: {
          userId,
          restaurantId: input.restaurantId,
          menuItemId: input.menuItemId,
          orderDate: input.orderDate,
          orderTime,
          observations: input.observations,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          restaurant: true,
          menuItem: true,
        },
      })

      // Salvar as opções escolhidas (optionChoices) na tabela OrderOptionSelection
      if (input.optionChoices && input.optionChoices.length > 0) {
        await ctx.db.orderOptionSelection.createMany({
          data: input.optionChoices.map((choiceId: string) => ({
            orderId: createdOrder.id,
            choiceId,
          })),
        })
      }

      // Buscar o pedido novamente, agora incluindo as opções
      return ctx.db.foodOrder.findUnique({
        where: { id: createdOrder.id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          restaurant: true,
          menuItem: true,
          optionSelections: true,
        },
      })
    }),

  // Atualizar status do pedido (apenas admin)
  updateStatus: protectedProcedure
    .input(updateFoodOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.foodOrder.update({
        where: { id },
        data,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          restaurant: true,
          menuItem: true,
        },
      })
    }),

  // Cancelar pedido (apenas o próprio usuário)
  cancel: protectedProcedure
    .input(foodOrderIdSchema)
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.foodOrder.findUnique({
        where: { id: input.id },
      })

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pedido não encontrado",
        })
      }

      if (order.userId !== ctx.auth.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para cancelar este pedido",
        })
      }

      return ctx.db.foodOrder.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          restaurant: true,
          menuItem: true,
        },
      })
    }),

  // Deletar pedido (apenas o próprio usuário)
  delete: protectedProcedure
    .input(foodOrderIdSchema)
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.foodOrder.findUnique({
        where: { id: input.id },
      })

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pedido não encontrado",
        })
      }

      if (order.userId !== ctx.auth.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para deletar este pedido",
        })
      }

      await ctx.db.foodOrder.delete({
        where: { id: input.id },
      })
      return { success: true }
    }),

  // Buscar pedido específico
  byId: protectedProcedure
    .input(foodOrderIdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.db.foodOrder.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          restaurant: true,
          menuItem: true,
        },
      })
    }),

  // Listar pedidos do usuário
  myOrders: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"]).optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId
      return ctx.db.foodOrder.findMany({
        where: {
          userId,
          ...(input?.startDate && { orderDate: { gte: input.startDate } }),
          ...(input?.endDate && { orderDate: { lte: input.endDate } }),
          ...(input?.status && { status: input.status }),
        },
        include: {
          restaurant: true,
          menuItem: true,
        },
        orderBy: { orderDate: "desc" },
      })
    }),

  // Listar todos os pedidos (apenas admin)
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"]).optional(),
        restaurantId: z.string().optional(),
        userId: z.string().optional(),
        userName: z.string().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const whereClause: Prisma.FoodOrderWhereInput = {
        ...(input?.startDate && { orderDate: { gte: input.startDate } }),
        ...(input?.endDate && { orderDate: { lte: input.endDate } }),
        ...(input?.status && { status: input.status }),
        ...(input?.restaurantId && { restaurantId: input.restaurantId }),
        ...(input?.userId && { userId: input.userId }),
      }

      // Adicionar filtro por nome do usuário se fornecido
      if (input?.userName) {
        whereClause.user = {
          OR: [
            {
              firstName: {
                contains: input.userName,
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: input.userName,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: input.userName,
                mode: "insensitive",
              },
            },
          ],
        }
      }

      return ctx.db.foodOrder.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          restaurant: true,
          menuItem: true,
        },
        orderBy: { orderDate: "desc" },
      })
    }),

    listToExcel: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"]).optional(),
        restaurantId: z.string().optional(),
        userId: z.string().optional(),
        userName: z.string().optional(),
      }).optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const whereClause: Prisma.FoodOrderWhereInput = {
        ...(input?.startDate && { orderDate: { gte: input.startDate } }),
        ...(input?.endDate && { orderDate: { lte: input.endDate } }),
        ...(input?.status && { status: input.status }),
        ...(input?.restaurantId && { restaurantId: input.restaurantId }),
        ...(input?.userId && { userId: input.userId }),
      }

      // Adicionar filtro por nome do usuário se fornecido
      if (input?.userName) {
        whereClause.user = {
          OR: [
            {
              firstName: {
                contains: input.userName,
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: input.userName,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: input.userName,
                mode: "insensitive",
              },
            },
          ],
        }
      }

      return ctx.db.foodOrder.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          restaurant: true,
          menuItem: true,
        },
        orderBy: { orderDate: "desc" },
      })
    }),

  // Exportar pedidos por restaurante e data (específico para assinatura)
  exportOrdersByRestaurantAndDate: protectedProcedure
    .input(
      z.object({
        restaurantId: z.string().optional(),
        orderDate: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const start = new Date(input.orderDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(input.orderDate)
      end.setHours(23, 59, 59, 999)

      return ctx.db.foodOrder.findMany({
        where: {
          orderDate: {
            gte: start,
            lte: end,
          },
          ...(input.restaurantId && { restaurantId: input.restaurantId }),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          menuItem: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { restaurant: { name: "asc" } },
          { user: { firstName: "asc" } },
        ],
      })
    }),

  // Listar pedidos por data
  byDate: protectedProcedure
    .input(getOrdersByDateSchema)
    .query(async ({ ctx, input }) => {
      // Corrigir busca para considerar o dia inteiro
      const start = new Date(input.date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(input.date)
      end.setHours(23, 59, 59, 999)
      return ctx.db.foodOrder.findMany({
        where: {
          orderDate: {
            gte: start,
            lte: end,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          restaurant: true,
          menuItem: true,
        },
        orderBy: [
          { restaurant: { name: "asc" } },
          { user: { firstName: "asc" } },
        ],
      })
    }),

  // Listar pedidos por restaurante
  byRestaurant: protectedProcedure
    .input(getOrdersByRestaurantSchema)
    .query(async ({ ctx, input }) => {
      const where: {
        restaurantId: string
        orderDate?: { gte: Date; lte: Date }
      } = { restaurantId: input.restaurantId }
      if (input.date) {
        const start = new Date(input.date)
        start.setHours(0, 0, 0, 0)
        const end = new Date(input.date)
        end.setHours(23, 59, 59, 999)
        where.orderDate = { gte: start, lte: end }
      }
      return ctx.db.foodOrder.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          restaurant: true,
          menuItem: true,
        },
        orderBy: { orderDate: "desc" },
      })
    }),

  // Verificar se usuário já fez pedido para hoje
  checkTodayOrder: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return ctx.db.foodOrder.findUnique({
      where: {
        userId_orderDate: {
          userId,
          orderDate: today,
        },
      },
      include: {
        restaurant: true,
        menuItem: true,
      },
    })
  }),

  // Verificar se usuário já fez pedido para uma data específica
  checkOrderByDate: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId
      const date = new Date(input.date)
      date.setHours(0, 0, 0, 0)
      return ctx.db.foodOrder.findUnique({
        where: {
          userId_orderDate: {
            userId,
            orderDate: date,
          },
        },
        include: {
          restaurant: true,
          menuItem: true,
        },
      })
    }),
}) 