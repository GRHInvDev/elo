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
import { Loader2, Plus, Trash2, Users, AlertCircle, Mail } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import type { Enterprise } from "@prisma/client"
import type { RouterOutputs } from "@/trpc/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type EnterpriseManager = RouterOutputs["enterpriseManager"]["list"][number]

export function EnterpriseManagers() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [managerType, setManagerType] = useState<"internal" | "external">("internal")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedUser, setSelectedUser] = useState<{ id: string; firstName: string | null; lastName: string | null; email: string } | null>(null)
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | "">("")
  const [searchQuery, setSearchQuery] = useState("")
  const [externalName, setExternalName] = useState("")
  const [externalEmail, setExternalEmail] = useState("")

  const { data: managers, isLoading, refetch } = api.enterpriseManager.list.useQuery()
  const { data: users, isLoading: isLoadingUsers } = api.user.searchMinimal.useQuery(
    { query: searchQuery },
    { enabled: dialogOpen && searchQuery.length > 2 }
  )

  // Resetar estado quando dialog fecha
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      // Resetar tudo quando fechar
      setManagerType("internal")
      setSelectedUserId("")
      setSelectedUser(null)
      setSelectedEnterprise("")
      setSearchQuery("")
      setExternalName("")
      setExternalEmail("")
    }
  }

  const createManager = api.enterpriseManager.create.useMutation({
    onSuccess: () => {
      toast.success("Responsável adicionado com sucesso!")
      handleDialogOpenChange(false)
      void refetch()
    },
    onError: (error: { message?: string }) => {
      toast.error(`Erro ao adicionar responsável: ${error.message ?? "Erro desconhecido"}`)
    },
  })

  const deleteManager = api.enterpriseManager.delete.useMutation({
    onSuccess: () => {
      toast.success("Responsável removido com sucesso!")
      void refetch()
    },
    onError: (error: { message?: string }) => {
      toast.error(`Erro ao remover responsável: ${error.message ?? "Erro desconhecido"}`)
    },
  })

  const handleAddManager = () => {
    if (!selectedEnterprise) {
      toast.error("Selecione uma empresa")
      return
    }

    if (managerType === "internal") {
      if (!selectedUserId) {
        toast.error("Selecione um usuário")
        return
      }
      createManager.mutate({
        userId: selectedUserId,
        enterprise: selectedEnterprise,
      })
    } else {
      if (!externalName.trim() || !externalEmail.trim()) {
        toast.error("Preencha o nome e email do responsável externo")
        return
      }
      createManager.mutate({
        externalName: externalName.trim(),
        externalEmail: externalEmail.trim(),
        enterprise: selectedEnterprise,
      })
    }
  }

  const handleDeleteManager = (id: string) => {
    if (confirm("Tem certeza que deseja remover este responsável?")) {
      deleteManager.mutate({ id })
    }
  }

  // Agrupar responsáveis por empresa
  const managersByEnterprise = managers?.reduce((acc, manager) => {
    const enterprise = manager.enterprise
    if (!acc[enterprise]) {
      acc[enterprise] = []
    }
    acc[enterprise].push(manager)
    return acc
  }, {} as Record<Enterprise, EnterpriseManager[]>) ?? {}

  const enterpriseLabels: Record<Enterprise, string> = {
    NA: "N/A",
    Box: "Box",
    RHenz: "RHenz",
    Cristallux: "Cristallux",
    Box_Filial: "Box Filial",
    Cristallux_Filial: "Cristallux Filial"
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
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Responsável
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Responsável</DialogTitle>
                <DialogDescription>
                  Adicione um usuário da Intranet ou um email externo como responsável
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Tabs value={managerType} onValueChange={(value) => setManagerType(value as "internal" | "external")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="internal">
                      <Users className="h-4 w-4 mr-2" />
                      Usuário Interno
                    </TabsTrigger>
                    <TabsTrigger value="external">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Externo
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="internal" className="space-y-4 mt-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Buscar Usuário
                      </Label>
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
                  </TabsContent>

                  <TabsContent value="external" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="externalName" className="text-sm font-medium mb-2 block">
                        Nome do Responsável
                      </Label>
                      <Input
                        id="externalName"
                        type="text"
                        placeholder="Digite o nome completo..."
                        value={externalName}
                        onChange={(e) => setExternalName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="externalEmail" className="text-sm font-medium mb-2 block">
                        Email
                      </Label>
                      <Input
                        id="externalEmail"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={externalEmail}
                        onChange={(e) => setExternalEmail(e.target.value)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Empresa
                  </Label>
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
                  {selectedEnterprise && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Empresa selecionada: {enterpriseLabels[selectedEnterprise]}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddManager}
                    disabled={
                      createManager.isPending ||
                      !selectedEnterprise ||
                      (managerType === "internal" && !selectedUserId) ||
                      (managerType === "external" && (!externalName.trim() || !externalEmail.trim()))
                    }
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
            {Object.entries(managersByEnterprise).map(([enterprise, enterpriseManagers]) => {
              const managersList = enterpriseManagers as EnterpriseManager[]
              return (
                <div key={enterprise} className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {enterpriseLabels[enterprise as Enterprise]}
                    <Badge variant="secondary">{managersList.length}</Badge>
                  </h3>
                  <div className="grid gap-2">
                    {managersList.map((manager) => {
                      const isExternal = !manager.user && manager.externalEmail
                      const displayName = isExternal 
                        ? manager.externalName ?? "Sem nome"
                        : `${manager.user?.firstName ?? ""} ${manager.user?.lastName ?? ""}`.trim() || "Sem nome"
                      const displayEmail = isExternal 
                        ? manager.externalEmail ?? ""
                        : manager.user?.email ?? ""
                      
                      return (
                        <div
                          key={manager.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            {isExternal && (
                              <Badge variant="outline" className="text-xs">
                                <Mail className="h-3 w-3 mr-1" />
                                Externo
                              </Badge>
                            )}
                            <div>
                              <div className="font-medium">
                                {displayName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {displayEmail}
                              </div>
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
                      )
                    })}
                  </div>
                </div>
              )
            })}
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

