import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { createFoodOrderSchema, updateFoodOrderSchema, foodOrderIdSchema, getOrdersByDateSchema, getOrdersByRestaurantSchema, createManualFoodOrderSchema } from "@/schemas/food-order.schema"
import { type Prisma } from "@prisma/client"
import type { RolesConfig } from "@/types/role-config"

export const foodOrderRouter = createTRPCRouter({
  // Criar um novo pedido
  create: protectedProcedure
    .input(createFoodOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId
      const now = new Date()
      const orderTime = now // Removido ajuste duplo, cliente já envia com fuso correto

      // Verificar se já existe um pedido para este usuário nesta data
      const inputDate = new Date(input.orderDate)
      const orderDateNormalized = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0)
      
      const existingOrder = await ctx.db.foodOrder.findUnique({
        where: {
          userId_orderDate: {
            userId,
            orderDate: orderDateNormalized,
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
          orderDate: orderDateNormalized,
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

  // Criar pedido manualmente (apenas superadmins ou usuários com permissão can_view_add_manual_ped)
  createManual: protectedProcedure
    .input(createManualFoodOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null

      const isSudo = roleConfig?.sudo ?? false
      const canViewAddManualPed = roleConfig?.can_view_add_manual_ped ?? false

      if (!isSudo && !canViewAddManualPed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para criar pedidos manualmente",
        })
      }

      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      })

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" })
      }

      const inputDate = new Date(input.orderDate)
      const orderDateNormalized = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0)

      const existingOrder = await ctx.db.foodOrder.findUnique({
        where: {
          userId_orderDate: {
            userId: input.userId,
            orderDate: orderDateNormalized,
          },
        },
      })

      if (existingOrder) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "O usuário já possui um pedido para esta data",
        })
      }

      const menuItem = await ctx.db.menuItem.findUnique({
        where: { id: input.menuItemId },
        include: { restaurant: true },
      })

      if (!menuItem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item do menu não encontrado" })
      }

      if (!menuItem.available) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este item não está disponível" })
      }

      if (!menuItem.restaurant.active) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este restaurante não está ativo" })
      }

      const orderTime = new Date()

      const createdOrder = await ctx.db.foodOrder.create({
        data: {
          userId: input.userId,
          restaurantId: input.restaurantId,
          menuItemId: input.menuItemId,
          orderDate: orderDateNormalized,
          orderTime,
          observations: input.observations,
          status: input.status ?? "PENDING",
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

      if (input.optionChoices && input.optionChoices.length > 0) {
        await ctx.db.orderOptionSelection.createMany({
          data: input.optionChoices.map((choiceId: string) => ({
            orderId: createdOrder.id,
            choiceId,
          })),
        })
      }

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
        ...(input?.startDate && input?.endDate && {
          orderDate: {
            gte: input.startDate,
            lte: input.endDate,
          }
        }),
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


      const orders = await ctx.db.foodOrder.findMany({
        where: whereClause,
        include: {
          user: true,
          restaurant: true,
          menuItem: true,
        },
        orderBy: { orderDate: "desc" },
      })
      
      
      return orders
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
        ...(input?.status && { status: input.status }),
        ...(input?.restaurantId && { restaurantId: input.restaurantId }),
        ...(input?.userId && { userId: input.userId }),
      }

      // Adicionar filtros de data usando as datas do cliente diretamente
      if (input?.startDate && input?.endDate) {
        whereClause.orderDate = {
          gte: input.startDate,
          lte: input.endDate
        }
      } else if (input?.startDate) {
        whereClause.orderDate = { gte: input.startDate }
      } else if (input?.endDate) {
        whereClause.orderDate = { lte: input.endDate }
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
              enterprise: true,
              setor: true,
              matricula: true,
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
      // Usar a mesma normalização que é usada na criação de pedidos (timezone local)
      const inputDate = new Date(input.orderDate)
      const year = inputDate.getFullYear()
      const month = inputDate.getMonth()
      const day = inputDate.getDate()

      // Normalizar para início do dia no timezone local (igual à criação de pedidos)
      const start = new Date(year, month, day, 0, 0, 0, 0)
      const end = new Date(year, month, day, 23, 59, 59, 999)

      // Debug: log dos parâmetros da query
      console.log("[exportOrdersByRestaurantAndDate] Buscando pedidos:", {
        orderDate: input.orderDate,
        inputDate: inputDate.toISOString(),
        start: start.toISOString(),
        end: end.toISOString(),
        restaurantId: input.restaurantId ?? "todos",
      })

      const orders = await ctx.db.foodOrder.findMany({
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
              enterprise: true,
              setor: true,
              matricula: true,
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
          optionSelections: {
            include: {
              choice: {
                include: {
                  option: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { user: { firstName: "asc" } },
          { orderDate: "asc" },
        ],
      })

      console.log("[exportOrdersByRestaurantAndDate] Pedidos encontrados:", orders.length)

      return orders
    }),

  // Listar pedidos por data
  byDate: protectedProcedure
    .input(getOrdersByDateSchema)
    .query(async ({ ctx, input }) => {
      // Usar orderDate para listagem - criar datas em UTC para evitar problemas de timezone
      const inputDate = new Date(input.date)
      const year = inputDate.getFullYear()
      const month = inputDate.getMonth()
      const day = inputDate.getDate()

      const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
      const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
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
        const inputDate = new Date(input.date)
        const year = inputDate.getFullYear()
        const month = inputDate.getMonth()
        const day = inputDate.getDate()

        const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
        const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
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
    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0))

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
      const inputDate = new Date(input.date)
      const date = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0))
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

  // Buscar métricas de pedidos por restaurante
  getMetricsByRestaurant: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        period: z.enum(["day", "month", "year"]),
        month: z.number().optional(),
        date: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { year, period, month, date } = input

      // Definir o período de busca baseado no tipo selecionado
      let startDate: Date
      let endDate: Date

      if (period === "year") {
        startDate = new Date(Date.UTC(year, 0, 1)) // 1 de janeiro
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)) // 31 de dezembro
      } else if (period === "month" && month) {
        // Para período mensal específico
        startDate = new Date(Date.UTC(year, month - 1, 1))
        endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
      } else if (period === "day" && date) {
        // Para período de dia específico - usar UTC para evitar problemas de timezone
        const dateInput = new Date(date)
        const year = dateInput.getFullYear()
        const month = dateInput.getMonth()
        const day = dateInput.getDate()
        startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
        endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
      } else {
        // Fallback: buscar dados de todos os meses do ano
        startDate = new Date(Date.UTC(year, 0, 1))
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
      }

      // Buscar pedidos agrupados por restaurante
      const orders = await ctx.db.foodOrder.findMany({
        where: {
          orderDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: "CANCELLED", // Excluir pedidos cancelados
          },
        },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          menuItem: {
            select: {
              price: true,
            },
          },
        },
      })

      // Agrupar por restaurante
      // Filtrar pedidos sem restaurante (restaurante deletado) - não faz sentido incluir em métricas
      const ordersWithRestaurant = orders.filter((order): order is typeof order & { 
        restaurantId: string; 
        restaurant: NonNullable<typeof order.restaurant> 
      } => {
        return order.restaurantId !== null && order.restaurant !== null;
      });

      const metricsMap = new Map<string, {
        restaurantId: string
        restaurantName: string
        restaurantCity: string
        totalOrders: number
        totalRevenue: number
      }>()

      ordersWithRestaurant.forEach((order) => {
        const restaurantId = order.restaurantId
        const key = restaurantId

        if (!metricsMap.has(key)) {
          metricsMap.set(key, {
            restaurantId,
            restaurantName: order.restaurant.name,
            restaurantCity: order.restaurant.city,
            totalOrders: 0,
            totalRevenue: 0,
          })
        }

        const metric = metricsMap.get(key)!
        metric.totalOrders += 1
        metric.totalRevenue += order.menuItem.price
      })

      return Array.from(metricsMap.values()).sort((a, b) => b.totalOrders - a.totalOrders)
    }),

  // Buscar dados para gráficos de pedidos por restaurante
  getChartDataByRestaurant: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        period: z.enum(["day", "month", "year"]),
        month: z.number().optional(),
        date: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { year, period, month, date } = input

      let startDate: Date
      let endDate: Date

      if (period === "year") {
        startDate = new Date(Date.UTC(year, 0, 1))
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
      } else if (period === "month" && month) {
        startDate = new Date(Date.UTC(year, month - 1, 1))
        endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
      } else if (period === "day" && date) {
        // Para período de dia específico - usar UTC para evitar problemas de timezone
        const dateInput = new Date(date)
        const year = dateInput.getFullYear()
        const month = dateInput.getMonth()
        const day = dateInput.getDate()
        startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
        endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
      } else {
        startDate = new Date(Date.UTC(year, 0, 1))
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
      }

      const orders = await ctx.db.foodOrder.findMany({
        where: {
          orderDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: "CANCELLED",
          },
        },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      // Agrupar por restaurante para dados do gráfico
      // Filtrar pedidos sem restaurante (restaurante deletado) - não faz sentido incluir em gráficos
      const ordersWithRestaurant = orders.filter((order): order is typeof order & { 
        restaurant: NonNullable<typeof order.restaurant> 
      } => {
        return order.restaurant !== null;
      });

      const chartDataMap = new Map<string, {
        restaurant: string
        orders: number
      }>()

      ordersWithRestaurant.forEach((order) => {
        const restaurantName = order.restaurant.name
        const key = restaurantName

        if (!chartDataMap.has(key)) {
          chartDataMap.set(key, {
            restaurant: restaurantName,
            orders: 0,
          })
        }

        const data = chartDataMap.get(key)!
        data.orders += 1
      })

      return Array.from(chartDataMap.values())
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 10) // Limitar aos top 10 restaurantes
    }),

  // Buscar dados DRE agrupados por empresa e setor
  getDREData: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        period: z.enum(["month", "quarter", "year"]),
        date: z.date().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }): Promise<{
      enterprise: string
      sector: string | null
      totalOrders: number
      totalValue: number
    }[]> => {
      const { year, period, date, startDate: inputStartDate, endDate: inputEndDate } = input

      // Definir o período de busca baseado no tipo selecionado
      let startDate: Date
      let endDate: Date

      // Se startDate e endDate foram fornecidos diretamente, usar esses valores
      if (inputStartDate && inputEndDate) {
        startDate = new Date(Date.UTC(
          inputStartDate.getFullYear(),
          inputStartDate.getMonth(),
          inputStartDate.getDate(),
          0,
          0,
          0,
          0
        ))
        endDate = new Date(Date.UTC(
          inputEndDate.getFullYear(),
          inputEndDate.getMonth(),
          inputEndDate.getDate(),
          23,
          59,
          59,
          999
        ))
      } else if (period === "year") {
        startDate = new Date(Date.UTC(year, 0, 1)) // 1 de janeiro
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)) // 31 de dezembro
      } else if (period === "quarter" && date) {
        // Para trimestre: calcular trimestre baseado na data
        const quarter = Math.floor(date.getMonth() / 3)
        const quarterStartMonth = quarter * 3
        startDate = new Date(Date.UTC(year, quarterStartMonth, 1))
        endDate = new Date(Date.UTC(year, quarterStartMonth + 3, 0, 23, 59, 59, 999))
      } else if (period === "month" && date) {
        // Para período mensal específico
        const month = date.getMonth()
        startDate = new Date(Date.UTC(year, month, 1))
        endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
      } else {
        // Fallback: buscar dados de todos os meses do ano
        startDate = new Date(Date.UTC(year, 0, 1))
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
      }

      // Buscar pedidos com dados de usuário (empresa e setor)
      const orders = await ctx.db.foodOrder.findMany({
        where: {
          orderDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: "CANCELLED", // Excluir pedidos cancelados
          },
        },
        include: {
          user: {
            select: {
              enterprise: true,
              setor: true,
            },
          },
          menuItem: {
            select: {
              price: true,
            },
          },
        },
      })

      // Agrupar por empresa e setor
      const dreDataMap = new Map<string, {
        enterprise: string
        sector: string | null
        totalOrders: number
        totalValue: number
      }>()

      orders.forEach((order) => {
        const enterprise = order.user.enterprise
        const sector = order.user.setor
        const key = `${enterprise}-${sector ?? 'sem-setor'}`
        const price = order.menuItem.price

        if (!dreDataMap.has(key)) {
          dreDataMap.set(key, {
            enterprise,
            sector: sector ?? null,
            totalOrders: 0,
            totalValue: 0,
          })
        }

        const data = dreDataMap.get(key)!
        data.totalOrders += 1
        data.totalValue += price
      })

      // Converter para array e ordenar
      const dreData = Array.from(dreDataMap.values())
        .sort((a, b) => {
          // Primeiro ordenar por empresa
          if (a.enterprise !== b.enterprise) {
            return a.enterprise.localeCompare(b.enterprise)
          }
          // Depois por setor
          const sectorA = a.sector ?? ''
          const sectorB = b.sector ?? ''
          return sectorA.localeCompare(sectorB)
        })

      return dreData
    }),
}) 