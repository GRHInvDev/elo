"use client"

import { useEffect, useRef } from "react"
import type { Birthday, User } from "@prisma/client"

interface BirthdayConfettiProps {
  birthdays: (Birthday & { user: User | null })[]
}

export function BirthdayConfetti({ birthdays }: BirthdayConfettiProps) {
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    // Só dispara confetes se houver aniversários e ainda não tiver disparado
    if (birthdays.length === 0 || hasTriggeredRef.current) {
      return
    }

    // Importação dinâmica do canvas-confetti
    void import("canvas-confetti")
      .then((confetti) => {
        const confettiInstance = confetti.default

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
        // Silenciosamente ignora erros se a biblioteca não estiver instalada
        console.warn("canvas-confetti não está disponível:", error)
      })
  }, [birthdays])

  // Não renderiza nada visualmente
  return null
}

