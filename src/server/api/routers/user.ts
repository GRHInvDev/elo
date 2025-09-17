import type { Prisma, Enterprise } from "@prisma/client";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc"
import { z } from "zod"
import { type RolesConfig } from "@/types/role-config"
import { TRPCError } from "@trpc/server"


export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role_config: true,
          enterprise: true,
          setor: true,
          birthDay: true
        }
      });

      // Garantir que role_config sempre tenha uma estrutura válida
      const defaultRoleConfig: RolesConfig = {
        sudo: false,
        admin_pages: [],
        can_create_form: false,
        can_create_event: false,
        can_create_flyer: false,
        can_create_booking: false,
        can_locate_cars: false,
        isTotem: false
      };

      // Se existe role_config customizado, usar; senão usar default
      const roleConfigData = user?.role_config 
        ? user.role_config as RolesConfig
        : defaultRoleConfig;

      const userData = {
        ...user,
        role_config: roleConfigData
      };

      // Log adicional para usuários Totem para debug
      if (roleConfigData.isTotem) {
        console.log('[USER.ME] Usuário Totem acessando:', {
          userId: ctx.auth.userId,
          email: user?.email,
          isTotem: roleConfigData.isTotem
        });
      }

      return userData;
    } catch (error) {
      console.error('[USER.ME] Erro ao buscar dados do usuário:', {
        userId: ctx.auth.userId,
        error: error
      });
      
      // Em caso de erro, retornar um usuário básico para evitar crash
      const fallbackRoleConfig: RolesConfig = {
        sudo: false,
        admin_pages: [],
        can_create_form: false,
        can_create_event: false,
        can_create_flyer: false,
        can_create_booking: false,
        can_locate_cars: false,
        isTotem: true // Modo seguro - assumir que é Totem
      };

      return {
        id: ctx.auth.userId,
        email: `${ctx.auth.userId}@fallback.local`,
        firstName: null,
        lastName: null,
        imageUrl: null,
        role_config: fallbackRoleConfig,
        enterprise: null,
        setor: null,
        birthDay: null
      };
    }
  }),

  listAll: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role_config: true,
        enterprise: true,
        setor: true
      }
    });
  }),

  listAdmins: adminProcedure.query(async ({ ctx }) => {
    // Buscar usuários que tem configurações admin
    const users = await ctx.db.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role_config: true,
        setor: true,
        enterprise: true
      }
    });

    // Filtrar apenas usuários com permissões admin
    return users.filter(user => {
      const roleConfig = user.role_config as RolesConfig | null;
      return !!roleConfig?.sudo || (Array.isArray(roleConfig?.admin_pages) && (roleConfig?.admin_pages?.length ?? 0) > 0);
    });
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      enterprise: z.string().min(1, "Empresa é obrigatória"),
      setor: z.string().min(1, "Setor é obrigatório"),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      // Primeiro tentar atualizar usuário existente (caso normal em produção)
      try {
        return await ctx.db.user.update({
          where: { id: userId },
          data: {
            enterprise: input.enterprise as Enterprise,
            setor: input.setor,
          },
          select: {
            id: true,
            enterprise: true,
            setor: true,
          },
        });
      } catch (error) {
        // Se usuário não existe (desenvolvimento), criar novo
        console.warn("Usuário não encontrado, criando novo registro:", error);

        return await ctx.db.user.create({
          data: {
            id: userId,
            email: `${userId}@local.dev`, // Fallback para desenvolvimento
            firstName: null,
            lastName: null,
            imageUrl: null,
            enterprise: input.enterprise as Enterprise,
            setor: input.setor,
            role_config: {
              sudo: false,
              admin_pages: undefined,
              forms: undefined,
              content: undefined
            }
          },
          select: {
            id: true,
            enterprise: true,
            setor: true,
          },
        });
      }
    }),



  listUsers: protectedProcedure
    .input(z.object({
      sector: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Verificar se o usuário é sudo
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null;
      if (!roleConfig?.sudo) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas usuários sudo podem listar usuários",
        })
      }

      const where: Prisma.UserWhereInput = {}

      // Busca por setor
      if (input.sector) {
        where.setor = {
          contains: input.sector,
          mode: 'insensitive',
        }
      }

      // Busca por nome ou email
      if (input.search) {
        where.OR = [
          {
            firstName: {
              contains: input.search,
              mode: 'insensitive',
            }
          },
          {
            lastName: {
              contains: input.search,
              mode: 'insensitive',
            }
          },
          {
            email: {
              contains: input.search,
              mode: 'insensitive',
            }
          }
        ]
      }

      return ctx.db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          enterprise: true,
          setor: true,
          role_config: true,
        },
        orderBy: {
          firstName: 'asc',
        },
      })
    }),

  updateRoleConfig: protectedProcedure
    .input(z.object({
      userId: z.string(),
      roleConfig: z.object({
        sudo: z.boolean(),
        admin_pages: z.array(z.string()),
        can_create_form: z.boolean(),
        can_create_event: z.boolean(),
        can_create_flyer: z.boolean(),
        can_create_booking: z.boolean(),
        can_locate_cars: z.boolean(),
        isTotem: z.boolean().optional(),
        visible_forms: z.array(z.string()).optional(),
        hidden_forms: z.array(z.string()).optional(),
      })
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o usuário é sudo
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null;
      if (!roleConfig?.sudo) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas usuários sudo podem alterar permissões",
        })
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: {
          role_config: input.roleConfig as RolesConfig,
        },
      })
    }),

  updateBasicInfo: protectedProcedure
    .input(z.object({
      userId: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      setor: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o usuário é sudo
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null;
      if (!roleConfig?.sudo) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas usuários sudo podem alterar dados de usuários",
        })
      }

      const { userId, ...updateData } = input
      
      return ctx.db.user.update({
        where: { id: userId },
        data: updateData,
      })
    }),
})

