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
import { SectorIconPicker, SectorColorPicker } from "@/components/forms/sector-icon-color-picker"
import { getLucideIconById } from "@/lib/form-icons"

export type SetorItem = {
  id: string
  name: string
  value: string
  active: boolean
  icon?: string | null
  color?: string | null
}

/**
 * Modal de gestão (CRUD) da lista de setores. A lista é a fonte da verdade para
 * o dropdown/filtro de setor e atribuição de ícone/cor.
 */
export function SetoresDialog({ setores }: { setores: SetorItem[] }) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newIcon, setNewIcon] = useState("laptop")
  const [newColor, setNewColor] = useState("#3B82F6")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editIcon, setEditIcon] = useState("laptop")
  const [editColor, setEditColor] = useState("#3B82F6")

  const [toDelete, setToDelete] = useState<SetorItem | null>(null)

  const { toast } = useToast()
  const utils = api.useUtils()

  const invalidate = async () => {
    await utils.setores.list.invalidate()
    await utils.setores.getSectorConfigs.invalidate()
    await utils.user.listUsers.invalidate()
  }

  const onError = (e: { message: string }) =>
    toast({ title: "Erro", description: e.message, variant: "destructive" })

  const createSetor = api.setores.create.useMutation({
    onSuccess: async () => {
      toast({ title: "Setor criado", description: "Setor adicionado com sucesso." })
      setNewName("")
      setNewIcon("laptop")
      setNewColor("#3B82F6")
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
    createSetor.mutate({
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
    })
  }

  const startEdit = (setor: SetorItem) => {
    setEditingId(setor.id)
    setEditName(setor.name)
    setEditIcon(setor.icon ?? "laptop")
    setEditColor(setor.color ?? "#3B82F6")
  }

  const handleSaveEdit = (setor: SetorItem) => {
    if (editName.trim().length < 2) {
      toast({ title: "Nome inválido", description: "Informe ao menos 2 caracteres.", variant: "destructive" })
      return
    }
    updateSetor.mutate({
      id: setor.id,
      name: editName.trim(),
      icon: editIcon,
      color: editColor,
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-xl font-semibold gap-1.5 shadow-2xs">
            <Tags className="h-4 w-4 text-primary" />
            Gerenciar Setores
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/80 bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Gerenciar Setores</DialogTitle>
            <DialogDescription className="text-xs">
              Configure os setores, atribua o ícone visual e a cor de destaque para cada departamento da empresa.
            </DialogDescription>
          </DialogHeader>

          {/* Criar novo setor */}
          <div className="space-y-2.5 rounded-2xl border border-border/80 bg-muted/20 p-4">
            <Label htmlFor="new-setor" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cadastrar Novo Setor
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="new-setor"
                placeholder="Ex.: Recursos Humanos, TI..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreate()
                  }
                }}
                className="h-10 rounded-xl text-sm"
              />

              {/* Quadrado 1: Escolha do Ícone */}
              <SectorIconPicker
                value={newIcon}
                onChange={setNewIcon}
                disabled={createSetor.isPending}
              />

              {/* Quadrado 2: Escolha da Cor */}
              <SectorColorPicker
                value={newColor}
                onChange={setNewColor}
                disabled={createSetor.isPending}
              />

              <Button
                onClick={handleCreate}
                disabled={createSetor.isPending}
                className="h-10 rounded-xl px-4 font-semibold shrink-0 shadow-xs"
              >
                {createSetor.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Lista de setores */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Setores Cadastrados ({setores.length})
            </span>

            {setores.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum setor cadastrado.
              </div>
            ) : (
              setores.map((setor) => {
                const isEditing = editingId === setor.id
                const SectorIcon = getLucideIconById(setor.icon)
                const sectorColor = setor.color ?? "#3B82F6"

                return (
                  <div
                    key={setor.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-2xs transition-all hover:border-primary/40"
                  >
                    {isEditing ? (
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
                          className="h-10 rounded-xl text-sm flex-1"
                          autoFocus
                        />

                        {/* Quadrado 1 de edição: Ícone */}
                        <SectorIconPicker
                          value={editIcon}
                          onChange={setEditIcon}
                          disabled={updateSetor.isPending}
                        />

                        {/* Quadrado 2 de edição: Cor */}
                        <SectorColorPicker
                          value={editColor}
                          onChange={setEditColor}
                          disabled={updateSetor.isPending}
                        />

                        <Button
                          size="sm"
                          className="h-10 w-10 rounded-xl p-0"
                          onClick={() => handleSaveEdit(setor)}
                          disabled={updateSetor.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-10 w-10 rounded-xl p-0"
                          onClick={() => {
                            setEditingId(null)
                            setEditName("")
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Miniatura do Ícone e Cor */}
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs"
                            style={{
                              backgroundColor: `${sectorColor}15`,
                              borderColor: `${sectorColor}40`,
                              color: sectorColor,
                            }}
                          >
                            <SectorIcon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-bold text-foreground">
                                {setor.name}
                              </span>
                              {!setor.active && (
                                <Badge variant="outline" className="text-[10px] bg-muted/60 text-muted-foreground border-border/70">
                                  Inativo
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {setor.value}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-xs font-semibold"
                            onClick={() =>
                              updateSetor.mutate({ id: setor.id, active: !setor.active })
                            }
                            disabled={updateSetor.isPending}
                          >
                            {setor.active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 rounded-lg p-0"
                            onClick={() => startEdit(setor)}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 rounded-lg p-0 hover:text-destructive hover:border-destructive/40"
                            onClick={() => setToDelete(setor)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Setor</AlertDialogTitle>
            <AlertDialogDescription>
              {`Tem certeza que deseja excluir "${toDelete?.name ?? ""}"? Setores com usuários vinculados não podem ser excluídos — nesse caso, desative-o.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteSetor.mutate({ id: toDelete.id })}
              disabled={deleteSetor.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
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
