"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Badge } from "@/components/ui/badge"
import { Check, Plus, Tags, ExternalLink, Edit, MessageSquare, ArrowRight, ChevronRight } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ResponseStatus } from "@/types/form-responses"

interface ResponseContextMenuProps {
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
  currentStatus,
  currentTags,
  position,
  onClose,
  onTagChange,
  onOpenDetails,
  onEdit,
  onOpenChat,
  onMoveToNextStatus: _onMoveToNextStatus,
  onOpenTagsManager,
}: ResponseContextMenuProps) {
  const [showTagsSection, setShowTagsSection] = useState(false)
  const { data: allTags = [] } = api.formResponse.getAllTags.useQuery()
  const utils = api.useUtils()
  
  const applyTag = api.formResponse.applyTag.useMutation({
    onSuccess: () => {
      toast.success("Tag aplicada")
      onTagChange?.()
      void utils.formResponse.listKanBan.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aplicar tag")
    },
  })

  const removeTag = api.formResponse.removeTag.useMutation({
    onSuccess: () => {
      toast.success("Tag removida")
      onTagChange?.()
      void utils.formResponse.listKanBan.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover tag")
    },
  })

  const updateStatus = api.formResponse.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado")
      void utils.formResponse.listKanBan.invalidate()
      onClose()
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status")
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

  const handleMoveToNextStatus = () => {
    const statusOrder: ResponseStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]
    const currentIndex = statusOrder.indexOf(currentStatus)
    if (currentIndex < statusOrder.length - 1) {
      const nextStatus = statusOrder[currentIndex + 1]!
      updateStatus.mutate({
        responseId,
        status: nextStatus,
      })
    } else {
      toast.info("Já está no último estado")
    }
  }

  const handleOpenTagsManager = () => {
    onOpenTagsManager?.()
    onClose()
  }

  const getNextStatusLabel = (): string => {
    const statusOrder: ResponseStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]
    const currentIndex = statusOrder.indexOf(currentStatus)
    if (currentIndex < statusOrder.length - 1) {
      const nextStatus = statusOrder[currentIndex + 1]!
      const labels: Record<ResponseStatus, string> = {
        NOT_STARTED: "Em Progresso",
        IN_PROGRESS: "Concluído",
        COMPLETED: "Concluído",
      }
      return labels[nextStatus] ?? ""
    }
    return ""
  }

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-context-menu]')) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  const menuContent = (
    <div
      data-context-menu
      className="fixed z-50 min-w-[220px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {!showTagsSection ? (
        <>
          {/* Botão Etiquetas */}
          <button
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setShowTagsSection(true)}
          >
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              <span>Etiquetas</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="h-px bg-border my-1" />

          {/* Botão Abrir */}
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={handleOpenDetails}
          >
            <ExternalLink className="h-4 w-4" />
            <span>Abrir</span>
          </button>

          {/* Botão Editar */}
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
            <span>Editar</span>
          </button>

          {/* Botão Responder no chat */}
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={handleOpenChat}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Responder no chat</span>
          </button>

          {/* Botão Mover estado para próximo */}
          {currentStatus !== "COMPLETED" && (
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={handleMoveToNextStatus}
              disabled={updateStatus.isPending}
            >
              <ArrowRight className="h-4 w-4" />
              <span>Mover para {getNextStatusLabel()}</span>
            </button>
          )}
        </>
      ) : (
        <>
          {/* Seção de Tags */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            <button
              className="flex items-center gap-2 text-sm hover:text-foreground transition-colors"
              onClick={() => setShowTagsSection(false)}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              <span className="font-semibold">Etiquetas</span>
            </button>
          </div>

          <div className="h-px bg-border my-1" />

          {/* Botão Gerenciar Tags */}
          <button
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={handleOpenTagsManager}
          >
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              <span>Gerenciar Tags</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="h-px bg-border my-1" />

          {/* Lista de Tags */}
          <div className="max-h-[300px] overflow-y-auto">
            {allTags.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Nenhuma tag disponível
              </div>
            ) : (
              allTags.map((tag) => {
                const isSelected = currentTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      isSelected && "bg-accent"
                    )}
                    onClick={() => handleTagToggle(tag.id)}
                    disabled={applyTag.isPending || removeTag.isPending}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge
                        style={{
                          backgroundColor: tag.cor,
                          color: "#fff",
                        }}
                        className="px-2 py-0.5 text-xs"
                      >
                        {tag.nome}
                      </Badge>
                    </div>
                    {isSelected ? (
                      <Check className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Plus className="h-4 w-4 flex-shrink-0 opacity-50" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )

  if (typeof window === "undefined") {
    return null
  }

  return createPortal(menuContent, document.body)
}

