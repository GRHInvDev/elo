"use client"

import { useEffect, useRef, useState } from "react"

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export interface UseCountUpOptions {
  /** Duração da contagem em ms (padrão 900). */
  durationMs?: number
  /** Atraso antes de iniciar (para escalar entradas na página). */
  delayMs?: number
  /**
   * Se true, cada mudança de `target` recomeça a partir de 0.
   * Padrão false: interpola a partir do valor exibido anterior (melhor para contadores que mudam no kanban).
   */
  fromZeroOnEachChange?: boolean
}

/**
 * Anima numericamente até `target` com easing ease-out cúbico.
 * Na primeira entrada usa 0 → `target`; depois, por padrão, valor anterior → `target`.
 * `target === null` → retorna `null` (ex.: exibir "—").
 */
export function useCountUp(target: number | null, options?: UseCountUpOptions): number | null {
  const durationMs = options?.durationMs ?? 900
  const delayMs = options?.delayMs ?? 0
  const fromZeroOnEachChange = options?.fromZeroOnEachChange ?? false
  const lastRef = useRef(0)
  const [current, setCurrent] = useState<number | null>(() => (target == null ? null : 0))

  useEffect(() => {
    if (target == null) {
      setCurrent(null)
      return
    }

    const startVal = fromZeroOnEachChange ? 0 : lastRef.current
    setCurrent(startVal)
    let raf = 0
    const timeoutId = window.setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs)
        const v = startVal + (target - startVal) * easeOutCubic(t)
        setCurrent(v)
        if (t < 1) {
          raf = requestAnimationFrame(tick)
        } else {
          setCurrent(target)
          lastRef.current = target
        }
      }
      raf = requestAnimationFrame(tick)
    }, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
      cancelAnimationFrame(raf)
    }
  }, [target, durationMs, delayMs, fromZeroOnEachChange])

  return current
}
