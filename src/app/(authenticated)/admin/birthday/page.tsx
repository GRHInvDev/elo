import type { Metadata } from "next"
import { DashboardShell } from "@/components/dashboard-shell"
import { BirthdayAdmin } from "@/components/birthday-admin"
import { checkAdminAccess } from "@/lib/access-control-server"

export const metadata: Metadata = {
  title: "Administração de Aniversários | Intranet",
  description: "Gerencie os aniversários da empresa",
}

export default async function AdminBirthdaysPage() {
  await checkAdminAccess("/admin/birthday")

  return (
    <DashboardShell>
      <BirthdayAdmin />
    </DashboardShell>
  )
}

