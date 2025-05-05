import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, LucideFileVideo } from "lucide-react"
import Link from "next/link"
import { FormsList } from "@/components/forms/forms-list"
import { Suspense } from "react"
import { FormsSkeleton } from "@/components/forms/forms-skeleton"
import { DashboardShell } from "@/components/dashboard-shell"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export const metadata = {
  title: "Formulários",
  description: "Gerencie e responda formulários",
}

export default async function FormsPage() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-8 gap-y-4 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formulários</h1>
          <p className="text-muted-foreground mt-2 mb-4">Crie, gerencie e responda formulários personalizados.</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                Tutorial <LucideFileVideo className="size-4"/>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Tutorial: Formulários
                </DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <iframe className="w-full aspect-video" src="https://www.youtube.com/embed/aSRZI9TmcC8?si=r6FZgNmOgoP8lhjP" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex gap-3 flex-col md:flex-row w-full md:w-auto">
          <Link href="/forms/my-responses">
            <Button variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Minhas Respostas
            </Button>
          </Link>
          <Link href="/forms/new">
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Formulário
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<FormsSkeleton />}>
        <FormsList />
      </Suspense>
    </DashboardShell>
  )
}
// <iframe width="560" height="315" src="https://www.youtube.com/embed/aSRZI9TmcC8?si=r6FZgNmOgoP8lhjP" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
