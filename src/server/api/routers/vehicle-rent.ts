import "server-only";
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { createVehicleRentSchema, finishRentSchema, vehicleRentIdSchema, editVehicleRentSchema } from "@/schemas/vehicle-rent.schema"
import { sendEmail } from "@/lib/mail/email-utils"
import { mockEmailReservaCarro } from "@/lib/mail/html-mock"
import { canLocateCars } from "@/lib/access-control"
import type { RolesConfig } from "@/types/role-config"


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

      // DEBUG: Log dos parâmetros recebidos
      console.log('🔍 [DEBUG] vehicleRent.getAll - Parâmetros recebidos:', {
        userId,
        vehicleId,
        finished,
        initial_date: initial_date?.toISOString(),
        final_date: final_date?.toISOString(),
        limit,
        cursor
      })

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

      // DEBUG: Log dos resultados encontrados
      console.log('📊 [DEBUG] vehicleRent.getAll - Resultados encontrados:', {
        totalResults: rents.length,
        firstResult: rents[0] ? {
          id: rents[0].id,
          startDate: rents[0].startDate.toISOString(),
          possibleEnd: rents[0].possibleEnd?.toISOString(),
          finished: rents[0].finished
        } : null,
        lastResult: rents[rents.length - 1] ? {
          id: rents[rents.length - 1]?.id,
          startDate: rents[rents.length - 1]?.startDate.toISOString(),
          possibleEnd: rents[rents.length - 1]?.possibleEnd?.toISOString(),
          finished: rents[rents.length - 1]?.finished
        } : null
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

    // DEBUG: Log da consulta de reservas ativas
    console.log('🚗 [DEBUG] getMyActiveRent - Buscando reservas ativas para userId:', userId)

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

    // DEBUG: Log dos resultados de reservas ativas
    console.log('📋 [DEBUG] getMyActiveRent - Reservas ativas encontradas:', {
      userId,
      totalActiveRents: activeRent.length,
      activeRents: activeRent.map(rent => ({
        id: rent.id,
        startDate: rent.startDate.toISOString(),
        possibleEnd: rent.possibleEnd?.toISOString(),
        vehicleModel: rent.vehicle.model,
        finished: rent.finished
      }))
    })

    return activeRent
  }),

  getMyAllRents: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
        includeFinished: z.boolean().default(true),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId
      const { limit, cursor, includeFinished } = input

      // DEBUG: Log da consulta de todas as reservas
      console.log('📚 [DEBUG] getMyAllRents - Buscando todas as reservas para userId:', {
        userId,
        limit,
        cursor,
        includeFinished
      })

      const whereClause: {
        userId: string
        finished?: boolean
      } = {
        userId,
      }

      // Se includeFinished for false, só buscar reservas não finalizadas
      if (!includeFinished) {
        whereClause.finished = false
      }

      const allRents = await ctx.db.vehicleRent.findMany({
        take: limit + 1,
        where: whereClause,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          vehicle: true,
        },
        orderBy: {
          startDate: "desc",
        },
      })

      // DEBUG: Log dos resultados de todas as reservas
      console.log('📊 [DEBUG] getMyAllRents - Todas as reservas encontradas:', {
        userId,
        totalResults: allRents.length,
        includeFinished,
        results: allRents.map(rent => ({
          id: rent.id,
          startDate: rent.startDate.toISOString(),
          possibleEnd: rent.possibleEnd?.toISOString(),
          endDate: rent.endDate?.toISOString(),
          vehicleModel: rent.vehicle.model,
          finished: rent.finished
        }))
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (allRents.length > limit) {
        const nextItem = allRents.pop()
        nextCursor = nextItem?.id
      }

      return {
        items: allRents,
        nextCursor,
      }
    }),

  getCalendarReservations: protectedProcedure
    .input(
      z.object({
        vehicleId: z.string().optional(),
        month: z.number(), // 0-11 (JavaScript months)
        year: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { vehicleId, month, year } = input

      // Criar datas para o início e fim do mês
      const startOfMonth = new Date(year, month, 1)
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)

      // DEBUG: Log da consulta do calendário
      console.log('📅 [DEBUG] getCalendarReservations - Buscando reservas para:', {
        vehicleId,
        month,
        year,
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString()
      })

      const reservations = await ctx.db.vehicleRent.findMany({
        where: {
          vehicleId: vehicleId,
          // Removido finished: false para incluir todas as reservas (finalizadas e não finalizadas)
          // Uma reserva deve aparecer no calendário se há sobreposição com o mês
          OR: [
            // Caso 1: reserva começa dentro do mês
            {
              startDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
            // Caso 2: reserva termina dentro do mês
            {
              possibleEnd: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
            // Caso 3: reserva cobre todo o mês (começa antes e termina depois)
            {
              AND: [
                { startDate: { lte: startOfMonth } },
                { possibleEnd: { gte: endOfMonth } },
              ],
            },
          ],
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
        orderBy: {
          startDate: "asc",
        },
      })

      // DEBUG: Log dos resultados do calendário
      console.log('📊 [DEBUG] getCalendarReservations - Reservas encontradas:', {
        vehicleId,
        month,
        year,
        totalReservations: reservations.length,
        reservations: reservations.map(reservation => ({
          id: reservation.id,
          startDate: reservation.startDate.toISOString(),
          possibleEnd: reservation.possibleEnd?.toISOString(),
          endDate: reservation.endDate?.toISOString(),
          finished: reservation.finished,
          userName: `${reservation.user.firstName} ${reservation.user.lastName}`
        }))
      })

      return reservations
    }),

  create: protectedProcedure.input(createVehicleRentSchema).mutation(async ({ ctx, input }) => {
    // Verificar se o usuário tem permissão para fazer agendamentos de carros
    const db_user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { role_config: true },
    })

    if (!canLocateCars(db_user?.role_config as RolesConfig)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para fazer agendamentos de carros",
      })
    }

    const userId = ctx.auth.userId
    const { vehicleId, startDate, possibleEnd, driver, destiny, passangers } = input

    console.log("Input completo:", input)
    console.log("Campos extraídos:", { vehicleId, startDate, possibleEnd, driver, destiny, passangers })

    const newStartDate = new Date(startDate ?? new Date()).setHours(new Date(startDate ?? new Date()).getHours() - 3);
    const newPossibleEnd = new Date(possibleEnd ?? new Date()).setHours(new Date(possibleEnd ?? new Date()).getHours() - 3);

    if (!possibleEnd) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A data de término prevista é obrigatória.",
      })
    }

    if (!driver || driver.trim().length <= 2) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nome do motorista é obrigatório e deve ter pelo menos 3 caracteres.",
      })
    }

    if (!destiny || destiny.trim().length <= 2) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Destino é obrigatório e deve ter pelo menos 3 caracteres.",
      })
    }

    // Usar uma transação para garantir que a verificação de disponibilidade e a criação da reserva sejam atômicas
    return ctx.db.$transaction(async (tx) => {
      // 1. Verificar se o veículo existe
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        select: { id: true, kilometers: true },
      })

      console.log("Veículo encontrado:", vehicle)

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
                lt: new Date(newPossibleEnd),
              },
            },
            {
              possibleEnd: {
                gt: new Date(newStartDate),
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
      const rentData = {
        userId,
        startDate: new Date(newStartDate),
        possibleEnd: new Date(newPossibleEnd),
        vehicleId: vehicleId,
        initialKm: BigInt(vehicle.kilometers.toString()),
        driver: driver || "",
        destiny: destiny || "",
        passangers: passangers ?? null,
      }

      console.log("Dados a serem salvos no banco:", rentData)

      const rent = await tx.vehicleRent.create({
        data: rentData,
        include: {
          vehicle: true,
        },
      })

      console.log("Reserva criada com sucesso:", rent.id)

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

  edit: protectedProcedure.input(editVehicleRentSchema).mutation(async ({ ctx, input }) => {
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
        message: "Reserva não encontrada",
      })
    }

    // Após verificação, rent não é mais null
    const safeRent = rent

    // Verificar se o usuário tem permissão para editar (apenas o proprietário da reserva)
    if (safeRent.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para editar esta reserva",
      })
    }

    // Verificar se a reserva já foi finalizada
    if (safeRent.finished) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Não é possível editar uma reserva já finalizada",
      })
    }

    // Validar a data de término
    if (!input.possibleEnd || input.possibleEnd <= new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A data de término deve ser posterior à data atual",
      })
    }

    // Validar campos obrigatórios
    if (!input.driver || input.driver.trim().length <= 2) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nome do motorista é obrigatório e deve ter pelo menos 3 caracteres",
      })
    }

    if (!input.destiny || input.destiny.trim().length <= 2) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Destino é obrigatório e deve ter pelo menos 3 caracteres",
      })
    }

    // Se há uma data de início fornecida, validar se é futura
    if (input.startDate && input.startDate <= new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A data de início deve ser posterior à data atual",
      })
    }

    // Verificar se há conflito de datas apenas se a data foi alterada
    if (input.startDate || input.possibleEnd.getTime() !== safeRent.possibleEnd?.getTime()) {
      const startDateToCheck = input.startDate ?? safeRent.startDate
      const endDateToCheck = input.possibleEnd

      if (startDateToCheck >= endDateToCheck) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A data de início deve ser anterior à data de término",
        })
      }

      // Verificar conflito com outras reservas
      const conflictingRent = await ctx.db.vehicleRent.findFirst({
        where: {
          vehicleId: safeRent.vehicleId,
          finished: false,
          AND: [
            {
              startDate: {
                lt: endDateToCheck,
              },
            },
            {
              possibleEnd: {
                gt: startDateToCheck,
              },
            },
          ],
          id: {
            not: input.id, // Excluir a própria reserva
          },
        },
      })

      if (conflictingRent) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este veículo não está disponível no período solicitado",
        })
      }
    }

    // Preparar dados para atualização
    const updateData = {
      startDate: input.startDate ?? safeRent.startDate,
      possibleEnd: input.possibleEnd,
      driver: input.driver,
      destiny: input.destiny,
      passangers: input.passangers ?? null,
    }

    // Atualizar a reserva
    const updatedRent = await ctx.db.vehicleRent.update({
      where: { id: input.id },
      data: updateData,
      include: {
        vehicle: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return updatedRent
  })
})

