"use client"

import { DotField } from "@/components/effects/dot-field"
import { useTheme } from "next-themes"
import { useMemo } from "react"

/**
 * Camada de fundo interativa (canvas) só na rota de login.
 * `pointer-events-none`: o Clerk continua clicável; o efeito usa `mousemove` na window.
 */
export function SignInBackground() {
  const { resolvedTheme } = useTheme()

  const { gradientFrom, gradientTo, glowColor } = useMemo(() => {
    if (resolvedTheme === "dark") {
      return {
        gradientFrom: "rgba(216, 180, 254, 0.78)",
        gradientTo: "rgba(167, 139, 250, 0.58)",
        glowColor: "rgba(46, 16, 101, 0.85)",
      }
    }
    if (resolvedTheme === "light") {
      return {
        gradientFrom: "rgba(109, 40, 217, 0.52)",
        gradientTo: "rgba(168, 85, 247, 0.4)",
        glowColor: "rgba(245, 243, 255, 0.95)",
      }
    }
    return {
      gradientFrom: "rgba(147, 51, 234, 0.58)",
      gradientTo: "rgba(192, 132, 252, 0.45)",
      glowColor: "rgba(18, 15, 23, 0.75)",
    }
  }, [resolvedTheme])

  return (
    <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden>
      <DotField
        bulgeStrength={72}
        className="h-full w-full"
        dotRadius={2}
        dotSpacing={13}
        glowColor={glowColor}
        glowRadius={180}
        gradientFrom={gradientFrom}
        gradientTo={gradientTo}
        sparkle={false}
        waveAmplitude={0}
      />
    </div>
  )
}
