import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const createCommentSchema = z.object({
  postId: z.string(),
  comment: z.string().min(1, "Comentário não pode estar vazio"),
})

export const commentRouter = createTRPCRouter({
  // Adicionar um comentário
  addComment: protectedProcedure.input(createCommentSchema).mutation(async ({ ctx, input }) => {
    const { postId, comment } = input
    const userId = ctx.auth.userId

    // Verifica se o post existe
    const post = await ctx.db.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Post não encontrado",
      })
    }

    // Verifica se o usuário já comentou neste post
    const existingComment = await ctx.db.coment.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    if (existingComment) {
      // Atualiza o comentário existente
      return ctx.db.coment.update({
        where: {
          id: existingComment.id,
        },
        data: {
          comment,
        },
      })
    }

    await ctx.db.post.update({
        where: { id: postId },
        data: {
            commentsCount: post.commentsCount+1
        }
    })

    // Cria um novo comentário
    return await ctx.db.coment.create({
      data: {
        userId,
        postId,
        comment,
      },
    })
  }),

  // Remover um comentário
  removeComment: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const { id } = input
    const userId = ctx.auth.userId

    const comment = await ctx.db.coment.findUnique({
      where: { id },
    })

    if (!comment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Comentário não encontrado",
      })
    }

    // Verifica se o usuário é o autor do comentário
    if (comment.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para remover este comentário",
      })
    }

    const post = await ctx.db.post.findUnique({
        where: {
            id: comment.postId
        }
    })

    await ctx.db.post.update({
        where: { id: comment.postId },
        data: {
            commentsCount: post?.commentsCount && post?.commentsCount > 0  ? post?.commentsCount-1 : 0
        }
    })

    return ctx.db.coment.delete({
      where: { id },
    })
  }),

  // Atualizar um comentário
  updateComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        comment: z.string().min(1, "Comentário não pode estar vazio"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, comment } = input
      const userId = ctx.auth.userId

      const existingComment = await ctx.db.coment.findUnique({
        where: { id },
      })

      if (!existingComment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comentário não encontrado",
        })
      }

      // Verifica se o usuário é o autor do comentário
      if (existingComment.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar este comentário",
        })
      }

      return ctx.db.coment.update({
        where: { id },
        data: {
          comment,
        },
      })
    }),

  // Listar comentários de um post
  listByPost: protectedProcedure.input(z.object({ postId: z.string() })).query(async ({ ctx, input }) => {
    const { postId } = input

    return ctx.db.coment.findMany({
      where: {
        postId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        id: "asc", // Ordenar por ID para manter a ordem de criação
      },
    })
  }),

  // Obter comentário do usuário atual em um post
  getUserComment: protectedProcedure.input(z.object({ postId: z.string() })).query(async ({ ctx, input }) => {
    const { postId } = input
    const userId = ctx.auth.userId

    return ctx.db.coment.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })
  }),
})

