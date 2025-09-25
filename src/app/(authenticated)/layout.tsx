import type { Metadata } from "next"
import AuthenticatedLayoutClient from "./layout-client"

// Forçar renderização dinâmica para layouts autenticados
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Elo | Intranet"
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayoutClient>{children}</AuthenticatedLayoutClient>
}

