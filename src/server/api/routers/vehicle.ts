import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { createVehicleSchema, updateVehicleSchema, vehicleIdSchema } from "@/schemas/vehicle.schema"

export const vehicleRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        enterprise: z.enum(["NA", "Box", "RHenz", "Cristallux"]).optional(),
        availble: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50
      const { cursor, enterprise, availble } = input

      const vehicles = await ctx.db.vehicle.findMany({
        take: limit + 1,
        where: {
          enterprise: enterprise,
          availble: availble,
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          model: "asc",
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (vehicles.length > limit) {
        const nextItem = vehicles.pop()
        nextCursor = nextItem?.id
      }

      return {
        items: vehicles,
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

