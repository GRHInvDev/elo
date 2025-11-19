import { z } from "zod"

export const getProductOrderChatSchema = z.object({
  orderId: z.string().cuid("ID de pedido inválido"),
})

export const sendProductOrderChatMessageSchema = z.object({
  orderId: z.string().cuid("ID de pedido inválido"),
  message: z.string().min(1, "Mensagem obrigatória").max(2000, "Mensagem muito longa"),
  imageUrl: z.string().url().optional(),
})

export type GetProductOrderChatInput = z.infer<typeof getProductOrderChatSchema>
export type SendProductOrderChatMessageInput = z.infer<typeof sendProductOrderChatMessageSchema>