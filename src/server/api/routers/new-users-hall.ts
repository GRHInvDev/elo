import { z } from "zod"
import { TRPCError } from "@trpc/server"
import {
  createTRPCRouter,
  protectedProcedure,
  type TRPCContext,
} from "@/server/api/trpc"
import { getEffectiveRoleConfig } from "@/lib/effective-role-config"

const userInclude = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    imageUrl: true,
    setor: true,
  },
} as const

async function assertCanManageNewUsersHall(ctx: TRPCContext): Promise<void> {
  const me = await ctx.db.user.findUnique({
    where: { id: ctx.auth.userId! },
    select: { role_config: true, is_active: true },
  })
  const rc = getEffectiveRoleConfig(me)
  if (!rc.sudo && !rc.can_manage_new_users_hall) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Sem permissão para gerenciar o Hall de entrada",
    })
  }
}

function withEffectiveImage<T extends { imageUrl: string | null; user: { imageUrl: string | null } | null }>(
  row: T,
): T & { effectiveImageUrl: string | null } {
  return {
    ...row,
    effectiveImageUrl: row.imageUrl ?? row.user?.imageUrl ?? null,
  }
}

export const newUsersHallRouter = createTRPCRouter({
  listPublished: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.newUsersHallEntry.findMany({
      where: { published: true },
      include: { user: userInclude },
      orderBy: [{ isHighlight: "desc" }, { createdAt: "desc" }],
    })
    return rows.map(withEffectiveImage)
  }),

  listAll: protectedProcedure.query(async ({ ctx }) => {
    await assertCanManageNewUsersHall(ctx)
    const rows = await ctx.db.newUsersHallEntry.findMany({
      include: { user: userInclude },
      orderBy: [{ isHighlight: "desc" }, { createdAt: "desc" }],
    })
    return rows.map(withEffectiveImage)
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        setor: z.string().optional().nullable(),
        imageUrl: z.string().optional().nullable(),
        userId: z.string().optional().nullable(),
        published: z.boolean().optional().default(true),
        isHighlight: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanManageNewUsersHall(ctx)

      if (input.userId) {
        const linkedUser = await ctx.db.user.findUnique({ where: { id: input.userId } })
        if (!linkedUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" })
        }
        const existing = await ctx.db.newUsersHallEntry.findUnique({
          where: { userId: input.userId },
        })
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma entrada no Hall vinculada a este usuário",
          })
        }
      }

      const created = await ctx.db.newUsersHallEntry.create({
        data: {
          name: input.name.trim(),
          setor: input.setor?.trim() ? input.setor.trim() : null,
          imageUrl: input.imageUrl?.trim() ? input.imageUrl.trim() : null,
          userId: input.userId ?? null,
          published: input.published,
          isHighlight: input.isHighlight,
        },
        include: { user: userInclude },
      })
      return withEffectiveImage(created)
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        setor: z.string().optional().nullable(),
        imageUrl: z.string().optional().nullable(),
        userId: z.string().optional().nullable(),
        published: z.boolean().optional(),
        isHighlight: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanManageNewUsersHall(ctx)

      const current = await ctx.db.newUsersHallEntry.findUnique({ where: { id: input.id } })
      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entrada não encontrada" })
      }

      const nextUserId = input.userId !== undefined ? input.userId : current.userId

      if (nextUserId) {
        const linkedUser = await ctx.db.user.findUnique({ where: { id: nextUserId } })
        if (!linkedUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" })
        }
        const other = await ctx.db.newUsersHallEntry.findFirst({
          where: { userId: nextUserId, NOT: { id: input.id } },
        })
        if (other) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe outra entrada no Hall vinculada a este usuário",
          })
        }
      }

      const updated = await ctx.db.newUsersHallEntry.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.setor !== undefined
            ? { setor: input.setor?.trim() ? input.setor.trim() : null }
            : {}),
          ...(input.imageUrl !== undefined
            ? { imageUrl: input.imageUrl?.trim() ? input.imageUrl.trim() : null }
            : {}),
          ...(input.userId !== undefined ? { userId: input.userId } : {}),
          ...(input.published !== undefined ? { published: input.published } : {}),
          ...(input.isHighlight !== undefined ? { isHighlight: input.isHighlight } : {}),
        },
        include: { user: userInclude },
      })
      return withEffectiveImage(updated)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertCanManageNewUsersHall(ctx)
      try {
        await ctx.db.newUsersHallEntry.delete({ where: { id: input.id } })
      } catch {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entrada não encontrada" })
      }
      return { ok: true as const }
    }),
})
