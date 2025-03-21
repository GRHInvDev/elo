import { createProductSchema, updateProductSchema } from "@/schemas/product.schema"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"

export const productRouter = createTRPCRouter({
    create: protectedProcedure
    .input(createProductSchema)
    .mutation(async ({ input, ctx }) => {
        return await ctx.db.product.create({
            data: {
                ...input
            }
        })
    }),

    update: protectedProcedure
    .input(updateProductSchema)
    .mutation(async ({ input, ctx }) => {
        return await ctx.db.product.update({
            data: {
                ...input
            },
            where: {
                id: input.id
            }
        })
    }),

    getAll: protectedProcedure
    .query(async ({ ctx }) => {
        return await ctx.db.product.findMany();
    })
})