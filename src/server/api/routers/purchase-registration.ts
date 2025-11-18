import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { createPurchaseRegistrationSchema } from "@/schemas/product-order.schema"
import { Enterprise } from "@prisma/client"

export const purchaseRegistrationRouter = createTRPCRouter({
    // Verificar se usuário tem cadastro para compras em uma empresa
    checkRegistration: protectedProcedure
        .input(z.object({
            enterprise: z.nativeEnum(Enterprise)
        }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.auth.userId

            const registration = await ctx.db.purchaseRegistration.findUnique({
                where: {
                    userId_enterprise: {
                        userId,
                        enterprise: input.enterprise
                    }
                }
            })

            return {
                hasRegistration: !!registration,
                registration: registration ?? null
            }
        }),

    // Criar ou atualizar cadastro de compras
    createOrUpdate: protectedProcedure
        .input(createPurchaseRegistrationSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.auth.userId

            // Verificar se já existe cadastro
            const existing = await ctx.db.purchaseRegistration.findUnique({
                where: {
                    userId_enterprise: {
                        userId,
                        enterprise: input.enterprise as Enterprise
                    }
                }
            })

            if (existing) {
                // Atualizar cadastro existente
                return await ctx.db.purchaseRegistration.update({
                    where: { id: existing.id },
                    data: {
                        fullName: input.fullName,
                        phone: input.phone,
                        email: input.email,
                        address: input.address,
                        whatsapp: input.whatsapp ?? null,
                    }
                })
            } else {
                // Criar novo cadastro
                return await ctx.db.purchaseRegistration.create({
                    data: {
                        userId,
                        enterprise: input.enterprise as Enterprise,
                        fullName: input.fullName,
                        phone: input.phone,
                        email: input.email,
                        address: input.address,
                        whatsapp: input.whatsapp ?? null,
                    }
                })
            }
        }),

    // Obter cadastro do usuário para uma empresa
    getByEnterprise: protectedProcedure
        .input(z.object({
            enterprise: z.nativeEnum(Enterprise)
        }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.auth.userId

            return await ctx.db.purchaseRegistration.findUnique({
                where: {
                    userId_enterprise: {
                        userId,
                        enterprise: input.enterprise
                    }
                }
            })
        }),

    // Obter cadastro de um usuário específico para uma empresa (admin)
    getByUserIdAndEnterprise: protectedProcedure
        .input(z.object({
            userId: z.string().min(1, "ID de usuário é obrigatório"),
            enterprise: z.nativeEnum(Enterprise)
        }))
        .query(async ({ ctx, input }) => {
            // Verificar se é admin ou gestor
            const user = await ctx.db.user.findUnique({
                where: { id: ctx.auth.userId },
                select: { role_config: true }
            })

            const roleConfig = user?.role_config as { sudo?: boolean; permissions?: string[] } | null
            const isAdmin = roleConfig?.sudo === true || roleConfig?.permissions?.includes("admin_pages.view_dashboard") === true

            if (!isAdmin) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Apenas administradores podem visualizar cadastros de outros usuários"
                })
            }

            return await ctx.db.purchaseRegistration.findUnique({
                where: {
                    userId_enterprise: {
                        userId: input.userId,
                        enterprise: input.enterprise
                    }
                }
            })
        }),
})

