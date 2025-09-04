import type { Metadata } from "next"
import { DashboardShell } from "@/components/dashboard-shell"
import { RoomAdmin } from "@/components/room-admin"
import { checkAdminAccess } from "@/lib/access-control"

export const metadata: Metadata = {
  title: "Administração de Salas | elo",
  description: "Gerencie as salas da empresa",
}

export default async function AdminRoomsPage() {
  await checkAdminAccess("/admin/rooms")

  return (
    <DashboardShell>
      <RoomAdmin />
    </DashboardShell>
  )
}

