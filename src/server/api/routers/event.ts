import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

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
    // Verifica se o usuário já tem um evento
    const existingEvent = await ctx.db.event.findFirst({
      where: { authorId: ctx.auth.userId },
    })

    if (existingEvent) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você já criou um evento",
      })
    }

    return ctx.db.event.create({
      data: {
        ...input,
        authorId: ctx.auth.userId,
      },
    })
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
          },
        },
      },
      orderBy: { startDate: "asc" },
    })
  }),
})

