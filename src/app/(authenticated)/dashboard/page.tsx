import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"

import { DashboardShell } from "@/components/dashboard-shell"
import { PostsList } from "@/components/posts-list"
import { QuickAccess } from "@/components/quick-access"

export const metadata: Metadata = {
  title: "Dashboard | Intranet",
  description: "Dashboard principal da intranet",
}

export default async function DashboardPage() {
  const { userId } = await auth()

  return (
    <DashboardShell>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <QuickAccess className="col-span-4" />
        <PostsList className="col-span-3" />
      </div>
    </DashboardShell>
  )
}

