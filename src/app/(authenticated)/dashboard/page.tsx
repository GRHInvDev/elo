import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard-shell"
import { ContentFeed } from "@/components/content-feed"
import { QuickAccess } from "@/components/quick-access"

export const metadata: Metadata = {
  title: "Dashboard | elo",
  description: "Dashboard principal da elo",
}

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <QuickAccess className="col-span-4" />
        <ContentFeed className="col-span-3" />
      </div>
    </DashboardShell>
  )
}

