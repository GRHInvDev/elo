"use client"

import { ErrorFallback } from "@/components/ui/error-fallback"

/**
 * Boundary de rota: pega qualquer erro de client side lançado abaixo do root
 * layout — inclui `/dashboard`, `/sign-in` e todos os segmentos que não
 * definem o próprio `error.tsx`.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorFallback error={error} reset={reset} scope="route" />
}
