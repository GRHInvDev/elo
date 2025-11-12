"use client"

import { useMemo, useState, useEffect } from "react"
import { api } from "@/trpc/react"
import { BirthdayConfetti } from "./birthday-confetti"

export function BirthdayConfettiWrapper() {
  // Estado para rastrear a data atual e forçar atualização quando mudar
  const [currentDateKey, setCurrentDateKey] = useState(() => new Date().toDateString())

  // Atualiza a data a cada minuto para detectar mudança de dia
  useEffect(() => {
    const interval = setInterval(() => {
      const newDateKey = new Date().toDateString()
      if (newDateKey !== currentDateKey) {
        setCurrentDateKey(newDateKey)
      }
    }, 1000 * 60) // Verifica a cada minuto

    return () => clearInterval(interval)
  }, [currentDateKey])

  // Usa a mesma query do dashboard
  // Configura cache para invalidar quando necessário
  const { data: birthdays, isLoading } = api.birthday.listCurrentMonth.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutos - dados ficam frescos por pouco tempo
    refetchInterval: 1000 * 60 * 30, // Refaz a query a cada 30 minutos
    refetchOnWindowFocus: true, // Refaz quando a janela ganha foco
  })

  // Usa a mesma lógica do dashboard para filtrar aniversários de hoje
  // Recalcula quando birthdays ou a data mudar
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
  }, [birthdays, currentDateKey]) // Recalcula quando a data muda

  if (isLoading) {
    return null
  }

  if (!todayBirthdays || todayBirthdays.length === 0) {
    return null
  }

  // Usa a data atual como key para forçar remontagem quando o dia mudar
  return <BirthdayConfetti key={currentDateKey} birthdays={todayBirthdays} />
}

