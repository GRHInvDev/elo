import { UserResponsesList } from "@/components/forms/user-responses-list"
import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ResponsesSkeleton } from "@/components/forms/responses-skeleton"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { FormsSubPageShell } from "@/components/forms/v2/forms-sub-page-shell"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Minhas solicitações",
  description: "Visualize suas respostas a solicitações",
}

export default async function MyResponsesPage() {
  return (
    <DashboardShell>
      <FormsSubPageShell
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Solicitações", href: "/forms" },
          { label: "Minhas solicitações" },
        ]}
        title="Minhas solicitações"
        description="Visualize e acompanhe o status de todas as suas respostas a solicitações."
        actions={
          <Link href="/forms">
            <Button className="bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] hover:bg-[hsl(var(--brand-accent)/.9)]">
              <Plus className="mr-2 h-4 w-4" />
              Nova solicitação
            </Button>
          </Link>
        }
      >
        <Suspense fallback={<ResponsesSkeleton />}>
          <UserResponsesList />
        </Suspense>
      </FormsSubPageShell>
    </DashboardShell>
  )
}

