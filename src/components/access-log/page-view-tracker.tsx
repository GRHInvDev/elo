"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import { api } from "@/trpc/react"

/**
 * Duração do carregamento inicial, pela Navigation Timing API.
 *
 * Só existe na primeira página da sessão: numa navegação client-side não há
 * marco de início confiável, então essas ficam sem duração de propósito, em vez
 * de gravar um número inventado.
 */
function initialLoadDuration(): number | undefined {
  try {
    const [navigation] = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[]

    if (!navigation || navigation.duration <= 0) return undefined

    return Math.round(navigation.duration)
  } catch {
    // Navegador sem Navigation Timing: segue sem duração.
    return undefined
  }
}

/**
 * Registra cada navegação de página na trilha de acesso, visível em
 * /admin/logs. Não renderiza nada.
 *
 * Fica no layout autenticado, então cobre toda tela atrás de login. Falha de
 * gravação é ignorada: log de acesso nunca pode atrapalhar a navegação.
 */
export function PageViewTracker() {
  const pathname = usePathname()
  const trackPageView = api.accessLog.trackPageView.useMutation({
    onError: () => {
      // Silencioso por decisão: o usuário não tem o que fazer com esse erro.
    },
  })

  // A mutation muda de identidade a cada render; guardamos em ref para manter
  // o efeito preso só à mudança de rota.
  const trackRef = useRef(trackPageView)
  trackRef.current = trackPageView

  const isFirstViewRef = useRef(true)

  useEffect(() => {
    if (!pathname) return

    const durationMs = isFirstViewRef.current ? initialLoadDuration() : undefined
    isFirstViewRef.current = false

    trackRef.current.mutate({ path: pathname, durationMs })
  }, [pathname])

  return null
}
