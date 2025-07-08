import { createOrderSchema, updateOrderStatusSchema } from "@/schemas/order.schema";
import { createTRPCRouter, protectedProcedure, shopManagerProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "@/lib/mail/email-utils";
import { type Product, type Enterprise } from "@prisma/client";

export const orderRouter = createTRPCRouter({
    create: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ input, ctx }) => {
        const { products, paymentMethod } = input;
        const userId = ctx.auth.userId;

        const user = await ctx.db.user.findUnique({ where: { id: userId } });
        if (!user?.email) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Usuário não encontrado ou sem email." });
        }
        
        const userEmail = user.email;
        const userName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

        const productIds = products.map(p => p.productId);
        const dbProducts = await ctx.db.product.findMany({
            where: { id: { in: productIds } }
        });

        if (dbProducts.length !== productIds.length) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Um ou mais produtos não foram encontrados." });
        }

        const productsById = new Map(dbProducts.map(p => [p.id, p]));

        const ordersByEnterprise = new Map<Enterprise, { product: Product, quantity: number }[]>();

        for (const cartProduct of products) {
            const product = productsById.get(cartProduct.productId);
            if (!product) continue;

            if (!ordersByEnterprise.has(product.enterprise)) {
                ordersByEnterprise.set(product.enterprise, []);
            }
            ordersByEnterprise.get(product.enterprise)?.push({ product, quantity: cartProduct.quantity });
        }

        const createdOrders = await ctx.db.$transaction(async (prisma) => {
            const allCreatedOrders = [];

            for (const [enterprise, enterpriseProducts] of ordersByEnterprise.entries()) {
                const enterpriseConfig = await prisma.enterpriseConfig.findUnique({
                    where: { enterprise }
                });

                if (!enterpriseConfig) {
                    throw new TRPCError({ code: "NOT_FOUND", message: `Configuração da empresa ${enterprise} não encontrada.` });
                }
                
                const totalPrice = enterpriseProducts.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);

                const order = await prisma.order.create({
                    data: {
                        userId,
                        totalPrice,
                        paymentMethod,
                        items: {
                            create: enterpriseProducts.map(({ product, quantity }) => ({
                                productId: product.id,
                                quantity,
                                price: product.price
                            }))
                        }
                    },
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        }
                    }
                });
                
                allCreatedOrders.push(order);

                const itemsListHtml = enterpriseProducts.map(({product, quantity}) => `<li>${product.name} (Quantidade: ${quantity})</li>`).join('');
                const paymentMethodText = paymentMethod === 'PIX' ? 'Pix' : 'Boleto para 28 dias';

                const userEmailHtml = `
                    <h1>Olá ${userName},</h1>
                    <p>Seu pedido para a empresa ${enterprise} foi realizado com sucesso!</p>
                    <h2>Detalhes do Pedido:</h2>
                    <ul>${itemsListHtml}</ul>
                    <p><b>Método de Pagamento:</b> ${paymentMethodText}</p>
                    <p><b>Preço Total:</b> ${totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                    <p>O Comercial entrará em contato para finalizar a compra.</p>
                `;
                await sendEmail(userEmail, `Confirmação de Pedido - ${enterprise}`, userEmailHtml);

                const enterpriseEmailHtml = `
                    <h1>Novo Pedido na Loja RHenz</h1>
                    <p>Um novo pedido foi realizado por ${userName} (${userEmail}).</p>
                    <h2>Detalhes do Pedido (${enterprise}):</h2>
                    <ul>${itemsListHtml}</ul>
                    <p><b>Método de Pagamento:</b> ${paymentMethodText}</p>
                    <p><b>Preço Total:</b> ${totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                `;
                await sendEmail(enterpriseConfig.shopNotificationEmail, `Novo Pedido de ${userName}`, enterpriseEmailHtml);
            }
            
            return allCreatedOrders;
        });


        return createdOrders;
    }),

    getAll: shopManagerProcedure
    .query(async ({ ctx }) => {
        return await ctx.db.order.findMany({
            include: {
                user: true,
                items: {
                    include: {
                        product: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    }),

    updateStatus: shopManagerProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ input, ctx }) => {
        const { orderId, status } = input;
        
        const updatedOrder = await ctx.db.order.update({
            where: { id: orderId },
            data: { status },
            include: {
                user: true,
            }
        });

        if (updatedOrder && updatedOrder.user.email) {
            const statusMap: Record<string, string> = {
                PENDING: "Pendente",
                PROCESSING: "Em Processamento",
                COMPLETED: "Enviado para separação",
                CANCELED: "Cancelado"
            }

            const emailHtml = `
                <h1>Olá ${updatedOrder.user.firstName},</h1>
                <p>O status do seu pedido #${updatedOrder.id.substring(0, 8)} foi atualizado.</p>
                <p>Novo status: <strong>${statusMap[status] ?? status}</strong></p>
                <p>Agradecemos a sua preferência!</p>
            `;

            await sendEmail(
                updatedOrder.user.email,
                `Atualização do Pedido - Status: ${statusMap[status] ?? status}`,
                emailHtml
            );
        }

        return updatedOrder;
    }),
}) 