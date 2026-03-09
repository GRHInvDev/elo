import "server-only";
import type { Prisma } from "@prisma/client";
import { Enterprise } from "@prisma/client";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc"
import { z } from "zod"
import { type RolesConfig } from "@/types/role-config"
import { TRPCError } from "@trpc/server"
import { getEffectiveRoleConfig } from "@/lib/effective-role-config"


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
          matricula: true,
          birthDay: true,
          extension: true,
          emailExtension: true,
          novidades: true,
          is_active: true,
          lojinha_full_name: true,
          lojinha_cpf: true,
          lojinha_address: true,
          lojinha_neighborhood: true,
          lojinha_cep: true,
          lojinha_rg: true,
          lojinha_email: true,
          lojinha_phone: true,
        } as Prisma.UserSelect,
      });

      // Role efetivo: se usuário desativado (is_active === false), mascarar como TOTEM
      // para que o app trate como acesso limitado sem alterar o role_config no banco.
      const roleConfigData = getEffectiveRoleConfig(user ?? null);

      const userData = {
        ...user,
        role_config: roleConfigData
      };

      // Log adicional para usuários Totem para debug
      if (roleConfigData.isTotem) {
        console.log('[USER.ME] Usuário Totem ou desativado acessando:', {
          userId: ctx.auth.userId,
          email: user?.email,
          isTotem: roleConfigData.isTotem,
          is_active: user?.is_active
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
        matricula: null,
        birthDay: null,
        novidades: false,
        lojinha_full_name: null,
        lojinha_cpf: null,
        lojinha_address: null,
        lojinha_neighborhood: null,
        lojinha_cep: null,
        lojinha_rg: null,
        lojinha_email: null,
        lojinha_phone: null,
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
      matricula: z.string().min(1, "Matrícula é obrigatória"),
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
            matricula: input.matricula.trim(),
            enterprise: input.enterprise as Enterprise,
            setor: input.setor,
          },
          select: {
            id: true,
            matricula: true,
            enterprise: true,
            setor: true,
          },
        });
      } catch (error) {
        // Se usuário não existe (desenvolvimento), criar novo
        console.warn("Usuário não encontrado, criando novo registro:", error);

        // Role config alinhado ao padrão de novos usuários (reserva de salas e veículos habilitada)
        const devDefaultRoleConfig = {
          sudo: false,
          admin_pages: [] as string[],
          can_create_form: false,
          can_create_event: false,
          can_create_flyer: false,
          can_create_booking: true,
          can_locate_cars: true,
          can_view_dre_report: false,
          can_create_solicitacoes: false,
          isTotem: false,
        };

        return await ctx.db.user.create({
          data: {
            id: userId,
            email: `${userId}@local.dev`, // Fallback para desenvolvimento
            firstName: null,
            lastName: null,
            imageUrl: null,
            matricula: input.matricula.trim(),
            enterprise: input.enterprise as Enterprise,
            setor: input.setor,
            role_config: devDefaultRoleConfig,
          },
          select: {
            id: true,
            matricula: true,
            enterprise: true,
            setor: true,
          },
        });
      }
    }),

  updateLojinhaProfile: protectedProcedure
    .input(z.object({
      lojinha_full_name: z.string().min(1, "Nome completo é obrigatório"),
      lojinha_cpf: z.string().min(1, "CPF é obrigatório").refine((val) => val.replace(/\D/g, "").length === 11, "CPF deve ter 11 dígitos"),
      lojinha_address: z.string().min(1, "Endereço é obrigatório"),
      lojinha_neighborhood: z.string().min(1, "Bairro é obrigatório"),
      lojinha_cep: z.string().min(1, "CEP é obrigatório").refine((val) => val.replace(/\D/g, "").length === 8, "CEP deve ter 8 dígitos"),
      lojinha_rg: z.string().min(1, "RG é obrigatório"),
      lojinha_email: z.string().email("E-mail inválido"),
      lojinha_phone: z.string().min(1, "Contato telefônico é obrigatório").refine((val) => val.replace(/\D/g, "").length >= 10, "Telefone deve ter pelo menos 10 dígitos"),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }
      return ctx.db.user.update({
        where: { id: userId },
        data: {
          lojinha_full_name: input.lojinha_full_name.trim(),
          lojinha_cpf: input.lojinha_cpf.replace(/\D/g, ""),
          lojinha_address: input.lojinha_address.trim(),
          lojinha_neighborhood: input.lojinha_neighborhood.trim(),
          lojinha_cep: input.lojinha_cep.replace(/\D/g, ""),
          lojinha_rg: input.lojinha_rg.trim(),
          lojinha_email: input.lojinha_email.trim(),
          lojinha_phone: input.lojinha_phone.replace(/\D/g, ""),
        } as Prisma.UserUpdateInput,
        select: {
          id: true,
          lojinha_full_name: true,
          lojinha_cpf: true,
          lojinha_address: true,
          lojinha_neighborhood: true,
          lojinha_cep: true,
          lojinha_rg: true,
          lojinha_email: true,
          lojinha_phone: true,
        } as Prisma.UserSelect,
      });
    }),

  listUsers: protectedProcedure
    .input(z.object({
      sector: z.string().optional(),
      search: z.string().optional(),
      enterprise: z.nativeEnum(Enterprise).optional(),
      isAdmin: z.boolean().optional(),
      /** Filtro por status na empresa: active (ativo), inactive (desativado). Omitir = todos. */
      status: z.enum(["active", "inactive"]).optional(),
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Verificar se o usuário tem permissão (desativado = sem acesso)
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true, is_active: true },
      })
      const effectiveConfig = getEffectiveRoleConfig(currentUser);
      const hasAccess = Boolean(effectiveConfig.sudo) || Boolean(effectiveConfig.can_manage_dados_basicos_users);

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

      // Filtro por status na empresa (ativo / desativado)
      if (input.status === "active") {
        where.is_active = true
      } else if (input.status === "inactive") {
        where.is_active = false
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

      const canViewDadosPrivados = Boolean(effectiveConfig.sudo) || Boolean(effectiveConfig.can_view_dados_privados);

      // Buscar todos os usuários que atendem aos filtros básicos (incluir lojinha_* para quem tem permissão)
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
          is_active: true,
          lojinha_full_name: true,
          lojinha_cpf: true,
          lojinha_address: true,
          lojinha_neighborhood: true,
          lojinha_cep: true,
          lojinha_rg: true,
          lojinha_email: true,
          lojinha_phone: true,
        } as Prisma.UserSelect,
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
      let paginatedUsers = filteredUsers.slice(input.offset, input.offset + input.limit)

      // Ocultar dados privados (lojinha_*) se o usuário não tiver can_view_dados_privados
      if (!canViewDadosPrivados) {
        const lojinhaKeys = ["lojinha_full_name", "lojinha_cpf", "lojinha_address", "lojinha_neighborhood", "lojinha_cep", "lojinha_rg", "lojinha_email", "lojinha_phone"] as const
        paginatedUsers = paginatedUsers.map(u => {
          const rest = { ...u } as Record<string, unknown>
          lojinhaKeys.forEach(k => delete rest[k])
          return rest
        }) as typeof paginatedUsers
      }

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
        select: { role_config: true, is_active: true },
      })
      const effectiveConfig = getEffectiveRoleConfig(currentUser);
      const canListCollaborators =
        effectiveConfig.sudo === true ||
        effectiveConfig.can_view_add_manual_ped === true ||
        effectiveConfig.can_manage_produtos === true ||
        effectiveConfig.can_manage_quality_management === true
      if (!canListCollaborators) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para listar colaboradores",
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
        // Apenas usuários ativos na empresa
        is_active: true,
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
        can_view_dados_privados: z.boolean().optional(),
        isTotem: z.boolean().optional(),
        visible_forms: z.array(z.string()).optional(),
        hidden_forms: z.array(z.string()).optional(),
      })
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o usuário é sudo (desativado não pode alterar permissões)
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true, is_active: true },
      })
      const effectiveConfig = getEffectiveRoleConfig(currentUser);
      if (!effectiveConfig.sudo) {
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
      enterprise: z.nativeEnum(Enterprise).optional(),
      /** Status na empresa: ativo ou desativado. Apenas sudo ou can_manage_dados_basicos_users podem alterar. */
      is_active: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar permissões do usuário (desativado = sem permissão de edição)
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true, is_active: true },
      })
      const effectiveConfig = getEffectiveRoleConfig(currentUser);

      // Permitir se for sudo ou se tiver a permissão específica
      const canEdit = Boolean(effectiveConfig.sudo) || Boolean(effectiveConfig.can_manage_dados_basicos_users);

      if (!canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para alterar dados de usuários",
        })
      }

      const { userId, ...updateData } = input

      // Se o usuário não é sudo, apenas permitir alterar dados básicos (incluindo is_active)
      if (!effectiveConfig.sudo) {
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
          enterprise: input.enterprise,
          is_active: input.is_active,
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

  updateDadosPrivados: protectedProcedure
    .input(z.object({
      userId: z.string(),
      lojinha_full_name: z.string().optional().nullable(),
      lojinha_cpf: z.string().optional().nullable(),
      lojinha_address: z.string().optional().nullable(),
      lojinha_neighborhood: z.string().optional().nullable(),
      lojinha_cep: z.string().optional().nullable(),
      lojinha_rg: z.string().optional().nullable(),
      lojinha_email: z.string().optional().nullable(),
      lojinha_phone: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true, is_active: true },
      });
      const effectiveConfig = getEffectiveRoleConfig(currentUser);
      const canEdit = Boolean(effectiveConfig.sudo) || Boolean(effectiveConfig.can_view_dados_privados);
      if (!canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para alterar dados privados",
        });
      }
      const { userId, ...data } = input;
      const updateData: Record<string, string | null> = {};
      if (data.lojinha_full_name !== undefined) updateData.lojinha_full_name = data.lojinha_full_name?.trim() ?? null;
      if (data.lojinha_cpf !== undefined) updateData.lojinha_cpf = data.lojinha_cpf ? data.lojinha_cpf.replace(/\D/g, "") : null;
      if (data.lojinha_address !== undefined) updateData.lojinha_address = data.lojinha_address?.trim() ?? null;
      if (data.lojinha_neighborhood !== undefined) updateData.lojinha_neighborhood = data.lojinha_neighborhood?.trim() ?? null;
      if (data.lojinha_cep !== undefined) updateData.lojinha_cep = data.lojinha_cep ? data.lojinha_cep.replace(/\D/g, "") : null;
      if (data.lojinha_rg !== undefined) updateData.lojinha_rg = data.lojinha_rg?.trim() ?? null;
      if (data.lojinha_email !== undefined) updateData.lojinha_email = data.lojinha_email?.trim() ?? null;
      if (data.lojinha_phone !== undefined) updateData.lojinha_phone = data.lojinha_phone ? data.lojinha_phone.replace(/\D/g, "") : null;
      return ctx.db.user.update({
        where: { id: userId },
        data: updateData as Prisma.UserUpdateInput,
      });
    }),

  // Listar usuários por setor com ramais para visualização pública
  listExtensions: protectedProcedure
    .query(async ({ ctx }) => {
      // Buscar usuários ativos, excluindo TOTEMs e ordenados por setor, nome
      const users = await ctx.db.user.findMany({
        where: {
          is_active: true,
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

