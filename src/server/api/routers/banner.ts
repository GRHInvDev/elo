import "server-only"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { utapi } from "@/server/uploadthing"
import type { RolesConfig } from "@/types/role-config"

/**
 * Gestão de banners do carrossel principal: restrita a sudo ou a quem tem a
 * página /admin/banners liberada em admin_pages.
 */
function checkPermission(roleConfig: RolesConfig | null | undefined): void {
  if (roleConfig?.sudo) return
  if (roleConfig?.admin_pages?.includes("/admin/banners")) return
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Você não tem permissão para gerenciar banners",
  })
}

/**
 * Remove do UploadThing a imagem de um banner, quando aplicável.
 * Imagens seed (servidas de /public/banners) não estão no UploadThing.
 */
async function deleteUploadedImage(imageUrl: string): Promise<void> {
  const key = /\.ufs\.sh\/f\/(.+)$/.exec(imageUrl)?.[1]
  if (!key) return
  try {
    await utapi.deleteFiles(key)
  } catch (error) {
    console.error(
      "Erro ao remover imagem de banner do UploadThing:",
      error instanceof Error ? error.message : error,
    )
  }
}

// Link opcional: aceita URL absoluta (http/https) ou caminho interno ("/...").
const linkUrlSchema = z
  .string()
  .trim()
  .refine(
    (v) => v.startsWith("/") || /^https?:\/\/.+/.test(v),
    "Link deve ser uma URL (https://...) ou um caminho interno (/...)",
  )

const bannerInputSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(120),
  imageUrl: z.string().min(1, "Imagem é obrigatória"),
  linkUrl: linkUrlSchema.nullish(),
  published: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
})

export const bannerRouter = createTRPCRouter({
  /** Banners publicados, na ordem de exibição do carrossel do dashboard. */
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.banner.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })
  }),

  /** Todos os banners (inclusive despublicados), para a tela de administração. */
  adminList: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { role_config: true },
    })
    checkPermission(user?.role_config as RolesConfig | null)

    return ctx.db.banner.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })
  }),

  create: protectedProcedure
    .input(bannerInputSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      return ctx.db.banner.create({
        data: { ...input, linkUrl: input.linkUrl ?? null },
      })
    }),

  update: protectedProcedure
    .input(bannerInputSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      const banner = await ctx.db.banner.findUnique({
        where: { id: input.id },
      })
      if (!banner) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Banner não encontrado" })
      }

      // Se a imagem foi trocada, remover a antiga do UploadThing.
      if (input.imageUrl && input.imageUrl !== banner.imageUrl) {
        await deleteUploadedImage(banner.imageUrl)
      }

      const { id, ...data } = input
      return ctx.db.banner.update({ where: { id }, data })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      const banner = await ctx.db.banner.findUnique({
        where: { id: input.id },
      })
      if (!banner) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Banner não encontrado" })
      }

      await deleteUploadedImage(banner.imageUrl)

      return ctx.db.banner.delete({ where: { id: input.id } })
    }),
})
