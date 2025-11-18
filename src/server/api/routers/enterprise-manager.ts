import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc"
import { Enterprise } from "@prisma/client"
import type { RolesConfig } from "@/types/role-config"

export const enterpriseManagerRouter = createTRPCRouter({
    // Listar responsáveis por empresa
    list: adminProcedure
        .query(async ({ ctx }) => {
            return await ctx.db.enterpriseManager.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            imageUrl: true,
                        }
                    }
                },
                orderBy: {
                    enterprise: "asc"
                }
            })
        }),

    // Adicionar responsável por empresa
    create: adminProcedure
        .input(z.object({
            userId: z.string().min(1, "ID de usuário é obrigatório"),
            enterprise: z.nativeEnum(Enterprise)
        }))
        .mutation(async ({ ctx, input }) => {
            // Verificar se já existe
            const existing = await ctx.db.enterpriseManager.findUnique({
                where: {
                    userId_enterprise: {
                        userId: input.userId,
                        enterprise: input.enterprise
                    }
                }
            })

            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Este usuário já é responsável por esta empresa"
                })
            }

            return await ctx.db.enterpriseManager.create({
                data: {
                    userId: input.userId,
                    enterprise: input.enterprise
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            imageUrl: true,
                        }
                    }
                }
            })
        }),

    // Remover responsável por empresa
    delete: adminProcedure
        .input(z.object({
            id: z.string().cuid("ID inválido")
        }))
        .mutation(async ({ ctx, input }) => {
            const manager = await ctx.db.enterpriseManager.findUnique({
                where: { id: input.id }
            })

            if (!manager) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Responsável não encontrado"
                })
            }

            return await ctx.db.enterpriseManager.delete({
                where: { id: input.id }
            })
        }),

    // Verificar se usuário é responsável por alguma empresa
    isManager: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.auth.userId

            const managers = await ctx.db.enterpriseManager.findMany({
                where: { userId },
                select: {
                    enterprise: true
                }
            })

            return {
                isManager: managers.length > 0,
                enterprises: managers.map(m => m.enterprise)
            }
        }),
})

