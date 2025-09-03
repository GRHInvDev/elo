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

    // Notificações temporariamente desabilitadas
    // TODO: Reimplementar sistema de notificações

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
            role_config: true,
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

