import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { createVehicleRentSchema, finishRentSchema, vehicleRentIdSchema } from "@/schemas/vehicle-rent.schema"
import { sendEmail } from "@/lib/mail/email-utils"
import { mockEmailReservaCarro } from "@/lib/mail/html-mock"


export const vehicleRentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        userId: z.string().optional(),
        vehicleId: z.string().optional(),
        finished: z.boolean().optional(),
        initial_date: z.date().optional(),
        final_date: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50
      const { cursor, userId, vehicleId, finished, final_date, initial_date } = input

      const rents = await ctx.db.vehicleRent.findMany({
        take: limit + 1,
        where: {
          userId: userId,
          vehicleId: vehicleId,
          finished: finished,
          startDate: {
            gte: initial_date ?? undefined,
          },
          possibleEnd: {
            lte: final_date ?? undefined,
          }
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

    const activeRent = await ctx.db.vehicleRent.findMany({
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
    const { vehicleId, startDate, possibleEnd } = input

    if (!possibleEnd) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A data de término prevista é obrigatória.",
      })
    }

    // Usar uma transação para garantir que a verificação de disponibilidade e a criação da reserva sejam atômicas
    return ctx.db.$transaction(async (tx) => {
      // 1. Verificar se o veículo existe
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        select: { id: true, kilometers: true },
      })

      if (!vehicle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Veículo não encontrado",
        })
      }

      // 2. Verificar novamente a disponibilidade dentro da transação para evitar race conditions
      const conflictingRent = await tx.vehicleRent.findFirst({
        where: {
          vehicleId: vehicleId,
          finished: false,
          AND: [
            {
              startDate: {
                lt: possibleEnd,
              },
            },
            {
              possibleEnd: {
                gt: startDate,
              },
            },
          ],
        },
      })

      if (conflictingRent) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este veículo não está mais disponível para reserva no período solicitado. Por favor, tente outro horário.",
        })
      }

      // 3. Criar a reserva
      const rent = await tx.vehicleRent.create({
        data: {
          userId,
          ...input,
          vehicleId: vehicleId,
          initialKm: vehicle.kilometers,
        },
        include: {
          vehicle: true,
        },
      })

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
          finalKm: input.finalKm,
          endLocation: input.endLocation,
          observation: input.observations
        },
        include: {
          vehicle: true,
          user: true
        },
      })

      // Atualizar o status do veículo
      await tx.vehicle.update({
        where: { id: rent.vehicleId },
        data: { availble: true, kilometers: input.finalKm },
      })

      await sendEmail('frota@boxdistribuidor.com.br', `Reserva ${updatedRent.id} finalizada`, mockEmailReservaCarro(
        updatedRent.user.firstName ?? '',
        updatedRent.id,
        updatedRent.vehicleId,
        updatedRent.vehicle.model,
        updatedRent.startDate.toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
        updatedRent.endDate?.toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }) ?? new Date().toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      ));

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

