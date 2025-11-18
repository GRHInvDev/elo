import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc"

export const globalConfigRouter = createTRPCRouter({
    // Obter configuração global
    get: adminProcedure
        .query(async ({ ctx }) => {
            let config = await ctx.db.globalConfig.findFirst({
                where: { id: "default" }
            })

            // Se não existe, criar com valores padrão
            if (!config) {
                config = await ctx.db.globalConfig.create({
                    data: {
                        id: "default",
                        shopWebhook: "",
                        shopNotificationEmail: null
                    }
                })
            }

            return config
        }),

    // Atualizar email de notificação
    updateShopNotificationEmail: adminProcedure
        .input(z.object({
            email: z.string().email("Email inválido").nullable()
        }))
        .mutation(async ({ ctx, input }) => {
            // Verificar se existe configuração
            let config = await ctx.db.globalConfig.findFirst({
                where: { id: "default" }
            })

            if (!config) {
                // Criar se não existir
                config = await ctx.db.globalConfig.create({
                    data: {
                        id: "default",
                        shopWebhook: "",
                        shopNotificationEmail: input.email
                    }
                })
            } else {
                // Atualizar
                config = await ctx.db.globalConfig.update({
                    where: { id: "default" },
                    data: {
                        shopNotificationEmail: input.email
                    }
                })
            }

            return config
        }),
})

