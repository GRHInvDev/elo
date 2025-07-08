import { z } from "zod";

export const createOrderSchema = z.object({
    products: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().min(1, "A quantidade deve ser de no mínimo 1"),
    })).min(1, "O carrinho não pode estar vazio"),
    paymentMethod: z.enum(["PIX", "BOLETO"]),
});

export const updateOrderStatusSchema = z.object({
    orderId: z.string(),
    status: z.string(),
}); 