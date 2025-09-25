import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { UserResponsesList } from "@/components/forms/user-responses-list"
import { Suspense } from "react"
import { ResponsesSkeleton } from "@/components/forms/responses-skeleton"
import { DashboardShell } from "@/components/dashboard-shell"

export const metadata = {
  title: "Minhas Respostas",
  description: "Visualize suas respostas a solicitações",
}

export default async function MyResponsesPage() {
  return (
    <DashboardShell>
      <div className="mb-8">
        <Link href="/forms">
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para solicitações
          </Button>
        </Link>

        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight">Minhas Respostas</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e acompanhe o status de todas as suas respostas a solicitações.
          </p>
        </div>
      </div>

      <Suspense fallback={<ResponsesSkeleton />}>
        <UserResponsesList />
      </Suspense>
    </DashboardShell>
  )
}

