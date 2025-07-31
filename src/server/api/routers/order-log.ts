import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { type Prisma } from "@prisma/client"

export const orderLogRouter = createTRPCRouter({
  // Gerar logs mensais para folha de pagamento
  generateMonthlyLogs: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { month, year } = input

      // Buscar todos os pedidos do mês
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)

      const orders = await ctx.db.foodOrder.findMany({
        where: {
          orderDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ["CONFIRMED", "DELIVERED"],
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
          menuItem: true,
        },
      })

      // Agrupar por usuário
      const userOrders = new Map()
      orders.forEach((order) => {
        const userId = order.userId
        if (!userOrders.has(userId)) {
          userOrders.set(userId, {
            userId,
            userName: `${order.user.firstName} ${order.user.lastName}`.trim(),
            userEmail: order.user.email,
            orders: [],
            totalValue: 0,
          })
        }
        const userData = userOrders.get(userId) as {
          userId: string
          userName: string
          userEmail: string
          orders: typeof orders
          totalValue: number
        }
        userData.orders.push(order)
        userData.totalValue += order.menuItem.price
      })

      // Criar ou atualizar logs
      const logs = []
      for (const userData of userOrders.values()) {
        const log = await ctx.db.orderLog.upsert({
          where: {
            userId_month_year: {
              userId: (userData as { userId: string }).userId,
              month: Number(month),
              year: Number(year),
            },
          },
          update: {
            totalOrders: (userData as { orders: unknown[] }).orders.length,
            totalValue: (userData as { totalValue: number }).totalValue,
            updatedAt: new Date(),
          },
          create: {
            userId: (userData as { userId: string }).userId,
            userName: (userData as { userName: string }).userName,
            userEmail: (userData as { userEmail: string }).userEmail,
            month,
            year,
            totalOrders: (userData as { orders: unknown[] }).orders.length,
            totalValue: (userData as { totalValue: number }).totalValue,
          },
        })
        logs.push(log)
      }

      return logs
    }),

  // Buscar logs por mês/ano
  getByMonth: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.orderLog.findMany({
        where: {
          month: input.month,
          year: input.year,
        },
        orderBy: { userName: "asc" },
      })
    }),

  // Buscar logs por usuário
  getByUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        startMonth: z.number().min(1).max(12).optional(),
        startYear: z.number().optional(),
        endMonth: z.number().min(1).max(12).optional(),
        endYear: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.OrderLogWhereInput = { userId: input.userId }

      if (input.startMonth && input.startYear && input.endMonth && input.endYear) {
        where.OR = [
          {
            AND: [
            { year: { gt: input.startYear } },
            { year: { lt: input.endYear } },
            ]
          },
          {
            AND: [
            { year: input.startYear },
            { month: { gte: input.startMonth } },
            ]
          },
          {
            AND: [
            { year: input.endYear },
            { month: { lte: input.endMonth } },
            ]
          },
        ]
      }

      return ctx.db.orderLog.findMany({
        where,
        orderBy: [
          { year: "desc" },
          { month: "desc" },
        ],
      })
    }),

  // Listar todos os logs
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50
      const { cursor } = input ?? {}

      const logs = await ctx.db.orderLog.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [
          { year: "desc" },
          { month: "desc" },
        ],
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (logs.length > limit) {
        const nextItem = logs.pop()
        nextCursor = nextItem?.id
      }

      return {
        items: logs,
        nextCursor,
      }
    }),

  // Exportar dados para folha de pagamento
  exportForPayroll: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.db.orderLog.findMany({
        where: {
          month: input.month,
          year: input.year,
        },
        orderBy: { userName: "asc" },
      })

      return logs.map((log) => ({
        nome: log.userName,
        email: log.userEmail,
        quantidade_pedidos: log.totalOrders,
        valor_total: log.totalValue,
        valor_medio: log.totalOrders > 0 ? log.totalValue / log.totalOrders : 0,
      }))
    }),
}) 