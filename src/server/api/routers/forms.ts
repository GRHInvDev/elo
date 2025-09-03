import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import type { Field } from "@/lib/form-types"
import { type InputJsonValue } from "@prisma/client/runtime/library";


export const formsRouter = createTRPCRouter({
    create: protectedProcedure
    .input(z.object({
        title: z.string().min(1, "O nome é obrigatório."),
        description: z.string().optional(),
        fields: z.custom<Field[]>(),
        isPrivate: z.boolean().default(false),
        allowedUsers: z.array(z.string()).default([]),
        allowedSectors: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input })=>{
        return await ctx.db.form.create({
            data: {
                ...input, 
                fields: input.fields as unknown as InputJsonValue[], 
                userId: ctx.auth.userId
            }
        })
    }),

    update: protectedProcedure
    .input(z.object({
        id: z.string(),
        title: z.string().min(1, "O nome é obrigatório."),
        description: z.string().optional(),
        fields: z.custom<Field[]>(),
        isPrivate: z.boolean().optional(),
        allowedUsers: z.array(z.string()).optional(),
        allowedSectors: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input })=>{
        return await ctx.db.form.update({
            data: {
                ...input, 
                fields: input.fields as unknown as InputJsonValue[], 
                userId: ctx.auth.userId
            },
            where: {
                id: input.id
            }
        })
    }),

    delete: protectedProcedure
    .input(z.object({
        id: z.string(),
    }))
    .mutation(async ({ ctx, input })=>{
        return await ctx.db.form.delete({
            where: {
                id: input.id
            }
        })
    }),

    list: protectedProcedure
    .query( async ({ ctx }) => {
        // Buscar dados do usuário atual
        const currentUser = await ctx.db.user.findUnique({
            where: { id: ctx.auth.userId },
            select: { 
                id: true, 
                setor: true, 
                role_config: true 
            }
        });

        if (!currentUser) {
            return [];
        }

        // Buscar todos os formulários
        const allForms = await ctx.db.form.findMany({
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
        });

        // Filtrar formulários baseado na visibilidade
        return allForms.filter(form => {
            // Se o formulário é público, sempre pode ver
            if (!form.isPrivate) {
                return true;
            }

            // Se é privado, verificar se o usuário está na lista de permitidos
            if (form.allowedUsers.includes(currentUser.id)) {
                return true;
            }

            // Verificar se o setor do usuário está permitido
            if (currentUser.setor && form.allowedSectors.includes(currentUser.setor)) {
                return true;
            }

            // Se é o criador do formulário, sempre pode ver
            if (form.userId === currentUser.id) {
                return true;
            }

            // Verificar se tem permissões especiais no role_config (hidden_forms)
            const roleConfig = currentUser.role_config as any;
            if (roleConfig?.forms?.hidden_forms?.includes(form.id)) {
                return false;
            }

            return false;
        });
    }),

    getById: protectedProcedure
    .input(z.object({
        id: z.string()
    }))
    .query( async ({ ctx, input }) => {
        return await ctx.db.form.findUnique({
            where: {
                id: input.id
            },
            include: {
                user: true
            }
        })
    }),

    getUsersAndSectors: protectedProcedure
    .query(async ({ ctx }) => {
        const users = await ctx.db.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                setor: true,
            },
            orderBy: {
                firstName: 'asc'
            }
        });

        // Extrair setores únicos
        const sectors = [...new Set(users.map(user => user.setor).filter(Boolean))];

        return {
            users: users.map(user => ({
                id: user.id,
                name: `${user.firstName} ${user.lastName}`.trim() || user.email,
                email: user.email,
                setor: user.setor,
            })),
            sectors: sectors.sort(),
        };
    }),
    
});