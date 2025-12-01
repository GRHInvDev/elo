import { z } from "zod"
import { createProductSchema, updateProductSchema, deleteProductSchema } from "@/schemas/product.schema"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { TRPCError } from "@trpc/server"

export const productRouter = createTRPCRouter({
    create: protectedProcedure
        .input(createProductSchema)
        .mutation(async ({ input, ctx }) => {
            return await ctx.db.product.create({
                data: {
                    name: input.name,
                    description: input.description,
                    code: input.code ?? null,
                    enterprise: input.enterprise,
                    imageUrl: input.imageUrl,
                    price: input.price,
                    stock: input.stock,
                    active: input.active,
                }
            })
        }),

    update: protectedProcedure
        .input(updateProductSchema)
        .mutation(async ({ input, ctx }) => {
            const { id, ...data } = input

            // Remover campos undefined
            const updateData: {
                name?: string
                description?: string
                code?: string | null
                enterprise?: "Box" | "Cristallux" | "RHenz"
                imageUrl?: string[]
                price?: number
                stock?: number
                active?: boolean
            } = {}

            if (data.name !== undefined) updateData.name = data.name
            if (data.description !== undefined) updateData.description = data.description
            if (data.code !== undefined) updateData.code = data.code ?? null
            if (data.enterprise !== undefined) updateData.enterprise = data.enterprise
            if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
            if (data.price !== undefined) updateData.price = data.price
            if (data.stock !== undefined) updateData.stock = data.stock
            if (data.active !== undefined) updateData.active = data.active

            return await ctx.db.product.update({
                where: { id },
                data: updateData
            })
        }),

    delete: protectedProcedure
        .input(deleteProductSchema)
        .mutation(async ({ input, ctx }) => {
            // Verificar se o produto existe
            const product = await ctx.db.product.findUnique({
                where: { id: input.id }
            })

            if (!product) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Produto não encontrado"
                })
            }

            return await ctx.db.product.delete({
                where: { id: input.id }
            })
        }),

    getAll: protectedProcedure
        .query(async ({ ctx }) => {
            // Retornar apenas produtos ativos para usuários finais, ordenados alfabeticamente por nome
            return await ctx.db.product.findMany({
                where: {
                    active: true
                },
                orderBy: {
                    name: "asc"
                }
            })
        }),

    getAllForAdmin: protectedProcedure
        .query(async ({ ctx }) => {
            // Buscar usuário para verificar permissões
            const user = await ctx.db.user.findUnique({
                where: { id: ctx.auth.userId },
                select: {
                    id: true,
                    role_config: true,
                }
            })

            if (!user) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não encontrado" })
            }

            const roleConfig = user.role_config as { sudo?: boolean; can_manage_produtos?: boolean; admin_pages?: string[] } | null
            
            // Verificar se é gestor (sudo, can_manage_produtos ou tem acesso a /admin/products)
            const isManager = 
                roleConfig?.sudo === true ||
                roleConfig?.can_manage_produtos === true ||
                (Array.isArray(roleConfig?.admin_pages) && roleConfig.admin_pages.includes("/admin/products"))

            if (!isManager) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "Você não tem permissão para visualizar todos os produtos" 
                })
            }

            // Retornar todos os produtos (ativos e inativos) para gestores
            return await ctx.db.product.findMany({
                orderBy: {
                    createdAt: "desc"
                }
            })
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .query(async ({ input, ctx }) => {
            const product = await ctx.db.product.findUnique({
                where: { id: input.id }
            })

            if (!product) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Produto não encontrado"
                })
            }

            return product
        }),

    toggleActive: protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(async ({ input, ctx }) => {
            // Buscar usuário para verificar permissões
            const user = await ctx.db.user.findUnique({
                where: { id: ctx.auth.userId },
                select: {
                    id: true,
                    role_config: true,
                }
            })

            if (!user) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não encontrado" })
            }

            const roleConfig = user.role_config as { sudo?: boolean; can_manage_produtos?: boolean; admin_pages?: string[] } | null
            
            // Verificar se é gestor
            const isManager = 
                roleConfig?.sudo === true ||
                roleConfig?.can_manage_produtos === true ||
                (Array.isArray(roleConfig?.admin_pages) && roleConfig.admin_pages.includes("/admin/products"))

            if (!isManager) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "Você não tem permissão para alterar o status dos produtos" 
                })
            }

            // Buscar produto atual
            const product = await ctx.db.product.findUnique({
                where: { id: input.id },
                select: { id: true, active: true }
            })

            if (!product) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Produto não encontrado"
                })
            }

            // Alternar status
            return await ctx.db.product.update({
                where: { id: input.id },
                data: {
                    active: !product.active
                }
            })
        })
})