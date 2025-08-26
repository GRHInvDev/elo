import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { utapi } from "@/server/uploadthing"

const createPostSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  imageUrl: z.string().optional(),
  published: z.boolean().default(false),
})

export const postRouter = createTRPCRouter({
  create: protectedProcedure
  .input(createPostSchema)
  .mutation(async ({ ctx, input }) => {
    console.log("user Id", ctx.auth.userId)

    const post = await ctx.db.post.create({
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

    // Criar notificações para todos os usuários (exceto o autor)
    try {
      const allUsers = await ctx.db.user.findMany({
        where: {
          id: { not: ctx.auth.userId }
        },
        select: { id: true }
      })

      if (allUsers.length > 0) {
        const notifications = allUsers.map(user => ({
          title: "Novo Post Publicado",
          message: `${post.author.firstName ?? 'Usuário'} publicou um novo post: "${post.title}"`,
          type: "INFO" as const,
          channel: "IN_APP" as const,
          userId: user.id,
          entityId: post.id,
          entityType: "post",
          actionUrl: `/news` // Ajustado para a rota correta
        }))

        await ctx.db.notification.createMany({
          data: notifications
        })
      }
    } catch (notificationError) {
      console.error("Erro ao criar notificações de post:", notificationError)
    }

    return post
  }),

  update: protectedProcedure
    .input(createPostSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
      })

      if (!post || post.authorId !== ctx.auth.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar este post",
        })
      }

      return ctx.db.post.update({
        where: { id: input.id },
        data: input,
      })
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const post = await ctx.db.post.findUnique({
      where: { id: input.id },
    })

    if (!post || post.authorId !== ctx.auth.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para deletar este post",
      })
    }

    if (post.imageUrl){
      await utapi.deleteFiles(post.imageUrl.replace("https://162synql7v.ufs.sh/f/", ""))
    }

    return ctx.db.post.delete({
      where: { id: input.id },
    })
  }),

  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.post.findMany({
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
            role: true,
            enterprise: true,
          },
        },
        reactions: {
          distinct: ["emoji"]
        }
      },
      orderBy: { createdAt: "desc" },
    })
  }),
})

