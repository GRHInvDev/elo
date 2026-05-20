import "server-only"
import { z } from "zod"
import { Enterprise } from "@prisma/client"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import type { RolesConfig } from "@/types/role-config"

function checkPermission(roleConfig: RolesConfig | null | undefined): void {
  if (!roleConfig) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para gerenciar empresas",
    })
  }
  if (roleConfig.sudo) return
  if (roleConfig.can_manage_filial !== true) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para gerenciar empresas",
    })
  }
}

const empresaSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome não pode exceder 100 caracteres"),
  enterprise: z.nativeEnum(Enterprise).refine((e) => e !== Enterprise.NA, {
    message: "Selecione o tipo de empresa",
  }),
})

export const empresasRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.empresa.findMany({
      include: {
        filiais: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    })
  }),

  create: protectedProcedure
    .input(empresaSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      return ctx.db.empresa.create({ data: input })
    }),

  update: protectedProcedure
    .input(empresaSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      const { id, ...data } = input
      return ctx.db.empresa.update({ where: { id }, data })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      const filiaisCount = await ctx.db.filial.count({
        where: { empresaId: input.id },
      })

      if (filiaisCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Não é possível excluir empresa com ${filiaisCount} filial(is) vinculada(s)`,
        })
      }

      return ctx.db.empresa.delete({ where: { id: input.id } })
    }),
})
