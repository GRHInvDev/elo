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
                    enterprise: input.enterprise,
                    imageUrl: input.imageUrl,
                    price: input.price,
                    stock: input.stock,
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
                enterprise?: "Box" | "Cristallux" | "RHenz"
                imageUrl?: string[]
                price?: number
                stock?: number
            } = {}
            
            if (data.name !== undefined) updateData.name = data.name
            if (data.description !== undefined) updateData.description = data.description
            if (data.enterprise !== undefined) updateData.enterprise = data.enterprise
            if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
            if (data.price !== undefined) updateData.price = data.price
            if (data.stock !== undefined) updateData.stock = data.stock

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
        })
})