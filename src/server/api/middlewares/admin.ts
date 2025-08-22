import { TRPCError } from "@trpc/server"
import { middleware } from "../trpc"

/**
 * Middleware que verifica se o usuário é ADMIN
 * Permite acesso multi-admin mas bloqueia usuários comuns
 */
export const adminMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Você deve estar logado para acessar esta funcionalidade.",
    })
  }

  const user = await ctx.db.user.findUnique({
    where: { id: ctx.auth.userId },
    select: { role: true, email: true },
  })

  if (!user || user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN", 
      message: "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: {
        ...user,
        id: ctx.auth.userId,
      },
    },
  })
})