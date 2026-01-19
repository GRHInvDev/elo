import type { Metadata } from "next"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { RoomAdmin } from "@/components/rooms/room-admin"
import { checkAdminAccess } from "@/lib/access-control-server"

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

