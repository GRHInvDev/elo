"use client"

import { useMemo, useRef } from "react"
import { api } from "@/trpc/react"
import { BirthdayConfetti } from "./birthday-confetti"

export function BirthdayConfettiWrapper() {
  // Busca o usuário atual
  const { data: currentUser } = api.user.me.useQuery()

  // Busca o aniversário do usuário atual
  const { data: myBirthday, isLoading: isLoadingBirthday } = api.birthday.getMine.useQuery(undefined, {
    enabled: !!currentUser?.id,
    staleTime: 0, // Dados ficam stale imediatamente - força refetch
    gcTime: 1000 * 60 * 2, // Cache por apenas 2 minutos (React Query v5)
    refetchOnWindowFocus: true, // Refaz quando a janela ganha foco
    refetchOnMount: true, // Sempre refaz ao montar
  })

  // Usa ref para rastrear a data atual sem causar re-renders
  const dateKeyRef = useRef(new Date().toDateString())

  // Verifica se hoje é o aniversário do usuário atual
  const isMyBirthdayToday = useMemo(() => {
    if (!myBirthday || !currentUser) {
      return false
    }

    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    
    // Atualiza a ref com a data atual
    dateKeyRef.current = today.toDateString()

    const birthdayDate = new Date(myBirthday.data)
    const isToday = (
      birthdayDate.getDate() === currentDay &&
      birthdayDate.getMonth() === currentMonth
    )

    // eslint-disable-next-line no-console
    console.log("🔍 BirthdayConfettiWrapper - Verificando aniversário:", {
      userId: currentUser.id,
      userName: currentUser.firstName ?? currentUser.email,
      myBirthday: myBirthday.data.toISOString(),
      today: today.toISOString(),
      birthdayDay: birthdayDate.getDate(),
      birthdayMonth: birthdayDate.getMonth() + 1,
      currentDay,
      currentMonth: currentMonth + 1,
      isMyBirthdayToday: isToday,
    })

    return isToday
  }, [myBirthday, currentUser])

  if (isLoadingBirthday || !currentUser) {
    return null
  }

  // Só mostra confetes se for o aniversário do usuário atual
  if (!isMyBirthdayToday || !myBirthday) {
    return null
  }

  // Cria array com o aniversário do usuário incluindo o user para passar ao componente
  // Usa type assertion pois o componente só precisa do birthday, não usa o user
  const myBirthdayArray = [{
    ...myBirthday,
    user: currentUser,
  }] as unknown as Parameters<typeof BirthdayConfetti>[0]['birthdays']

  // Usa a data atual como key para forçar remontagem quando o dia mudar
  return <BirthdayConfetti key={dateKeyRef.current} birthdays={myBirthdayArray} />
}

