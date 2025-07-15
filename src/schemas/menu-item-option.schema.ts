import { z } from "zod"

export const createMenuItemOptionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  required: z.boolean().default(false),
  multiple: z.boolean().default(false),
  menuItemId: z.string().min(1, "Item do menu é obrigatório"),
})

export const updateMenuItemOptionSchema = createMenuItemOptionSchema.partial().extend({
  id: z.string(),
})

export const menuItemOptionIdSchema = z.object({
  id: z.string(),
}) 