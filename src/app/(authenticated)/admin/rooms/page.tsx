import type { Metadata } from "next"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { db } from "@/server/db"
import { DashboardShell } from "@/components/dashboard-shell"
import { RoomAdmin } from "@/components/room-admin"

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

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <DashboardShell>
      <RoomAdmin />
    </DashboardShell>
  )
}

