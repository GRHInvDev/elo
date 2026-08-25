import { z } from "zod"
import { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import {
  buildIsometricRoomFromPhotos,
} from "@/server/ai/room-vision-builder"
import {
  type IsometricRoomModel,
  isometricRoomModelSchema,
} from "@/types/isometric-room"

const createRoomSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().nullable(),
  capacity: z.number().min(1, "Capacidade deve ser maior que 0"),
  floor: z.number(),
  filial: z.string().min(1, "Filial é obrigatória"),
  photos: z.array(z.string()).optional().default([]),
  visualModel: isometricRoomModelSchema.optional().nullable(),
  coordinates: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
})

const updateRoomSchema = createRoomSchema.partial().extend({
  id: z.string(),
})

export const roomRouter = createTRPCRouter({
  generateVisualModel: protectedProcedure
    .input(
      z.object({
        imageUrls: z.array(z.string()),
        roomName: z.string().optional(),
        capacity: z.number().optional(),
        floor: z.number().optional(),
        filial: z.string().optional(),
        additionalContext: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const model = await buildIsometricRoomFromPhotos({
        imageUrls: input.imageUrls,
        roomName: input.roomName,
        capacity: input.capacity,
        floor: input.floor,
        filial: input.filial,
        additionalContext: input.additionalContext,
      })
      return model
    }),

  create: protectedProcedure.input(createRoomSchema).mutation(async ({ ctx, input }) => {
    const visualModelToSave = input.visualModel ?? Prisma.DbNull

    const coordinatesToSave = input.coordinates ?? {
      x: 50,
      y: 50,
      width: 120,
      height: 90,
    }

    const filialCode = input.filial.trim().toUpperCase()
    const filialRecord = await ctx.db.filial.findUnique({
      where: { code: filialCode },
    })

    if (!filialRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Filial com código "${filialCode}" não encontrada.`,
      })
    }

    if (!filialRecord.hasRoom) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `A filial "${filialRecord.name}" (${filialRecord.code}) não permite o cadastro de salas.`,
      })
    }

    return ctx.db.room.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        capacity: input.capacity,
        floor: input.floor,
        filial: filialCode,
        photos: input.photos ?? [],
        visualModel: visualModelToSave,
        coordinates: coordinatesToSave,
      },
    })
  }),

  update: protectedProcedure.input(updateRoomSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input

    if (data.filial) {
      const filialCode = data.filial.trim().toUpperCase()
      const filialRecord = await ctx.db.filial.findUnique({
        where: { code: filialCode },
      })

      if (!filialRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Filial com código "${filialCode}" não encontrada.`,
        })
      }

      if (!filialRecord.hasRoom) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `A filial "${filialRecord.name}" (${filialRecord.code}) não permite o cadastro de salas.`,
        })
      }
    }

    return ctx.db.room.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        description: data.description !== undefined ? data.description : undefined,
        capacity: data.capacity ?? undefined,
        floor: data.floor ?? undefined,
        filial: data.filial ? data.filial.toUpperCase() : undefined,
        photos: data.photos ?? undefined,
        visualModel:
          data.visualModel === null
            ? Prisma.DbNull
            : (data.visualModel ?? undefined),
        coordinates: data.coordinates ?? undefined,
      },
    })
  }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.room.delete({
      where: { id: input.id },
    })
  }),

  // Buscar uma sala específica
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const room = await ctx.db.room.findUnique({
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

    if (!room) return null

    const visualModel = (room.visualModel as unknown as IsometricRoomModel) ?? null

    return {
      ...room,
      photos: room.photos ?? [],
      visualModel,
    }
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
      const rooms = await ctx.db.room.findMany({
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

      return rooms.map((room) => ({
        ...room,
        photos: room.photos ?? [],
        visualModel: (room.visualModel as unknown as IsometricRoomModel) ?? null,
      }))
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

      const rooms = await ctx.db.room.findMany({
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

      return rooms.map((room) => ({
        ...room,
        photos: room.photos ?? [],
        visualModel: (room.visualModel as unknown as IsometricRoomModel) ?? null,
      }))
    }),
})
