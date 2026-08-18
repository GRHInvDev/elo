"use client"

import { useSignInSignal } from "@clerk/nextjs/experimental"
import { Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"
import { type ReactNode, useEffect, useRef, useState } from "react"

import { SilentErrorBoundary } from "@/components/ui/silent-error-boundary"

const SIGN_IN_SELECTOR = '[data-clerk-component="SignIn"]'

/** Trava de segurança: se a rede não responder, o overlay não fica preso. */
const SUBMIT_SAFETY_TIMEOUT_MS = 25_000

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
 * Observa se o Clerk está validando o código e reporta ao shell.
 *
 * Vive isolado num componente próprio porque depende de `useSignInSignal`, que
 * é API **experimental** do Clerk: se ela mudar ou sair numa atualização, o
 * hook quebra. Enquanto essa chamada era ancestral do `<SignIn>`, uma falha
 * dela levava o formulário de login embora junto — e login em branco é bem pior
 * do que perder o indicador de carregamento. Aqui o estrago fica contido pelo
 * SilentErrorBoundary que envolve este componente.
 */
function SignInFetchWatcher({
  onBusyChange,
}: {
  onBusyChange: (busy: boolean) => void
}) {
  const { fetchStatus } = useSignInSignal()
  const previousFetchRef = useRef(fetchStatus)
  const safetyTimerRef = useRef<number | null>(null)

  useEffect(() => {
    // Fallback para quando o sinal do Clerk não cobre o envio: marcamos ocupado
    // no submit do form e liberamos quando a rede responder.
    const onSubmit = () => {
      onBusyChange(true)
      if (safetyTimerRef.current !== null) {
        window.clearTimeout(safetyTimerRef.current)
      }
      safetyTimerRef.current = window.setTimeout(() => {
        onBusyChange(false)
        safetyTimerRef.current = null
      }, SUBMIT_SAFETY_TIMEOUT_MS)
    }

    let detach: (() => void) | null = null
    const tryAttach = (): boolean => {
      const attached = attachSubmitListener(onSubmit)
      if (!attached) return false
      detach = () => attached.detach()
      return true
    }

    // O Clerk monta o form por script; se ainda não está lá, tenta de novo.
    let retryId: number | null = null
    if (!tryAttach()) {
      retryId = window.setTimeout(() => {
        tryAttach()
      }, 400)
    }

    return () => {
      if (retryId !== null) window.clearTimeout(retryId)
      detach?.()
      if (safetyTimerRef.current !== null) {
        window.clearTimeout(safetyTimerRef.current)
      }
    }
  }, [onBusyChange])

  useEffect(() => {
    // Enquanto o próprio Clerk indica busca em andamento, o overlay dele manda;
    // e na transição de volta para idle a resposta chegou.
    if (
      fetchStatus === "fetching" ||
      (previousFetchRef.current === "fetching" && fetchStatus === "idle")
    ) {
      onBusyChange(false)
    }
    previousFetchRef.current = fetchStatus
  }, [fetchStatus, onBusyChange])

  const signalBusy = fetchStatus === "fetching"

  useEffect(() => {
    if (signalBusy) onBusyChange(true)
  }, [signalBusy, onBusyChange])

  return null
}

/**
 * Na etapa de código (factor-one), cobre o card com loading enquanto o Clerk
 * valida a identidade.
 *
 * O indicador é conforto de UX, não funcionalidade: `children` — o card com o
 * `<SignIn>` — é renderizado sempre, independente do que aconteça com o
 * observador de estado.
 */
export function SignInVerificationLoadingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isCodeStep = pathname.includes("factor-one")
  const [busy, setBusy] = useState(false)

  return (
    <div className="relative w-full min-w-0 max-w-full">
      {children}

      {isCodeStep ? (
        <SilentErrorBoundary label="sign-in-signal">
          <SignInFetchWatcher onBusyChange={setBusy} />
        </SilentErrorBoundary>
      ) : null}

      {isCodeStep && busy ? (
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
