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
                orderBy: [
                    { enterprise: "asc" },
                    { createdAt: "asc" }
                ]
            })
        }),

    // Adicionar responsável por empresa
    create: adminProcedure
        .input(z.object({
            userId: z.string().optional(),
            enterprise: z.nativeEnum(Enterprise),
            externalName: z.string().min(1, "Nome é obrigatório para emails externos").optional(),
            externalEmail: z.string().email("Email inválido").optional(),
        }).refine(
            (data) => data.userId ?? (data.externalName && data.externalEmail),
            {
                message: "É necessário fornecer um userId ou externalName e externalEmail",
            }
        ))
        .mutation(async ({ ctx, input }) => {
            // Se for usuário interno, verificar se já existe
            if (input.userId) {
                const existing = await ctx.db.enterpriseManager.findFirst({
                    where: {
                        userId: input.userId,
                        enterprise: input.enterprise
                    }
                })

                if (existing) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Este usuário já é responsável por esta empresa"
                    })
                }
            }

            // Se for email externo, verificar se já existe
            if (input.externalEmail) {
                const existing = await ctx.db.enterpriseManager.findFirst({
                    where: {
                        externalEmail: input.externalEmail,
                        enterprise: input.enterprise
                    }
                })

                if (existing) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Este email já é responsável por esta empresa"
                    })
                }
            }

            return await ctx.db.enterpriseManager.create({
                data: {
                    userId: input.userId ?? null,
                    enterprise: input.enterprise,
                    externalName: input.externalName ?? null,
                    externalEmail: input.externalEmail ?? null,
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

