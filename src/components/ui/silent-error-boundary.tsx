"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface SilentErrorBoundaryProps {
  children: ReactNode
  /** Identifica a origem no log. Sem isso o erro fica difícil de rastrear. */
  label: string
}

interface SilentErrorBoundaryState {
  failed: boolean
}

/**
 * Isola um trecho acessório da árvore: se ele quebrar, renderiza nada em vez de
 * derrubar o que está em volta.
 *
 * Para funcionalidade essencial isto é errado — o usuário precisa saber que
 * algo falhou. O uso legítimo é o inverso: um enfeite ou uma melhoria de UX que
 * não pode, em nenhuma hipótese, levar embora o conteúdo principal da tela. O
 * erro continua indo para o console.
 */
export class SilentErrorBoundary extends Component<
  SilentErrorBoundaryProps,
  SilentErrorBoundaryState
> {
  state: SilentErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): SilentErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      `[elo] trecho isolado falhou (${this.props.label}):`,
      error,
      errorInfo.componentStack,
    )
  }

  render(): ReactNode {
    if (this.state.failed) return null
    return this.props.children
  }
}
