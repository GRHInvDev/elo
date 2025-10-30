import { createProductSchema, updateProductSchema } from "@/schemas/product.schema"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import type { RolesConfig } from "@/types/role-config"

export const productRouter = createTRPCRouter({
    create: protectedProcedure
    .input(createProductSchema)
    .mutation(async ({ input, ctx }) => {
        const currentUser = await ctx.db.user.findUnique({
            where: { id: ctx.auth.userId },
            select: { role_config: true }
        })

        const roleConfig = currentUser?.role_config as RolesConfig | null
        const allowed = !!roleConfig?.sudo || !!roleConfig?.can_manage_shop
        if (!allowed) {
            throw new Error("FORBIDDEN: Você não tem permissão para gerenciar produtos")
        }

        return await ctx.db.product.create({
            data: {
                name: input.name,
                description: input.description,
                enterprise: input.enterprise as any,
                imageUrl: input.imageUrl,
                price: input.price,
                code: input.code,
                active: input.active,
            }
        })
    }),

    update: protectedProcedure
    .input(updateProductSchema)
    .mutation(async ({ input, ctx }) => {
        const currentUser = await ctx.db.user.findUnique({
            where: { id: ctx.auth.userId },
            select: { role_config: true }
        })

        const roleConfig = currentUser?.role_config as RolesConfig | null
        const allowed = !!roleConfig?.sudo || !!roleConfig?.can_manage_shop
        if (!allowed) {
            throw new Error("FORBIDDEN: Você não tem permissão para gerenciar produtos")
        }

        const { id, ...data } = input
        return await ctx.db.product.update({
            data: data as any,
            where: {
                id
            }
        })
    }),

    getAll: protectedProcedure
    .query(async ({ ctx }) => {
        return await ctx.db.product.findMany();
    })
})