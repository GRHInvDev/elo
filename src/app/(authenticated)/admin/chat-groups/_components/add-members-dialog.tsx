"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
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
  members: Array<{
    user: {
      id: string
      firstName: string | null
      lastName: string | null
      email: string
    }
  }>
}

interface AddMembersDialogProps {
  group: Group
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddMembersDialog({ group, open, onOpenChange, onSuccess }: AddMembersDialogProps) {
  const { toast } = useToast()
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Mutation para adicionar membros
  const addMembersMutation = api.adminChatGroups.addMembers.useMutation({
    onSuccess: () => {
      toast({
        title: "Membros adicionados",
        description: `${selectedUsers.length} membro(s) foram adicionados ao grupo com sucesso.`,
      })
      handleClose()
      onSuccess()
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar membros",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleClose = () => {
    setSelectedUsers([])
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedUsers.length === 0) {
      toast({
        title: "Nenhum membro selecionado",
        description: "Por favor, selecione pelo menos um usuário para adicionar.",
        variant: "destructive",
      })
      return
    }

    addMembersMutation.mutate({
      groupId: group.id,
      memberIds: selectedUsers,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Membros - {group.name}</DialogTitle>
          <DialogDescription>
            Selecione os usuários que deseja adicionar ao grupo. Usuários já membros não aparecerão na lista.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do grupo atual */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Membros Atuais</h4>
            <div className="flex flex-wrap gap-2">
              {group.members.map((member) => (
                <span key={member.user.id} className="text-sm bg-background px-2 py-1 rounded">
                  {member.user.firstName || member.user.lastName
                    ? `${member.user.firstName ?? ''} ${member.user.lastName ?? ''}`.trim()
                    : member.user.email}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {group.members.length} membro{group.members.length !== 1 ? 's' : ''} atualmente
            </p>
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
              disabled={addMembersMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addMembersMutation.isPending || selectedUsers.length === 0}
            >
              {addMembersMutation.isPending
                ? "Adicionando..."
                : `Adicionar ${selectedUsers.length} Membro${selectedUsers.length !== 1 ? 's' : ''}`
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
