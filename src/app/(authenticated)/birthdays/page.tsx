import { DashboardShell } from "@/components/dashboard-shell"
import { MonthlyBirthdays } from "@/components/monthly-birthdays"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cake } from "lucide-react"

export const metadata = {
  title: "Aniversários | Intranet",
  description: "Aniversários do mês",
}

export default function BirthdaysPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Cake className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Aniversários</h1>
            <p className="text-muted-foreground">
              Aniversariantes do mês atual
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <MonthlyBirthdays />
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cake className="h-5 w-5" />
                Sobre os Aniversários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nesta página você pode visualizar todos os aniversariantes do mês atual.
                Os aniversários são exibidos com foto quando disponível, ou com as iniciais do nome.
              </p>

              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Aniversariante hoje</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-muted-foreground/20 rounded-full"></div>
                  <span>Aniversariante em outro dia</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
