import { z } from "zod"

export const createMenuItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  category: z.string().min(1, "Categoria é obrigatória"),
  available: z.boolean().default(true),
  restaurantId: z.string().min(1, "Restaurante é obrigatório"),
})

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  id: z.string(),
})

export const menuItemIdSchema = z.object({
  id: z.string(),
}) 