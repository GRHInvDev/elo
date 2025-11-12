"use client"

import { useMemo, useRef, useEffect } from "react"
import { api } from "@/trpc/react"
import { BirthdayConfetti } from "./birthday-confetti"

export function BirthdayConfettiWrapper() {
  const utils = api.useUtils()
  
  // Força refetch ao montar para garantir dados frescos
  useEffect(() => {
    void utils.birthday.listCurrentMonth.invalidate()
  }, [utils])

  // Usa a mesma query do dashboard
  // Configura cache para invalidar rapidamente
  const { data: birthdays, isLoading, dataUpdatedAt } = api.birthday.listCurrentMonth.useQuery(undefined, {
    staleTime: 0, // Dados ficam stale imediatamente - força refetch
    cacheTime: 1000 * 60 * 2, // Cache por apenas 2 minutos
    refetchInterval: 1000 * 60 * 5, // Refaz a query a cada 5 minutos
    refetchOnWindowFocus: true, // Refaz quando a janela ganha foco
    refetchOnMount: true, // Sempre refaz ao montar
  })

  // Usa ref para rastrear a data atual sem causar re-renders
  const dateKeyRef = useRef(new Date().toDateString())

  // Usa a mesma lógica do dashboard para filtrar aniversários de hoje
  // Recalcula apenas quando birthdays mudar
  const todayBirthdays = useMemo(() => {
    if (!birthdays) {
      // eslint-disable-next-line no-console
      console.log("🔍 BirthdayConfettiWrapper: Sem dados de aniversários")
      return []
    }

    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    
    // Atualiza a ref com a data atual
    dateKeyRef.current = today.toDateString()

    // Log detalhado para debug
    // eslint-disable-next-line no-console
    console.log("🔍 BirthdayConfettiWrapper - Debug:", {
      dataUpdatedAt: new Date(dataUpdatedAt).toISOString(),
      totalBirthdays: birthdays.length,
      today: today.toISOString(),
      currentDay,
      currentMonth: currentMonth + 1,
      allBirthdays: birthdays.map((b) => ({
        id: b.id,
        name: b.name,
        data: b.data.toISOString(),
        day: new Date(b.data).getDate(),
        month: new Date(b.data).getMonth() + 1,
      })),
    })

    const filtered = birthdays.filter((birthday) => {
      const birthdayDate = new Date(birthday.data)
      const matches = (
        birthdayDate.getDate() === currentDay &&
        birthdayDate.getMonth() === currentMonth
      )
      
      if (matches) {
        // eslint-disable-next-line no-console
        console.log("✅ Aniversário encontrado para hoje:", {
          id: birthday.id,
          name: birthday.name,
          birthdayDate: birthdayDate.toISOString(),
        })
      }
      
      return matches
    })

    // eslint-disable-next-line no-console
    console.log("🎂 Total de aniversários de HOJE:", filtered.length)

    return filtered
  }, [birthdays, dataUpdatedAt]) // Recalcula quando dados mudam

  if (isLoading) {
    return null
  }

  if (!todayBirthdays || todayBirthdays.length === 0) {
    return null
  }

  // Usa a data atual como key para forçar remontagem quando o dia mudar
  return <BirthdayConfetti key={dateKeyRef.current} birthdays={todayBirthdays} />
}

