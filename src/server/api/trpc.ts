/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import "server-only";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { currentUser } from "@clerk/nextjs/server"

import { db } from "@/server/db";
import type { RolesConfig } from "@/types/role-config";

// Type definitions for tRPC context
export interface TRPCContext {
  db: typeof db;
  auth: {
    userId: string | undefined;
  };
  headers: Headers;
}

export interface TRPCContextWithUser extends TRPCContext {
  user: {
    id: string;
    role_config: RolesConfig | null;
  };
}

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }): Promise<TRPCContext> => {
  let user = null;
  
  try {
    user = await currentUser();
  } catch (error) {
    // Erro do Clerk - não logar em produção para evitar spam
    // Apenas silenciosamente tratar como usuário não autenticado
    if (process.env.NODE_ENV === 'development') {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const clerkError = error && typeof error === 'object' && 'clerkError' in error;
      
      // Só logar se não for um erro comum do Clerk (como sessão inválida)
      if (!clerkError || errorMessage) {
        console.warn('[TRPC Context] Erro ao obter usuário atual:', errorMessage || 'Erro desconhecido do Clerk');
      }
    }
    // Continuar sem usuário - o protectedProcedure vai tratar a autenticação
    user = null;
  }

  return {
    db,
    auth: {
      userId: user?.id,
    },
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  // if (t._config.isDev) {
  //   // artificial delay in dev
  //   const waitMs = Math.floor(Math.random() * 400) + 100;
  //   await new Promise((resolve) => setTimeout(resolve, waitMs));
  // }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  // Verificação adicional para usuários potencialmente problemáticos
  // REMOVIDO: Query desnecessária que estava causando headers muito grandes
  // O role_config completo não é necessário aqui - apenas verificamos se o usuário existe
  try {
    const userExists = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { id: true } // Apenas verificar se existe, sem buscar role_config
    });

    if (!userExists) {
      console.warn(`[Protected Procedure] Usuário ${ctx.auth.userId} não encontrado no banco`);
    }

  } catch (error) {
    console.error('[Protected Procedure] Erro ao verificar usuário:', {
      userId: ctx.auth.userId,
      error: error
    });
    // Não vamos bloquear o acesso aqui - deixa o procedure específico tratar
  }

  return next({
    ctx: {
      ...ctx,
      auth: { userId: ctx.auth.userId },
    },
  })
})

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Buscar apenas os campos necessários para verificação de admin
  // Evitar buscar arrays grandes como unlocked_forms, hidden_forms, etc.
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.auth.userId },
    select: {
      id: true,
      role_config: true, // Mantém para compatibilidade, mas pode ser otimizado futuramente
    }
  })

  if (!user) {
    throw new TRPCError({ code: "FORBIDDEN" })
  }

  // Verificar se é sudo ou tem acesso admin
  const roleConfig = user.role_config as RolesConfig;
  const hasAdminAccess = !!roleConfig?.sudo ||
                        (Array.isArray(roleConfig?.admin_pages) && roleConfig.admin_pages.includes("/admin"));

  if (!hasAdminAccess) {
    throw new TRPCError({ code: "FORBIDDEN" })
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  })
})

export const middleware = t.middleware