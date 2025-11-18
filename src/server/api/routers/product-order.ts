import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { 
    createProductOrderSchema, 
    updateProductOrderStatusSchema, 
    markProductOrderAsReadSchema 
} from "@/schemas/product-order.schema"
import type { RolesConfig } from "@/types/role-config"
import { sendEmail } from "@/lib/mail/email-utils"
import { mockEmailPedidoProduto, mockEmailNotificacaoPedidoProduto } from "@/lib/mail/html-mock"

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
                let orderGroupId: string | null = null
                let purchaseRegistration: { createdAt: Date } | null = null

                // Tentar verificar/criar grupo de pedidos (pode não existir ainda)
                try {
                    const existingGroup = await tx.orderGroup.findFirst({
                        where: {
                            userId,
                            enterprise: product.enterprise,
                            status: {
                                in: ["SOLICITADO", "EM_ANDAMENTO"]
                            }
                        },
                        orderBy: {
                            createdAt: "desc"
                        }
                    })

                    // Se não existe grupo, criar um novo
                    if (!existingGroup) {
                        const newGroup = await tx.orderGroup.create({
                            data: {
                                userId,
                                enterprise: product.enterprise,
                                status: "SOLICITADO"
                            }
                        })
                        orderGroupId = newGroup.id
                    } else {
                        orderGroupId = existingGroup.id
                    }
                } catch (error) {
                    // Tabela order_groups pode não existir ainda, continuar sem grupo
                    console.warn('[ProductOrder] Tabela order_groups não encontrada, continuando sem grupo:', error)
                    orderGroupId = null
                }

                // Tentar verificar cadastro de compras (pode não existir ainda)
                try {
                    purchaseRegistration = await tx.purchaseRegistration.findUnique({
                        where: {
                            userId_enterprise: {
                                userId,
                                enterprise: product.enterprise
                            }
                        }
                    })
                } catch (error) {
                    // Tabela purchase_registrations pode não existir ainda
                    console.warn('[ProductOrder] Tabela purchase_registrations não encontrada:', error)
                    purchaseRegistration = null
                }

                // Criar pedido vinculado ao grupo
                const order = await tx.productOrder.create({
                    data: {
                        userId,
                        productId: input.productId,
                        orderGroupId,
                        quantity: input.quantity,
                        paymentMethod: input.paymentMethod ?? null,
                        status: "SOLICITADO",
                        read: false,
                        orderTimestamp: new Date(),
                        purchaseRegistrationTimestamp: purchaseRegistration ? purchaseRegistration.createdAt : null,
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
                        orderGroup: true,
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
            }).then(async (order) => {
                // Enviar emails após a criação do pedido (fora da transação)
                try {
                    const userName = order.user.firstName && order.user.lastName
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : (order.user.firstName ?? order.user.email ?? "Usuário")
                    
                    const userEmail = order.user.email
                    const dataPedido = new Date().toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })

                    const precoTotal = order.product.price * order.quantity

                    // Email para o usuário
                    if (userEmail) {
                        const emailContentUsuario = mockEmailPedidoProduto(
                            userName,
                            order.product.name,
                            order.quantity,
                            order.product.price,
                            precoTotal,
                            order.product.enterprise,
                            dataPedido
                        )

                        await sendEmail(
                            userEmail,
                            `Pedido Recebido - ${order.product.name}`,
                            emailContentUsuario
                        ).catch((error) => {
                            console.error('[ProductOrder] Erro ao enviar email para usuário:', error)
                        })
                    }

                    // Buscar email de notificação (configurado ou responsáveis pela empresa)
                    const notificationEmails: string[] = []

                    // Buscar email configurado globalmente
                    const globalConfig = await ctx.db.globalConfig.findFirst({
                        where: { id: "default" }
                    })
                    
                    if (globalConfig?.shopNotificationEmail) {
                        notificationEmails.push(globalConfig.shopNotificationEmail)
                    }

                    // Buscar emails dos responsáveis pela empresa
                    const enterpriseManagers = await ctx.db.enterpriseManager.findMany({
                        where: { enterprise: order.product.enterprise },
                        include: {
                            user: {
                                select: {
                                    email: true
                                }
                            }
                        }
                    })

                    enterpriseManagers.forEach(manager => {
                        if (manager.user?.email && !notificationEmails.includes(manager.user.email)) {
                            notificationEmails.push(manager.user.email)
                        }
                    })

                    // Enviar email de notificação para responsáveis
                    if (notificationEmails.length > 0) {
                        const emailContentNotificacao = mockEmailNotificacaoPedidoProduto(
                            userName,
                            userEmail ?? "N/A",
                            order.product.name,
                            order.quantity,
                            precoTotal,
                            order.product.enterprise,
                            dataPedido
                        )

                        // Enviar para todos os emails de notificação
                        for (const email of notificationEmails) {
                            await sendEmail(
                                email,
                                `Novo Pedido - ${order.product.name} (${order.product.enterprise})`,
                                emailContentNotificacao
                            ).catch((error) => {
                                console.error(`[ProductOrder] Erro ao enviar email de notificação para ${email}:`, error)
                            })
                        }
                    }
                } catch (error) {
                    // Não falhar a criação do pedido se o email falhar
                    console.error('[ProductOrder] Erro ao processar envio de emails:', error)
                }

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

            // Buscar empresas das quais o usuário é responsável
            const enterpriseManagers = await ctx.db.enterpriseManager.findMany({
                where: { userId: ctx.auth.userId },
                select: { enterprise: true }
            })
            const managedEnterprises = enterpriseManagers.map(em => em.enterprise)

            // Se não é gestor nem responsável por nenhuma empresa, negar acesso
            if (!isManager && managedEnterprises.length === 0) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Apenas gestores ou responsáveis por empresas podem visualizar pedidos"
                })
            }

            // Se é gestor, retornar todos os pedidos
            // Se é apenas responsável, retornar apenas pedidos das empresas que gerencia
            return await ctx.db.productOrder.findMany({
                where: isManager ? undefined : {
                    product: {
                        enterprise: {
                            in: managedEnterprises
                        }
                    }
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
                    orderGroup: true,
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

            // Buscar empresas das quais o usuário é responsável
            const enterpriseManagers = await ctx.db.enterpriseManager.findMany({
                where: { userId: ctx.auth.userId },
                select: { enterprise: true }
            })
            const managedEnterprises = enterpriseManagers.map(em => em.enterprise)

            if (!isManager && managedEnterprises.length === 0) {
                return 0
            }

            return await ctx.db.productOrder.count({
                where: {
                    read: false,
                    ...(isManager ? {} : {
                        product: {
                            enterprise: {
                                in: managedEnterprises
                            }
                        }
                    })
                }
            })
        }),

    // Atualizar status do pedido (gestor ou responsável)
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

            // Buscar empresas das quais o usuário é responsável
            const enterpriseManagers = await ctx.db.enterpriseManager.findMany({
                where: { userId: ctx.auth.userId },
                select: { enterprise: true }
            })
            const managedEnterprises = enterpriseManagers.map(em => em.enterprise)

            // Verificar se o pedido existe e buscar produto
            const order = await ctx.db.productOrder.findUnique({
                where: { id: input.id },
                include: {
                    product: {
                        select: {
                            enterprise: true
                        }
                    }
                }
            })

            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Pedido não encontrado"
                })
            }

            // Verificar permissão: gestor ou responsável pela empresa do pedido
            if (!isManager && !managedEnterprises.includes(order.product.enterprise)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Você não tem permissão para atualizar este pedido"
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

    // Marcar pedido como lido (gestor ou responsável)
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

            // Buscar empresas das quais o usuário é responsável
            const enterpriseManagers = await ctx.db.enterpriseManager.findMany({
                where: { userId: ctx.auth.userId },
                select: { enterprise: true }
            })
            const managedEnterprises = enterpriseManagers.map(em => em.enterprise)

            // Verificar se o pedido existe e buscar produto
            const order = await ctx.db.productOrder.findUnique({
                where: { id: input.id },
                include: {
                    product: {
                        select: {
                            enterprise: true
                        }
                    }
                }
            })

            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Pedido não encontrado"
                })
            }

            // Verificar permissão: gestor ou responsável pela empresa do pedido
            if (!isManager && !managedEnterprises.includes(order.product.enterprise)) {
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

    // Listar grupos de pedidos pendentes do usuário
    listMyPendingGroups: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.auth.userId

            try {
                return await ctx.db.orderGroup.findMany({
                    where: {
                        userId,
                        status: {
                            in: ["SOLICITADO", "EM_ANDAMENTO"]
                        }
                    },
                    include: {
                        orders: {
                            include: {
                                product: {
                                    select: {
                                        enterprise: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "desc"
                    }
                })
            } catch (error) {
                // Tabela order_groups pode não existir ainda
                console.warn('[ProductOrder] Tabela order_groups não encontrada em listMyPendingGroups:', error)
                return []
            }
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
                    orderGroup: true,
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

