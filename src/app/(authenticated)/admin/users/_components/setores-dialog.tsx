"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { Tags, Plus, Edit3, Trash2, Check, X, Loader2 } from "lucide-react"

export type SetorItem = { id: string; name: string; value: string; active: boolean }

/**
 * Modal de gestão (CRUD) da lista de setores. A lista é a fonte da verdade para
 * o dropdown/filtro de setor na gestão de usuários. Segue o padrão de modais do
 * app (Dialog com fade-in) e reaproveita o Design System.
 */
export function SetoresDialog({ setores }: { setores: SetorItem[] }) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [toDelete, setToDelete] = useState<SetorItem | null>(null)

  const { toast } = useToast()
  const utils = api.useUtils()

  const invalidate = async () => {
    await utils.setores.list.invalidate()
    await utils.user.listUsers.invalidate()
  }

  const onError = (e: { message: string }) =>
    toast({ title: "Erro", description: e.message, variant: "destructive" })

  const createSetor = api.setores.create.useMutation({
    onSuccess: async () => {
      toast({ title: "Setor criado", description: "Setor adicionado com sucesso." })
      setNewName("")
      await invalidate()
    },
    onError,
  })

  const updateSetor = api.setores.update.useMutation({
    onSuccess: async () => {
      toast({ title: "Setor atualizado", description: "Setor atualizado com sucesso." })
      setEditingId(null)
      setEditName("")
      await invalidate()
    },
    onError,
  })

  const deleteSetor = api.setores.delete.useMutation({
    onSuccess: async () => {
      toast({ title: "Setor excluído", description: "Setor removido com sucesso." })
      setToDelete(null)
      await invalidate()
    },
    onError,
  })

  const handleCreate = () => {
    if (newName.trim().length < 2) {
      toast({ title: "Nome inválido", description: "Informe ao menos 2 caracteres.", variant: "destructive" })
      return
    }
    createSetor.mutate({ name: newName.trim() })
  }

  const startEdit = (setor: SetorItem) => {
    setEditingId(setor.id)
    setEditName(setor.name)
  }

  const handleSaveEdit = (setor: SetorItem) => {
    if (editName.trim().length < 2) {
      toast({ title: "Nome inválido", description: "Informe ao menos 2 caracteres.", variant: "destructive" })
      return
    }
    updateSetor.mutate({ id: setor.id, name: editName.trim() })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Tags className="mr-2 h-4 w-4" />
            Gerenciar Setores
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Setores</DialogTitle>
            <DialogDescription>
              Setores usados no cadastro e no filtro de usuários. Ative/desative para controlar a disponibilidade.
            </DialogDescription>
          </DialogHeader>

          {/* Criar novo setor */}
          <div className="space-y-2">
            <Label htmlFor="new-setor">Novo setor</Label>
            <div className="flex gap-2">
              <Input
                id="new-setor"
                placeholder="Ex.: Qualidade"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreate()
                  }
                }}
              />
              <Button onClick={handleCreate} disabled={createSetor.isPending}>
                {createSetor.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Lista de setores */}
          <div className="space-y-2">
            {setores.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum setor cadastrado.
              </div>
            ) : (
              setores.map((setor) => (
                <div
                  key={setor.id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  {editingId === setor.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleSaveEdit(setor)
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveEdit(setor)}
                        disabled={updateSetor.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditingId(null); setEditName("") }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{setor.name}</span>
                          {!setor.active && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{setor.value}</span>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateSetor.mutate({ id: setor.id, active: !setor.active })
                          }
                          disabled={updateSetor.isPending}
                        >
                          {setor.active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(setor)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setToDelete(setor)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Setor</AlertDialogTitle>
            <AlertDialogDescription>
              {`Tem certeza que deseja excluir "${toDelete?.name ?? ""}"? Setores com usuários vinculados não podem ser excluídos — nesse caso, desative-o.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteSetor.mutate({ id: toDelete.id })}
              disabled={deleteSetor.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSetor.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</>
              ) : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
