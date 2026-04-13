import type { Metadata } from "next"

import { NewUsersHallAdminPanel } from "@/components/new-users-hall/new-users-hall-admin-panel"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { checkAdminAccess } from "@/lib/access-control-server"

export const metadata: Metadata = {
  title: "Hall de entrada | Admin",
  description: "Gerencie a comunicação de novos colaboradores na intranet",
}

export default async function AdminHallEntradaPage() {
  await checkAdminAccess("/admin/hall-entrada")

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestão do Hall de entrada</h1>
        <p className="text-muted-foreground mt-2">
        Cadastre colaboradores, defina foto e setor, publique no Hall e marque destaques — eles ficam no topo em cards maiores até você desativar o destaque.
        </p>
      </div>
      <NewUsersHallAdminPanel />
    </DashboardShell>
  )
}
