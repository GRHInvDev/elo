"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MonthlyBirthdays } from "@/components/monthly-birthdays"

export function BirthdaysTab(): JSX.Element {
  return (
    <div className="space-y-4">
      <MonthlyBirthdays />
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/birthdays">Ver todos os aniversários</Link>
        </Button>
      </div>
    </div>
  )
}


