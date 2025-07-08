import { upsertEnterpriseConfigSchema } from "@/schemas/enterpriseConfig.schema";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const enterpriseConfigRouter = createTRPCRouter({
    getAll: protectedProcedure
    .query(async ({ ctx }) => {
        return await ctx.db.enterpriseConfig.findMany();
    }),

    upsert: adminProcedure
    .input(upsertEnterpriseConfigSchema)
    .mutation(async ({ input, ctx }) => {
        return await ctx.db.enterpriseConfig.upsert({
            where: {
                enterprise: input.enterprise
            },
            update: {
                shopNotificationEmail: input.shopNotificationEmail
            },
            create: {
                enterprise: input.enterprise,
                shopNotificationEmail: input.shopNotificationEmail
            }
        })
    })
}) 