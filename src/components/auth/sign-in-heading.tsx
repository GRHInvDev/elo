"use client"

import { CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { KeyRound, LogIn } from "lucide-react"
import { usePathname } from "next/navigation"
import type { ReactElement } from "react"

/**
 * Título e descrição da tela de login conforme a etapa do Clerk (ex.: verificação em factor-one).
 */
export function SignInHeading(): ReactElement {
  const pathname = usePathname()
  const isFactorOne = pathname.includes("factor-one")

  if (isFactorOne) {
    return (
      <div className="flex gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15",
            "dark:bg-primary/15 dark:ring-primary/25",
          )}
          aria-hidden
        >
          <KeyRound className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground">
            Quase lá — confirme que é você
          </h1>
          <CardDescription className="text-pretty text-base leading-relaxed">
            Digite o código que enviamos. É rápido e ajuda a manter sua conta no Elo
            protegida.
          </CardDescription>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span
          className="inline-flex h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.65)]"
          aria-hidden
        />
        elo
      </p>
      <div className="flex gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary",
            "shadow-inner ring-1 ring-primary/20 dark:from-primary/25 dark:ring-primary/30",
          )}
          aria-hidden
        >
          <LogIn className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
          <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.65rem]">
            Que bom te ver de novo
          </h1>
          <CardDescription className="text-pretty text-base leading-relaxed">
            Faça login e retome de onde parou — seu espaço no Elo segue do jeito que você
            deixou.
          </CardDescription>
        </div>
      </div>
    </div>
  )
}
