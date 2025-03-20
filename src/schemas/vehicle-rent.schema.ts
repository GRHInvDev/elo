import { z } from "zod"

export const createVehicleRentSchema = z.object({
  vehicleId: z.string().cuid("ID do veículo inválido"),
  dataInicial: z.date().optional()
})

export const updateVehicleRentSchema = z.object({
  endDate: z.date().optional(),
  finished: z.boolean().optional(),
  endLocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string().optional(),
    })
    .optional(),
})

export const finishRentSchema = z.object({
  id: z.string().cuid("ID inválido"),
  finalKm: z.number(),
  endLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
})

export const vehicleRentIdSchema = z.object({
  id: z.string().cuid("ID inválido"),
})

export type CreateVehicleRentInput = z.infer<typeof createVehicleRentSchema>
export type UpdateVehicleRentInput = z.infer<typeof updateVehicleRentSchema>
export type FinishRentInput = z.infer<typeof finishRentSchema>
export type VehicleRentIdInput = z.infer<typeof vehicleRentIdSchema>

