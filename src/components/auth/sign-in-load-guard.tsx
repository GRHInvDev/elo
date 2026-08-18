"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { claimAutoReload } from "@/lib/auto-reload"

/**
 * Quanto esperar pelo form do Clerk antes de considerar que ele não vem.
 *
 * Folgado de propósito: numa rede corporativa lenta o clerk-js pode levar
 * alguns segundos, e um falso positivo aqui recarregaria a tela na cara de quem
 * só estava esperando.
 */
const FORM_TIMEOUT_MS = 8_000

const RELOAD_KEY = "elo:sign-in-reload-at"

/** Presença de campo de entrada é o sinal de que o Clerk montou o form. */
function hasRenderedForm(container: HTMLElement): boolean {
  return container.querySelector("input, form") !== null
}

/**
 * Vigia a montagem do form de login e não deixa a tela ficar muda.
 *
 * O `<SignIn>` do Clerk é montado por script: se o clerk-js não desce — chunk
 * de um deploy que saiu do ar, rede que bloqueia o domínio do Clerk, falha de
 * appearance — o componente simplesmente não produz DOM. Sem vigilância, o
 * usuário encara um card vazio sem nenhuma pista do que fazer.
 *
 * Na primeira ocorrência a página se recarrega uma vez, que é o que resolve o
 * caso de HTML defasado. Se o form continuar ausente depois disso, a tela
 * assume a falha e oferece caminho manual em vez de insistir.
 */
export function SignInLoadGuard({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<"waiting" | "loaded" | "reloading" | "failed">(
    "waiting",
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (hasRenderedForm(container)) {
      setState("loaded")
      return
    }

    // O form pode chegar depois do prazo, numa rede ruim. O observer garante
    // que a tela volte ao normal nesse caso, em vez de ficar presa no aviso.
    const observer = new MutationObserver(() => {
      if (hasRenderedForm(container)) {
        setState("loaded")
        observer.disconnect()
      }
    })
    observer.observe(container, { childList: true, subtree: true })

    const timer = window.setTimeout(() => {
      if (hasRenderedForm(container)) {
        setState("loaded")
        return
      }

      if (claimAutoReload(RELOAD_KEY)) {
        setState("reloading")
        window.location.reload()
        return
      }

      setState("failed")
    }, FORM_TIMEOUT_MS)

    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <>
      {/* `children` fica sempre montado: é o que permite ao Clerk aparecer com
          atraso e ao observer detectar a chegada. */}
      <div ref={containerRef}>{children}</div>

      {state === "reloading" ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground" role="status">
            Atualizando a tela de login…
          </p>
        </div>
      ) : null}

      {state === "failed" ? (
        <div
          className="mt-4 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center"
          role="alert"
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Não conseguimos carregar o formulário de acesso
            </p>
            <p className="text-sm text-muted-foreground">
              Recarregar costuma resolver. Se insistir, avise o time de TI — pode
              ser bloqueio de rede no serviço de autenticação.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => window.location.reload()}>
              Recarregar
            </Button>
            <Button asChild variant="outline">
              <a href="/api/auth/status" rel="noopener noreferrer" target="_blank">
                Ver diagnóstico
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
