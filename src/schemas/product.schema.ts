import { z } from "zod"

export const createProductSchema = z.object({
    name: z.string().min(2, "O nome do produto é obrigatório."),
    description: z.string().min(1, "A descrição do produto é obrigatória."),
    code: z.string().optional(), // Código interno do produto (apenas para gestores)
    enterprise: z.enum(["Box", "Cristallux", "RHenz"]),
    imageUrl: z.array(z.string().url("URL inválida.")).min(1, "Adicione pelo menos uma imagem."),
    price: z.number().gt(0, "Valor não pode ser negativo ou igual a 0."),
    stock: z.number().int().min(0, "Estoque não pode ser negativo.").default(0),
    active: z.boolean().default(true),
})

export const updateProductSchema = z.object({
    id: z.string().cuid("ID inválido"),
    name: z.string().min(2, "O nome do produto é obrigatório.").optional(),
    description: z.string().min(1, "A descrição do produto é obrigatória.").optional(),
    code: z.string().optional(), // Código interno do produto (apenas para gestores)
    enterprise: z.enum(["Box", "Cristallux", "RHenz"]).optional(),
    imageUrl: z.array(z.string().url("URL inválida.")).optional(),
    price: z.number().gt(0, "Valor não pode ser negativo ou igual a 0.").optional(),
    stock: z.number().int().min(0, "Estoque não pode ser negativo.").optional(),
    active: z.boolean().optional(),
})

export const deleteProductSchema = z.object({
    id: z.string().cuid("ID inválido"),
})

