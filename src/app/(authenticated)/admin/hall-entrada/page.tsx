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
        <h1 className="text-3xl font-bold tracking-tight">Hall de entrada</h1>
        <p className="text-muted-foreground mt-2">
          Gerenciamento das entradas exibidas em{" "}
          <span className="font-medium text-foreground">/forms/hall-entrada</span>.
        </p>
      </div>
      <NewUsersHallAdminPanel />
    </DashboardShell>
  )
}
