import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, LucideFileVideo, LucideKanbanSquare } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { FormsList } from "@/components/forms/forms-list"
import { Suspense } from "react"
import { FormsSkeleton } from "@/components/forms/forms-skeleton"
import { DashboardShell } from "@/components/dashboard-shell"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { api } from "@/trpc/server"
import { canViewForms, canCreateForm } from "@/lib/access-control"

export const metadata = {
  title: "Solicitações",
  description: "Gerencie e responda solicitações",
}

export default async function FormsPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in?redirect_url=/forms")
  }

  // Buscar dados do usuário para verificar permissões
  const userData = await api.user.me()

  // Verificar se o usuário tem permissão para visualizar a página de solicitações
  if (!canViewForms(userData.role_config)) {
    redirect("/dashboard")
  }

  // Verificar se o usuário tem permissão para criar solicitações
  const userCanCreateForm = canCreateForm(userData.role_config)
  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-8 gap-y-4 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitações</h1>
          <p className="text-muted-foreground mt-2 mb-4">
            {userCanCreateForm 
              ? "Crie, gerencie e responda solicitações personalizadas." 
              : "Responda aos solicitações disponíveis para você."
            }
          </p>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  Tutorial <LucideFileVideo className="size-4"/>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Tutorial: Solicitações
                  </DialogTitle>
                </DialogHeader>
                <DialogFooter>
                  <iframe className="w-full aspect-video" src="https://www.youtube.com/embed/aSRZI9TmcC8?si=r6FZgNmOgoP8lhjP" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Link href="/forms/kanban">
              <Button className="w-full" variant='outline'>
                <LucideKanbanSquare className="mr-2 h-4 w-4" />
                Kanban
              </Button>
            </Link> 
          </div>
        </div>
        <div className="flex gap-3 flex-col md:flex-row w-full md:w-auto">
          <Link href="/forms/my-responses">
            <Button variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Minhas respostas
            </Button>
          </Link>
          {userCanCreateForm && (
            <Link href="/forms/new">
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar um novo formulário
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Suspense fallback={<FormsSkeleton />}>
        <FormsList />
      </Suspense>
    </DashboardShell>
  )
}
// <iframe width="560" height="315" src="https://www.youtube.com/embed/aSRZI9TmcC8?si=r6FZgNmOgoP8lhjP" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
