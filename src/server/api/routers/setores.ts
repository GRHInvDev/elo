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
 * remove acentos, coloca em maiúsculas e preserva espaços únicos (sem _).
 * Ex.: "Recursos Humanos" -> "RECURSOS HUMANOS".
 */
function toSetorValue(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas diacriticas)
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s]+/g, " ") // não converte para _, mantém espaços
    .replace(/\s+/g, " ") // múltiplos espaços -> 1 espaço
    .trim()
}

const nameSchema = z
  .string()
  .trim()
  .min(2, "Nome deve ter no mínimo 2 caracteres")
  .max(100, "Nome não pode exceder 100 caracteres")

export const setoresRouter = createTRPCRouter({
  // Lista setores com seus ícones e cores configurados
  list: protectedProcedure
    .input(z.object({ onlyActive: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.setor.findMany({
        where: input?.onlyActive ? { active: true } : undefined,
        orderBy: { name: "asc" },
      })
    }),

  // Retorna o mapa de configurações de setores (acesso público autenticado)
  getSectorConfigs: protectedProcedure.query(async ({ ctx }) => {
    const setores = await ctx.db.setor.findMany({
      orderBy: { name: "asc" },
    })

    const result: Record<string, { icon: string; color: string }> = {}
    for (const s of setores) {
      if (s.icon || s.color) {
        const entry: { icon: string; color: string } = {
          icon: s.icon ?? "help-circle",
          color: s.color ?? "#3B82F6",
        }
        result[s.name] = entry
        result[s.value] = entry
        result[s.id] = entry
        result[s.name.replace(/_/g, " ")] = entry
        result[s.value.replace(/_/g, " ")] = entry
        result[s.name.replace(/\s+/g, "_")] = entry
        result[s.value.replace(/\s+/g, "_")] = entry
      }
    }
    return result
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: nameSchema,
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
    )
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

      return ctx.db.setor.create({
        data: {
          name: input.name,
          value,
          icon: input.icon ?? null,
          color: input.color ?? null,
        },
      })
    }),

  // Atualiza rótulo, status, ícone e cor
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: nameSchema.optional(),
        active: z.boolean().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      const { id, ...data } = input
      const existing = await ctx.db.setor.findUnique({ where: { id } })
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Setor não encontrado" })
      }

      let newValue = existing.value
      if (data.name) {
        const trimmedName = data.name.trim()
        const clash = await ctx.db.setor.findFirst({
          where: { name: trimmedName, NOT: { id } },
          select: { id: true },
        })
        if (clash) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um setor com este nome",
          })
        }
        newValue = toSetorValue(trimmedName)
      }

      const updated = await ctx.db.setor.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name.trim(), value: newValue } : {}),
          ...(data.active !== undefined ? { active: data.active } : {}),
          ...(data.icon !== undefined ? { icon: data.icon } : {}),
          ...(data.color !== undefined ? { color: data.color } : {}),
        },
      })

      // Se o valor do setor mudou, propaga para os usuários vinculados para manter a consistência
      if (data.name && newValue !== existing.value) {
        await ctx.db.user.updateMany({
          where: { setor: existing.value },
          data: { setor: newValue },
        })
      }

      return updated
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
