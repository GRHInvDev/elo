"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2, AlertTriangle } from "lucide-react"

function formatIdeaNumber(ideaNumber: number): string {
  return ideaNumber.toString().padStart(3, "0")
}

export interface IdeaActionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Posição do cursor onde o menu deve surgir. */
  position?: { x: number; y: number } | null
  /** Número da ideia exibido no cabeçalho (ex.: #042). */
  ideaNumber?: number
  /** Acionado ao escolher "Editar". */
  onEdit: () => void
  /** Acionado ao confirmar a exclusão. */
  onDelete: () => void
  /** Mantém o estado de carregamento no botão de exclusão. */
  isDeleting?: boolean
}

const MENU_WIDTH = 224 // w-56
const VIEWPORT_MARGIN = 8

/**
 * Menu de ações de uma ideia (acionado por clique direito no card do kanban).
 * Surge discretamente ao lado do cursor — sem overlay escurecendo a tela —
 * oferecendo Editar ou Excluir (a exclusão exige confirmação no próprio menu).
 */
export function IdeaActionsDialog({
  open,
  onOpenChange,
  position,
  ideaNumber,
  onEdit,
  onDelete,
  isDeleting = false,
}: IdeaActionsDialogProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => setMounted(true), [])

  // Reinicia para a tela inicial sempre que o menu fechar.
  useEffect(() => {
    if (!open) setConfirmingDelete(false)
  }, [open])

  // Fechar com ESC.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  // Posiciona próximo ao cursor, mantendo o menu dentro da viewport.
  useLayoutEffect(() => {
    if (!open || !position) return
    const panel = panelRef.current
    const width = panel?.offsetWidth ?? MENU_WIDTH
    const height = panel?.offsetHeight ?? 0
    let left = position.x
    let top = position.y
    if (left + width + VIEWPORT_MARGIN > window.innerWidth) {
      left = window.innerWidth - width - VIEWPORT_MARGIN
    }
    if (top + height + VIEWPORT_MARGIN > window.innerHeight) {
      top = window.innerHeight - height - VIEWPORT_MARGIN
    }
    setCoords({
      top: Math.max(VIEWPORT_MARGIN, top),
      left: Math.max(VIEWPORT_MARGIN, left),
    })
  }, [open, position, confirmingDelete])

  if (!mounted || !open || !position) return null

  const title = ideaNumber !== undefined ? `Ideia #${formatIdeaNumber(ideaNumber)}` : "Ideia"

  return createPortal(
    // Camada transparente apenas para capturar cliques fora e fechar o menu.
    <div
      className="fixed inset-0 z-50"
      onMouseDown={() => onOpenChange(false)}
      onContextMenu={(e) => {
        e.preventDefault()
        onOpenChange(false)
      }}
    >
      <div
        ref={panelRef}
        role="menu"
        style={{ top: coords.top, left: coords.left }}
        onMouseDown={(e) => e.stopPropagation()}
        className="fixed w-56 overflow-hidden rounded-xl border border-border/60 bg-popover text-popover-foreground shadow-[0_12px_28px_-10px_rgba(0,0,0,0.4)] duration-150 animate-in fade-in-0 zoom-in-95"
      >
        {confirmingDelete ? (
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold leading-tight">Excluir esta ideia?</h2>
                <p className="text-xs text-muted-foreground">
                  A {title} será removida permanentemente. Essa ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="min-w-[6rem]"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                    Excluindo
                  </>
                ) : (
                  "Excluir"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-1.5">
            <div className="px-2.5 pb-1.5 pt-1">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={onEdit}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
            >
              <Edit className="h-4 w-4 text-muted-foreground" aria-hidden />
              Editar
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => setConfirmingDelete(true)}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus:bg-destructive/10 focus:outline-none"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Excluir
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
