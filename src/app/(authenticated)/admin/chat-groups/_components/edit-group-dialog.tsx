"use client"

import { useState, useEffect } from "react"
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

interface Group {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  members: Array<{
    user: {
      id: string
      firstName: string | null
      lastName: string | null
      email: string
      imageUrl: string | null
    }
  }>
  createdBy: {
    id: string
    firstName: string | null
    lastName: string | null
  }
  _count: {
    members: number
    messages: number
  }
}

interface EditGroupDialogProps {
  groupId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditGroupDialog({ groupId, open, onOpenChange, onSuccess }: EditGroupDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Buscar dados do grupo
  const groupQuery = api.adminChatGroups.getGroup.useQuery(
    { id: groupId },
    { enabled: open && !!groupId }
  )

  // Preencher campos quando o grupo for carregado
  useEffect(() => {
    if (groupQuery.data) {
      const group = groupQuery.data as unknown as Group
      setName(group.name)
      setDescription(group.description ?? "")
      setSelectedUsers(group.members.map(m => m.user.id))
    }
  }, [groupQuery.data])

  const updateGroupMutation = api.adminChatGroups.updateGroup.useMutation({
    onSuccess: () => {
      toast({
        title: "Grupo atualizado",
        description: "O grupo de chat foi atualizado com sucesso.",
      })
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

    updateGroupMutation.mutate({
      id: groupId,
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

  if (groupQuery.isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Grupo de Chat</DialogTitle>
          <DialogDescription>
            Atualize as informações do grupo e gerencie seus membros.
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
              excludeGroupId={undefined} // Para edição, permitir qualquer usuário
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateGroupMutation.isPending}
            >
              {updateGroupMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
