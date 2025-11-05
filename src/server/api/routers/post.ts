import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { utapi } from "@/server/uploadthing"
import type { RolesConfig } from "@/types/role-config"
import { getNotificationWebSocketService } from "../../services/notification-websocket-service"

const createPostSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  imageUrl: z.string().optional(), // Mantido para compatibilidade
  images: z.array(z.string()).optional(), // Novas imagens múltiplas
  published: z.boolean().default(false),
})

export const postRouter = createTRPCRouter({
  create: protectedProcedure
  .input(createPostSchema)
  .mutation(async ({ ctx, input }) => {
    console.log("user Id", ctx.auth.userId)

    const { images, ...postData } = input

    const post = await ctx.db.post.create({
      data: {
        ...postData,
        authorId: ctx.auth.userId,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    // Criar registros de imagens se fornecidas
    if (images && images.length > 0) {
      await ctx.db.postImage.createMany({
        data: images.map((imageUrl, index) => ({
          postId: post.id,
          imageUrl,
          order: index,
        }))
      })
    }

    // Notificação: Novo Post para todos usuários
    try {
      const allUsers = await ctx.db.user.findMany({ select: { id: true } })
      const userIds = allUsers.map(u => u.id).filter(id => id !== ctx.auth.userId)

      if (userIds.length > 0) {
        const now = new Date()
        await ctx.db.notification.createMany({
          data: userIds.map(userId => ({
            title: 'Novo Post publicado',
            message: post.title,
            type: 'INFO',
            channel: 'IN_APP',
            userId,
            entityId: post.id,
            entityType: 'post',
            actionUrl: '/news',
            createdAt: now,
            updatedAt: now,
          }))
        })

        const wsService = getNotificationWebSocketService()
        if (wsService) {
          await Promise.all(userIds.map(uid => wsService.updateUnreadCount(uid)))
        }
      }
    } catch (notificationError) {
      console.error('Erro ao criar/emitter notificações de novo post:', notificationError)
    }

    return post
  }),

  update: protectedProcedure
  .input(createPostSchema.partial().extend({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
      })

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post não encontrado",
        })
      }

      // Verificar se o usuário tem permissões de admin ou é o autor
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true }
      })

      const roleConfig = user?.role_config as RolesConfig | null
      const isSudo = roleConfig?.sudo ?? false
      const hasAdminAccess = Array.isArray(roleConfig?.admin_pages) && roleConfig?.admin_pages.includes("/admin")
      const isAuthor = post.authorId === ctx.auth.userId

      if (!isAuthor && !isSudo && !hasAdminAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar este post",
        })
      }

      const { images, ...postData } = input

      // Atualizar o post
      const updatedPost = await ctx.db.post.update({
        where: { id: input.id },
        data: postData,
      })

      // Atualizar imagens se fornecidas
      if (images !== undefined) {
        // Deletar imagens existentes
        await ctx.db.postImage.deleteMany({
          where: { postId: input.id }
        })

        // Criar novas imagens se fornecidas
        if (images.length > 0) {
          await ctx.db.postImage.createMany({
            data: images.map((imageUrl, index) => ({
              postId: input.id,
              imageUrl,
              order: index,
            }))
          })
        }
      }

      return updatedPost
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const post = await ctx.db.post.findUnique({
      where: { id: input.id },
    })

    if (!post) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Post não encontrado",
      })
    }

    // Verificar se o usuário tem permissões de admin ou é o autor
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { role_config: true }
    })

    const roleConfig = user?.role_config as RolesConfig | null
    const isSudo = roleConfig?.sudo ?? false
    const hasAdminAccess = Array.isArray(roleConfig?.admin_pages) && roleConfig?.admin_pages.includes("/admin")
    const isAuthor = post.authorId === ctx.auth.userId

    if (!isAuthor && !isSudo && !hasAdminAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para deletar este post",
      })
    }

    // Deletar imagens do UploadThing
    if (post.imageUrl){
      await utapi.deleteFiles(post.imageUrl.replace("https://162synql7v.ufs.sh/f/", ""))
    }

    // Deletar imagens múltiplas do UploadThing
    const postImages = await ctx.db.postImage.findMany({
      where: { postId: input.id }
    })

    for (const image of postImages) {
      try {
        await utapi.deleteFiles(image.imageUrl.replace("https://162synql7v.ufs.sh/f/", ""))
      } catch (error) {
        console.error("Erro ao deletar imagem:", error)
      }
    }

    return ctx.db.post.delete({
      where: { id: input.id },
    })
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    // Verificar se o usuário tem permissões de admin para ver todos os posts
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { role_config: true }
    })

    const roleConfig = user?.role_config as RolesConfig | null
    const isSudo = roleConfig?.sudo ?? false
    const hasAdminAccess = Array.isArray(roleConfig?.admin_pages) && roleConfig?.admin_pages.includes("/admin")

    // Se for admin ou sudo, vê todos os posts (incluindo rascunhos); senão, apenas os publicados
    // NOTA: Por compatibilidade com posts existentes, usuários normais vêem todos os posts
    // exceto aqueles explicitamente marcados como rascunhos (published: false)
    const whereClause = (isSudo || hasAdminAccess)
      ? {} // Admins vêem todos os posts (incluindo rascunhos)
      : { NOT: { published: false } } // Usuários normais não vêem apenas rascunhos explícitos

    return ctx.db.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
            role_config: true,
            enterprise: true,
          },
        },
        images: {
          orderBy: { order: "asc" }
        },
        reactions: {
          distinct: ["emoji"]
        }
      },
      orderBy: { createdAt: "desc" },
    })
  }),

  // Lista todos os posts (para admins)
  listAll: protectedProcedure.query(async ({ ctx }) => {
    // Verificar se o usuário tem permissões de admin
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { role_config: true }
    })

    const roleConfig = user?.role_config as RolesConfig | null
    const isSudo = roleConfig?.sudo ?? false
    const hasAdminAccess = Array.isArray(roleConfig?.admin_pages) && roleConfig?.admin_pages.includes("/admin")

    if (!isSudo && !hasAdminAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para acessar esta funcionalidade",
      })
    }

    return ctx.db.post.findMany({
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
            role_config: true,
            enterprise: true,
            email: true,
          },
        },
        images: {
          orderBy: { order: "asc" }
        },
        reactions: {
          distinct: ["emoji"]
        }
      },
      orderBy: { createdAt: "desc" },
    })
  }),

  // Incrementa contador de visualizações
  incrementView: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.update({
        where: { id: input.id },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      })
    }),
})

