import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { utapi } from "@/server/uploadthing"
import { canCreateFlyer } from "@/lib/access-control";
import type { RolesConfig } from "@/types/role-config"

const createFlyerSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  imageUrl: z.string().url("URL da imagem inválida"),
  iframe: z.string().optional(),
  published: z.boolean().default(false),
})

export const flyerRouter = createTRPCRouter({
  create: protectedProcedure.input(createFlyerSchema).mutation(async ({ ctx, input }) => {
    // Verificar se o usuário tem permissão para criar encartes
    const db_user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { role_config: true },
    })

    if (!canCreateFlyer(db_user?.role_config as RolesConfig)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para criar encartes",
      })
    }

    const flyer = await ctx.db.flyer.create({
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

    // Criar notificações para usuários que têm permissão para criar encartes
    try {
      const usersWithFlyerAccess = await ctx.db.user.findMany({
        where: {
          id: { not: ctx.auth.userId }
        },
        select: {
          id: true,
          role_config: true
        }
      })

      // Filtrar usuários que podem criar encartes
      const usersToNotify = usersWithFlyerAccess.filter(user => {
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

        // Verificar se pode criar encartes
        return roleConfig.content?.can_create_flyer === true;
      })

      if (usersToNotify.length > 0) {
        const notifications = usersToNotify.map(user => ({
          title: "Novo Encarte Criado",
          message: `${flyer.author.firstName ?? 'Usuário'} criou um novo encarte: "${flyer.title}"`,
          type: "INFO" as const,
          channel: "IN_APP" as const,
          userId: user.id,
          entityId: flyer.id,
          entityType: "flyer",
          actionUrl: `/flyers`
        }))

        await ctx.db.notification.createMany({
          data: notifications
        })
      }
    } catch (notificationError) {
      console.error("Erro ao criar notificações de encarte:", notificationError instanceof Error ? notificationError.message : notificationError)
    }

    return flyer
  }),

  update: protectedProcedure
    .input(createFlyerSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const flyer = await ctx.db.flyer.findUnique({
        where: { id: input.id },
      })

      if (!flyer || flyer.authorId !== ctx.auth.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar este encarte",
        })
      }

      await utapi.deleteFiles(flyer.imageUrl.replace("https://162synql7v.ufs.sh/f/", ""))

      return ctx.db.flyer.update({
        where: { id: input.id },
        data: input,
      })
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const flyer = await ctx.db.flyer.findUnique({
      where: { id: input.id },
    })

    if (!flyer || flyer.authorId !== ctx.auth.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para deletar este encarte",
      })
    }

    await utapi.deleteFiles(flyer.imageUrl.replace("https://162synql7v.ufs.sh/f/", ""))

    return ctx.db.flyer.delete({
      where: { id: input.id },
    })
  }),

  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.flyer.findMany({
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
      orderBy: { createdAt: "desc" },
    })
  }),
})

