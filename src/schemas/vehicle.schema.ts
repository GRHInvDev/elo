import { z } from "zod"

export const EnterpriseEnum = z.enum(["NA", "Box", "RHenz", "Cristallux"])

export const createVehicleSchema = z.object({
  model: z.string().min(1, "Modelo é obrigatório"),
  plate: z.string().min(1, "Placa é obrigatória"),
  imageUrl: z.string().url("URL da imagem inválida"),
  enterprise: EnterpriseEnum,
  kilometers: z.number().or(z.string().regex(/^\d+$/).transform(Number)),
  availble: z.boolean().optional().default(true),
})

export const updateVehicleSchema = createVehicleSchema.partial()

export const vehicleIdSchema = z.object({
  id: z.string().cuid("ID inválido"),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type VehicleIdInput = z.infer<typeof vehicleIdSchema>

