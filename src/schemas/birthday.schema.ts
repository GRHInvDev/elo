import { z } from "zod"

/**
 * - Aceita apenas strings no formato YYYY-MM-DD do input type="date"
 * - Valida o formato correto da data
 * - Evita problemas de timezone com Date objects
 */
export const createBirthdaySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  data: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
    .refine((dateStr) => {
      // Validar se é uma data válida
      const [year, month, day] = dateStr.split('-').map(Number)
      
      // Verificar limites básicos
      if (month! < 1 || month! > 12) return false
      if (day! < 1 || day! > 31) return false
      
      // Verificar se a data é válida (ex: 31 de fevereiro não existe)
      const date = new Date(Date.UTC(year!, month! - 1, day!))
      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month! - 1 &&
        date.getUTCDate() === day
      )
    }, "Data inválida"),
  userId: z.string().optional(),
  imageUrl: z.string().optional(),
})

export const updateBirthdaySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório").optional(),
  data: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
    .refine((dateStr) => {
      const [year, month, day] = dateStr.split('-').map(Number)
      
      if (month! < 1 || month! > 12) return false
      if (day! < 1 || day! > 31) return false
      
      const date = new Date(Date.UTC(year!, month! - 1, day!))
      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month! - 1 &&
        date.getUTCDate() === day
      )
    }, "Data inválida")
    .optional(),
  userId: z.string().optional(),
  imageUrl: z.string().optional(),
})

export type CreateBirthdayInput = z.infer<typeof createBirthdaySchema>
export type UpdateBirthdayInput = z.infer<typeof updateBirthdaySchema>