import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import type { Field } from "@/lib/form-types"
import { type InputJsonValue } from "@prisma/client/runtime/library";
import type { RolesConfig } from "@/types/role-config";


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
        // Criar o formulário
        const form = await ctx.db.form.create({
            data: {
                title: input.title,
                description: input.description,
                fields: input.fields as unknown as InputJsonValue[], 
                userId: ctx.auth.userId
            }
        });

        // Se é privado, configurar visibilidade para todos os usuários permitidos e setores
        if (input.isPrivate) {
            // Buscar todos os usuários que devem ter acesso
            const usersToUpdate = new Set<string>();
            
            // Adicionar usuários específicos
            input.allowedUsers.forEach(userId => usersToUpdate.add(userId));
            
            // Adicionar usuários dos setores permitidos
            if (input.allowedSectors.length > 0) {
                const usersFromSectors = await ctx.db.user.findMany({
                    where: {
                        setor: { in: input.allowedSectors }
                    },
                    select: { id: true }
                });
                usersFromSectors.forEach(user => usersToUpdate.add(user.id));
            }

            // Atualizar role_config para todos os outros usuários (esconder o formulário)
            const allUsers = await ctx.db.user.findMany({
                select: { id: true, role_config: true }
            });

            for (const user of allUsers) {
                // Pular se é o criador ou tem acesso
                if (user.id === ctx.auth.userId || usersToUpdate.has(user.id)) {
                    continue;
                }

                const currentConfig = (user.role_config as RolesConfig) || {
                    sudo: false,
                    admin_pages: [],
                    can_create_form: false,
                    can_create_event: false,
                    can_create_flyer: false,
                    can_create_booking: false,
                    can_locate_cars: false,
                };

                // Adicionar formulário à lista de ocultos
                const hiddenForms = currentConfig.hidden_forms ?? [];
                if (!hiddenForms.includes(form.id)) {
                    const newConfig = {
                        ...currentConfig,
                        hidden_forms: [...hiddenForms, form.id]
                    };

                    await ctx.db.user.update({
                        where: { id: user.id },
                        data: { role_config: newConfig }
                    });
                }
            }
        }

        return form;
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
        const form = await ctx.db.form.update({
            data: {
                title: input.title,
                description: input.description,
                fields: input.fields as unknown as InputJsonValue[], 
                userId: ctx.auth.userId
            },
            where: {
                id: input.id
            }
        });

        // Se a configuração de privacidade foi alterada, atualizar role_config dos usuários
        if (input.isPrivate !== undefined) {
            if (input.isPrivate && input.allowedUsers && input.allowedSectors) {
                // Mesma lógica da criação para formulários privados
                const usersToUpdate = new Set<string>();
                
                input.allowedUsers.forEach(userId => usersToUpdate.add(userId));
                
                if (input.allowedSectors.length > 0) {
                    const usersFromSectors = await ctx.db.user.findMany({
                        where: {
                            setor: { in: input.allowedSectors }
                        },
                        select: { id: true }
                    });
                    usersFromSectors.forEach(user => usersToUpdate.add(user.id));
                }

                const allUsers = await ctx.db.user.findMany({
                    select: { id: true, role_config: true }
                });

                for (const user of allUsers) {
                    if (user.id === ctx.auth.userId || usersToUpdate.has(user.id)) {
                        // Para usuários com acesso, remover da lista de ocultos
                        const currentConfig = (user.role_config as RolesConfig) || {
                            sudo: false,
                            admin_pages: [],
                            can_create_form: false,
                            can_create_event: false,
                            can_create_flyer: false,
                            can_create_booking: false,
                            can_locate_cars: false,
                        };

                        if (currentConfig.hidden_forms?.includes(input.id)) {
                            const newConfig = {
                                ...currentConfig,
                                hidden_forms: currentConfig.hidden_forms.filter(id => id !== input.id)
                            };

                            await ctx.db.user.update({
                                where: { id: user.id },
                                data: { role_config: newConfig }
                            });
                        }
                    } else {
                        // Para outros usuários, adicionar à lista de ocultos
                        const currentConfig = (user.role_config as RolesConfig) || {
                            sudo: false,
                            admin_pages: [],
                            can_create_form: false,
                            can_create_event: false,
                            can_create_flyer: false,
                            can_create_booking: false,
                            can_locate_cars: false,
                        };

                        const hiddenForms = currentConfig.hidden_forms ?? [];
                        if (!hiddenForms.includes(input.id)) {
                            const newConfig = {
                                ...currentConfig,
                                hidden_forms: [...hiddenForms, input.id]
                            };

                            await ctx.db.user.update({
                                where: { id: user.id },
                                data: { role_config: newConfig }
                            });
                        }
                    }
                }
            } else if (!input.isPrivate) {
                // Se tornou público, remover de todas as listas de ocultos
                const allUsers = await ctx.db.user.findMany({
                    select: { id: true, role_config: true }
                });

                for (const user of allUsers) {
                    const currentConfig = (user.role_config as RolesConfig);
                    if (currentConfig?.hidden_forms?.includes(input.id)) {
                        const newConfig = {
                            ...currentConfig,
                            hidden_forms: currentConfig.hidden_forms.filter(id => id !== input.id)
                        };

                        await ctx.db.user.update({
                            where: { id: user.id },
                            data: { role_config: newConfig }
                        });
                    }
                }
            }
        }

        return form;
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

        // Filtrar formulários baseado na visibilidade e permissões do role_config
        const roleConfig = currentUser.role_config as RolesConfig;
        
        return allForms.filter(form => {
            // TOTEMs não podem ver nenhum formulário
            if (roleConfig?.isTotem) {
                return false;
            }

            // Se é o criador do formulário, sempre pode ver
            if (form.userId === currentUser.id) {
                return true;
            }

            // Se o usuário tem formulários específicos bloqueados
            if (roleConfig?.hidden_forms?.includes(form.id)) {
                return false;
            }

            // Se o usuário tem uma lista específica de formulários permitidos
            if (roleConfig?.visible_forms && roleConfig.visible_forms.length > 0) {
                return roleConfig.visible_forms.includes(form.id);
            }

            // Por padrão, todos podem ver todos os formulários (exceto os bloqueados)
            return true;
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

    // Gerenciamento de visibilidade via role_config
    updateFormVisibility: protectedProcedure
    .input(z.object({
        userId: z.string(),
        formId: z.string(),
        action: z.enum(['show', 'hide', 'restrict_to_list']),
    }))
    .mutation(async ({ ctx, input }) => {
        const user = await ctx.db.user.findUnique({
            where: { id: input.userId },
            select: { role_config: true }
        });

        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        const currentConfig = (user.role_config as RolesConfig) || {
            sudo: false,
            admin_pages: [],
            can_create_form: false,
            can_create_event: false,
            can_create_flyer: false,
            can_create_booking: false,
            can_locate_cars: false,
        };

        const newConfig = { ...currentConfig };

        if (input.action === 'hide') {
            // Adicionar à lista de formulários ocultos
            const hiddenForms = newConfig.hidden_forms ?? [];
            if (!hiddenForms.includes(input.formId)) {
                newConfig.hidden_forms = [...hiddenForms, input.formId];
            }
            // Remover da lista de visíveis se estiver lá
            if (newConfig.visible_forms) {
                newConfig.visible_forms = newConfig.visible_forms.filter(id => id !== input.formId);
            }
        } else if (input.action === 'show') {
            // Remover da lista de ocultos
            if (newConfig.hidden_forms) {
                newConfig.hidden_forms = newConfig.hidden_forms.filter(id => id !== input.formId);
            }
            // Se tem lista restritiva, adicionar à lista de visíveis
            if (newConfig.visible_forms && newConfig.visible_forms.length > 0) {
                if (!newConfig.visible_forms.includes(input.formId)) {
                    newConfig.visible_forms = [...newConfig.visible_forms, input.formId];
                }
            }
        } else if (input.action === 'restrict_to_list') {
            // Criar lista restritiva com apenas este formulário
            newConfig.visible_forms = [input.formId];
            // Remover da lista de ocultos se estiver lá
            if (newConfig.hidden_forms) {
                newConfig.hidden_forms = newConfig.hidden_forms.filter(id => id !== input.formId);
            }
        }

        await ctx.db.user.update({
            where: { id: input.userId },
            data: { role_config: newConfig }
        });

        return { success: true };
    }),

    getUsersForFormVisibility: protectedProcedure
    .query(async ({ ctx }) => {
        const users = await ctx.db.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                setor: true,
                role_config: true,
            },
            orderBy: {
                firstName: 'asc'
            }
        });

        return users.map(user => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim() || user.email,
            email: user.email,
            setor: user.setor,
            role_config: user.role_config as RolesConfig,
        }));
    }),
    
});