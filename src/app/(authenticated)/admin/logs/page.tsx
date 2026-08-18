"use client"

import { Activity, Loader2 } from "lucide-react"

import { AccessLogsView } from "./access-logs-view"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { useAccessControl } from "@/hooks/use-access-control"

export default function AccessLogsPage() {
  const { isSudo, hasAdminAccess, isLoading } = useAccessControl()
  const hasAccess = isSudo || hasAdminAccess("/admin/logs")

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    )
  }

  if (!hasAccess) {
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Acesso Negado</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <AccessLogsView />
    </DashboardShell>
  )
}
