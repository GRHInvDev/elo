import { UserResponsesList } from "@/components/forms/user-responses-list"
import { Suspense } from "react"
import { ResponsesSkeleton } from "@/components/forms/responses-skeleton"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { FormsSubPageShell } from "@/components/forms/v2/forms-sub-page-shell"

export const metadata = {
  title: "Minhas solicitações",
  description: "Visualize suas respostas a solicitações",
}

export default async function MyResponsesPage() {
  return (
    <DashboardShell>
      <FormsSubPageShell
        backHref="/forms"
        backLabel="Voltar para solicitações"
        title="Minhas solicitações"
        description="Visualize e acompanhe o status de todas as suas respostas a solicitações."
      >
        <Suspense fallback={<ResponsesSkeleton />}>
          <UserResponsesList />
        </Suspense>
      </FormsSubPageShell>
    </DashboardShell>
  )
}

