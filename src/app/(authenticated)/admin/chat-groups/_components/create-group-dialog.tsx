"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserSelection } from "./user-selection"

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const createGroupMutation = api.adminChatGroups.createGroup.useMutation({
    onSuccess: () => {
      toast({
        title: "Grupo criado",
        description: "O grupo de chat foi criado com sucesso.",
      })
      handleClose()
      onSuccess?.()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um membro para o grupo.",
        variant: "destructive",
      })
      return
    }

    createGroupMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      memberIds: selectedUsers,
    })
  }

  const handleClose = () => {
    setName("")
    setDescription("")
    setSelectedUsers([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo de Chat</DialogTitle>
          <DialogDescription>
            Crie um grupo de chat e selecione os membros que poderão participar da conversa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome do grupo */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Nome do Grupo *</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do grupo"
              maxLength={100}
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="group-description">Descrição (opcional)</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste grupo"
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Seleção de usuários */}
          <div className="space-y-2">
            <Label>Membros do Grupo *</Label>
            <UserSelection
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
              excludeGroupId={undefined} // Novo grupo, não excluir ninguém
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createGroupMutation.isPending}
            >
              {createGroupMutation.isPending ? "Criando..." : "Criar Grupo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
