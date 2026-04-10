"use client"

import { useEffect, useRef } from "react"
import type { Birthday, User } from "@prisma/client"
import { isSameUtcMonthDay } from "@/lib/date-utils"
import { Confetti, type ConfettiRef } from "@/registry/magicui/confetti"

interface BirthdayConfettiProps {
  birthdays: (Birthday & { user: User | null })[]
}

export function BirthdayConfetti({ birthdays }: BirthdayConfettiProps) {
  const confettiRef = useRef<ConfettiRef>(null)

  // Usa a data atual como chave para resetar quando o dia mudar
  const todayKey = useRef(new Date().toDateString())
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    // Verifica se está no browser
    if (typeof window === "undefined") {
      return
    }

    // Verifica se o dia mudou - se sim, reseta o estado
    const currentDateKey = new Date().toDateString()
    if (todayKey.current !== currentDateKey) {
      todayKey.current = currentDateKey
      hasTriggeredRef.current = false
    }

    // Verifica se realmente é hoje antes de disparar (comparando em UTC)
    const today = new Date()
    const hasTodayBirthday = birthdays.some((birthday) => {
      const birthdayDate = new Date(birthday.data)
      return isSameUtcMonthDay(today, birthdayDate)
    })

    // Só dispara confetes se houver aniversários de HOJE e ainda não tiver disparado
    if (!hasTodayBirthday || birthdays.length === 0 || hasTriggeredRef.current) {
      return
    }

    let intervalId: number | null = null
    let centralTimeoutId: number | null = null

    // Pequeno delay para garantir que o DOM está pronto
    const timeoutId = setTimeout(() => {
      const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]

      const durationMs = 3000
      const end = Date.now() + durationMs

      // Dispara pequenos bursts em loop até completar o tempo.
      intervalId = window.setInterval(() => {
        if (Date.now() >= end) {
          if (intervalId) window.clearInterval(intervalId)
          return
        }

        confettiRef.current?.fire({
          particleCount: 6,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        })

        confettiRef.current?.fire({
          particleCount: 6,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        })
      }, 120)

      // Explosão central após um pequeno delay
      centralTimeoutId = window.setTimeout(() => {
        confettiRef.current?.fire({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors,
        })
      }, 500)

      // Marca como já disparado (evita loops/reativações)
      hasTriggeredRef.current = true
    }, 100) // Delay de 100ms para garantir que o DOM está pronto

    return () => {
      clearTimeout(timeoutId)
      if (intervalId) window.clearInterval(intervalId)
      if (centralTimeoutId) window.clearTimeout(centralTimeoutId)
    }
  }, [birthdays])

  // Renderiza apenas um elemento base para o `ref` do confete, sem afetar layout.
  return <Confetti ref={confettiRef} className="pointer-events-none fixed inset-0 z-50" />
}

