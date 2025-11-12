"use client"

import { useMemo } from "react"
import { api } from "@/trpc/react"
import { BirthdayConfetti } from "./birthday-confetti"

export function BirthdayConfettiWrapper() {
  // Usa a mesma query do dashboard
  const { data: birthdays, isLoading } = api.birthday.listCurrentMonth.useQuery()

  // Usa a mesma lógica do dashboard para filtrar aniversários de hoje
  const todayBirthdays = useMemo(() => {
    if (!birthdays) {
      return []
    }

    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()

    return birthdays.filter((birthday) => {
      const birthdayDate = new Date(birthday.data)
      return (
        birthdayDate.getDate() === currentDay &&
        birthdayDate.getMonth() === currentMonth
      )
    })
  }, [birthdays])

  if (isLoading) {
    return null
  }

  if (!todayBirthdays || todayBirthdays.length === 0) {
    return null
  }

  return <BirthdayConfetti birthdays={todayBirthdays} />
}

