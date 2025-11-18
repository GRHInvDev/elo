"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Trash2, Users, AlertCircle } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { Enterprise } from "@prisma/client"
import type { RouterOutputs } from "@/trpc/react"
import { Input } from "@/components/ui/input"

type EnterpriseManager = RouterOutputs["enterpriseManager"]["list"][number]

export function EnterpriseManagers() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedUser, setSelectedUser] = useState<{ id: string; firstName: string | null; lastName: string | null; email: string } | null>(null)
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | "">("")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: managers, isLoading, refetch } = api.enterpriseManager.list.useQuery()
  const { data: users, isLoading: isLoadingUsers } = api.user.searchMinimal.useQuery(
    { query: searchQuery },
    { enabled: dialogOpen && searchQuery.length > 2 }
  )

  const createManager = api.enterpriseManager.create.useMutation({
    onSuccess: () => {
      toast.success("Responsável adicionado com sucesso!")
      setDialogOpen(false)
      setSelectedUserId("")
      setSelectedUser(null)
      setSelectedEnterprise("")
      setSearchQuery("")
      void refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar responsável: ${error.message}`)
    },
  })

  const deleteManager = api.enterpriseManager.delete.useMutation({
    onSuccess: () => {
      toast.success("Responsável removido com sucesso!")
      void refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao remover responsável: ${error.message}`)
    },
  })

  const handleAddManager = () => {
    if (!selectedUserId || !selectedEnterprise) {
      toast.error("Selecione um usuário e uma empresa")
      return
    }

    createManager.mutate({
      userId: selectedUserId,
      enterprise: selectedEnterprise as Enterprise,
    })
  }

  const handleDeleteManager = (id: string) => {
    if (confirm("Tem certeza que deseja remover este responsável?")) {
      deleteManager.mutate({ id })
    }
  }

  // Agrupar responsáveis por empresa
  const managersByEnterprise = managers?.reduce((acc, manager) => {
    if (!acc[manager.enterprise]) {
      acc[manager.enterprise] = []
    }
    acc[manager.enterprise]!.push(manager)
    return acc
  }, {} as Record<Enterprise, EnterpriseManager[]>) ?? {}

  const enterpriseLabels: Record<Enterprise, string> = {
    NA: "N/A",
    Box: "Box",
    RHenz: "RHenz",
    Cristallux: "Cristallux",
    Box_Filial: "Box Filial",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Responsáveis por Empresa
            </CardTitle>
            <CardDescription>
              Designe responsáveis para gerenciar pedidos de cada empresa
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Responsável
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Responsável</DialogTitle>
                <DialogDescription>
                  Selecione um usuário e uma empresa para designá-lo como responsável
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Buscar Usuário
                  </label>
                  {selectedUser ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                        <div>
                          <div className="font-medium">
                            {selectedUser.firstName} {selectedUser.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId("")
                            setSelectedUser(null)
                            setSearchQuery("")
                          }}
                        >
                          Limpar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="text"
                        placeholder="Digite o nome ou email do usuário..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {isLoadingUsers && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Buscando...
                        </div>
                      )}
                      {users && users.length > 0 && (
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto border rounded-md p-1">
                          {users.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setSelectedUserId(user.id)
                                setSelectedUser(user)
                                setSearchQuery("")
                              }}
                              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                            >
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchQuery.length > 2 && users && users.length === 0 && !isLoadingUsers && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Nenhum usuário encontrado
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Empresa
                  </label>
                  <Select
                    value={selectedEnterprise}
                    onValueChange={(value) => setSelectedEnterprise(value as Enterprise)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(enterpriseLabels)
                        .filter(([key]) => key !== "NA")
                        .map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false)
                      setSelectedUserId("")
                      setSelectedUser(null)
                      setSelectedEnterprise("")
                      setSearchQuery("")
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddManager}
                    disabled={!selectedUserId || !selectedEnterprise || createManager.isPending}
                  >
                    {createManager.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      "Adicionar"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : managers && managers.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(managersByEnterprise).map(([enterprise, enterpriseManagers]) => (
              <div key={enterprise} className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {enterpriseLabels[enterprise as Enterprise]}
                  <Badge variant="secondary">{enterpriseManagers.length}</Badge>
                </h3>
                <div className="grid gap-2">
                  {enterpriseManagers.map((manager) => (
                    <div
                      key={manager.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {manager.user.firstName} {manager.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {manager.user.email}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteManager(manager.id)}
                        disabled={deleteManager.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum responsável designado. Adicione responsáveis para cada empresa.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

