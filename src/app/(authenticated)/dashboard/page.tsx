import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard-shell"
import { ContentFeed } from "@/components/content-feed"
import { QuickAccess } from "@/components/quick-access"
import { api } from "@/trpc/server"
import { MonthlyBirthdays } from "@/components/monthly-birthdays"

export const metadata: Metadata = {
  title: "Dashboard | elo",
  description: "Dashboard principal da elo",
}

export default async function DashboardPage() {
  const me = await api.user.me();
  const today = new Date();
  
  return (
    <DashboardShell>
      <div>
        {me?.birthDay?.data && 
          me?.birthDay?.data.getDate() === today.getDate() && 
          me?.birthDay?.data.getMonth() === today.getMonth() ?
          <div>
            <h1 className='text-2xl font-bold'>Feliz aniversário {me.firstName}!! 🎉</h1>
          </div>
          :
          <div>
            <h1 className='text-2xl font-bold'>Olá {me?.firstName}!</h1>
          </div>
        }
      </div>
      <div className="flex flex-col-reverse md:grid gap-4 md:grid-cols-2 lg:grid-cols-7 w-full">
        <ContentFeed className="col-span-5 w-full" />
        <div className="col-span-2 space-y-4 w-full">
          <QuickAccess className="w-full" />
          <MonthlyBirthdays className="w-full"/>
        </div>
      </div>
    </DashboardShell>
  )
}