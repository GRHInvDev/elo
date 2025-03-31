import type { Metadata } from "next"

import { MainCarousel } from "@/components/dashboard/main-carousel"
import { BirthdaysCarousel } from "@/components/dashboard/birthdays-carousel"
import { api } from "@/trpc/server"
import { cn } from "@/lib/utils"
import { LucidePlane } from "lucide-react"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Dashboard | elo",
  description: "Dashboard principal da elo",
}

export default async function DashboardPage() {
  const birthdays = await api.birthday.listCurrentMonth();
  const posts = []

  return (
    <div>
      <div className={cn("grid grid-cols-1 md:grid-cols-3", (birthdays?.length>0 || posts.length>0 ) && "md:grid-cols-1")}>
        {
          posts?.length > 0 &&
          <MainCarousel className={cn("col-span-1 md:col-span-2", (birthdays?.length>0) && "md:col-span-1")} itens={posts}/>
        }
        {
          birthdays?.length> 0 &&
          <BirthdaysCarousel className="col-span-1" itens={birthdays?.map((b)=>({
            imageRef: b.imageUrl,
            title: b.Name,
          }))}/>
        }
      </div>
      <div>
        <div className="ml-16 mt-16">
          <div className="flex items-center gap-8">
            <div className="p-2 bg-foreground size-28 flex items-center justify-center">
              <LucidePlane className="text-background size-20 rotate-45"/>
            </div>
            <h1 className="text-4xl font-semibold">
              OnBoarding
            </h1>
          </div>
          <div>
            <Image alt='' fill src={'/placeholder.svg'}/>
          </div>
        </div>
      </div>
    </div>
  )
}