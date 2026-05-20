import "server-only"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import type { RolesConfig } from "@/types/role-config"

const createFilialSchema = z.object({
  name: z
    .string()
    .min(2, "Nome da filial deve ter no mínimo 2 caracteres")
    .max(100, "Nome não pode exceder 100 caracteres"),
  code: z
    .string()
    .min(1, "Código é obrigatório")
    .max(50, "Código não pode exceder 50 caracteres")
    .transform((val) => val.toUpperCase()),
  empresaId: z.string().min(1, "Selecione a empresa à qual esta filial pertence"),
})

const updateFilialSchema = createFilialSchema.partial().extend({
  id: z.string(),
})

function checkFilialManagementPermission(
  roleConfig: RolesConfig | null | undefined,
): void {
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

const empresaSelect = {
  id: true,
  name: true,
  enterprise: true,
} as const

export const filiaisRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ empresaId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.filial.findMany({
        where: input?.empresaId ? { empresaId: input.empresaId } : undefined,
        include: { empresa: { select: empresaSelect } },
        orderBy: { name: "asc" },
      })
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const filial = await ctx.db.filial.findUnique({
        where: { id: input.id },
        include: { empresa: { select: empresaSelect } },
      })

      if (!filial) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Filial não encontrada",
        })
      }

      return filial
    }),

  listUsers: protectedProcedure
    .input(
      z.object({
        filialId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(5).max(50).default(10),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { filialId, page, pageSize, search } = input
      const skip = (page - 1) * pageSize

      const where = {
        filialId,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            enterprise: true,
            filialId: true,
          },
          skip,
          take: pageSize,
          orderBy: [{ firstName: "asc" }, { email: "asc" }],
        }),
        ctx.db.user.count({ where }),
      ])

      return {
        users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    }),

  create: protectedProcedure
    .input(createFilialSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      checkFilialManagementPermission(user?.role_config as RolesConfig | null)

      const existingFilial = await ctx.db.filial.findUnique({
        where: { code: input.code.toUpperCase() },
      })

      if (existingFilial) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Filial com código "${input.code}" já existe`,
        })
      }

      const empresa = await ctx.db.empresa.findUnique({
        where: { id: input.empresaId },
      })

      if (!empresa) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Empresa não encontrada",
        })
      }

      return ctx.db.filial.create({
        data: {
          name: input.name,
          code: input.code.toUpperCase(),
          empresaId: input.empresaId,
        },
        include: { empresa: { select: empresaSelect } },
      })
    }),

  update: protectedProcedure
    .input(updateFilialSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      checkFilialManagementPermission(user?.role_config as RolesConfig | null)

      const { id, ...data } = input
      const dataToUpdate = {
        ...data,
        ...(data.code && { code: data.code.toUpperCase() }),
      }

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

      if (dataToUpdate.empresaId) {
        const empresa = await ctx.db.empresa.findUnique({
          where: { id: dataToUpdate.empresaId },
        })

        if (!empresa) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Empresa não encontrada",
          })
        }
      }

      return ctx.db.filial.update({
        where: { id },
        data: dataToUpdate,
        include: { empresa: { select: empresaSelect } },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      checkFilialManagementPermission(user?.role_config as RolesConfig | null)

      const usersCount = await ctx.db.user.count({
        where: { filialId: input.id },
      })

      if (usersCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Não é possível deletar filial com ${usersCount} usuário(s) vinculado(s)`,
        })
      }

      return ctx.db.filial.delete({ where: { id: input.id } })
    }),
})
