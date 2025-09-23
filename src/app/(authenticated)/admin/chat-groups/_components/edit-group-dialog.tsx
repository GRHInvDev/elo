"use client"

import React, { useState, useEffect } from "react"
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

interface Group {
  id: string
  name: string
  description: string | null
  members: Array<{
    user: {
      id: string
      firstName: string | null
      lastName: string | null
      email: string
      imageUrl: string | null
    }
  }>
}

interface EditGroupDialogProps {
  group: Group
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditGroupDialog({ group, open, onOpenChange, onSuccess }: EditGroupDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Preencher campos quando o grupo muda
  useEffect(() => {
    if (group) {
      setName(group.name)
      setDescription(group.description ?? "")
      setSelectedUsers(group.members.map(member => member.user.id))
    }
  }, [group])

  // Mutation para atualizar grupo
  const updateGroupMutation = api.adminChatGroups.updateGroup.useMutation({
    onSuccess: () => {
      toast({
        title: "Grupo atualizado",
        description: "O grupo foi atualizado com sucesso.",
      })
      onSuccess()
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar grupo",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleClose = () => {
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

    updateGroupMutation.mutate({
      id: group.id,
      name: name.trim(),
      description: description.trim() || undefined,
      memberIds: selectedUsers,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Grupo</DialogTitle>
          <DialogDescription>
            Atualize as informações do grupo e gerencie seus membros.
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
            excludeGroupId={group.id}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateGroupMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateGroupMutation.isPending || !name.trim() || selectedUsers.length === 0}
            >
              {updateGroupMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
