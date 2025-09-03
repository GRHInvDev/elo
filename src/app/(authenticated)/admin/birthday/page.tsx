import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { db } from "@/server/db"
import { DashboardShell } from "@/components/dashboard-shell"
import { BirthdayAdmin } from "@/components/birthday-admin"
import type { RolesConfig } from "@/types/role-config"

export const metadata: Metadata = {
  title: "Administração de Aniversários | Intranet",
  description: "Gerencie os aniversários da empresa",
}

export default async function AdminBirthdaysPage() {
  const userAuth = await auth()

  if (!userAuth) {
    redirect("/sign-in")
  }

  const dbUser = await db.user.findUnique({
    where: { id: userAuth.userId ?? undefined },
  })

  const roleConfig = dbUser?.role_config as RolesConfig;
  const hasAdminAccess = !!roleConfig?.sudo ||
                        (Array.isArray(roleConfig?.admin_pages) && roleConfig.admin_pages.includes("/admin"));

  if (!dbUser || !hasAdminAccess) {
    redirect("/dashboard")
  }

  return (
    <DashboardShell>
      <BirthdayAdmin />
    </DashboardShell>
  )
}

