"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { UserSelection } from "./user-selection"

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Mutation para criar grupo
  const createGroupMutation = api.adminChatGroups.createGroup.useMutation({
    onSuccess: () => {
      toast({
        title: "Grupo criado",
        description: "O grupo foi criado com sucesso.",
      })
      handleClose()
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar grupo",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleClose = () => {
    setName("")
    setDescription("")
    setSelectedUsers([])
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite um nome para o grupo.",
        variant: "destructive",
      })
      return
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Membros obrigatórios",
        description: "Por favor, selecione pelo menos um membro para o grupo.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
          <DialogDescription>
            Crie um novo grupo de chat e convide membros para participar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome do grupo */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Grupo *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do grupo"
              maxLength={100}
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito do grupo"
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Seleção de usuários */}
          <UserSelection
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createGroupMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createGroupMutation.isPending || !name.trim() || selectedUsers.length === 0}
            >
              {createGroupMutation.isPending ? "Criando..." : "Criar Grupo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
