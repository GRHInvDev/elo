import "server-only"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import type { RolesConfig } from "@/types/role-config"

const createFilialSchema = z.object({
  name: z.string().min(2, "Nome da filial deve ter no mínimo 2 caracteres").max(100, "Nome não pode exceder 100 caracteres"),
  code: z.string()
    .min(1, "Código é obrigatório")
    .max(50, "Código não pode exceder 50 caracteres")
    .transform(val => val.toUpperCase()),
})

const updateFilialSchema = createFilialSchema.partial().extend({
  id: z.string(),
})

// Função auxiliar para verificar permissão
function checkFilialManagementPermission(roleConfig: RolesConfig | null | undefined): void {
  if (!roleConfig) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para gerenciar filiais",
    })
  }

  if (roleConfig.sudo) return

  if (roleConfig.can_manage_filial !== true) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para gerenciar filiais",
    })
  }
}

export const filiaisRouter = createTRPCRouter({
  // Listar todas as filiais
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.filial.findMany({
      orderBy: { name: "asc" },
    })
  }),

  // Obter filial por ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const filial = await ctx.db.filial.findUnique({
        where: { id: input.id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      if (!filial) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Filial não encontrada",
        })
      }

      return filial
    }),

  // Criar nova filial
  create: protectedProcedure
    .input(createFilialSchema)
    .mutation(async ({ ctx, input }) => {
      // Buscar role_config do usuário
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId! },
        select: { role_config: true },
      })

      const roleConfig = user?.role_config as RolesConfig | null

      // Validar permissão
      checkFilialManagementPermission(roleConfig)

      // Validar se código já existe
      const existingFilial = await ctx.db.filial.findUnique({
        where: { code: input.code.toUpperCase() },
      })

      if (existingFilial) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Filial com código "${input.code}" já existe`,
        })
      }

      return ctx.db.filial.create({
        data: {
          name: input.name,
          code: input.code.toUpperCase(),
        },
      })
    }),

  // Atualizar filial
  update: protectedProcedure
    .input(updateFilialSchema)
    .mutation(async ({ ctx, input }) => {
      // Buscar role_config do usuário
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId! },
        select: { role_config: true },
      })

      const roleConfig = user?.role_config as RolesConfig | null

      // Validar permissão
      checkFilialManagementPermission(roleConfig)

      const { id, ...data } = input
      const dataToUpdate = {
        ...data,
        ...(data.code && { code: data.code.toUpperCase() }),
      }

      // Se código foi alterado, validar unicidade
      if (dataToUpdate.code) {
        const existingFilial = await ctx.db.filial.findUnique({
          where: { code: dataToUpdate.code },
        })

        if (existingFilial && existingFilial.id !== id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Filial com código "${dataToUpdate.code}" já existe`,
          })
        }
      }

      return ctx.db.filial.update({
        where: { id },
        data: dataToUpdate,
      })
    }),

  // Deletar filial
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Buscar role_config do usuário
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId! },
        select: { role_config: true },
      })

      const roleConfig = user?.role_config as RolesConfig | null

      // Validar permissão
      checkFilialManagementPermission(roleConfig)

      // Verificar se filial tem usuários vinculados
      const usersCount = await ctx.db.user.count({
        where: { filialId: input.id },
      })

      if (usersCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Não é possível deletar filial com ${usersCount} usuário(s) vinculado(s)`,
        })
      }

      return ctx.db.filial.delete({
        where: { id: input.id },
      })
    }),
})
