"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSetBreadcrumbs, type BreadcrumbEntry } from "@/contexts/breadcrumb-context"

/** Item da trilha de navegação. Sem `href` = página atual (não clicável). */
export type FormsBreadcrumb = BreadcrumbEntry

interface FormsSubPageShellProps {
  /**
   * Trilha de navegação (breadcrumb) da página, publicada no header global.
   * O último item (sem href) é a página atual.
   */
  breadcrumbs?: FormsBreadcrumb[]
  /** Destino do link "voltar". Usado como fallback quando não há breadcrumbs. */
  backHref?: string
  backLabel?: string
  title: React.ReactNode
  /** Conteúdo inline renderizado antes do título (ex.: nº da resposta). */
  titlePrefix?: React.ReactNode
  /** Texto/descrição abaixo do título. */
  description?: React.ReactNode
  /** Ações alinhadas ao topo direito (botões, links). */
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Casca padronizada das páginas internas de Solicitações (criação, visualização e
 * gestão). Aplica o vocabulário visual do módulo Solicitações (escopo .v2-scope,
 * título 28px, bordas suaves) e publica a trilha de navegação no header global.
 */
export function FormsSubPageShell({
  breadcrumbs,
  backHref,
  backLabel = "Voltar",
  title,
  titlePrefix,
  description,
  actions,
  children,
  className,
}: FormsSubPageShellProps) {
  // Publica a trilha desta página no breadcrumb global do header.
  useSetBreadcrumbs(breadcrumbs)

  const hasBreadcrumbs = Boolean(breadcrumbs && breadcrumbs.length > 0)

  return (
    <div className={cn("v2-scope", className)}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {!hasBreadcrumbs && backHref && (
            <Link
              href={backHref}
              className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--v2-border-soft))] bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel}
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {titlePrefix}
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em]">
              {title}
            </h1>
          </div>
          {description && (
            <div className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

interface FormsPanelProps {
  children: React.ReactNode
  className?: string
}

/** Painel de conteúdo padronizado com as bordas suaves/sombra do módulo Solicitações. */
export function FormsPanel({ children, className }: FormsPanelProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--v2-radius-card)] border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.75)] p-6 shadow-[var(--v2-shadow)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  )
}
