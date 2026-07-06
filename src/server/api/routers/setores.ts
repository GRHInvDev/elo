import "server-only"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import type { RolesConfig } from "@/types/role-config"

/**
 * Gestão de setores: quem gerencia dados básicos de usuários (ou sudo) pode
 * gerenciar a lista de setores, já que o setor é um dado básico do colaborador.
 */
function checkPermission(roleConfig: RolesConfig | null | undefined): void {
  if (roleConfig?.sudo) return
  if (roleConfig?.can_manage_dados_basicos_users === true) return
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Você não tem permissão para gerenciar setores",
  })
}

/**
 * Deriva o `value` (código persistido em User.setor) a partir do rótulo:
 * remove acentos, coloca em maiúsculas e troca separadores por "_".
 * Ex.: "Recursos Humanos" -> "RECURSOS_HUMANOS".
 */
function toSetorValue(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas diacriticas)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_") // separadores -> _
    .replace(/^_+|_+$/g, "") // trim de "_"
}

const nameSchema = z
  .string()
  .trim()
  .min(2, "Nome deve ter no mínimo 2 caracteres")
  .max(100, "Nome não pode exceder 100 caracteres")

export const setoresRouter = createTRPCRouter({
  // Lista setores. Por padrão retorna todos; use onlyActive para o dropdown.
  list: protectedProcedure
    .input(z.object({ onlyActive: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.setor.findMany({
        where: input?.onlyActive ? { active: true } : undefined,
        orderBy: { name: "asc" },
      })
    }),

  create: protectedProcedure
    .input(z.object({ name: nameSchema }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      const value = toSetorValue(input.name)
      if (!value) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nome de setor inválido",
        })
      }

      const existing = await ctx.db.setor.findFirst({
        where: { OR: [{ name: input.name }, { value }] },
        select: { id: true },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um setor com este nome",
        })
      }

      return ctx.db.setor.create({ data: { name: input.name, value } })
    }),

  // Atualiza apenas o rótulo e/ou o status. O `value` é imutável para não
  // órfãos os usuários já vinculados a ele.
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: nameSchema.optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      const { id, ...data } = input

      if (data.name) {
        const clash = await ctx.db.setor.findFirst({
          where: { name: data.name, NOT: { id } },
          select: { id: true },
        })
        if (clash) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um setor com este nome",
          })
        }
      }

      return ctx.db.setor.update({ where: { id }, data })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      const setor = await ctx.db.setor.findUnique({
        where: { id: input.id },
        select: { value: true },
      })
      if (!setor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Setor não encontrado" })
      }

      const usersCount = await ctx.db.user.count({
        where: { setor: setor.value },
      })
      if (usersCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Não é possível excluir: ${usersCount} usuário(s) vinculado(s) a este setor. Reatribua-os antes ou desative o setor.`,
        })
      }

      return ctx.db.setor.delete({ where: { id: input.id } })
    }),
})
