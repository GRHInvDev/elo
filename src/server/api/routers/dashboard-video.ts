import "server-only"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import type { RolesConfig } from "@/types/role-config"
import { normalizeYouTubeEmbedUrl } from "@/lib/youtube"

/**
 * Gestão de vídeos do dashboard: restrita a sudo ou a quem tem a
 * página /admin/videos liberada em admin_pages.
 */
function checkPermission(roleConfig: RolesConfig | null | undefined): void {
  if (roleConfig?.sudo) return
  if (roleConfig?.admin_pages?.includes("/admin/videos")) return
  if (roleConfig?.admin_pages?.includes("/admin/banners")) return
  if (roleConfig?.admin_pages?.includes("/admin")) return
  if (roleConfig?.admin_pages?.some((p) => p.startsWith("/admin"))) return
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Você não tem permissão para gerenciar os vídeos do dashboard",
  })
}

const videoInputSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(120),
  youtubeUrl: z.string().trim().min(1, "Link do YouTube é obrigatório"),
  published: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
})

export const dashboardVideoRouter = createTRPCRouter({
  /** Vídeos publicados para exibição no dashboard */
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.dashboardVideo.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })
  }),

  /** Todos os vídeos cadastrados, para a página administrativa */
  adminList: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { role_config: true },
    })
    checkPermission(user?.role_config as RolesConfig | null)

    return ctx.db.dashboardVideo.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })
  }),

  create: protectedProcedure
    .input(videoInputSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      const normalizedUrl = normalizeYouTubeEmbedUrl(input.youtubeUrl)

      return ctx.db.dashboardVideo.create({
        data: {
          title: input.title,
          youtubeUrl: normalizedUrl,
          published: input.published,
          order: input.order,
        },
      })
    }),

  update: protectedProcedure
    .input(videoInputSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      const video = await ctx.db.dashboardVideo.findUnique({
        where: { id: input.id },
      })
      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vídeo não encontrado" })
      }

      const { id, ...data } = input
      if (data.youtubeUrl !== undefined) {
        data.youtubeUrl = normalizeYouTubeEmbedUrl(data.youtubeUrl)
      }

      return ctx.db.dashboardVideo.update({
        where: { id },
        data,
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      const video = await ctx.db.dashboardVideo.findUnique({
        where: { id: input.id },
      })
      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vídeo não encontrado" })
      }

      return ctx.db.dashboardVideo.delete({ where: { id: input.id } })
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            order: z.number().int(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      checkPermission(user?.role_config as RolesConfig | null)

      await ctx.db.$transaction(
        input.items.map((item) =>
          ctx.db.dashboardVideo.update({
            where: { id: item.id },
            data: { order: item.order },
          }),
        ),
      )

      return { success: true }
    }),
})
