"use client"

import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAccessControl } from "@/hooks/use-access-control"
import { type EnumType, type QualityEnumListItem, type EnumFormData, type UpdateEnumFormData, type EnumSubmitData, enumTypeLabels } from "@/types/quality-document"

export default function QualityEnumsPage() {
  const [selectedType, setSelectedType] = useState<EnumType | "ALL">("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingEnum, setEditingEnum] = useState<QualityEnumListItem | null>(null)

  const { canManageQualityManagement } = useAccessControl()
  const canManage = canManageQualityManagement()

  // Buscar enums
  const { data: enums, isLoading, refetch } = api.qualityEnum.list.useQuery({
    type: selectedType === "ALL" ? undefined : selectedType,
    active: true,
  })

  // Mutations
  const createEnum = api.qualityEnum.create.useMutation()
  const updateEnum = api.qualityEnum.update.useMutation()
  const deleteEnum = api.qualityEnum.delete.useMutation()

  const handleCreate = async (data: EnumSubmitData) => {
    try {
      await createEnum.mutateAsync(data as EnumFormData)
      toast.success("Enum criado com sucesso!")
      setIsCreateDialogOpen(false)
      void refetch()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar enum"
      toast.error(errorMessage)
    }
  }

  const handleUpdate = async (data: EnumSubmitData) => {
    try {
      await updateEnum.mutateAsync(data as UpdateEnumFormData)
      toast.success("Enum atualizado com sucesso!")
      setEditingEnum(null)
      void refetch()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar enum"
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este enum?")) return

    try {
      await deleteEnum.mutateAsync({ id })
      toast.success("Enum excluído com sucesso!")
      void refetch()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir enum"
      toast.error(errorMessage)
    }
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enums de Qualidade</h1>
          <p className="text-muted-foreground">
            Gerencie os valores para Processos, Tipos de Arquivo, Departamentos e Empresas
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Enum
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Enum</DialogTitle>
            </DialogHeader>
            <EnumForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as EnumType | "ALL")}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PROCESS">Processo</SelectItem>
                  <SelectItem value="FILE_TYPE">Tipo de Arquivo</SelectItem>
                  <SelectItem value="DEPARTMENT">Departamento</SelectItem>
                  <SelectItem value="ENTERPRISE">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Enums</CardTitle>
          <CardDescription>
            {enums?.length ?? 0} enums encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enums?.map((enumItem: QualityEnumListItem) => (
                  <TableRow key={enumItem.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {enumTypeLabels[enumItem.type as keyof typeof enumTypeLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{enumItem.name}</TableCell>
                    <TableCell>{enumItem.description ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={enumItem.active ? "default" : "secondary"}>
                        {enumItem.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Enum</DialogTitle>
                            </DialogHeader>
                            <EnumForm enum={enumItem} onSubmit={handleUpdate} />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(enumItem.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Componente do formulário
function EnumForm({ enum: editingEnum, onSubmit }: { enum?: QualityEnumListItem; onSubmit: (data: EnumSubmitData) => void }) {
  const [formData, setFormData] = useState<EnumFormData>({
    type: editingEnum?.type ?? "PROCESS",
    name: editingEnum?.name ?? "",
    description: editingEnum?.description ?? "",
    active: editingEnum?.active ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingEnum) {
      onSubmit({
        id: editingEnum.id,
        ...formData,
      })
    } else {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as EnumType })}
          disabled={!!editingEnum}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PROCESS">Processo</SelectItem>
            <SelectItem value="FILE_TYPE">Tipo de Arquivo</SelectItem>
            <SelectItem value="DEPARTMENT">Departamento</SelectItem>
            <SelectItem value="ENTERPRISE">Empresa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
        <Label htmlFor="active">Ativo</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">
          {editingEnum ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}
