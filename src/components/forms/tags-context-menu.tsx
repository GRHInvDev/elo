"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { Check, Plus, Tags, ExternalLink, Edit, MessageSquare } from "lucide-react"
import { api } from "@/trpc/react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { ResponseStatus } from "@/types/form-responses"

export interface ResponseContextMenuProps {
  responseId: string
  formId: string
  currentStatus: ResponseStatus
  currentTags: string[]
  position: { x: number; y: number }
  onClose: () => void
  onTagChange?: () => void
  onOpenDetails?: (responseId: string) => void
  onEdit?: (responseId: string, formId: string) => void
  onOpenChat?: (responseId: string) => void
  onMoveToNextStatus?: (responseId: string, currentStatus: ResponseStatus) => void
  onOpenTagsManager?: () => void
}

export function ResponseContextMenu({
  responseId,
  formId,
  currentTags,
  position,
  onClose,
  onTagChange,
  onOpenDetails,
  onEdit,
  onOpenChat,
  onOpenTagsManager,
}: ResponseContextMenuProps) {
  const { toast } = useToast()
  const [showTagsSection, setShowTagsSection] = useState(false)
  const { data: allTags = [] } = api.formResponse.getAllTags.useQuery()
  const utils = api.useUtils()
  
  const applyTag = api.formResponse.applyTag.useMutation({
    onSuccess: () => {
      toast({
        title: "Tag aplicada",
      })
      onTagChange?.()
      void utils.formResponse.listQueueInfinite.invalidate()
      void utils.formResponse.getQueueKpis.invalidate()
      void utils.formResponse.getChat.invalidate({ responseId })
      void utils.formResponse.getById.invalidate({ responseId })
    },
    onError: (error) => {
      toast({
        title: "Erro ao aplicar tag",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const removeTag = api.formResponse.removeTag.useMutation({
    onSuccess: () => {
      toast({
        title: "Tag removida",
      })
      onTagChange?.()
      void utils.formResponse.listQueueInfinite.invalidate()
      void utils.formResponse.getQueueKpis.invalidate()
      void utils.formResponse.getChat.invalidate({ responseId })
      void utils.formResponse.getById.invalidate({ responseId })
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover tag",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleTagToggle = (tagId: string) => {
    if (currentTags.includes(tagId)) {
      removeTag.mutate({ responseId, tagId })
    } else {
      applyTag.mutate({ responseId, tagId })
    }
  }

  const handleOpenDetails = () => {
    onOpenDetails?.(responseId)
    onClose()
  }

  const handleEdit = () => {
    onEdit?.(responseId, formId)
    onClose()
  }

  const handleOpenChat = () => {
    onOpenChat?.(responseId)
    onClose()
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999]"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div
        style={{
          position: "fixed",
          left: Math.min(position.x, window.innerWidth - 240),
          top: Math.min(position.y, window.innerHeight - 300),
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-56 rounded-xl border border-border/80 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 text-xs select-none"
      >
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={handleOpenDetails}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
            <span>Abrir Detalhes</span>
          </button>

          {onOpenChat && (
            <button
              type="button"
              onClick={handleOpenChat}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Abrir Chat</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={handleEdit}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5 text-primary" />
              <span>Editar Resposta</span>
            </button>
          )}

          <div className="my-1 border-t border-border/60" />

          <button
            type="button"
            onClick={() => setShowTagsSection(!showTagsSection)}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left font-medium text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Tags className="h-3.5 w-3.5 text-primary" />
              <span>Tags</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {showTagsSection ? "Fechar" : "Expandir"}
            </span>
          </button>

          {showTagsSection && (
            <div className="mt-1 flex flex-col gap-1 max-h-48 overflow-y-auto rounded-lg bg-muted/40 p-1.5 border border-border/40">
              {allTags.length === 0 ? (
                <p className="p-2 text-center text-[11px] text-muted-foreground">
                  Nenhuma tag cadastrada.
                </p>
              ) : (
                allTags.map((tag) => {
                  const isSelected = currentTags.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary/10 font-semibold text-primary"
                          : "hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: tag.cor || "#3B82F6" }}
                        />
                        <span className="truncate">{tag.nome}</span>
                      </div>
                      {isSelected && <Check className="h-3 w-3 shrink-0 text-primary" />}
                    </button>
                  )
                })
              )}

              {onOpenTagsManager && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenTagsManager()
                    onClose()
                  }}
                  className="mt-1 flex w-full items-center gap-1.5 rounded-md border border-dashed border-border/70 p-1.5 text-center text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Gerenciar tags...</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
