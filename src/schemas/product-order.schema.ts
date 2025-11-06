import { z } from "zod"

export const createProductOrderSchema = z.object({
    productId: z.string().cuid("ID do produto inválido"),
    quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1").default(1),
})

export const updateProductOrderStatusSchema = z.object({
    id: z.string().cuid("ID inválido"),
    status: z.enum(["SOLICITADO", "EM_COMPRA", "EM_RETIRADA", "ENTREGUE"]),
})

export const markProductOrderAsReadSchema = z.object({
    id: z.string().cuid("ID inválido"),
})

