import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/server/db"
import AuthenticatedLayoutClient from "./layout-client"

// Forçar renderização dinâmica para layouts autenticados
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Elo | Intranet"
}

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Bloqueio total para contas desativadas: não podem acessar/visualizar nada.
  // Redireciona para a página de aviso (fora deste grupo de layout).
  const { userId } = await auth()
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { is_active: true },
    })
    if (user?.is_active === false) {
      redirect("/conta-desativada")
    }
  }

  return <AuthenticatedLayoutClient>{children}</AuthenticatedLayoutClient>
}

