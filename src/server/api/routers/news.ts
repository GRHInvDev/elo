import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc"

const createNewsSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  body: z.string().min(1, "Conteúdo é obrigatório"),
  imageUrl: z.string().url("URL da imagem inválida"),
  published: z.boolean().default(false),
})

export const newsRouter = createTRPCRouter({
  // Criar uma notícia
  create: protectedProcedure.input(createNewsSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.news.create({
      data: {
        ...input,
        authorId: ctx.auth.userId,
      },
    })
  }),

  // Atualizar uma notícia
  update: protectedProcedure
    .input(
      createNewsSchema.partial().extend({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const news = await ctx.db.news.findUnique({
        where: { id: input.id },
      })

      if (!news) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notícia não encontrada",
        })
      }

      // Verifica se o usuário é o autor da notícia ou um admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
      })

      if (news.authorId !== ctx.auth.userId && user?.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar esta notícia",
        })
      }

      return ctx.db.news.update({
        where: { id: input.id },
        data: input,
      })
    }),

  // Deletar uma notícia
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const news = await ctx.db.news.findUnique({
      where: { id: input.id },
    })

    if (!news) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Notícia não encontrada",
      })
    }

    // Verifica se o usuário é o autor da notícia ou um admin
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
    })

    if (news.authorId !== ctx.auth.userId && user?.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para deletar esta notícia",
      })
    }

    return ctx.db.news.delete({
      where: { id: input.id },
    })
  }),

  // Publicar/despublicar uma notícia (toggle)
  togglePublish: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const news = await ctx.db.news.findUnique({
      where: { id: input.id },
    })

    if (!news) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Notícia não encontrada",
      })
    }

    // Verifica se o usuário é o autor da notícia ou um admin
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
    })

    if (news.authorId !== ctx.auth.userId && user?.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para publicar/despublicar esta notícia",
      })
    }

    return ctx.db.news.update({
      where: { id: input.id },
      data: {
        published: !news.published,
      },
    })
  }),

  // Buscar uma notícia específica
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.news.findUnique({
      where: { id: input.id },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    })
  }),

  // Listar todas as notícias
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional(),
          cursor: z.string().optional(),
          onlyPublished: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10
      const cursor = input?.cursor
      const onlyPublished = input?.onlyPublished ?? true

      const items = await ctx.db.news.findMany({
        take: limit + 1,
        where: onlyPublished ? { published: true } : undefined,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          data: "desc",
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (items.length > limit) {
        const nextItem = items.pop()
        nextCursor = nextItem?.id
      }

      return {
        items,
        nextCursor,
      }
    }),

  // Listar notícias do usuário atual
  listMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.news.findMany({
      where: {
        authorId: ctx.auth.userId,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        data: "desc",
      },
    })
  }),

  // Buscar notícias em destaque (para admin)
  getFeatured: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.news.findMany({
      where: {
        published: true,
      },
      take: 5,
      orderBy: {
        data: "desc",
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    })
  }),
})

