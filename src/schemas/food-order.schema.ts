import { z } from "zod"

export const createFoodOrderSchema = z.object({
  restaurantId: z.string().min(1, "Restaurante é obrigatório"),
  menuItemId: z.string().min(1, "Item do menu é obrigatório"),
  orderDate: z.date(),
  observations: z.string().optional(),
  optionChoices: z.array(z.string()).optional(), // IDs das escolhas selecionadas
})

export const createManualFoodOrderSchema = createFoodOrderSchema.extend({
  userId: z.string().min(1, "Usuário é obrigatório"),
  status: z.enum(["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"]).optional(),
})

export const updateFoodOrderSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"]),
  observations: z.string().optional(),
})

export const foodOrderIdSchema = z.object({
  id: z.string(),
})

export const getOrdersByDateSchema = z.object({
  date: z.date(),
})

export const getOrdersByRestaurantSchema = z.object({
  restaurantId: z.string(),
  date: z.date().optional(),
}) 