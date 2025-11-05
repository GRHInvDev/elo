import { z } from "zod"

export const createVehicleRentSchema = z.object({
  vehicleId: z.string().cuid("ID do veículo inválido"),
  startDate: z.date().optional(),
  possibleEnd: z.date(),
  driver: z.string(),
  passangers: z.string().optional(),
  destiny: z.string(),
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

export const editVehicleRentSchema = z.object({
  id: z.string().cuid("ID inválido"),
  startDate: z.date().optional(),
  possibleEnd: z.date(),
  driver: z.string(),
  passangers: z.string().optional(),
  destiny: z.string(),
})

export const finishRentSchema = z.object({
  id: z.string().cuid("ID inválido"),
  finalKm: z.number(),
  observations: z.object({
    gasLevel: z.enum(["Reserva", "1/4","1/2", "3/4", "Cheio"]),
    needCleaning: z.boolean(),
    considerations: z.string().optional()
  }),
  endLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
})

export const vehicleRentIdSchema = z.object({
  id: z.string().cuid("ID inválido"),
})

export type CreateVehicleRentInput = z.infer<typeof createVehicleRentSchema>
export type UpdateVehicleRentInput = z.infer<typeof updateVehicleRentSchema>
export type EditVehicleRentInput = z.infer<typeof editVehicleRentSchema>
export type FinishRentInput = z.infer<typeof finishRentSchema>
export type VehicleRentIdInput = z.infer<typeof vehicleRentIdSchema>

