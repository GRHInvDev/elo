import { z } from "zod"
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc"
import { NotificationType, NotificationChannel } from "@prisma/client"
import { getNotificationWebSocketService } from "../../services/notification-websocket-service"

export const notificationRouter = createTRPCRouter({
  // Listar notificações do usuário logado
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      unreadOnly: z.boolean().default(false)
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        userId: ctx.auth.userId,
        ...(input.unreadOnly && { isRead: false })
      }

      const [notifications, total] = await Promise.all([
        ctx.db.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.notification.count({ where })
      ])

      return {
        notifications,
        total,
        unreadCount: await ctx.db.notification.count({
          where: { userId: ctx.auth.userId, isRead: false }
        })
      }
    }),

  // Marcar notificação como lida
  markAsRead: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.update({
        where: {
          id: input.id,
          userId: ctx.auth.userId // Garantir que só o dono pode marcar como lida
        },
        data: { isRead: true }
      })

      // Atualizar contagem via WebSocket
      const wsService = getNotificationWebSocketService()
      if (wsService) {
        await wsService.emitNotificationUpdate(notification)
        await wsService.updateUnreadCount(ctx.auth.userId)
      }

      return notification
    }),

  // Marcar todas as notificações como lidas
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const result = await ctx.db.notification.updateMany({
        where: {
          userId: ctx.auth.userId,
          isRead: false
        },
        data: { isRead: true }
      })

      // Atualizar contagem via WebSocket
      const wsService = getNotificationWebSocketService()
      if (wsService) {
        await wsService.updateUnreadCount(ctx.auth.userId)
      }

      return result
    }),

  // Criar notificação (admin ou sistema)
  create: adminProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(1000),
      type: z.nativeEnum(NotificationType).default(NotificationType.INFO),
      channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.IN_APP),
      userId: z.string(),
      entityId: z.string().optional(),
      entityType: z.string().optional(),
      actionUrl: z.string().url().optional(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: z.any().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.create({
        data: {
          title: input.title,
          message: input.message,
          type: input.type,
          channel: input.channel,
          userId: input.userId,
          entityId: input.entityId,
          entityType: input.entityType,
          actionUrl: input.actionUrl,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: input.data
        }
      })

      // Emitir notificação via WebSocket em tempo real
      const wsService = getNotificationWebSocketService()
      if (wsService) {
        await wsService.emitNewNotification(notification)
        await wsService.updateUnreadCount(input.userId)
      }

      return notification
    }),

  // Criar notificação para múltiplos usuários
  createBulk: adminProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(1000),
      type: z.nativeEnum(NotificationType).default(NotificationType.INFO),
      channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.IN_APP),
      userIds: z.array(z.string()),
      entityId: z.string().optional(),
      entityType: z.string().optional(),
      actionUrl: z.string().url().optional(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: z.any().optional(),
      notifications: z.array(z.object({
        title: z.string().min(1).max(200),
        message: z.string().min(1).max(1000),
        type: z.nativeEnum(NotificationType).default(NotificationType.INFO),
        channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.IN_APP),
        userId: z.string(),
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const notifications = input.userIds.map(userId => ({
        title: input.title,
        message: input.message,
        type: input.type,
        channel: input.channel,
        userId,
        entityId: input.entityId,
        entityType: input.entityType,
        actionUrl: input.actionUrl,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: input.data
      }))

      const result = await ctx.db.notification.createMany({
        data: notifications
      })

      // Para notificações em lote, buscar as notificações criadas para emitir via WebSocket
      if (result.count > 0) {
        const wsService = getNotificationWebSocketService()
        if (wsService) {
          // Buscar as notificações recém-criadas
          const createdNotifications = await ctx.db.notification.findMany({
            where: {
              userId: { in: input.userIds },
              createdAt: {
                gte: new Date(Date.now() - 1000) // Último segundo
              }
            },
            orderBy: { createdAt: 'desc' },
            take: result.count
          })

          // Emitir cada notificação via WebSocket
          await Promise.all(createdNotifications.map(notification =>
            Promise.all([
              wsService.emitNewNotification(notification),
              wsService.updateUnreadCount(notification.userId)
            ])
          ))
        }
      }

      return result
    }),

  // Deletar notificação
  delete: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.delete({
        where: {
          id: input.id,
          userId: ctx.auth.userId // Garantir que só o dono pode deletar
        }
      })

      // Emitir exclusão via WebSocket
      const wsService = getNotificationWebSocketService()
      if (wsService) {
        await wsService.emitNotificationDelete(notification)
        await wsService.updateUnreadCount(ctx.auth.userId)
      }

      return notification
    }),

  // Deletar notificações antigas (cleanup)
  deleteOld: adminProcedure
    .input(z.object({
      daysOld: z.number().min(1).max(365).default(30)
    }))
    .mutation(async ({ ctx, input }) => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - input.daysOld)

      return await ctx.db.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isRead: true // Só deletar lidas
        }
      })
    }),

  // Gerenciar preferências de notificação
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.notificationPreference.findUnique({
        where: { userId: ctx.auth.userId }
      })
    }),

  updatePreferences: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      suggestionUpdates: z.boolean().optional(),
      systemNotifications: z.boolean().optional(),
      postNotifications: z.boolean().optional(),
      bookingNotifications: z.boolean().optional(),
      foodOrderNotifications: z.boolean().optional(),
      birthdayNotifications: z.boolean().optional(),
      soundEnabled: z.boolean().optional(),
      popupEnabled: z.boolean().optional(),
      successNotifications: z.boolean().optional(),
      errorNotifications: z.boolean().optional(),
      warningNotifications: z.boolean().optional(),
      suggestionNotifications: z.boolean().optional(),
      kpiNotifications: z.boolean().optional(),
      maintenanceNotifications: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.notificationPreference.upsert({
        where: { userId: ctx.auth.userId },
        update: input,
        create: {
          userId: ctx.auth.userId,
          ...input
        }
      })
    }),

  // Notificações por entidade (ex: todas as notificações de uma sugestão)
  getByEntity: protectedProcedure
    .input(z.object({
      entityId: z.string(),
      entityType: z.string(),
      limit: z.number().min(1).max(50).default(10)
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.notification.findMany({
        where: {
          entityId: input.entityId,
          entityType: input.entityType,
          userId: ctx.auth.userId
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit
      })
    })
})
