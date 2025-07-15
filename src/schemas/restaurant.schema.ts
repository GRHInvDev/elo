import { z } from "zod"

export const createRestaurantSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  city: z.string().min(1, "Cidade é obrigatória"),
  address: z.string().min(1, "Endereço é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
  active: z.boolean().default(true),
})

export const updateRestaurantSchema = createRestaurantSchema.partial().extend({
  id: z.string(),
})

export const restaurantIdSchema = z.object({
  id: z.string(),
}) 