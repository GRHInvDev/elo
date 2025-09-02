import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { canCreateEvent } from "@/lib/access-control"
import type { RolesConfig } from "@/types/role-config"

const createEventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  location: z.string().min(1, "Local é obrigatório"),
  startDate: z.date(),
  endDate: z.date(),
  published: z.boolean().default(false),
})

export const eventRouter = createTRPCRouter({
  create: protectedProcedure.input(createEventSchema).mutation(async ({ ctx, input }) => {
    // Verificar se o usuário tem permissão para criar eventos
    const db_user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { role_config: true },
    })

    if (!canCreateEvent(db_user?.role_config as RolesConfig)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para criar eventos",
      })
    }

    const event = await ctx.db.event.create({
      data: {
        ...input,
        authorId: ctx.auth.userId,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    // Criar notificações para usuários que têm permissão para criar eventos
    try {
      const usersWithEventAccess = await ctx.db.user.findMany({
        where: {
          id: { not: ctx.auth.userId }
        },
        select: {
          id: true,
          role_config: true
        }
      })

      // Filtrar usuários que podem criar eventos
      const usersToNotify = usersWithEventAccess.filter(user => {
        if (!user.role_config) return false;

        const roleConfig = user.role_config as {
          sudo?: boolean;
          isTotem?: boolean;
          content?: {
            can_create_event?: boolean;
            can_create_flyer?: boolean;
            can_create_booking?: boolean;
          };
        };

        // Se é sudo, tem acesso a tudo
        if (roleConfig.sudo) return true;

        // Verificar se pode criar eventos
        return roleConfig.content?.can_create_event === true;
      })

      if (usersToNotify.length > 0) {
        const notifications = usersToNotify.map(user => ({
          title: "Novo Evento Criado",
          message: `${event.author.firstName ?? 'Usuário'} criou um novo evento: "${event.title}"`,
          type: "INFO" as const,
          channel: "IN_APP" as const,
          userId: user.id,
          entityId: event.id,
          entityType: "event",
          actionUrl: `/events`
        }))

        await ctx.db.notification.createMany({
          data: notifications
        })
      }
    } catch (notificationError) {
      console.error("Erro ao criar notificações de evento:", notificationError instanceof Error ? notificationError.message : notificationError)
    }

    return event
  }),

  update: protectedProcedure
    .input(createEventSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
      })

      if (!event || event.authorId !== ctx.auth.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar este evento",
        })
      }

      return ctx.db.event.update({
        where: { id: input.id },
        data: input,
      })
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const event = await ctx.db.event.findUnique({
      where: { id: input.id },
    })

    if (!event || event.authorId !== ctx.auth.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para deletar este evento",
      })
    }

    return ctx.db.event.delete({
      where: { id: input.id },
    })
  }),

  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.event.findMany({
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
            role_config: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
    })
  }),
})

