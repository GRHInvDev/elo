import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { createFoodOrderSchema, updateFoodOrderSchema, foodOrderIdSchema, getOrdersByDateSchema, getOrdersByRestaurantSchema, createManualFoodOrderSchema, sendRestaurantOrdersEmailSchema } from "@/schemas/food-order.schema"
import { Enterprise, type Prisma } from "@prisma/client"
import type { RolesConfig } from "@/types/role-config"
import { sendFoodOrdersEmail } from "@/server/services/food-order-email"
import { checkSelfServiceFoodOrderDate } from "@/lib/food-order-self-service-date"

/**
 * Resolve o intervalo [startDate, endDate] usado pelas consultas do relatório DRE.
 * Quando startDate/endDate são informados diretamente, têm prioridade; caso contrário
 * o período é derivado de year/period/date. Mantém o comportamento em UTC.
 */
function resolveDrePeriod({
  year,
  period,
  date,
  startDate,
  endDate,
}: {
  year: number
  period: "month" | "quarter" | "year"
  date?: Date
  startDate?: Date
  endDate?: Date
}): { startDate: Date; endDate: Date } {
  if (startDate && endDate) {
    return {
      startDate: new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0)),
      endDate: new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)),
    }
  }
  if (period === "year") {
    return {
      startDate: new Date(Date.UTC(year, 0, 1)),
      endDate: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
    }
  }
  if (period === "quarter" && date) {
    const quarter = Math.floor(date.getMonth() / 3)
    const quarterStartMonth = quarter * 3
    return {
      startDate: new Date(Date.UTC(year, quarterStartMonth, 1)),
      endDate: new Date(Date.UTC(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)),
    }
  }
  if (period === "month" && date) {
    const month = date.getMonth()
    return {
      startDate: new Date(Date.UTC(year, month, 1)),
      endDate: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
    }
  }
  return {
    startDate: new Date(Date.UTC(year, 0, 1)),
    endDate: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  }
}

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

      const dateCheck = checkSelfServiceFoodOrderDate(orderDateNormalized, now)
      if (!dateCheck.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: dateCheck.message,
        })
      }

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

  // Enviar email de pedidos para um restaurante (manual)
  sendOrdersEmailByRestaurant: protectedProcedure
    .input(sendRestaurantOrdersEmailSchema)
    .mutation(async ({ input }) => {
      console.log("| FOOD_ORDER | Envio acionado manualmente: Payload simples")
      return sendFoodOrdersEmail({
        restaurantId: input.restaurantId,
        orderDate: input.orderDate,
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
      const orderDateFilter =
        input?.startDate != null || input?.endDate != null
          ? {
              ...(input?.startDate != null ? { gte: input.startDate } : {}),
              ...(input?.endDate != null ? { lte: input.endDate } : {}),
            }
          : undefined

      return ctx.db.foodOrder.findMany({
        where: {
          userId,
          ...(orderDateFilter != null ? { orderDate: orderDateFilter } : {}),
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
        userEmail: z.string().optional(),
        filialId: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(15),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1
      const pageSize = input?.pageSize ?? 15
      const skip = (page - 1) * pageSize

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

      const userFilter: Prisma.UserWhereInput = {}

      if (input?.userName) {
        userFilter.OR = [
          { firstName: { contains: input.userName, mode: "insensitive" } },
          { lastName: { contains: input.userName, mode: "insensitive" } },
          { email: { contains: input.userName, mode: "insensitive" } },
        ]
      }

      // Filtro dedicado por e-mail (ex.: navegação vinda do relatório DRE)
      if (input?.userEmail) {
        userFilter.email = { contains: input.userEmail, mode: "insensitive" }
      }

      if (input?.filialId) {
        userFilter.filialId = input.filialId
      }

      if (Object.keys(userFilter).length > 0) {
        whereClause.user = userFilter
      }

      const [orders, total, statusCountsRaw] = await ctx.db.$transaction([
        ctx.db.foodOrder.findMany({
          where: whereClause,
          include: {
            user: {
              include: {
                filial: { select: { id: true, name: true, code: true } },
              },
            },
            restaurant: true,
            menuItem: true,
          },
          orderBy: { orderDate: "desc" },
          skip,
          take: pageSize,
        }),
        ctx.db.foodOrder.count({ where: whereClause }),
        ctx.db.foodOrder.groupBy({
          by: ["status"],
          where: whereClause,
          _count: { _all: true },
          orderBy: { status: "asc" },
        }),
      ])

      const statusCounts = { PENDING: 0, CONFIRMED: 0, DELIVERED: 0, CANCELLED: 0 }
      for (const row of statusCountsRaw) {
        const key = row.status
        const count = (row._count as { _all?: number })._all ?? 0
        statusCounts[key] = count
      }

      return { orders, total, statusCounts }
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
        filialId: z.string().optional(),
      }).optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const whereClause: Prisma.FoodOrderWhereInput = {
        ...(input?.status && { status: input.status }),
        ...(input?.restaurantId && { restaurantId: input.restaurantId }),
        ...(input?.userId && { userId: input.userId }),
      }

      if (input?.startDate && input?.endDate) {
        whereClause.orderDate = { gte: input.startDate, lte: input.endDate }
      } else if (input?.startDate) {
        whereClause.orderDate = { gte: input.startDate }
      } else if (input?.endDate) {
        whereClause.orderDate = { lte: input.endDate }
      }

      const userFilter: Prisma.UserWhereInput = {}

      if (input?.userName) {
        userFilter.OR = [
          { firstName: { contains: input.userName, mode: "insensitive" } },
          { lastName: { contains: input.userName, mode: "insensitive" } },
          { email: { contains: input.userName, mode: "insensitive" } },
        ]
      }

      if (input?.filialId) {
        userFilter.filialId = input.filialId
      }

      if (Object.keys(userFilter).length > 0) {
        whereClause.user = userFilter
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

  // Buscar dados DRE agrupados por empresa/setor, restaurante ou filial
  getDREData: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        period: z.enum(["month", "quarter", "year"]),
        date: z.date().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        restaurantId: z.string().optional(),
        filialId: z.string().optional(),
        empresaId: z.string().optional(),
        groupBy: z.enum(["enterprise_sector", "restaurant", "filial"]).optional().default("enterprise_sector"),
      }),
    )
    .query(async ({ ctx, input }): Promise<{
      groupBy: "enterprise_sector" | "restaurant" | "filial"
      enterprise: string | null
      /** Id da Empresa (cadastro novo) dona da filial do colaborador. Null para registros legados sem filial. */
      empresaId: string | null
      /** Nome da Empresa (cadastro novo) para exibição no agrupamento por empresa/setor. */
      empresaName: string | null
      sector: string | null
      restaurantId: string | null
      restaurantName: string | null
      filialId: string | null
      filialName: string | null
      filialCode: string | null
      totalOrders: number
      totalValue: number
      /** Valor dos pedidos cujo colaborador está em empresa matriz (não Box_Filial/Cristallux_Filial). */
      valueFromHeadquartersOrders: number
      /** Valor dos pedidos cujo colaborador está em empresa filial (enum matriz/filial legado). */
      valueFromBranchOrders: number
    }[]> => {
      const caller = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      const roleConfig = caller?.role_config as RolesConfig | null
      const canView = roleConfig?.sudo === true || roleConfig?.can_view_dre_report === true
      if (!canView) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para visualizar o relatório DRE",
        })
      }

      const {
        year,
        period,
        date,
        startDate: inputStartDate,
        endDate: inputEndDate,
        restaurantId: filterRestaurantId,
        filialId: filterFilialId,
        empresaId: filterEmpresaId,
        groupBy,
      } = input

      // Definir o período de busca baseado no tipo selecionado
      const { startDate, endDate } = resolveDrePeriod({
        year,
        period,
        date,
        startDate: inputStartDate,
        endDate: inputEndDate,
      })

      const isBranchEnterpriseEnum = (e: Enterprise): boolean =>
        e === Enterprise.Box_Filial || e === Enterprise.Cristallux_Filial

      type DreAggRow = {
        groupBy: "enterprise_sector" | "restaurant" | "filial"
        enterprise: string | null
        empresaId: string | null
        empresaName: string | null
        sector: string | null
        restaurantId: string | null
        restaurantName: string | null
        filialId: string | null
        filialName: string | null
        filialCode: string | null
        totalOrders: number
        totalValue: number
        valueFromHeadquartersOrders: number
        valueFromBranchOrders: number
      }

      // Buscar pedidos com dados de usuário (empresa, setor, filial) e restaurante (pedido ou cardápio)
      const orders = await ctx.db.foodOrder.findMany({
        where: {
          orderDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: "CANCELLED", // Excluir pedidos cancelados
          },
          ...(filterRestaurantId
            ? {
                OR: [
                  { restaurantId: filterRestaurantId },
                  { menuItem: { restaurantId: filterRestaurantId } },
                ],
              }
            : {}),
          ...(() => {
            const userFilter: Prisma.UserWhereInput = {}
            if (filterFilialId) userFilter.filialId = filterFilialId
            if (filterEmpresaId) userFilter.filial = { empresaId: filterEmpresaId }
            return Object.keys(userFilter).length > 0 ? { user: userFilter } : {}
          })(),
        },
        include: {
          user: {
            select: {
              enterprise: true,
              setor: true,
              filialId: true,
              filial: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  empresa: {
                    select: {
                      id: true,
                      name: true,
                      enterprise: true,
                    },
                  },
                },
              },
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
          menuItem: {
            select: {
              price: true,
              restaurantId: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      const dreDataMap = new Map<string, DreAggRow>()

      orders.forEach((order) => {
        const price = order.menuItem.price
        const effectiveRestaurant = order.restaurant ?? order.menuItem.restaurant
        // Empresa (cadastro novo) derivada da filial do colaborador.
        const empresa = order.user.filial?.empresa ?? null
        // Enum efetivo: empresa.enterprise quando há filial; senão o enum legado do usuário.
        const effectiveEnterprise = empresa?.enterprise ?? order.user.enterprise
        const sector = order.user.setor ?? null

        let key: string
        let base: Omit<DreAggRow, "totalOrders" | "totalValue" | "valueFromHeadquartersOrders" | "valueFromBranchOrders">

        const fromBranchOrder = isBranchEnterpriseEnum(effectiveEnterprise)

        if (groupBy === "enterprise_sector") {
          const empresaId = empresa?.id ?? null
          // Identidade da empresa para agrupamento: usa o rótulo exibido (nome do
          // cadastro novo, com fallback no enum legado), normalizado. Assim,
          // colaboradores ligados à Empresa e os legados (só enum) com o mesmo nome
          // caem na MESMA empresa — sem linhas duplicadas para a mesma empresa.
          const empresaGroupLabel = (empresa?.name ?? String(effectiveEnterprise)).trim().toUpperCase()
          // Setor normalizado (sem acento, caixa e espaços) para unificar variações
          // do mesmo setor (ex.: "LOGÍSTICA"/"LOGISTICA"/"logistica ").
          const sectorKey = sector
            ? sector.trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
            : "sem-setor"
          // Agrupa pela Empresa (rótulo) + setor normalizado.
          key = `${empresaGroupLabel}-${sectorKey}`
          base = {
            groupBy: "enterprise_sector",
            enterprise: effectiveEnterprise,
            empresaId,
            empresaName: empresa?.name ?? null,
            sector,
            restaurantId: null,
            restaurantName: null,
            filialId: null,
            filialName: null,
            filialCode: null,
          }
        } else if (groupBy === "restaurant") {
          const rid = effectiveRestaurant?.id ?? "sem-restaurante"
          key = rid
          base = {
            groupBy: "restaurant",
            enterprise: null,
            empresaId: null,
            empresaName: null,
            sector: null,
            restaurantId: effectiveRestaurant?.id ?? null,
            restaurantName: effectiveRestaurant?.name ?? "Não informado",
            filialId: null,
            filialName: null,
            filialCode: null,
          }
        } else {
          const filial = order.user.filial
          const fid = filial?.id ?? "sem-filial"
          key = fid
          base = {
            groupBy: "filial",
            enterprise: null,
            empresaId: null,
            empresaName: null,
            sector: null,
            restaurantId: null,
            restaurantName: null,
            filialId: filial?.id ?? null,
            filialName: filial?.name ?? "Não informado",
            filialCode: filial?.code ?? null,
          }
        }

        if (!dreDataMap.has(key)) {
          dreDataMap.set(key, {
            ...base,
            totalOrders: 0,
            totalValue: 0,
            valueFromHeadquartersOrders: 0,
            valueFromBranchOrders: 0,
          })
        }

        const data = dreDataMap.get(key)!
        data.totalOrders += 1
        data.totalValue += price
        if (fromBranchOrder) {
          data.valueFromBranchOrders += price
        } else {
          data.valueFromHeadquartersOrders += price
        }
      })

      const dreData = Array.from(dreDataMap.values()).sort((a, b) => {
        if (groupBy === "enterprise_sector") {
          const aLabel = a.empresaName ?? a.enterprise ?? ""
          const bLabel = b.empresaName ?? b.enterprise ?? ""
          if (aLabel !== bLabel) {
            return aLabel.localeCompare(bLabel)
          }
          return (a.sector ?? "").localeCompare(b.sector ?? "")
        }
        if (groupBy === "restaurant") {
          return (a.restaurantName ?? "").localeCompare(b.restaurantName ?? "")
        }
        const byCode = (a.filialCode ?? "").localeCompare(b.filialCode ?? "")
        if (byCode !== 0) return byCode
        return (a.filialName ?? "").localeCompare(b.filialName ?? "")
      })

      return dreData
    }),

  // Listar os pedidos individuais que compõem uma linha (empresa + setor) do relatório DRE
  getEnterpriseSectorOrders: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        period: z.enum(["month", "quarter", "year"]),
        date: z.date().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        restaurantId: z.string().optional(),
        // Filtro de filial do relatório (quando aplicado).
        filialId: z.string().optional(),
        // Identidade do grupo: empresa (cadastro novo) da linha clicada. Mantido por
        // compatibilidade; o casamento agora usa o rótulo da empresa (empresaName/enum).
        empresaId: z.string().nullable().optional(),
        // Nome da empresa (cadastro novo) exibido na linha; usado como rótulo do grupo.
        empresaName: z.string().nullable().optional(),
        // Enum efetivo da linha (fallback do rótulo quando não há empresa cadastrada).
        enterprise: z.string(),
        sector: z.string().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const caller = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      const roleConfig = caller?.role_config as RolesConfig | null
      const canView = roleConfig?.sudo === true || roleConfig?.can_view_dre_report === true
      if (!canView) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para visualizar o relatório DRE",
        })
      }

      const { startDate, endDate } = resolveDrePeriod({
        year: input.year,
        period: input.period,
        date: input.date,
        startDate: input.startDate,
        endDate: input.endDate,
      })

      // Reproduz EXATAMENTE a chave de agrupamento do getDREData (rótulo da empresa
      // + setor normalizado). Aplica os filtros amplos no banco (período, restaurante
      // e filial do relatório) e faz o casamento fino do grupo em memória — assim os
      // pedidos listados batem com os totais da linha unificada.
      const normalizeSector = (s: string | null) =>
        s ? s.trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "") : "sem-setor"
      const targetLabel = (input.empresaName ?? input.enterprise).trim().toUpperCase()
      const targetSectorKey = normalizeSector(input.sector)

      const rawOrders = await ctx.db.foodOrder.findMany({
        where: {
          orderDate: { gte: startDate, lte: endDate },
          status: { not: "CANCELLED" },
          ...(input.filialId ? { user: { filialId: input.filialId } } : {}),
          ...(input.restaurantId
            ? {
                OR: [
                  { restaurantId: input.restaurantId },
                  { menuItem: { restaurantId: input.restaurantId } },
                ],
              }
            : {}),
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
              filial: { select: { empresa: { select: { name: true, enterprise: true } } } },
            },
          },
          restaurant: { select: { id: true, name: true } },
          menuItem: {
            select: {
              name: true,
              price: true,
              restaurant: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { orderDate: "desc" },
      })

      const orders = rawOrders.filter((order) => {
        const empresa = order.user.filial?.empresa ?? null
        const effectiveEnterprise = empresa?.enterprise ?? order.user.enterprise
        const label = (empresa?.name ?? String(effectiveEnterprise)).trim().toUpperCase()
        const sectorKey = normalizeSector(order.user.setor ?? null)
        return label === targetLabel && sectorKey === targetSectorKey
      })

      return orders.map((order) => ({
        id: order.id,
        userId: order.user.id,
        userName: `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`.trim(),
        email: order.user.email,
        enterprise: order.user.enterprise,
        empresaName: order.user.filial?.empresa.name ?? null,
        sector: order.user.setor ?? null,
        orderDate: order.orderDate,
        restaurantName: (order.restaurant ?? order.menuItem.restaurant)?.name ?? null,
        menuItemName: order.menuItem.name,
        price: order.menuItem.price,
        status: order.status,
      }))
    }),
})