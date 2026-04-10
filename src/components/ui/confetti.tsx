"use client"

import { useEffect, useRef } from "react"

import { Confetti as MagicConfetti, type ConfettiRef } from "@/registry/magicui/confetti"

const CONFETTI_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]

export function Confetti() {
  const confettiRef = useRef<ConfettiRef>(null)

  useEffect(() => {
    const start = Date.now()
    const durationMs = 4800

    // Dispara bursts curtos para manter o efeito visível por alguns segundos.
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= durationMs) {
        window.clearInterval(intervalId)
        return
      }

      confettiRef.current?.fire({
        particleCount: 18,
        spread: 70,
        angle: 90,
        origin: { y: 0.6 },
        colors: CONFETTI_COLORS,
      })
    }, 320)

    // Burst inicial imediato.
    confettiRef.current?.fire({
      particleCount: 55,
      spread: 70,
      angle: 90,
      origin: { y: 0.6 },
      colors: CONFETTI_COLORS,
    })

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <MagicConfetti
        ref={confettiRef}
        className="absolute left-0 top-0 size-full"
        onMouseEnter={() => {
          confettiRef.current?.fire({
            particleCount: 35,
            spread: 60,
            origin: { y: 0.55 },
            colors: CONFETTI_COLORS,
          })
        }}
      />
    </div>
  )
}

