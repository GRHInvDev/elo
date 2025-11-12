"use client"

import { useEffect, useRef } from "react"
import type { Birthday, User } from "@prisma/client"

interface BirthdayConfettiProps {
  birthdays: (Birthday & { user: User | null })[]
}

export function BirthdayConfetti({ birthdays }: BirthdayConfettiProps) {
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

    // Verifica se realmente é hoje antes de disparar
    const today = new Date()
    const hasTodayBirthday = birthdays.some((birthday) => {
      const birthdayDate = new Date(birthday.data)
      return (
        birthdayDate.getDate() === today.getDate() &&
        birthdayDate.getMonth() === today.getMonth()
      )
    })

    // Só dispara confetes se houver aniversários de HOJE e ainda não tiver disparado
    if (!hasTodayBirthday || birthdays.length === 0 || hasTriggeredRef.current) {
      return
    }

    // eslint-disable-next-line no-console
    console.log("🎉 BirthdayConfetti: Disparando confetes para", birthdays.length, "aniversariante(s)")

    // Pequeno delay para garantir que o DOM está pronto
    const timeoutId = setTimeout(() => {
      // Importação dinâmica do canvas-confetti
      void import("canvas-confetti")
        .then((confetti) => {
          const confettiInstance = confetti.default

            // eslint-disable-next-line no-console
            console.log("✅ canvas-confetti carregado com sucesso")

          // Configuração dos confetes
          const duration = 3000 // 3 segundos
          const end = Date.now() + duration

          // Função para disparar confetes
          const frame = () => {
            void confettiInstance({
              particleCount: 3,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"],
            })

            void confettiInstance({
              particleCount: 3,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"],
            })

            if (Date.now() < end) {
              requestAnimationFrame(frame)
            }
          }

          // Dispara os confetes
          frame()

          // Dispara uma explosão central após um pequeno delay
          void setTimeout(() => {
            void confettiInstance({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"],
            })
          }, 500)

          // Marca como já disparado
          hasTriggeredRef.current = true
        })
        .catch((error) => {
          // Log de erro para debug
          // eslint-disable-next-line no-console
          console.error("❌ Erro ao carregar canvas-confetti:", error)
        })
    }, 100) // Delay de 100ms para garantir que o DOM está pronto

    return () => {
      clearTimeout(timeoutId)
    }
  }, [birthdays])

  // Não renderiza nada visualmente
  return null
}

