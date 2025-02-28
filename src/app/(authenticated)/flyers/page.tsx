import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard-shell"
import { FlyersList } from "@/components/flyers-list"
import { CreateFlyerButton } from "@/components/create-flyer-button"

export const metadata: Metadata = {
  title: "Encartes | elo",
  description: "Encartes da empresa",
}

export default function FlyersPage() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Encartes</h2>
          <p className="text-muted-foreground">Confira os encartes disponíveis</p>
        </div>
        <CreateFlyerButton />
      </div>
      <FlyersList />
    </DashboardShell>
  )
}
