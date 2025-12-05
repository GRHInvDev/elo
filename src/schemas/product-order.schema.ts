import { z } from "zod"
import { Enterprise } from "@prisma/client"

export const createProductOrderSchema = z.object({
    productId: z.string().cuid("ID do produto inválido"),
    quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1").default(1),
    paymentMethod: z.enum(["BOLETO", "PIX"], {
        errorMap: () => ({ message: "Forma de pagamento deve ser BOLETO ou PIX" })
    }).optional(),
    contactWhatsapp: z.string().min(8, "Informe um WhatsApp válido").optional(),
})

export const createMultipleProductOrdersSchema = z.object({
    orders: z.array(z.object({
        productId: z.string().cuid("ID do produto inválido"),
        quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
    })),
    paymentMethod: z.enum(["BOLETO", "PIX"], {
        errorMap: () => ({ message: "Forma de pagamento deve ser BOLETO ou PIX" })
    }),
    contactWhatsapp: z.string().min(8, "Informe um WhatsApp válido"),
})

export const createPurchaseRegistrationSchema = z.object({
    enterprise: z.nativeEnum(Enterprise),
    fullName: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
    phone: z.string().min(10, "Telefone inválido"),
    email: z.string().email("Email inválido"),
    address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
    whatsapp: z.string().optional(),
})

export const updateProductOrderStatusSchema = z.object({
    id: z.string().cuid("ID inválido"),
    status: z.enum(["SOLICITADO", "EM_ANDAMENTO", "PEDIDO_PROCESSADO"]),
})

export const markProductOrderAsReadSchema = z.object({
    id: z.string().cuid("ID inválido"),
})

export const deleteProductOrderSchema = z.object({
    id: z.string().cuid("ID inválido"),
})

