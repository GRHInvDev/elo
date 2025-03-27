import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { createVehicleRentSchema, finishRentSchema, vehicleRentIdSchema } from "@/schemas/vehicle-rent.schema"

export const vehicleRentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        userId: z.string().optional(),
        vehicleId: z.string().optional(),
        finished: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50
      const { cursor, userId, vehicleId, finished } = input

      const rents = await ctx.db.vehicleRent.findMany({
        take: limit + 1,
        where: {
          userId: userId,
          vehicleId: vehicleId,
          finished: finished,
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          startDate: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
          vehicle: true,
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (rents.length > limit) {
        const nextItem = rents.pop()
        nextCursor = nextItem?.id
      }

      return {
        items: rents,
        nextCursor,
      }
    }),

  getById: protectedProcedure.input(vehicleRentIdSchema).query(async ({ ctx, input }) => {
    const rent = await ctx.db.vehicleRent.findUnique({
      where: { id: input.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            email: true,
            imageUrl: true,
          },
        },
        vehicle: true,
      },
    })

    if (!rent) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "reserva não encontrado",
      })
    }

    return rent
  }),

  getMyActiveRent: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId

    const activeRent = await ctx.db.vehicleRent.findFirst({
      where: {
        userId,
        finished: false,
      },
      include: {
        vehicle: true,
      },
      orderBy: {
        startDate: "desc",
      },
    })

    return activeRent
  }),

  create: protectedProcedure.input(createVehicleRentSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.userId

    // Verificar se o usuário já tem um reserva ativo
    const activeRent = await ctx.db.vehicleRent.findFirst({
      where: {
        userId,
        finished: false,
        AND: [
          {
            startDate: {
              lte: new Date() 
            },
            endDate: {
              gte: new Date()
            }
          },
        ]
      },
    })

    if (activeRent) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você já possui um veículo reservado",
      })
    }

    // Verificar se o veículo existe e está disponível
    const vehicle = await ctx.db.vehicle.findUnique({
      where: { id: input.vehicleId },
    })

    if (!vehicle) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Veículo não encontrado",
      })
    }

    const activeCarRent = await ctx.db.vehicleRent.findFirst({
      where: {
        finished: false,
        vehicleId: vehicle.id,
        OR: [
          {
            startDate: {
              lte: input.possibleEnd
            },
            endDate: {
              gte: input.startDate
            }
          },
          {
            startDate: {
              lte: input.startDate
            },
            endDate: {
              gte: input.possibleEnd
            }
          }
        ]
      }
    });
    
    if (activeCarRent){
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Este veículo não está disponível para reserva nesse período",
      })
    }

    // Criar a reserva e atualizar o status do veículo em uma transação
    return ctx.db.$transaction(async (tx) => {
      // Criar a reserva
      const vehicle = await tx.vehicle.findUnique({
        select: {
          kilometers: true,
        },
        where: {
          id: input.vehicleId
        }
      })
      const rent = await tx.vehicleRent.create({
        data: {
          userId,
          ...input,
          vehicleId: input.vehicleId,
          initialKm: vehicle?.kilometers
        },
        include: {
          vehicle: true,
        },
      })

      if (!input.startDate || input.startDate <= new Date()){
        // Atualizar o status do veículo
        await tx.vehicle.update({
          where: { id: input.vehicleId },
          data: { availble: false },
        })
      }

      return rent
    })
  }),

  finish: protectedProcedure.input(finishRentSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.userId

    // Verificar se a reserva existe e pertence ao usuário
    const rent = await ctx.db.vehicleRent.findUnique({
      where: { id: input.id },
      include: {
        vehicle: true,
      },
    })

    if (!rent) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "reserva não encontrada",
      })
    }

    if (rent.vehicle.kilometers >= input.finalKm) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A Kilometragem final não pode ser menor que a inicial",
      })
    }

    if (rent.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para finalizar esta reserva",
      })
    }

    if (rent.finished) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Esta reserva já foi finalizada",
      })
    }

    // Finalizar a reserva e atualizar o status do veículo em uma transação
    return ctx.db.$transaction(async (tx) => {
      // Finalizar a reserva
      const updatedRent = await tx.vehicleRent.update({
        where: { id: input.id },
        data: {
          endDate: new Date(),
          finished: true,
          endLocation: input.endLocation,
          observation: input.observations
        },
        include: {
          vehicle: true,
        },
      })

      // Atualizar o status do veículo
      await tx.vehicle.update({
        where: { id: rent.vehicleId },
        data: { availble: true, kilometers: input.finalKm },
      })

      return updatedRent
    })
  }),

  cancel: protectedProcedure.input(vehicleRentIdSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.userId
    
    // Verificar se a reserva existe
    const rent = await ctx.db.vehicleRent.findUnique({
      where: { id: input.id },
      include: {
        vehicle: true,
      },
    })

    if (!rent) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "reserva não encontrado",
      })
    }

    // Verificar permissões (apenas o próprio usuário ou um admin pode cancelar)
    if (rent.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para cancelar este reserva",
      })
    }

    if (rent.finished) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Não é possível cancelar um reserva já finalizado",
      })
    }

    // Cancelar a reserva (excluir) e atualizar o status do veículo em uma transação
    return ctx.db.$transaction(async (tx) => {
      // Excluir a reserva
      await tx.vehicleRent.delete({
        where: { id: input.id },
      })

      // Atualizar o status do veículo
      await tx.vehicle.update({
        where: { id: rent.vehicleId },
        data: { availble: true },
      })

      return { success: true }
    })
  }),
})

