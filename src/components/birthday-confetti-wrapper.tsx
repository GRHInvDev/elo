"use client"

import { api } from "@/trpc/react"
import { BirthdayConfetti } from "./birthday-confetti"

export function BirthdayConfettiWrapper() {
  const { data: todayBirthdays, isLoading, error } = api.birthday.getTodayBirthdays.useQuery(
    undefined,
    {
      refetchInterval: 1000 * 60 * 60, // Refaz a query a cada hora
      staleTime: 1000 * 60 * 30, // Considera os dados válidos por 30 minutos
    }
  )

  // Debug: log para verificar se está funcionando
    // eslint-disable-next-line no-console
    console.log("🎂 BirthdayConfettiWrapper:", {
      isLoading,
      hasData: !!todayBirthdays,
      count: todayBirthdays?.length ?? 0,
      error: error?.message,
    })

  if (isLoading) {
    return null
  }

  if (!todayBirthdays || todayBirthdays.length === 0) {
    return null
  }

  return <BirthdayConfetti birthdays={todayBirthdays} />
}

