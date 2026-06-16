"use client"

import * as React from "react"

/** Item da trilha de navegação. Sem `href` = página atual (não clicável). */
export interface BreadcrumbEntry {
  label: string
  href?: string
}

interface BreadcrumbContextValue {
  /** Trilha definida explicitamente por uma página; `null` = derivar da rota. */
  items: BreadcrumbEntry[] | null
  setItems: (items: BreadcrumbEntry[] | null) => void
}

const BreadcrumbContext = React.createContext<BreadcrumbContextValue | null>(null)

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<BreadcrumbEntry[] | null>(null)
  const value = React.useMemo<BreadcrumbContextValue>(() => ({ items, setItems }), [items])
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}

export function useBreadcrumbs(): BreadcrumbContextValue {
  const ctx = React.useContext(BreadcrumbContext)
  if (!ctx) {
    throw new Error("useBreadcrumbs deve ser usado dentro de <BreadcrumbProvider>")
  }
  return ctx
}

/**
 * Define a trilha de navegação da página atual no header global e a limpa ao
 * desmontar (a navegação para outra página volta a derivar a trilha da rota).
 * Use em páginas com segmentos dinâmicos (ex.: título de um formulário).
 */
export function useSetBreadcrumbs(items: BreadcrumbEntry[] | null | undefined): void {
  const { setItems } = useBreadcrumbs()
  const serialized = items ? JSON.stringify(items) : null

  React.useEffect(() => {
    setItems(items ?? null)
    return () => setItems(null)
    // serialized cobre mudanças de conteúdo sem depender da identidade do array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, setItems])
}
