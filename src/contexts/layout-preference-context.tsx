"use client"

import * as React from "react"

export type LayoutVersion = "classic" | "v2"

const STORAGE_KEY = "elo:ui-layout-version"
const DEFAULT_VERSION: LayoutVersion = "classic"

interface LayoutPreferenceContextValue {
  layout: LayoutVersion
  setLayout: (version: LayoutVersion) => void
  toggleLayout: () => void
  ready: boolean
  /** Verdadeiro durante a animação de transição entre layouts (fake reload). */
  transitioning: boolean
  /** Direção pendente da transição, útil para o overlay decidir o skeleton. */
  pendingTo: LayoutVersion | null
}

const LayoutPreferenceContext = React.createContext<LayoutPreferenceContextValue | null>(null)

const TRANSITION_DURATION_MS = 1100

export function LayoutPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayoutState] = React.useState<LayoutVersion>(DEFAULT_VERSION)
  const [ready, setReady] = React.useState(false)
  const [transitioning, setTransitioning] = React.useState(false)
  const [pendingTo, setPendingTo] = React.useState<LayoutVersion | null>(null)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === "v2" || stored === "classic") {
        setLayoutState(stored)
      }
    } catch {
      // localStorage indisponível (modo privado/SSR) — segue com padrão clássico.
    }
    setReady(true)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const persist = React.useCallback((version: LayoutVersion) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, version)
    } catch {
      // silencioso
    }
  }, [])

  const runTransition = React.useCallback(
    (target: LayoutVersion) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setPendingTo(target)
      setTransitioning(true)
      const swapAt = Math.max(180, Math.floor(TRANSITION_DURATION_MS * 0.55))
      const endAt = TRANSITION_DURATION_MS
      // Aplica a troca no meio da animação para "estilo fake reload".
      const swapTimer = setTimeout(() => {
        setLayoutState(target)
        persist(target)
      }, swapAt)
      timeoutRef.current = setTimeout(() => {
        setTransitioning(false)
        setPendingTo(null)
        clearTimeout(swapTimer)
      }, endAt)
    },
    [persist],
  )

  const setLayout = React.useCallback(
    (version: LayoutVersion) => {
      if (version === layout) return
      runTransition(version)
    },
    [layout, runTransition],
  )

  const toggleLayout = React.useCallback(() => {
    const next: LayoutVersion = layout === "v2" ? "classic" : "v2"
    runTransition(next)
  }, [layout, runTransition])

  const value = React.useMemo<LayoutPreferenceContextValue>(
    () => ({ layout, setLayout, toggleLayout, ready, transitioning, pendingTo }),
    [layout, setLayout, toggleLayout, ready, transitioning, pendingTo],
  )

  return (
    <LayoutPreferenceContext.Provider value={value}>{children}</LayoutPreferenceContext.Provider>
  )
}

export function useLayoutPreference(): LayoutPreferenceContextValue {
  const ctx = React.useContext(LayoutPreferenceContext)
  if (!ctx) {
    throw new Error("useLayoutPreference deve ser usado dentro de <LayoutPreferenceProvider>")
  }
  return ctx
}
