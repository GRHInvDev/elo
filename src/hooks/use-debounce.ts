"use client"

import { useState, useEffect } from "react"

/**
 * Retorna o valor após o delay de inatividade (debounce).
 * @param value - Valor a ser debounced
 * @param delay - Atraso em ms (ex: 2000 para 2 segundos)
 * @returns Valor atualizado apenas após `delay` ms sem mudanças
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
