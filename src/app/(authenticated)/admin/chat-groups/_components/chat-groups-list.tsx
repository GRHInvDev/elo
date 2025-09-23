"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { Users, Edit, Trash2, UserPlus, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { EditGroupDialog } from "./edit-group-dialog"
import { AddMembersDialog } from "./add-members-dialog"

interface Group {
  id: string
  name: string
  description: string | null
  createdAt: Date
  isActive: boolean
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
    firstName: string | null
    lastName: string | null
  }
}

export function ChatGroupsList() {
  const { toast } = useToast()
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null)
  const [groupToAddMembers, setGroupToAddMembers] = useState<Group | null>(null)

  // Buscar grupos
  const { data: groups, isLoading, refetch } = api.adminChatGroups.getGroups.useQuery()

  // Mutations
  const deleteGroupMutation = api.adminChatGroups.deleteGroup.useMutation({
    onSuccess: () => {
      toast({
        title: "Grupo deletado",
        description: "O grupo foi removido com sucesso.",
      })
      void refetch()
      setGroupToDelete(null)
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar grupo",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Vamos remover a funcionalidade de toggle active por enquanto já que não está implementada no backend

  const handleDelete = () => {
    if (groupToDelete) {
      deleteGroupMutation.mutate({ id: groupToDelete.id })
    }
  }


  const formatUserName = (user: { firstName: string | null; lastName: string | null; email: string }) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    }
    return user.email
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum grupo encontrado</h3>
        <p className="text-muted-foreground mb-4">
          Crie o primeiro grupo de chat para começar.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {groups.map((group) => (
            <Card key={group.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                  </div>
                  {group.description && (
                    <CardDescription className="mt-1">
                      {group.description}
                    </CardDescription>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setGroupToEdit(group)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Grupo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupToAddMembers(group)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar Membros
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setGroupToDelete(group)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {group.members.length} membro{group.members.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {group.members.length > 0 && (
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 5).map((member) => (
                      <Avatar key={member.user.id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={member.user.imageUrl ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {member.user.firstName?.charAt(0) ?? member.user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {group.members.length > 5 && (
                      <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                        <span className="text-xs font-medium">+{group.members.length - 5}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para editar grupo */}
      {groupToEdit && (
        <EditGroupDialog
          group={groupToEdit}
          open={!!groupToEdit}
          onOpenChange={(open) => !open && setGroupToEdit(null)}
          onSuccess={() => {
            void refetch()
            setGroupToEdit(null)
          }}
        />
      )}

      {/* Dialog para adicionar membros */}
      {groupToAddMembers && (
        <AddMembersDialog
          group={groupToAddMembers}
          open={!!groupToAddMembers}
          onOpenChange={(open) => !open && setGroupToAddMembers(null)}
          onSuccess={() => {
            void refetch()
            setGroupToAddMembers(null)
          }}
        />
      )}

      {/* Dialog de confirmação para deletar */}
      <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o grupo &quot;{groupToDelete?.name}&quot;?
              Esta ação não pode ser desfeita e todas as mensagens do grupo serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar Grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
