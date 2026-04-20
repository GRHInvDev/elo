"use client"

import { useSignInSignal } from "@clerk/nextjs/experimental"
import { Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"
import { type ReactNode, useEffect, useRef, useState } from "react"

const SIGN_IN_SELECTOR = '[data-clerk-component="SignIn"]'

function attachSubmitListener(
  onSubmit: () => void,
): { detach: () => void } | null {
  const root = document.querySelector(SIGN_IN_SELECTOR)
  if (!root) return null
  root.addEventListener("submit", onSubmit, true)
  return {
    detach: () => {
      root.removeEventListener("submit", onSubmit, true)
    },
  }
}

/**
 * Na etapa de código (factor-one), cobre o card com loading enquanto o Clerk valida
 * (`fetchStatus`) e, em fallback, após envio do formulário até a rede responder.
 */
export function SignInVerificationLoadingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isCodeStep = pathname.includes("factor-one")
  const { fetchStatus } = useSignInSignal()
  const [submitPending, setSubmitPending] = useState(false)
  const prevFetchRef = useRef(fetchStatus)
  const safetyTimerRef = useRef<number | null>(null)

  const signalBusy = isCodeStep && fetchStatus === "fetching"
  const showOverlay = isCodeStep && (signalBusy || submitPending)

  useEffect(() => {
    if (!isCodeStep) {
      setSubmitPending(false)
      return
    }

    const onSubmit = () => {
      setSubmitPending(true)
      if (safetyTimerRef.current != null) window.clearTimeout(safetyTimerRef.current)
      safetyTimerRef.current = window.setTimeout(() => {
        setSubmitPending(false)
        safetyTimerRef.current = null
      }, 25_000)
    }

    let detach: (() => void) | null = null
    const tryAttach = (): boolean => {
      const r = attachSubmitListener(onSubmit)
      if (r) {
        detach = () => r.detach()
        return true
      }
      return false
    }

    let retryId: number | null = null
    if (!tryAttach()) {
      retryId = window.setTimeout(() => {
        tryAttach()
      }, 400)
    }

    return () => {
      if (retryId != null) window.clearTimeout(retryId)
      detach?.()
      if (safetyTimerRef.current != null) window.clearTimeout(safetyTimerRef.current)
    }
  }, [isCodeStep, pathname])

  useEffect(() => {
    if (fetchStatus === "fetching") {
      setSubmitPending(false)
    }
    if (prevFetchRef.current === "fetching" && fetchStatus === "idle") {
      setSubmitPending(false)
    }
    prevFetchRef.current = fetchStatus
  }, [fetchStatus])

  return (
    <div className="relative w-full min-w-0 max-w-full">
      {children}
      {showOverlay ? (
        <div
          aria-busy="true"
          aria-live="polite"
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 rounded-lg border border-border/50 bg-background/90 px-6 text-center shadow-inner backdrop-blur-md dark:bg-zinc-900/92"
          role="status"
        >
          <Loader2 className="h-10 w-10 shrink-0 animate-spin text-primary" aria-hidden />
          <div className="max-w-[260px] space-y-1">
            <p className="text-base font-semibold text-foreground">Validando código</p>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto confirmamos sua identidade.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
