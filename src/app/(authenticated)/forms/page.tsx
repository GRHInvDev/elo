import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, LucideFileVideo, LucideKanbanSquare, LifeBuoy } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { FormsList } from "@/components/forms/forms-list"
import { Suspense } from "react"
import { FormsSkeleton } from "@/components/forms/forms-skeleton"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { api } from "@/trpc/server"
import { canViewForms, canCreateForm, canManageRequests } from "@/lib/access-control"
import { FormsPageSwitch } from "@/components/forms/v2/forms-page-switch"
import { FormsListV2 } from "@/components/forms/v2/forms-list-v2"
import { LayoutSwitch } from "@/components/ui/layout-switch"

export const metadata = {
  title: "Solicitações",
  description: "Gerencie e responda solicitações",
}

export default async function FormsPage() {
  let user;

  try {
    user = await currentUser();
  } catch (error) {
    console.warn('[FormsPage] Erro ao obter usuário:', error instanceof Error ? error.message : 'Erro desconhecido');
    redirect("/sign-in?redirect_url=/forms");
  }

  if (!user) {
    redirect("/sign-in?redirect_url=/forms")
  }

  const userData = await api.user.me()

  if (!canViewForms(userData.role_config)) {
    redirect("/dashboard")
  }

  const userCanCreateForm = canCreateForm(userData.role_config)
  const userCanManageRequests = canManageRequests(userData.role_config)
  // Fallback: se não tem flag explícita mas é dono de algum formulário,
  // também pode acessar a Central (atende seus próprios chamados).
  const isOwnerOfAnyForm = userCanManageRequests
    ? true
    : await api.form.isOwnerOfAnyForm().catch(() => false)
  const showCentralLink = userCanManageRequests || isOwnerOfAnyForm

  const classicView = (
    <>
      <div className="flex items-center justify-between mb-8 gap-y-4 flex-col md:flex-row">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Solicitações</h1>
            <LayoutSwitch />
          </div>
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
                  Tutorial <LucideFileVideo className="size-4" />
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
              Minhas solicitações
            </Button>
          </Link>
          {showCentralLink && (
            <Link href="/forms/central">
              <Button variant="outline" className="w-full">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Central de chamados
              </Button>
            </Link>
          )}
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
    </>
  )

  const v2View = (
    <FormsListV2
      userCanCreateForm={userCanCreateForm}
      showCentralLink={showCentralLink}
    />
  )

  return (
    <DashboardShell>
      <FormsPageSwitch classic={classicView} v2={v2View} />
    </DashboardShell>
  )
}
