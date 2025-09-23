"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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

interface AddMembersDialogProps {
  groupId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddMembersDialog({ groupId, open, onOpenChange, onSuccess }: AddMembersDialogProps) {
  const { toast } = useToast()
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Buscar informações do grupo
  const groupQuery = api.adminChatGroups.getGroup.useQuery(
    { id: groupId },
    { enabled: open }
  )

  const addMembersMutation = api.adminChatGroups.addMembers.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Membros adicionados",
        description: `${result.added} membro(s) foram adicionados ao grupo.`,
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

    if (selectedUsers.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um usuário para adicionar.",
        variant: "destructive",
      })
      return
    }

    addMembersMutation.mutate({
      groupId,
      memberIds: selectedUsers,
    })
  }

  const handleClose = () => {
    setSelectedUsers([])
    onOpenChange(false)
  }

  const groupName = groupQuery.data ? (groupQuery.data as { name: string }).name : 'Carregando...'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Adicionar Membros - {groupName}
          </DialogTitle>
          <DialogDescription>
            Selecione os usuários que deseja adicionar ao grupo de chat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de usuários */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Selecionar Usuários para Adicionar
            </label>
            <UserSelection
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
              excludeGroupId={groupId} // Excluir usuários que já são membros
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addMembersMutation.isPending || selectedUsers.length === 0}
            >
              {addMembersMutation.isPending
                ? "Adicionando..."
                : `Adicionar ${selectedUsers.length} Membro(s)`
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
