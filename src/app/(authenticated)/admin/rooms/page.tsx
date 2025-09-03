import type { Metadata } from "next"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { db } from "@/server/db"
import { DashboardShell } from "@/components/dashboard-shell"
import { RoomAdmin } from "@/components/room-admin"
import type { RolesConfig } from "@/types/role-config"

export const metadata: Metadata = {
  title: "Administração de Salas | elo",
  description: "Gerencie as salas da empresa",
}

export default async function AdminRoomsPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
  })

  const roleConfig = dbUser?.role_config as RolesConfig;
  const hasAdminAccess = !!roleConfig?.sudo ||
                        (Array.isArray(roleConfig?.admin_pages) && roleConfig.admin_pages.includes("/admin"));

  if (!dbUser || !hasAdminAccess) {
    redirect("/dashboard")
  }

  return (
    <DashboardShell>
      <RoomAdmin />
    </DashboardShell>
  )
}

