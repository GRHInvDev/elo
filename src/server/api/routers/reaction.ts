import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const createReactionSchema = z.object({
  postId: z.string(),
  emoji: z.string(),
})

export const reactionRouter = createTRPCRouter({
  // Adicionar ou atualizar uma reação
  addReaction: protectedProcedure.input(createReactionSchema).mutation(async ({ ctx, input }) => {
    const { postId, emoji } = input
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

    // Verifica se o usuário já reagiu a este post
    const existingReaction = await ctx.db.reaction.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    if (existingReaction) {
      // Atualiza a reação existente
      return ctx.db.reaction.update({
        where: {
          id: existingReaction.id,
        },
        data: {
          emoji,
        },
      })
    }

    await ctx.db.post.update({
        where: { id: postId },
        data: {
            reactionCount: post.reactionCount+1
        }
    })

    // Cria uma nova reação
    return ctx.db.reaction.create({
      data: {
        userId,
        postId,
        emoji,
      },
    })
  }),

  // Remover uma reação
  removeReaction: protectedProcedure.input(z.object({ postId: z.string() })).mutation(async ({ ctx, input }) => {
    const { postId } = input
    const userId = ctx.auth.userId

    const post = await ctx.db.post.findUnique({
        where: { id: postId },
    })

    if (!post) {
    throw new TRPCError({
        code: "NOT_FOUND",
        message: "Post não encontrado",
    })
    }

    const existingReaction = await ctx.db.reaction.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    if (!existingReaction) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Reação não encontrada",
      })
    }

    await ctx.db.post.update({
        where: { id: postId },
        data: {
            reactionCount: post.reactionCount-1
        }
    })

    return ctx.db.reaction.delete({
      where: {
        id: existingReaction.id,
      },
    })
  }),

  // Listar reações de um post
  listByPost: protectedProcedure.input(z.object({ postId: z.string() })).query(async ({ ctx, input }) => {
    const { postId } = input

    return ctx.db.reaction.findMany({
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
    })
  }),

  // Obter contagem de reações por emoji para um post
  getReactionCounts: protectedProcedure.input(z.object({ postId: z.string() })).query(async ({ ctx, input }) => {
    const { postId } = input

    const reactions = await ctx.db.reaction.findMany({
      where: {
        postId,
      },
      select: {
        emoji: true,
      },
    })

    // Agrupa as reações por emoji e conta
    const counts: Record<string, number> = {}
    reactions.forEach((reaction) => {
      const { emoji } = reaction
      counts[emoji] = (counts[emoji] ?? 0) + 1
    })

    return counts
  }),

  // Verificar se o usuário atual reagiu a um post
  getUserReaction: protectedProcedure.input(z.object({ postId: z.string() })).query(async ({ ctx, input }) => {
    const { postId } = input
    const userId = ctx.auth.userId

    const reaction = await ctx.db.reaction.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    return reaction
  }),
})

