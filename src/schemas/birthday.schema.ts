import { z } from "zod"

export const createBirthdaySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  data: z.date(),
  userId: z.string().optional(),
  imageUrl: z.string().optional(),
})

export const updateBirthdaySchema = createBirthdaySchema.extend({
  id: z.string(),
})

export type CreateBirthdayInput = z.infer<typeof createBirthdaySchema>
export type UpdateBirthdayInput = z.infer<typeof updateBirthdaySchema>
