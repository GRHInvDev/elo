import { z } from "zod"

export const createProductSchema = z.object({
    name: z.string().min(2).catch("O nome do produto é obrigatório."),
    description: z.string().catch("a descrição do produto é obrigatória."),
    enterprise: z.enum(["Box", "Cristallux", "RHenz", "NA"]),
    imageUrl: z.array(z.string().url("Url inválida.")),
    price: z.number().gt(0, "Valor não pode ser negativo ou igual a 0."),
})

export const updateProductSchema = z.object({
    id: z.string().cuid("id inválido"),
    name: z.string().optional(),
    description: z.string().optional(),
    enterprise: z.enum(["Box", "Cristallux", "RHenz", "NA"]).optional(),
    imageUrl: z.array(z.string().url()).optional(),
    price: z.number().optional(),
})

