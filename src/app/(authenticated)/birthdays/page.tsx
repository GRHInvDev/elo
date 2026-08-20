import { DashboardShell } from "@/components/ui/dashboard-shell"
import { MonthlyBirthdays } from "@/components/birthday/monthly-birthdays"
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

        <div className="max-w-1xl mx-auto space-y-6">
          <div className="flex justify-center">
            <MonthlyBirthdays />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
