"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, X } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Tag {
  id: string
  nome: string
  cor: string
  timestampCreate: string
  countVezesUsadas: number
  ativa: boolean
}

interface TagsManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TagsManagerModal({ open, onOpenChange }: TagsManagerModalProps) {
  const { data: tags = [], refetch } = api.formResponse.getAllTags.useQuery(undefined, {
    enabled: open,
  })

  const createTag = api.formResponse.createTag.useMutation({
    onSuccess: () => {
      toast.success("Tag criada com sucesso")
      void refetch()
      setNewTagName("")
      setNewTagColor("#3B82F6")
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar tag")
    },
  })

  const updateTag = api.formResponse.updateTag.useMutation({
    onSuccess: () => {
      toast.success("Tag atualizada com sucesso")
      void refetch()
      setEditingTagId(null)
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar tag")
    },
  })

  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3B82F6")
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingTagName, setEditingTagName] = useState("")
  const [editingTagColor, setEditingTagColor] = useState("")

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error("Nome da tag é obrigatório")
      return
    }

    createTag.mutate({
      nome: newTagName.trim(),
      cor: newTagColor,
    })
  }

  const handleStartEdit = (tag: Tag) => {
    setEditingTagId(tag.id)
    setEditingTagName(tag.nome)
    setEditingTagColor(tag.cor)
  }

  const handleSaveEdit = (tagId: string) => {
    if (!editingTagName.trim()) {
      toast.error("Nome da tag é obrigatório")
      return
    }

    updateTag.mutate({
      id: tagId,
      nome: editingTagName.trim(),
      cor: editingTagColor,
    })
  }

  const handleCancelEdit = () => {
    setEditingTagId(null)
    setEditingTagName("")
    setEditingTagColor("")
  }

  const handleToggleActive = (tag: Tag) => {
    updateTag.mutate({
      id: tag.id,
      ativa: !tag.ativa,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
          <DialogDescription>
            Crie e gerencie tags para organizar suas solicitações
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Criar nova tag */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Criar Nova Tag</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="new-tag-name">Nome</Label>
                <Input
                  id="new-tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex: Urgente, Revisão, etc."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateTag()
                    }
                  }}
                />
              </div>
              <div className="w-32">
                <Label htmlFor="new-tag-color">Cor</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-tag-color"
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="h-10"
                  />
                  <Input
                    type="text"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    placeholder="#000000"
                    className="w-24"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleCreateTag}
                  disabled={createTag.isPending || !newTagName.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de tags */}
          <div className="space-y-2">
            <h3 className="font-semibold">Tags Existentes</h3>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tag criada ainda</p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    {editingTagId === tag.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit(tag.id)
                            } else if (e.key === "Escape") {
                              handleCancelEdit()
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editingTagColor}
                            onChange={(e) => setEditingTagColor(e.target.value)}
                            className="w-16 h-10"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(tag.id)}
                            disabled={updateTag.isPending}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 flex-1">
                          <Badge
                            style={{
                              backgroundColor: tag.cor,
                              color: "#fff",
                            }}
                            className="px-3 py-1"
                          >
                            {tag.nome}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">{tag.countVezesUsadas}</span> usos
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Criada em {format(new Date(tag.timestampCreate), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(tag)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(tag)}
                            disabled={updateTag.isPending}
                          >
                            {tag.ativa ? (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

