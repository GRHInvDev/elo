import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { db } from "@/server/db"
import type { RolesConfig } from "@/types/role-config"

/**
 * Diagnóstico de sessão e acesso, do lado do servidor.
 *
 * Existe para separar dois problemas que se parecem na tela: "o componente do
 * Clerk não renderizou" e "a sessão do usuário está inválida". Não depende de
 * nenhum componente do Clerk carregar no navegador — basta abrir a URL no
 * aparelho com problema e ler o JSON.
 *
 * Responde sobre o usuário da própria requisição, e só sobre ele. Nunca devolve
 * valores de variáveis de ambiente: das credenciais, apenas se estão presentes.
 */

// Sem prerender e sem cache: a rota existe justamente para investigar cache.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Cabeçalhos que garantem resposta fresca em qualquer proxy do caminho. */
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
} as const

/** Resumo do acesso que vive no nosso banco, não no Clerk. */
function summarizeAccess(roleConfig: RolesConfig | null) {
  if (!roleConfig) {
    return { configured: false as const }
  }

  return {
    configured: true as const,
    sudo: roleConfig.sudo === true,
    isTotem: roleConfig.isTotem === true,
    adminPages: Array.isArray(roleConfig.admin_pages)
      ? roleConfig.admin_pages
      : [],
  }
}

export async function GET() {
  const startedAt = Date.now()

  let clerkUserId: string | null = null
  let clerkSessionId: string | null = null
  let clerkError: string | null = null

  try {
    const session = await auth()
    clerkUserId = session.userId
    clerkSessionId = session.sessionId
  } catch (error) {
    // Clerk indisponível ou sessão ilegível: é um dos diagnósticos possíveis,
    // então virou dado da resposta em vez de derrubar a rota.
    clerkError = error instanceof Error ? error.message : String(error)
  }

  let database: Record<string, unknown> = { checked: false }

  if (clerkUserId) {
    try {
      const user = await db.user.findUnique({
        where: { id: clerkUserId },
        select: {
          id: true,
          email: true,
          is_active: true,
          enterprise: true,
          setor: true,
          filialId: true,
          role_config: true,
        },
      })

      database = user
        ? {
            checked: true,
            found: true,
            /** Conta desativada é bloqueada em toda a plataforma. */
            isActive: user.is_active,
            email: user.email,
            enterprise: user.enterprise,
            setor: user.setor,
            filialId: user.filialId,
            access: summarizeAccess(user.role_config as RolesConfig | null),
          }
        : {
            checked: true,
            found: false,
            /** Sessão válida sem registro local: webhook do Clerk não rodou. */
            hint: "Sessão do Clerk válida, mas o usuário não existe na tabela users",
          }
    } catch (error) {
      database = {
        checked: true,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  return NextResponse.json(
    {
      serverTime: new Date().toISOString(),
      /** Compare com o ?dpl= das URLs de chunk para detectar HTML defasado. */
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      environment: process.env.NODE_ENV,
      clerk: {
        authenticated: clerkUserId !== null,
        userId: clerkUserId,
        sessionId: clerkSessionId,
        error: clerkError,
        /** Só a presença: o valor da chave nunca é exposto. */
        publishableKeyPresent:
          typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0,
        secretKeyPresent:
          typeof process.env.CLERK_SECRET_KEY === "string" &&
          process.env.CLERK_SECRET_KEY.length > 0,
      },
      database,
      tookMs: Date.now() - startedAt,
    },
    { headers: NO_STORE_HEADERS },
  )
}
