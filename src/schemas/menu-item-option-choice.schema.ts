import { z } from "zod"

export const createMenuItemOptionChoiceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  priceModifier: z.number().default(0),
  available: z.boolean().default(true),
  optionId: z.string().min(1, "Opção é obrigatória"),
})

export const updateMenuItemOptionChoiceSchema = createMenuItemOptionChoiceSchema.partial().extend({
  id: z.string(),
})

export const menuItemOptionChoiceIdSchema = z.object({
  id: z.string(),
}) 