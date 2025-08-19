import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const createRoomSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  capacity: z.number().min(1, "Capacidade deve ser maior que 0"),
  floor: z.number().min(1, "Andar deve ser maior que 0"),
  filial: z.string().optional(),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
})

const updateRoomSchema = createRoomSchema.partial().extend({
  id: z.string(),
})

export const roomRouter = createTRPCRouter({
  // Criar uma nova sala
  create: protectedProcedure.input(createRoomSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.room.create({
      data: {
        name: input.name,
        capacity: input.capacity,
        floor: input.floor,
        filial: input.filial,
        coordinates: input.coordinates,
      },
    })
  }),

  // Atualizar uma sala existente
  update: protectedProcedure.input(updateRoomSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input
    return ctx.db.room.update({
      where: { id },
      data,
    })
  }),

  // Deletar uma sala
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.room.delete({
      where: { id: input.id },
    })
  }),

  // Buscar uma sala específica
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.room.findUnique({
      where: { id: input.id },
      include: {
        bookings: {
          where: {
            end: {
              gte: new Date(),
            },
          },
          orderBy: {
            start: "asc",
          },
        },
      },
    })
  }),

  // Listar todas as salas
  list: protectedProcedure
  .input(
    z
      .object({
        floor: z.number().optional(),
        filial: z.string().optional(),
      })
      .optional(),
  )
  .query(async ({ ctx, input }) => {
    return ctx.db.room.findMany({
      where:
        input?.floor || input?.filial
          ? {
              ...(input?.floor ? { floor: input.floor } : {}),
              ...(input?.filial ? { filial: input.filial } : {}),
            }
          : undefined,
      include: {
        bookings: {
          where: {
            end: {
              gte: new Date(),
            },
          },
        },
      },
      orderBy: [{ floor: "asc" }, { name: "asc" }],
    })
  }),

  // Verificar disponibilidade da sala
  checkAvailability: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        start: z.date(),
        end: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const bookings = await ctx.db.booking.findMany({
        where: {
          roomId: input.roomId,
          OR: [
            {
              start: {
                lte: input.end,
              },
              end: {
                gte: input.start,
              },
            },
          ],
        },
      })

      return bookings.length === 0
    }),

  listBookings: protectedProcedure
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
            },
          },
        },
        orderBy: {
          start: "asc",
        },
      })
    }),

    listAvailable: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        filial: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = input.date
      const bookings = await ctx.db.booking.findMany({
        where: {
          start: {
            lte: now,
          },
          end: {
            gte: now,
          },
        },
        select: {
          roomId: true,
        },
      })
  
      const bookedRoomIds = bookings.map((b) => b.roomId)
  
      return ctx.db.room.findMany({
        where: {
          id: {
            notIn: bookedRoomIds,
          },
          ...(input.filial ? { filial: input.filial } : {}),
        },
        orderBy: [
          {
            floor: "asc",
          },
          {
            name: "asc",
          },
        ],
      })
    }),
})
