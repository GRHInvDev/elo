"use client"

import { api } from "@/trpc/react"
import { BirthdayConfetti } from "./birthday-confetti"

export function BirthdayConfettiWrapper() {
  const { data: todayBirthdays } = api.birthday.getTodayBirthdays.useQuery(
    undefined,
    {
      refetchInterval: 1000 * 60 * 60, // Refaz a query a cada hora
      staleTime: 1000 * 60 * 30, // Considera os dados válidos por 30 minutos
    }
  )

  if (!todayBirthdays || todayBirthdays.length === 0) {
    return null
  }

  return <BirthdayConfetti birthdays={todayBirthdays} />
}

