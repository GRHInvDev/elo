import "server-only";
import type { Prisma } from "@prisma/client";
import { Enterprise } from "@prisma/client";
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
          birthDay: true,
          extension: true,
          emailExtension: true,
          novidades: true
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
        can_view_dre_report: false,
        can_manage_extensions: false,
        can_create_solicitacoes: false,
        can_manage_quality_management: false,
        isTotem: false,
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
        can_view_dre_report: false,
        can_manage_extensions: false,
        can_create_solicitacoes: false,
        can_manage_quality_management: false,
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
        birthDay: null,
        novidades: false
      };
    }
  }),

  // Buscar usuário atual
  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
          enterprise: true,
          setor: true,
          extension: true,
          emailExtension: true,
        }
      })
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          extension: true,
          emailExtension: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      return user;
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
        setor: true,
        extension: true,
        emailExtension: true
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
        enterprise: true,
        extension: true,
        emailExtension: true
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
      enterprise: z.nativeEnum(Enterprise).optional(),
      isAdmin: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Verificar se o usuário tem permissão
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null;
      const hasAccess = Boolean(roleConfig?.sudo) || Boolean(roleConfig?.can_manage_dados_basicos_users);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para listar usuários",
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

      // Filtro por empresa
      if (input.enterprise) {
        where.enterprise = input.enterprise
      }

      // Filtro por admin (sudo) - será aplicado após buscar os dados
      // devido à complexidade de filtrar JSON no Prisma

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

      // Buscar todos os usuários que atendem aos filtros básicos
      const allUsers = await ctx.db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          enterprise: true,
          setor: true,
          extension: true,
          emailExtension: true,
          matricula: true,
          role_config: true,
          email_empresarial: true,
        },
        orderBy: {
          firstName: 'asc',
        },
      })

      // Aplicar filtro de admin se necessário (filtro em memória para JSON)
      let filteredUsers = allUsers
      if (input.isAdmin !== undefined) {
        filteredUsers = allUsers.filter(user => {
          const roleConfig = user.role_config as RolesConfig | null
          const isSudo = roleConfig?.sudo === true
          return input.isAdmin ? isSudo : !isSudo
        })
      }

      // Aplicar paginação
      const total = filteredUsers.length
      const paginatedUsers = filteredUsers.slice(input.offset, input.offset + input.limit)

      return {
        users: paginatedUsers,
        total,
        hasMore: input.offset + input.limit < total,
      }
    }),

  searchMinimal: protectedProcedure
    .input(z.object({ query: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null
      if (!roleConfig?.sudo) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas usuários sudo podem listar colaboradores",
        })
      }

      const where: Prisma.UserWhereInput = {}

      if (input.query) {
        where.OR = [
          { firstName: { contains: input.query, mode: "insensitive" } },
          { lastName: { contains: input.query, mode: "insensitive" } },
          { email: { contains: input.query, mode: "insensitive" } },
        ]
      }

      return ctx.db.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        orderBy: {
          firstName: "asc",
        },
        take: 100,
      })
    }),

  // Listar usuários para chat - acessível para todos os usuários autenticados
  listForChat: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.UserWhereInput = {
        // Excluir usuários Totem
        role_config: {
          path: ['isTotem'],
          equals: false,
        },
        // Excluir usuários do setor "Sistema"
        setor: {
          not: 'Sistema'
        }
      }

      // Filtro de busca
      if (input.search) {
        where.OR = [
          { firstName: { contains: input.search, mode: 'insensitive' as const } },
          { lastName: { contains: input.search, mode: 'insensitive' as const } },
          { email: { contains: input.search, mode: 'insensitive' as const } },
        ]
      }

      return ctx.db.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
          enterprise: true,
          setor: true,
          extension: true,
          emailExtension: true,
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' },
        ]
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
        can_view_dre_report: z.boolean(),
        can_manage_extensions: z.boolean().optional(),
        can_manage_dados_basicos_users: z.boolean().optional(),
        can_manage_produtos: z.boolean().optional(),
        can_manage_quality_management: z.boolean().optional(),
        can_view_answer_without_admin_access: z.boolean().optional(),
        can_view_add_manual_ped: z.boolean().optional(),
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
      extension: z.string().transform(val => BigInt(val)).optional(),
      emailExtension: z.string().email().optional().or(z.literal("")),
      matricula: z.string().optional().or(z.literal("")),
      email_empresarial: z.string().email().optional().or(z.literal("")),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar permissões do usuário
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null;

      // Permitir se for sudo ou se tiver a permissão específica
      const canEdit = Boolean(roleConfig?.sudo) || Boolean(roleConfig?.can_manage_dados_basicos_users);

      if (!canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para alterar dados de usuários",
        })
      }

      const { userId, ...updateData } = input

      // Se o usuário não é sudo, apenas permitir alterar dados básicos
      if (!roleConfig?.sudo) {
        // Garantir que apenas dados básicos sejam atualizados
        const allowedFields = {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          setor: input.setor,
          extension: input.extension,
          emailExtension: input.emailExtension,
          matricula: input.matricula,
          email_empresarial: input.email_empresarial,
        }

        return ctx.db.user.update({
          where: { id: userId },
          data: allowedFields,
        })
      }

      return ctx.db.user.update({
        where: { id: userId },
        data: updateData,
      })
    }),

  // Listar usuários por setor com ramais para visualização pública
  listExtensions: protectedProcedure
    .query(async ({ ctx }) => {
      // Buscar usuários excluindo TOTEMs e ordenados por setor, nome
      const users = await ctx.db.user.findMany({
        where: {
          role_config: {
            path: ['isTotem'],
            equals: false,
          },
          // Excluir usuários do setor "Sistema"
          setor: {
            not: 'Sistema'
          },
          // Mostrar apenas usuários com ramal configurado ou email específico do ramal
          OR: [
            { extension: { gt: 0 } },
            { emailExtension: { not: null } }
          ]
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          setor: true,
          extension: true,
          emailExtension: true,
          nameExtension: true,
          setorExtension: true,
          enterprise: true,
        },
        orderBy: [
          { setor: 'asc' },
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
      })

      // Agrupar por setor
      const groupedBySector = users.reduce((acc, user) => {
        const sector = user.setor ?? 'Não informado'
        acc[sector] ??= []
        acc[sector]?.push(user)
        return acc
      }, {} as Record<string, typeof users>)

      return groupedBySector
    }),

  // Atualizar ramal de usuário (requer permissão específica)
  updateExtension: protectedProcedure
    .input(z.object({
      userId: z.string(),
      extension: z.string().transform(val => BigInt(val)), // Ramal/telefone deve ser positivo
      emailExtension: z.string().email().optional().or(z.literal("")),
      nameExtension: z.string().optional(),
      setorExtension: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o usuário atual tem permissão para gerenciar ramais
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null

      // Só sudo ou quem tem permissão específica pode alterar ramais
      if (!roleConfig?.sudo && !roleConfig?.can_manage_extensions) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para alterar ramais de usuários",
        })
      }

      // Não permitir alterar o próprio ramal (para evitar conflitos)
      if (input.userId === ctx.auth.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não pode alterar seu próprio ramal",
        })
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: {
          extension: input.extension,
          emailExtension: input.emailExtension ?? null,
          nameExtension: input.nameExtension ?? null,
          setorExtension: input.setorExtension ?? null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          extension: true,
          setor: true,
          emailExtension: true,
          nameExtension: true,
          setorExtension: true,
        },
      })
    }),

  // === RAMAIS PERSONALIZADOS ===

  // Listar ramais personalizados
  listcustom_extensions: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.custom_extension.findMany({
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })
    }),

  // Criar ramal personalizado
  createcustom_extension: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      email: z.string().email().optional().or(z.literal("")),
      extension: z.string().transform(val => BigInt(val)),
      description: z.string().optional(),
      setor: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o usuário atual tem permissão para gerenciar ramais
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null

      // Só sudo ou quem tem permissão específica pode criar ramais personalizados
      if (!roleConfig?.sudo && !roleConfig?.can_manage_extensions) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para criar ramais personalizados",
        })
      }

      return await ctx.db.custom_extension.create({
        data: {
          name: input.name,
          email: input.email ?? null,
          extension: input.extension,
          description: input.description ?? null,
          setor: input.setor ?? null,
          createdById: ctx.auth.userId,
        },
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        }
      })
    }),


  // Atualizar ramal personalizado
  updatecustom_extension: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, "Nome é obrigatório"),
      email: z.string().email().optional().or(z.literal("")),
      extension: z.string().transform(val => BigInt(val)),
      description: z.string().optional(),
      setor: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o usuário atual tem permissão para gerenciar ramais
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null

      // Só sudo ou quem tem permissão específica pode editar ramais personalizados
      if (!roleConfig?.sudo && !roleConfig?.can_manage_extensions) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar ramais personalizados",
        })
      }

      // Validação de unicidade removida - permitindo múltiplos usuários com o mesmo ramal

      return ctx.db.custom_extension.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: input.email ?? null,
          extension: input.extension,
          description: input.description ?? null,
          setor: input.setor ?? null,
        },
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        }
      })
    }),

  // Deletar ramal personalizado
  deletecustom_extension: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o usuário atual tem permissão para gerenciar ramais
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null

      // Só sudo ou quem tem permissão específica pode deletar ramais personalizados
      if (!roleConfig?.sudo && !roleConfig?.can_manage_extensions) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para deletar ramais personalizados",
        })
      }

      return ctx.db.custom_extension.delete({
        where: { id: input.id },
      })
    }),

  // Verificar se o usuário é novo colaborador
  checkNewCollaborator: protectedProcedure.query(async ({ ctx }) => {
    const newCollaborator = await ctx.db.newCollaborator.findUnique({
      where: { userId: ctx.auth.userId },
    })

    // Se não existe registro, criar com isNew = true (primeiro acesso)
    if (!newCollaborator) {
      const created = await ctx.db.newCollaborator.create({
        data: {
          userId: ctx.auth.userId,
          isNew: true,
        },
      })
      return { isNew: created.isNew }
    }

    return { isNew: newCollaborator.isNew }
  }),

  // Marcar colaborador como não novo (fechar card de boas-vindas)
  markAsNotNew: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.db.newCollaborator.findUnique({
      where: { userId: ctx.auth.userId },
    })

    if (existing) {
      return await ctx.db.newCollaborator.update({
        where: { userId: ctx.auth.userId },
        data: { isNew: false },
      })
    }

    // Se não existe, criar com isNew = false
    return await ctx.db.newCollaborator.create({
      data: {
        userId: ctx.auth.userId,
        isNew: false,
      },
    })
  }),
})

