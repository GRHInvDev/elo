import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const createBookingSchema = z.object({
  id: z.string().optional(),
  roomId: z.string(),
  title: z.string().min(1, "Título é obrigatório"),
  start: z.date(),
  end: z.date(),
})

export const bookingRouter = createTRPCRouter({
  create: protectedProcedure.input(createBookingSchema).mutation(async ({ ctx, input }) => {
    // Verifica se a sala existe
    const room = await ctx.db.room.findUnique({
      where: { id: input.roomId },
    })

    if (!room) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Sala não encontrada",
      })
    }

    // Verifica se há conflito de horário
    const conflictingBooking = await ctx.db.booking.findFirst({
      where: {
        roomId: input.roomId,
        OR: [
          {
            start: {
              lt: input.end,
            },
            end: {
              gt: input.start,
            },
          },
        ],
      },
    })

    if (conflictingBooking) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Esta sala já está reservada para este horário",
      })
    }

    return ctx.db.booking.create({
      data: {
        ...input,
        userId: ctx.auth.userId,
      },
    })
  }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const booking = await ctx.db.booking.findUnique({
      where: { id: input.id },
    })

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Reserva não encontrada",
      })
    }

    if (booking.userId !== ctx.auth.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para cancelar esta reserva",
      })
    }

    return ctx.db.booking.delete({
      where: { id: input.id },
    })
  }),

  update: protectedProcedure.input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
    // Verifica se a sala existe
    const room = await ctx.db.room.findUnique({
      where: { id: input.roomId, },
    })

    if (!room) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Sala não encontrada",
      })
    }

    // Verifica se há conflito de horário
    const conflictingBooking = await ctx.db.booking.findFirst({
      where: {
        roomId: input.roomId,
        id: {
          not: input.id
        }, 
        OR: [
          {
            start: {
              lt: input.end,
            },
            end: {
              gt: input.start,
            },
          },
        ],
      },
    })

    if (conflictingBooking) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Esta sala já está reservada para este horário",
      })
    }

    return ctx.db.booking.update({
      where:{
        id: input.id!,
      },
      data: {
        ...input,
        userId: ctx.auth.userId,
      },
    })
  }),

  list: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.booking.findMany({
        where: {
          start: {
            gte: input.startDate,
          },
          end: {
            lte: input.endDate,
          },
        },
        include: {
          room: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
        },
        orderBy: {
          start: "asc",
        },
      })
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.booking.findMany({
      where: {
        userId: ctx.auth.userId,
        end: {
          gte: new Date(),
        },
      },
      include: {
        room: true,
      },
      orderBy: {
        start: "asc",
      },
    })
  }),
})

