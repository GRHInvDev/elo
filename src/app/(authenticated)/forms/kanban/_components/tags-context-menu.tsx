"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Plus } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Tag {
  id: string
  nome: string
  cor: string
  timestampCreate: string
  countVezesUsadas: number
  ativa: boolean
}

interface TagsContextMenuProps {
  responseId: string
  currentTags: string[]
  position: { x: number; y: number }
  onClose: () => void
  onTagChange?: () => void
}

export function TagsContextMenu({
  responseId,
  currentTags,
  position,
  onClose,
  onTagChange,
}: TagsContextMenuProps) {
  const { data: allTags = [] } = api.formResponse.getAllTags.useQuery()
  const applyTag = api.formResponse.applyTag.useMutation({
    onSuccess: () => {
      toast.success("Tag aplicada")
      onTagChange?.()
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aplicar tag")
    },
  })

  const removeTag = api.formResponse.removeTag.useMutation({
    onSuccess: () => {
      toast.success("Tag removida")
      onTagChange?.()
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover tag")
    },
  })

  const handleTagToggle = (tagId: string) => {
    if (currentTags.includes(tagId)) {
      removeTag.mutate({ responseId, tagId })
    } else {
      applyTag.mutate({ responseId, tagId })
    }
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
      className="fixed z-50 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2 py-1.5 text-sm font-semibold">Aplicar Tags</div>
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
    </div>
  )

  if (typeof window === "undefined") {
    return null
  }

  return createPortal(menuContent, document.body)
}

