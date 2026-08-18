"use client"

// O global-error substitui o root layout inteiro, então precisa trazer o CSS
// e as tags <html>/<body> por conta própria.
import "@/styles/globals.css"

import { ErrorFallback } from "@/components/ui/error-fallback"

/**
 * Boundary do root layout: última rede de proteção para erros lançados no
 * próprio `app/layout.tsx` (providers do Clerk, tRPC, tema), que ficam acima
 * do alcance do `app/error.tsx`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ErrorFallback error={error} reset={reset} scope="global" />
      </body>
    </html>
  )
}
