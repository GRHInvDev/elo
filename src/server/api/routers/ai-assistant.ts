import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"

const MAX_STORED_MESSAGES = 30

export const aiAssistantRouter = createTRPCRouter({
  getSession: protectedProcedure.query(async ({ ctx }): Promise<unknown[]> => {
    const row = await ctx.db.aiAssistantChatSession.findUnique({
      where: { userId: ctx.auth.userId },
    })
    if (!row?.messages) {
      return []
    }
    const parsed: unknown = row.messages
    return Array.isArray(parsed) ? (parsed as unknown[]) : []
  }),

  saveSession: protectedProcedure
    .input(
      z.object({
        messages: z.array(z.unknown()).max(MAX_STORED_MESSAGES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const trimmed = input.messages.slice(-MAX_STORED_MESSAGES)
      await ctx.db.aiAssistantChatSession.upsert({
        where: { userId: ctx.auth.userId },
        create: {
          userId: ctx.auth.userId,
          messages: trimmed as unknown as Prisma.InputJsonValue,
        },
        update: {
          messages: trimmed as unknown as Prisma.InputJsonValue,
        },
      })
    }),

  notifyColleague: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1),
        message: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.targetUserId === ctx.auth.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível enviar notificação para si mesmo.",
        })
      }

      const target = await ctx.db.user.findFirst({
        where: { id: input.targetUserId, is_active: true },
        select: { id: true },
      })

      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Colaborador não encontrado ou inativo.",
        })
      }

      const sender = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { firstName: true, lastName: true, email: true },
      })

      const senderName = sender?.firstName
        ? `${sender.firstName}${sender.lastName ? ` ${sender.lastName}` : ""}`.trim()
        : (sender?.email ?? "Um colega")

      await ctx.db.notification.create({
        data: {
          userId: input.targetUserId,
          title: `Recado de ${senderName} (via assistente)`,
          message: input.message,
          type: "INFO",
          channel: "IN_APP",
          actionUrl: "/dashboard",
        },
      })

      return { ok: true as const }
    }),
})
