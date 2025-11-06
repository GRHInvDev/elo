import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { 
    createProductOrderSchema, 
    updateProductOrderStatusSchema, 
    markProductOrderAsReadSchema 
} from "@/schemas/product-order.schema"
import type { RolesConfig } from "@/types/role-config"

export const productOrderRouter = createTRPCRouter({
    // Criar pedido (usuário)
    create: protectedProcedure
        .input(createProductOrderSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.auth.userId

            // Verificar se o produto existe e tem estoque
            const product = await ctx.db.product.findUnique({
                where: { id: input.productId }
            })

            if (!product) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Produto não encontrado"
                })
            }

            if (product.stock < input.quantity) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Estoque insuficiente. Disponível: ${product.stock} unidades`
                })
            }

            // Criar pedido e atualizar estoque em uma transação
            return await ctx.db.$transaction(async (tx) => {
                // Criar pedido
                const order = await tx.productOrder.create({
                    data: {
                        userId,
                        productId: input.productId,
                        quantity: input.quantity,
                        status: "SOLICITADO",
                        read: false,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                imageUrl: true,
                            }
                        },
                        product: true,
                    }
                })

                // Atualizar estoque do produto
                await tx.product.update({
                    where: { id: input.productId },
                    data: {
                        stock: {
                            decrement: input.quantity
                        }
                    }
                })

                return order
            })
        }),

    // Listar pedidos para gestor (Kanban)
    listKanban: protectedProcedure
        .query(async ({ ctx }) => {
            // Verificar se é gestor (sudo ou can_manage_produtos)
            const user = await ctx.db.user.findUnique({
                where: { id: ctx.auth.userId },
                select: { role_config: true }
            })

            const roleConfig = user?.role_config as RolesConfig | null
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            const isManager = !!(roleConfig?.sudo || roleConfig?.can_manage_produtos)

            if (!isManager) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Apenas gestores podem visualizar pedidos"
                })
            }

            return await ctx.db.productOrder.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            imageUrl: true,
                        }
                    },
                    product: true,
                },
                orderBy: {
                    createdAt: "desc"
                }
            })
        }),

    // Contar pedidos não lidos
    countUnread: protectedProcedure
        .query(async ({ ctx }) => {
            // Verificar se é gestor
            const user = await ctx.db.user.findUnique({
                where: { id: ctx.auth.userId },
                select: { role_config: true }
            })

            const roleConfig = user?.role_config as RolesConfig | null
            const isManager = !!roleConfig?.sudo || roleConfig?.can_manage_produtos

            if (!isManager) {
                return 0
            }

            return await ctx.db.productOrder.count({
                where: {
                    read: false
                }
            })
        }),

    // Atualizar status do pedido (gestor)
    updateStatus: protectedProcedure
        .input(updateProductOrderStatusSchema)
        .mutation(async ({ ctx, input }) => {
            // Verificar se é gestor
            const user = await ctx.db.user.findUnique({
                where: { id: ctx.auth.userId },
                select: { role_config: true }
            })

            const roleConfig = user?.role_config as RolesConfig | null
            const isManager = !!roleConfig?.sudo || roleConfig?.can_manage_produtos

            if (!isManager) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Apenas gestores podem atualizar status de pedidos"
                })
            }

            // Verificar se o pedido existe
            const order = await ctx.db.productOrder.findUnique({
                where: { id: input.id }
            })

            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Pedido não encontrado"
                })
            }

            return await ctx.db.productOrder.update({
                where: { id: input.id },
                data: {
                    status: input.status
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            imageUrl: true,
                        }
                    },
                    product: true,
                }
            })
        }),

    // Marcar pedido como lido (gestor)
    markAsRead: protectedProcedure
        .input(markProductOrderAsReadSchema)
        .mutation(async ({ ctx, input }) => {
            // Verificar se é gestor
            const user = await ctx.db.user.findUnique({
                where: { id: ctx.auth.userId },
                select: { role_config: true }
            })

            const roleConfig = user?.role_config as RolesConfig | null
            const isManager = !!roleConfig?.sudo || roleConfig?.can_manage_produtos

            if (!isManager) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Apenas gestores podem marcar pedidos como lidos"
                })
            }

            return await ctx.db.productOrder.update({
                where: { id: input.id },
                data: {
                    read: true,
                    readAt: new Date(),
                }
            })
        }),

    // Listar meus pedidos (usuário)
    listMyOrders: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.auth.userId

            return await ctx.db.productOrder.findMany({
                where: {
                    userId
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            price: true,
                            stock: true,
                            enterprise: true,
                            imageUrl: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    },
                },
                orderBy: {
                    createdAt: "desc"
                }
            })
        }),

    // Contar pedidos não lidos do usuário
    countMyUnread: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.auth.userId

            return await ctx.db.productOrder.count({
                where: {
                    userId,
                    read: false
                }
            })
        }),

    // Marcar meu pedido como lido (usuário)
    markMyOrderAsRead: protectedProcedure
        .input(markProductOrderAsReadSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.auth.userId

            // Verificar se o pedido pertence ao usuário
            const order = await ctx.db.productOrder.findUnique({
                where: { id: input.id },
                select: { userId: true }
            })

            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Pedido não encontrado"
                })
            }

            if (order.userId !== userId) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Você não tem permissão para marcar este pedido como lido"
                })
            }

            return await ctx.db.productOrder.update({
                where: { id: input.id },
                data: {
                    read: true,
                    readAt: new Date(),
                }
            })
        }),
})

