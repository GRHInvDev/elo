"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import {
  MessageSquare,
  Users,
  Trash2,
  MoreHorizontal,
  Edit,
  UserPlus
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { EditGroupDialog } from "./edit-group-dialog"
import { AddMembersDialog } from "./add-members-dialog"

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

export function ChatGroupsList() {
  const { toast } = useToast()
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null)
  const [groupToEdit, setGroupToEdit] = useState<string | null>(null)
  const [groupToAddMembers, setGroupToAddMembers] = useState<string | null>(null)

  // Buscar grupos
  const groupsQuery = api.adminChatGroups.getGroups.useQuery()

  // Deletar grupo
  const deleteGroupMutation = api.adminChatGroups.deleteGroup.useMutation({
    onSuccess: () => {
      toast({
        title: "Grupo deletado",
        description: "O grupo de chat foi removido com sucesso.",
      })
      void groupsQuery.refetch()
      setGroupToDelete(null)
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleDeleteGroup = (groupId: string) => {
    deleteGroupMutation.mutate({ id: groupId })
  }

  if (groupsQuery.isLoading) {
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

  if (!groupsQuery.data || !Array.isArray(groupsQuery.data) || groupsQuery.data.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum grupo criado</h3>
        <p className="text-muted-foreground mb-4">
          Crie seu primeiro grupo de chat para começar a organizar conversas privadas.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {groupsQuery.data.map((group: Group) => (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <CardDescription>
                      {group.description ?? "Sem descrição"}
                    </CardDescription>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setGroupToEdit(group.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Grupo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupToAddMembers(group.id)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar Membros
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setGroupToDelete(group.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar Grupo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Estatísticas */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group._count.members} membros</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{group._count.messages} mensagens</span>
                  </div>

                  {/* Status */}
                  <Badge variant={group.isActive ? "default" : "secondary"}>
                    {group.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                {/* Avatares dos membros */}
                <div className="flex -space-x-2">
                  {group.members.slice(0, 5).map((member) => (
                    <Avatar key={member.user.id} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={member.user.imageUrl ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {member.user.firstName?.charAt(0) ?? member.user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {group._count.members > 5 && (
                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        +{group._count.members - 5}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Criado por */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Criado por {group.createdBy.firstName ?? ''} {group.createdBy.lastName ?? ''} em{" "}
                  {group.createdAt.toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de confirmação de delete */}
      <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este grupo? Esta ação não pode ser desfeita.
              Todas as mensagens e configurações serão perdidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => groupToDelete && handleDeleteGroup(groupToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar Grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de editar grupo */}
      {groupToEdit && (
        <EditGroupDialog
          groupId={groupToEdit}
          open={!!groupToEdit}
          onOpenChange={() => setGroupToEdit(null)}
          onSuccess={() => {
            void groupsQuery.refetch()
            setGroupToEdit(null)
          }}
        />
      )}

      {/* Dialog de adicionar membros */}
      {groupToAddMembers && (
        <AddMembersDialog
          groupId={groupToAddMembers}
          open={!!groupToAddMembers}
          onOpenChange={() => setGroupToAddMembers(null)}
          onSuccess={() => {
            void groupsQuery.refetch()
            setGroupToAddMembers(null)
          }}
        />
      )}
    </>
  )
}
