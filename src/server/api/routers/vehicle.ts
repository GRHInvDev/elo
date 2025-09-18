import "server-only";
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { createVehicleSchema, updateVehicleSchema, vehicleIdSchema } from "@/schemas/vehicle.schema"

export const vehicleRouter = createTRPCRouter({
  getAvailable: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input

      if (startDate >= endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A data de início deve ser anterior à data de término.",
        })
      }

      // Encontra todos os veículos que têm aluguéis conflitantes no período solicitado
      const unavailableVehicles = await ctx.db.vehicle.findMany({
        where: {
          rents: {
            some: {
              finished: false,
              // Um conflito ocorre se a reserva existente (R) e o período solicitado (S) se sobrepõem.
              // A sobreposição acontece se a R não termina antes de S começar E R não começa depois de S terminar.
              // Em outras palavras: !(R.possibleEnd <= S.startDate || R.startDate >= S.endDate)
              // Usando a Lei de De Morgan, isso é: R.possibleEnd > S.startDate && R.startDate < S.endDate
              AND: [
                {
                  // A reserva existente começa antes do fim do período solicitado.
                  startDate: {
                    lt: endDate,
                  },
                },
                {
                  // A reserva existente termina depois do início do período solicitado.
                  possibleEnd: {
                    gt: startDate,
                  },
                },
              ],
            },
          },
        },
        select: {
          id: true, // Apenas precisamos do ID para excluir
        },
      })

      const unavailableVehicleIds = unavailableVehicles.map((v) => v.id)

      // Busca todos os veículos que NÃO ESTÃO na lista de indisponíveis
      const availableVehicles = await ctx.db.vehicle.findMany({
        where: {
          id: {
            notIn: unavailableVehicleIds,
          },
        },
        orderBy: {
          model: "asc",
        },
      })

      return availableVehicles.map((v) => ({
        ...v,
        kilometers: parseInt(v.kilometers.toString()),
      }))
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        enterprise: z.enum(["NA", "Box", "RHenz", "Cristallux"]).optional(),
        availble: z.boolean().optional(),
        checkDate: z.string().optional(),
        checkTime: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50
      const { cursor, enterprise, availble, checkDate, checkTime } = input

      // Buscar veículos baseados nos filtros básicos
      let vehicles = await ctx.db.vehicle.findMany({
        take: limit + 1,
        where: {
          enterprise: enterprise,
          availble: availble,
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          model: "asc",
        },
        include: {
          rents: {
            where: {
              finished: false,
            },
            select: {
              id: true,
              startDate: true,
              possibleEnd: true,
            },
          },
        },
      })

      // Se foi solicitado verificar disponibilidade por data/hora
      if (checkDate && checkTime && checkTime.trim() !== '') {
        // Criar data com timezone local
        const requestedStart = new Date(`${checkDate}T${checkTime}:00`)
        const requestedEnd = new Date(requestedStart.getTime() + 60 * 60 * 1000) // +1 hora

        // Verificar se as datas foram criadas corretamente
        if (isNaN(requestedStart.getTime()) || isNaN(requestedEnd.getTime())) {
          console.error('Erro ao criar datas:', { checkDate, checkTime, requestedStart, requestedEnd })
          return { items: [], nextCursor: undefined }
        }

        vehicles = vehicles.filter(vehicle => {
          // Verificar se há reservas conflitantes
          const hasConflict = vehicle.rents.some(rent => {
            const rentStart = new Date(rent.startDate)
            const rentEnd = rent.possibleEnd ? new Date(rent.possibleEnd) : new Date(Date.now() + 24 * 60 * 60 * 1000) // +1 dia como fallback

            // Verifica se há sobreposição entre o período solicitado e a reserva existente
            const hasOverlap = !(requestedEnd <= rentStart || requestedStart >= rentEnd)

            return hasOverlap
          })

          return !hasConflict
        })

      }

      let nextCursor: typeof cursor | undefined = undefined
      if (vehicles.length > limit) {
        const nextItem = vehicles.pop()
        nextCursor = nextItem?.id
      }

      return {
        items: vehicles.map((v)=>({
          ...v,
          // Manter tipos originais do Prisma para compatibilidade
        })),
        nextCursor,
      }
    }),

  getById: protectedProcedure.input(vehicleIdSchema).query(async ({ ctx, input }) => {
    const vehicle = await ctx.db.vehicle.findUnique({
      where: { id: input.id },
      include: {
        rents: {
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
          },
          orderBy: {
            startDate: "desc",
          },
          take: 10,
        },
      },
    })

    if (!vehicle) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Veículo não encontrado",
      })
    }

    return vehicle
  }),

  create: protectedProcedure.input(createVehicleSchema).mutation(async ({ ctx, input }) => {
    // Verificar se a placa já existe
    const existingVehicle = await ctx.db.vehicle.findUnique({
      where: { plate: input.plate },
    })

    if (existingVehicle) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Já existe um veículo com esta placa",
      })
    }

    return ctx.db.vehicle.create({
      data: {
        model: input.model,
        plate: input.plate,
        imageUrl: input.imageUrl,
        enterprise: input.enterprise,
        kilometers: BigInt(input.kilometers.toString()),
        availble: input.availble,
      },
    })
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        data: updateVehicleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input

      // Verificar se o veículo existe
      const vehicle = await ctx.db.vehicle.findUnique({
        where: { id },
      })

      if (!vehicle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Veículo não encontrado",
        })
      }

      // Se estiver atualizando a placa, verificar se já existe
      if (data.plate && data.plate !== vehicle.plate) {
        const existingVehicle = await ctx.db.vehicle.findUnique({
          where: { plate: data.plate },
        })

        if (existingVehicle) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um veículo com esta placa",
          })
        }
      }

      // Converter kilometers para BigInt se fornecido
      const kilometers = data.kilometers ? BigInt(data.kilometers.toString()) : undefined

      return ctx.db.vehicle.update({
        where: { id },
        data: {
          ...data,
          kilometers,
        },
      })
    }),

  delete: protectedProcedure.input(vehicleIdSchema).mutation(async ({ ctx, input }) => {
    // Verificar se o veículo existe
    const vehicle = await ctx.db.vehicle.findUnique({
      where: { id: input.id },
      include: {
        rents: {
          where: {
            finished: false,
          },
        },
      },
    })

    if (!vehicle) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Veículo não encontrado",
      })
    }

    // Verificar se há reservas ativos
    if (vehicle.rents.length > 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Não é possível excluir um veículo com reservas ativos",
      })
    }

    return ctx.db.vehicle.delete({
      where: { id: input.id },
    })
  }),
})

