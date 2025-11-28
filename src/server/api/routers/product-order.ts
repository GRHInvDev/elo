import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import {
    createProductOrderSchema,
    createMultipleProductOrdersSchema,
    updateProductOrderStatusSchema,
    markProductOrderAsReadSchema
} from "@/schemas/product-order.schema"
import type { RolesConfig } from "@/types/role-config"
import { sendEmail } from "@/lib/mail/email-utils"
import { mockEmailPedidoProduto, mockEmailNotificacaoPedidoProduto, mockEmailChatMensagemPedido } from "@/lib/mail/html-mock"
import { getProductOrderChatSchema, sendProductOrderChatMessageSchema } from "@/schemas/product-order-chat.schema"

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
                                enterprise: true,
                            }
                        },
                        product: true,
                        orderGroup: {
                            include: {
                                orders: {
                                    include: {
                                        product: true
                                    }
                                }
                            }
                        },
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
                        // Adicionar email de usuário interno se existir
                        if (manager.user?.email) {
                            const userEmail = manager.user.email
                            if (!notificationEmails.includes(userEmail)) {
                                notificationEmails.push(userEmail)
                            }
                        }
                        // Adicionar email externo se existir
                        if (manager.externalEmail) {
                            const externalEmail = manager.externalEmail
                            if (!notificationEmails.includes(externalEmail)) {
                                notificationEmails.push(externalEmail)
                            }
                        }
                    })

                    // Enviar email de notificação para responsáveis
                    if (notificationEmails.length > 0) {
                        // Buscar todos os pedidos do grupo se existir
                        let orderItems: Array<{ nome: string; quantidade: number; precoUnitario: number; subtotal: number }> = []
                        
                        if (order.orderGroupId && order.orderGroup?.orders) {
                            // Pedido agrupado - incluir todos os itens
                            orderItems = order.orderGroup.orders.map(o => ({
                                nome: o.product.name,
                                quantidade: o.quantity,
                                precoUnitario: o.product.price,
                                subtotal: o.product.price * o.quantity
                            }))
                        } else {
                            // Pedido único
                            orderItems = [{
                                nome: order.product.name,
                                quantidade: order.quantity,
                                precoUnitario: order.product.price,
                                subtotal: precoTotal
                            }]
                        }

                        const emailContentNotificacao = mockEmailNotificacaoPedidoProduto(
                            userName,
                            userEmail ?? "N/A",
                            order.product.name,
                            order.quantity,
                            precoTotal,
                            order.user.enterprise ?? "N/A",
                            dataPedido,
                            input.contactWhatsapp,
                            orderItems
                        )

                        // Enviar para todos os emails de notificação
                        for (const email of notificationEmails) {
                            await sendEmail(
                                email,
                                `Novo Pedido - ${order.product.name} (${order.user.enterprise ?? "N/A"})`,
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

    // Criar múltiplos pedidos (carrinho)
    createMultiple: protectedProcedure
        .input(createMultipleProductOrdersSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.auth.userId

            // Validar se todos os produtos existem e têm estoque suficiente
            const productIds = input.orders.map(order => order.productId)
            const products = await ctx.db.product.findMany({
                where: { id: { in: productIds } }
            })

            if (products.length !== productIds.length) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Um ou mais produtos não foram encontrados"
                })
            }

            // Verificar se todos os produtos são da mesma empresa
            const enterprises = [...new Set(products.map(p => p.enterprise))]
            if (enterprises.length === 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Nenhum produto encontrado"
                })
            }
            if (enterprises.length > 1) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Todos os produtos devem ser da mesma empresa"
                })
            }

            const enterprise = enterprises[0]!

            // Verificar estoque para cada produto
            const productMap = new Map(products.map(p => [p.id, p]))
            for (const order of input.orders) {
                const product = productMap.get(order.productId)
                if (!product || product.stock < order.quantity) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Estoque insuficiente para ${product?.name}. Disponível: ${product?.stock} unidades`
                    })
                }
            }

            // Criar pedidos e atualizar estoque em uma transação
            return await ctx.db.$transaction(async (tx) => {
                let orderGroupId: string | null = null
                let purchaseRegistration: { createdAt: Date } | null = null

                // Criar novo grupo de pedidos para este carrinho
                try {
                    const newGroup = await tx.orderGroup.create({
                        data: {
                            userId,
                            enterprise,
                            status: "SOLICITADO"
                        }
                    })
                    orderGroupId = newGroup.id
                } catch (error) {
                    // Tabela order_groups pode não existir ainda
                    console.warn('[ProductOrder] Tabela order_groups não encontrada, continuando sem grupo:', error)
                    orderGroupId = null
                }

                // Tentar verificar cadastro de compras
                try {
                    purchaseRegistration = await tx.purchaseRegistration.findUnique({
                        where: {
                            userId_enterprise: {
                                userId,
                                enterprise
                            }
                        }
                    })
                } catch (error) {
                    // Tabela purchase_registrations pode não existir ainda
                    console.warn('[ProductOrder] Tabela purchase_registrations não encontrada:', error)
                    purchaseRegistration = null
                }

                // Criar todos os pedidos
                const createdOrders = []
                for (const orderInput of input.orders) {
                    const order = await tx.productOrder.create({
                        data: {
                            userId,
                            productId: orderInput.productId,
                            orderGroupId,
                            quantity: orderInput.quantity,
                            paymentMethod: input.paymentMethod,
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
                                    enterprise: true,
                                }
                            },
                            product: true,
                            orderGroup: true,
                        }
                    })
                    createdOrders.push(order)

                    // Atualizar estoque do produto
                    await tx.product.update({
                        where: { id: orderInput.productId },
                        data: {
                            stock: {
                                decrement: orderInput.quantity
                            }
                        }
                    })
                }

                return createdOrders
            }).then(async (orders) => {
                // Enviar emails após a criação dos pedidos (fora da transação)
                try {
                    if (orders.length > 0) {
                        const firstOrder = orders[0]
                        const userName = firstOrder?.user.firstName && firstOrder?.user.lastName
                            ? `${firstOrder.user.firstName} ${firstOrder.user.lastName}`
                            : (firstOrder?.user.firstName ?? firstOrder?.user.email ?? "Usuário")

                        const userEmail = firstOrder?.user.email
                        const dataPedido = new Date().toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })

                        // Calcular total de todos os pedidos
                        const totalGeral = orders.reduce((total, order) => {
                            return total + (order.product.price * order.quantity)
                        }, 0)

                        // Enviar email para o usuário
                        const emailContent = mockEmailPedidoProduto(
                            userName,
                            orders.map(order => `${order.product.name} (${order.quantity}x)`).join(', '),
                            orders.reduce((total, order) => total + order.quantity, 0), // quantidade total
                            0, // precoUnitario não usado para múltiplos produtos
                            totalGeral,
                            enterprise,
                            dataPedido
                        )

                        await sendEmail(
                            userEmail ?? "",
                            `Pedido Recebido - ${orders.length} ${orders.length === 1 ? 'produto' : 'produtos'} (${enterprise})`,
                            emailContent
                        ).catch((error) => {
                            console.error(`[ProductOrder] Erro ao enviar email para usuário:`, error)
                        })

                        // Enviar notificações para gestores
                        const notificationEmails: string[] = []

                        // Buscar gestores da empresa através da tabela enterpriseManager
                        const enterpriseManagers = await ctx.db.enterpriseManager.findMany({
                            where: {
                                enterprise: enterprise,
                            },
                            include: {
                                user: {
                                    select: {
                                        email: true
                                    }
                                }
                            }
                        })

                        enterpriseManagers.forEach((manager) => {
                            // Adicionar email do usuário se existir
                            if (manager.user?.email) {
                                const userEmail = manager.user.email
                                if (!notificationEmails.includes(userEmail)) {
                                    notificationEmails.push(userEmail)
                                }
                            }
                            // Adicionar email externo se existir
                            if (manager.externalEmail) {
                                const externalEmail = manager.externalEmail
                                if (!notificationEmails.includes(externalEmail)) {
                                    notificationEmails.push(externalEmail)
                                }
                            }
                        })

                        // Enviar email de notificação para responsáveis
                        if (notificationEmails.length > 0) {
                            // Usar a empresa do colaborador (primeiro pedido) em vez da empresa do produto
                            const userEnterprise = firstOrder?.user.enterprise ?? enterprise
                            
                            // Preparar lista de itens com quantidade e preço individuais
                            const orderItems = orders.map(order => ({
                                nome: order.product.name,
                                quantidade: order.quantity,
                                precoUnitario: order.product.price,
                                subtotal: order.product.price * order.quantity
                            }))

                            const emailContentNotificacao = mockEmailNotificacaoPedidoProduto(
                                userName,
                                userEmail ?? "N/A",
                                orders.map(order => `${order.product.name} (${order.quantity}x)`).join(', '),
                                1, // quantidade total (não usada no template)
                                totalGeral,
                                userEnterprise,
                                dataPedido,
                                input.contactWhatsapp,
                                orderItems
                            )

                            // Enviar para todos os emails de notificação
                            for (const email of notificationEmails) {
                                await sendEmail(
                                    email,
                                    `Novo Pedido - ${orders.length} ${orders.length === 1 ? 'produto' : 'produtos'} (${userEnterprise})`,
                                    emailContentNotificacao
                                ).catch((error) => {
                                    console.error(`[ProductOrder] Erro ao enviar email de notificação para ${email}:`, error)
                                })
                            }
                        }
                    }
                } catch (error) {
                    // Não falhar a criação do pedido se o email falhar
                    console.error('[ProductOrder] Erro ao processar envio de emails:', error)
                }

                return orders
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
                    orderGroup: {
                        include: {
                            orders: {
                                include: {
                                    product: true
                                }
                            }
                        }
                    },
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
                    orderGroup: {
                        include: {
                            orders: {
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
                                    }
                                }
                            }
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

    // Chat: listar mensagens de um pedido (usuário, gestor ou responsável)
    getChat: protectedProcedure
        .input(getProductOrderChatSchema)
        .query(async ({ ctx, input }) => {
            const currentUserId = ctx.auth.userId

            // Buscar pedido e empresa
            const order = await ctx.db.productOrder.findUnique({
                where: { id: input.orderId },
                include: {
                    product: { select: { enterprise: true, name: true } },
                    user: { select: { id: true } },
                },
            })

            if (!order) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" })
            }

            // Carregar role_config do usuário
            const user = await ctx.db.user.findUnique({
                where: { id: currentUserId },
                select: { role_config: true },
            })
            const roleConfig = user?.role_config as RolesConfig | null
            const isManager = (roleConfig?.sudo === true) || (roleConfig?.can_manage_produtos === true)

            // Empresas gerenciadas
            const enterpriseManagers = await ctx.db.enterpriseManager.findMany({
                where: { userId: currentUserId },
                select: { enterprise: true },
            })
            const managedEnterprises = enterpriseManagers.map((em) => em.enterprise)

            const canAccess =
                order.userId === currentUserId ||
                isManager ||
                managedEnterprises.includes(order.product.enterprise)

            if (!canAccess) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para visualizar este chat" })
            }

            // @ts-expect-error - Tabela shopChat pode não existir durante desenvolvimento
            const shopChatClient = ctx.db.shopChat as {
              findMany: (args: {
                where: { productOrderId: string }
                include: {
                  user: {
                    select: {
                      id: true
                      firstName: true
                      lastName: true
                      email: true
                      imageUrl: true
                    }
                  }
                }
                orderBy: { createdAt: "asc" }
              }) => Promise<Array<{
                id: string
                message: string
                imageUrl: string | null
                createdAt: Date
                updatedAt: Date
                user: {
                  id: string
                  firstName: string | null
                  lastName: string | null
                  email: string | null
                  imageUrl: string | null
                }
              }>>
            }
            return await shopChatClient.findMany({
                where: { productOrderId: input.orderId },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            imageUrl: true,
                        },
                    },
                },
                orderBy: { createdAt: "asc" },
            })
        }),

    // Chat: enviar mensagem (usuário, gestor ou responsável)
    sendChatMessage: protectedProcedure
        .input(sendProductOrderChatMessageSchema)
        .mutation(async ({ ctx, input }) => {
            const currentUserId = ctx.auth.userId
            type ShopChatCreateReturn = {
              id: string
              message: string
              imageUrl: string | null
              createdAt: Date
              updatedAt: Date
              user: {
                id: string
                firstName: string | null
                lastName: string | null
                email: string | null
                imageUrl: string | null
              }
            }

            // Buscar pedido e empresa com informações completas
            const order = await ctx.db.productOrder.findUnique({
                where: { id: input.orderId },
                include: {
                    product: { 
                        select: { 
                            enterprise: true,
                            name: true
                        } 
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        }
                    }
                },
            })

            if (!order) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" })
            }

            // Carregar role_config do usuário
            const user = await ctx.db.user.findUnique({
                where: { id: currentUserId },
                select: { role_config: true },
            })
            const roleConfig = user?.role_config as RolesConfig | null
            const isManager = (roleConfig?.sudo === true) || (roleConfig?.can_manage_produtos === true)

            // Empresas gerenciadas
            const enterpriseManagers = await ctx.db.enterpriseManager.findMany({
                where: { userId: currentUserId },
                select: { enterprise: true },
            })
            const managedEnterprises = enterpriseManagers.map((em) => em.enterprise)

            const canAccess =
                order.userId === currentUserId ||
                isManager ||
                managedEnterprises.includes(order.product.enterprise)

            if (!canAccess) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para enviar mensagens neste chat" })
            }

            // @ts-expect-error - Tabela shopChat pode não existir durante desenvolvimento
            const shopChatClient = ctx.db.shopChat as {
              create: (args: {
                data: {
                  productOrderId: string
                  userId: string
                  message: string
                  imageUrl?: string
                }
                include: {
                  user: {
                    select: {
                      id: true
                      firstName: true
                      lastName: true
                      email: true
                      imageUrl: true
                    }
                  }
                }
              }) => Promise<ShopChatCreateReturn>
            }
            const newMessage = await shopChatClient.create({
                data: {
                    productOrderId: input.orderId,
                    userId: currentUserId,
                    message: input.message,
                    imageUrl: input.imageUrl,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            imageUrl: true,
                        },
                    },
                },
            })

            // Preparar informações do remetente
            const remetenteNome = newMessage.user.firstName && newMessage.user.lastName
                ? `${newMessage.user.firstName} ${newMessage.user.lastName}`
                : (newMessage.user.firstName ?? newMessage.user.email ?? "Usuário")

            // Criar notificações e enviar emails para a outra parte (comprador ou responsáveis)
            try {
              const now = new Date()
              if (order.userId === currentUserId) {
                // Remetente é o comprador: notificar responsáveis internos pela empresa
                const managers = await ctx.db.enterpriseManager.findMany({
                  where: { enterprise: order.product.enterprise, userId: { not: null } },
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      }
                    }
                  }
                })
                const recipientUserIds = managers.map(m => m.userId!).filter(Boolean)
                if (recipientUserIds.length > 0) {
                  await ctx.db.notification.createMany({
                    data: recipientUserIds.map(userId => ({
                      title: "Nova mensagem no pedido",
                      message: "Você recebeu uma mensagem no chat do pedido",
                      type: "CHAT_MESSAGE",
                      channel: "IN_APP",
                      userId,
                      entityId: input.orderId,
                      entityType: "product_order_chat",
                      actionUrl: "/admin/products",
                      createdAt: now,
                      updatedAt: now,
                    }))
                  })

                  // Enviar emails para os gestores
                  for (const manager of managers) {
                    if (manager.user?.email) {
                      const destinatarioNome = manager.user.firstName && manager.user.lastName
                        ? `${manager.user.firstName} ${manager.user.lastName}`
                        : (manager.user.firstName ?? manager.user.email ?? "Gestor")

                      const emailContent = mockEmailChatMensagemPedido(
                        destinatarioNome,
                        remetenteNome,
                        input.message,
                        input.orderId,
                        order.product.name,
                        false // Não é comprador, é gestor
                      )

                      await sendEmail(
                        manager.user.email,
                        "Elo | Intranet - Você tem uma nova mensagem em Pedidos",
                        emailContent
                      ).catch((error) => {
                        console.error(`[ProductOrder] Erro ao enviar email de chat para ${manager.user?.email}:`, error)
                      })
                    }
                  }
                }
              } else {
                // Remetente é admin/gestor/responsável: notificar comprador
                await ctx.db.notification.create({
                  data: {
                    title: "Nova mensagem no seu pedido",
                    message: "Você recebeu uma mensagem no chat do seu pedido",
                    type: "CHAT_MESSAGE",
                    channel: "IN_APP",
                    userId: order.userId,
                    entityId: input.orderId,
                    entityType: "product_order_chat",
                    actionUrl: "/shop",
                  }
                })

                // Enviar email para o comprador
                if (order.user.email) {
                  const destinatarioNome = order.user.firstName && order.user.lastName
                    ? `${order.user.firstName} ${order.user.lastName}`
                    : (order.user.firstName ?? order.user.email ?? "Cliente")

                  const emailContent = mockEmailChatMensagemPedido(
                    destinatarioNome,
                    remetenteNome,
                    input.message,
                    input.orderId,
                    order.product.name,
                    true // É comprador
                  )

                  await sendEmail(
                    order.user.email,
                    "Elo | Intranet - Você tem uma nova mensagem em Pedidos",
                    emailContent
                  ).catch((error) => {
                    console.error(`[ProductOrder] Erro ao enviar email de chat para ${order.user.email}:`, error)
                  })
                }
              }
            } catch (notificationError) {
              console.error("[ProductOrder] Erro ao criar notificação de chat:", notificationError)
            }

            return newMessage
        }),
    
    // Marcar notificações de chat do pedido como lidas para o usuário atual
    markChatNotificationsAsRead: protectedProcedure
        .input(getProductOrderChatSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.auth.userId
            await ctx.db.notification.updateMany({
                where: {
                    userId,
                    entityType: "product_order_chat",
                    entityId: input.orderId,
                    isRead: false,
                },
                data: { isRead: true }
            })
            return { success: true }
        }),
})

