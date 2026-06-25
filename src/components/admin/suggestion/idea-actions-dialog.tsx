"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2, AlertTriangle } from "lucide-react"

function formatIdeaNumber(ideaNumber: number): string {
  return ideaNumber.toString().padStart(3, "0")
}

export interface IdeaActionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Número da ideia exibido no cabeçalho (ex.: #042). */
  ideaNumber?: number
  /** Acionado ao escolher "Editar". */
  onEdit: () => void
  /** Acionado ao confirmar a exclusão. */
  onDelete: () => void
  /** Mantém o estado de carregamento no botão de exclusão. */
  isDeleting?: boolean
}

/**
 * Menu de ações de uma ideia (acionado por clique direito no card do kanban).
 * Dialog enxuto, com sombra suave ao redor, oferecendo Editar ou Excluir
 * (a exclusão exige confirmação dentro do próprio dialog).
 */
export function IdeaActionsDialog({
  open,
  onOpenChange,
  ideaNumber,
  onEdit,
  onDelete,
  isDeleting = false,
}: IdeaActionsDialogProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Reinicia para a tela inicial sempre que o dialog reabrir.
  useEffect(() => {
    if (!open) setConfirmingDelete(false)
  }, [open])

  const title = ideaNumber !== undefined ? `Ideia #${formatIdeaNumber(ideaNumber)}` : "Ideia"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="max-w-[20rem] gap-0 overflow-hidden rounded-xl border-border/60 p-0 shadow-2xl"
      >
        {confirmingDelete ? (
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold leading-tight">Excluir esta ideia?</h2>
                <p className="text-xs text-muted-foreground">
                  A {title} será removida permanentemente. Essa ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
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
          <div className="p-2">
            <div className="px-3 pb-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
            </div>
            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
            >
              <Edit className="h-4 w-4 text-muted-foreground" aria-hidden />
              Editar
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus:bg-destructive/10 focus:outline-none"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Excluir
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
