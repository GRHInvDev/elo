"use client"

import { useState } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { type MenuItem, type MenuItemOption, type MenuItemOptionChoice } from "@prisma/client"
import * as XLSX from "xlsx"

export default function MenuEditor() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Adicionar estados para Dialogs
  const [openAddMenuItem, setOpenAddMenuItem] = useState(false)
  const [openEditMenuItemId, setOpenEditMenuItemId] = useState<string | null>(null)
  const [openAddOptionId, setOpenAddOptionId] = useState<string | null>(null)
  const [openEditOptionId, setOpenEditOptionId] = useState<string | null>(null)
  const [openAddChoiceOptionId, setOpenAddChoiceOptionId] = useState<string | null>(null)
  const [openEditChoiceId, setOpenEditChoiceId] = useState<string | null>(null)

  const utils = api.useUtils()

  // Buscar restaurantes
  const restaurants = api.restaurant.list.useQuery()

  // Buscar itens do menu do restaurante selecionado
  const menuItems = api.menuItem.byRestaurant.useQuery(
    { restaurantId: selectedRestaurant },
    { enabled: !!selectedRestaurant }
  )

  const createMenuItem = api.menuItem.create.useMutation({
    onSuccess: () => {
      void utils.menuItem.byRestaurant.invalidate({ restaurantId: selectedRestaurant })
      toast.success("Prato criado com sucesso!")
    },
    onError: (error) => {
      toast.error(`Erro ao criar prato: ${error.message}`)
    },
  })

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  // Função para exportar cardápio para Excel
  const handleExportMenu = () => {
    if (!menuItems.data || menuItems.data.length === 0) {
      toast.error("Nenhum item de cardápio para exportar.")
      return
    }
    const dataToExport = menuItems.data.map((item) => ({
      "Nome": item.name,
      "Descrição": item.description,
      "Preço": item.price,
      "Categoria": item.category,
      "Disponível": item.available ? "Sim" : "Não"
    }))
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Cardápio")
    XLSX.writeFile(wb, `cardapio_${selectedRestaurant}.xlsx`)
    toast.success("Cardápio exportado com sucesso!")
  }

  // Função para importar cardápio de Excel
  const handleImportMenu = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]!]
      const json = XLSX.utils.sheet_to_json(sheet!)
      // json: Array<{ Nome, Descrição, Preço, Categoria, Disponível }>
      await Promise.all(json.map((row) => {
        if (typeof (row as { Nome: string }).Nome !== "string" || !(row as { Nome: string }).Nome) return Promise.resolve()
        return new Promise<void>((resolve) => {
          void createMenuItem.mutate({
            restaurantId: selectedRestaurant,
            name: (row as { Nome: string }).Nome,
            description: (row as { Descrição: string }).Descrição ?? "",
            price: Number((row as { Preço: number }).Preço) ?? 0,
            category: (row as { Categoria: string }).Categoria ?? "",
            available: (row as { Disponível: string }).Disponível === "Sim"
          }, {
            onSuccess: () => resolve(),
            onError: () => resolve()
          })
        })
      }))
      toast.success("Cardápio importado com sucesso!")
    } catch {
      toast.error("Erro ao importar cardápio. Verifique o arquivo.")
    }
  }

  // Função para refresh do menu
  const refreshMenu = () => menuItems.refetch()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administração de Cardápios</h1>
        <p className="text-muted-foreground">
          Gerencie os pratos e opções dos restaurantes parceiros
        </p>
      </div>

      {/* Seleção de restaurante */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Restaurante</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um restaurante" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.data?.map((restaurant) => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name} - {restaurant.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Botões de exportação/importação do cardápio */}
      {selectedRestaurant && (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" onClick={handleExportMenu}>
            Exportar Cardápio Excel
          </Button>
          <label className="inline-block">
            <Button variant="outline" asChild>
              <span>Importar Cardápio Excel</span>
            </Button>
            <input type="file" accept=".xlsx,.xls" onChange={handleImportMenu} className="hidden" />
          </label>
        </div>
      )}

      {selectedRestaurant && (
        <Tabs defaultValue="menu" className="space-y-4">
          <TabsList>
            <TabsTrigger value="menu">Cardápio</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-4">
            {/* Adicionar novo item */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Itens do Cardápio</CardTitle>
                    <CardDescription>
                      Gerencie os pratos disponíveis
                    </CardDescription>
                  </div>
                  <Dialog open={openAddMenuItem} onOpenChange={setOpenAddMenuItem}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Prato
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Prato</DialogTitle>
                        <DialogDescription>
                          Preencha as informações do novo prato
                        </DialogDescription>
                      </DialogHeader>
                      <MenuItemForm
                        restaurantId={selectedRestaurant}
                        onSuccess={() => {
                          setOpenAddMenuItem(false)
                          void refreshMenu()
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {menuItems.data && menuItems.data.length > 0 ? (
                  <div className="space-y-4">
                    {menuItems.data.map((item) => (
                      <Card key={item.id} className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpanded(item.id)}
                                >
                                  {expandedItems.has(item.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <p className="font-medium">{item.name}</p>
                                <Badge variant="outline">{item.category}</Badge>
                                <Badge variant={item.available ? "default" : "secondary"}>
                                  {item.available ? "Disponível" : "Indisponível"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground ml-10">
                                {item.description}
                              </p>
                              <p className="text-sm font-medium ml-10">
                                R$ {item.price.toFixed(2)}
                              </p>

                              {/* Opções expandidas */}
                              {expandedItems.has(item.id) && (
                                <div className="ml-10 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-medium">Opções do Prato</h4>
                                  </div>

                                  <MenuItemOptionsList
                                    menuItemId={item.id}
                                    onOptionChanged={refreshMenu}
                                    openAddOptionId={openAddOptionId}
                                    setOpenAddOptionId={setOpenAddOptionId}
                                    openEditOptionId={openEditOptionId}
                                    setOpenEditOptionId={setOpenEditOptionId}
                                    openAddChoiceOptionId={openAddChoiceOptionId}
                                    setOpenAddChoiceOptionId={setOpenAddChoiceOptionId}
                                    openEditChoiceId={openEditChoiceId}
                                    setOpenEditChoiceId={setOpenEditChoiceId}
                                  />
                                  <Dialog open={openAddOptionId === item.id} onOpenChange={(open) => setOpenAddOptionId(open ? item.id : null)}>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Adicionar Opção
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Adicionar Opção</DialogTitle>
                                      </DialogHeader>
                                      <MenuItemOptionForm
                                        menuItemId={item.id}
                                        onSuccess={() => {
                                          setOpenAddOptionId(null)
                                          void refreshMenu()
                                        }}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Dialog open={openEditMenuItemId === item.id} onOpenChange={(open) => setOpenEditMenuItemId(open ? item.id : null)}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Editar Prato</DialogTitle>
                                  </DialogHeader>
                                  <MenuItemForm
                                    restaurantId={selectedRestaurant}
                                    menuItem={item}
                                    onSuccess={() => {
                                      setOpenEditMenuItemId(null)
                                      void refreshMenu()
                                    }}
                                  />
                                </DialogContent>
                              </Dialog>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum prato cadastrado para este restaurante
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
                <CardDescription>
                  Gerencie as categorias dos pratos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoriesManager restaurantId={selectedRestaurant} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// Componente de formulário de item do menu
function MenuItemForm({ restaurantId, menuItem, onSuccess }: { restaurantId: string; menuItem?: MenuItem; onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    name: menuItem?.name ?? "",
    description: menuItem?.description ?? "",
    price: menuItem?.price ?? 0,
    category: menuItem?.category ?? "",
    available: menuItem?.available ?? true,
  })

  const utils = api.useUtils()

  const createMenuItem = api.menuItem.create.useMutation({
    onSuccess: () => {
      toast.success("Prato criado com sucesso!")
      onSuccess?.()
      void utils.menuItem.byRestaurant.invalidate({ restaurantId })
    },
    onError: (error) => {
      toast.error(`Erro ao criar prato: ${error.message}`)
    },
  })

  const updateMenuItem = api.menuItem.update.useMutation({
    onSuccess: () => {
      toast.success("Prato atualizado com sucesso!")
      onSuccess?.()
      void utils.menuItem.byRestaurant.invalidate({ restaurantId })
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar prato: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (menuItem) {
      void updateMenuItem.mutate({
        id: menuItem.id,
        ...formData,
        restaurantId,
      })
    } else {
      void createMenuItem.mutate({
        ...formData,
        restaurantId,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Prato</Label>
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
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="available"
          checked={formData.available}
          onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
        />
        <Label htmlFor="available">Disponível</Label>
      </div>

      <Button type="submit" className="w-full">
        {menuItem ? "Atualizar" : "Criar"} Prato
      </Button>
    </form>
  )
}

// Componente de formulário de opção
function MenuItemOptionForm({ menuItemId, option, onSuccess }: { menuItemId: string; option?: MenuItemOption; onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    name: option?.name ?? "",
    description: option?.description ?? "",
    required: option?.required ?? false,
    multiple: option?.multiple ?? false,
  })

  const utils = api.useUtils()

  const createOption = api.menuItemOption.create.useMutation({
    onSuccess: () => {
      toast.success("Opção criada com sucesso!")
      onSuccess?.()
      void utils.menuItemOption.byMenuItem.invalidate({ menuItemId })
    },
    onError: (error) => {
      toast.error(`Erro ao criar opção: ${error.message}`)
    },
  })

  const updateOption = api.menuItemOption.update.useMutation({
    onSuccess: () => {
      toast.success("Opção atualizada com sucesso!")
      onSuccess?.()
      void utils.menuItemOption.byMenuItem.invalidate({ menuItemId })
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar opção: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (option) {
      void updateOption.mutate({
        id: option.id,
        ...formData,
        menuItemId,
      })
    } else {
      void createOption.mutate({
        ...formData,
        menuItemId,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="optionName">Nome da Opção</Label>
        <Input
          id="optionName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Tamanho, Temperatura, Adicionais"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="optionDescription">Descrição</Label>
        <Textarea
          id="optionDescription"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição da opção (opcional)"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="required"
            checked={formData.required}
            onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
          />
          <Label htmlFor="required">Obrigatória (cliente deve escolher)</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="multiple"
            checked={formData.multiple}
            onCheckedChange={(checked) => setFormData({ ...formData, multiple: checked })}
          />
          <Label htmlFor="multiple">Múltipla escolha</Label>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {option ? "Atualizar" : "Criar"} Opção
      </Button>
    </form>
  )
}

// Componente para listar opções de um item
function MenuItemOptionsList({ menuItemId, onOptionChanged, openEditOptionId, setOpenEditOptionId, openAddChoiceOptionId, setOpenAddChoiceOptionId, openEditChoiceId, setOpenEditChoiceId }: { menuItemId: string; onOptionChanged?: () => void; openAddOptionId: string | null; setOpenAddOptionId: (open: string | null) => void; openEditOptionId: string | null; setOpenEditOptionId: (open: string | null) => void; openAddChoiceOptionId: string | null; setOpenAddChoiceOptionId: (open: string | null) => void; openEditChoiceId: string | null; setOpenEditChoiceId: (open: string | null) => void }) {
  const options = api.menuItemOption.byMenuItem.useQuery({ menuItemId })
  const utils = api.useUtils()

  const deleteOption = api.menuItemOption.delete.useMutation({
    onSuccess: () => {
      toast.success("Opção excluída com sucesso!")
      void utils.menuItemOption.byMenuItem.invalidate({ menuItemId })
      onOptionChanged?.()
    },
    onError: (error) => {
      toast.error(`Erro ao excluir opção: ${error.message}`)
    },
  })

  if (!options.data || options.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma opção cadastrada para este prato
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {options.data.map((option) => (
        <Card key={option.id} className="bg-background">
          <CardContent className="pt-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{option.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {option.required ? "Obrigatória" : "Opcional"}
                  </Badge>
                  {option.multiple && (
                    <Badge variant="secondary" className="text-xs">
                      Múltipla
                    </Badge>
                  )}
                </div>
                {option.description && (
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                )}
                <OptionChoicesList
                  optionId={option.id}
                  onOptionChanged={onOptionChanged}
                  openAddChoiceOptionId={openAddChoiceOptionId}
                  setOpenAddChoiceOptionId={setOpenAddChoiceOptionId}
                  openEditChoiceId={openEditChoiceId}
                  setOpenEditChoiceId={setOpenEditChoiceId}
                />
              </div>
              <div className="flex space-x-1">
                <Dialog open={openEditOptionId === option.id} onOpenChange={(open) => setOpenEditOptionId(open ? option.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Opção</DialogTitle>
                    </DialogHeader>
                    <MenuItemOptionForm
                      menuItemId={menuItemId}
                      option={option}
                      onSuccess={() => {
                        setOpenEditOptionId(null)
                        onOptionChanged?.()
                      }}
                    />
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={async () => {
                  try {
                    await deleteOption.mutateAsync({ id: option.id })
                  } catch {}
                }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Componente para listar escolhas de uma opção
function OptionChoicesList({ optionId, onOptionChanged, openAddChoiceOptionId, setOpenAddChoiceOptionId, openEditChoiceId, setOpenEditChoiceId }: { optionId: string; onOptionChanged?: () => void; openAddChoiceOptionId: string | null; setOpenAddChoiceOptionId: (open: string | null) => void; openEditChoiceId: string | null; setOpenEditChoiceId: (open: string | null) => void }) {
  const choices = api.menuItemOptionChoice.byOption.useQuery({ optionId })
  const utils = api.useUtils()

  const deleteChoice = api.menuItemOptionChoice.delete.useMutation({
    onSuccess: () => {
      void utils.menuItemOptionChoice.byOption.invalidate({ optionId })
    },
  })

  if (!choices.data || choices.data.length === 0) {
    return (
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Nenhuma escolha cadastrada</p>
        <Dialog open={openAddChoiceOptionId === optionId} onOpenChange={(open) => setOpenAddChoiceOptionId(open ? optionId : null)}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-3 w-3 mr-1" />
              Adicionar Escolha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Escolha</DialogTitle>
            </DialogHeader>
            <OptionChoiceForm
              optionId={optionId}
              onSuccess={() => {
                setOpenAddChoiceOptionId(null)
                onOptionChanged?.()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xs font-medium">Escolhas disponíveis:</p>
        <Dialog open={openAddChoiceOptionId === optionId} onOpenChange={(open) => setOpenAddChoiceOptionId(open ? optionId : null)}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Escolha</DialogTitle>
            </DialogHeader>
            <OptionChoiceForm
              optionId={optionId}
              onSuccess={() => {
                setOpenAddChoiceOptionId(null)
                onOptionChanged?.()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-1">
        {choices.data.map((choice) => (
          <div key={choice.id} className="flex justify-between items-center text-xs">
            <span>{choice.name}</span>
            <div className="flex items-center space-x-2">
              <span className={choice.priceModifier >= 0 ? "text-green-600" : "text-red-600"}>
                {choice.priceModifier >= 0 ? "+" : ""}R$ {choice.priceModifier.toFixed(2)}
              </span>
              <Dialog open={openEditChoiceId === choice.id} onOpenChange={(open) => setOpenEditChoiceId(open ? choice.id : null)}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Escolha</DialogTitle>
                  </DialogHeader>
                  <OptionChoiceForm
                    optionId={optionId}
                    choice={choice}
                    onSuccess={() => {
                      setOpenEditChoiceId(null)
                      onOptionChanged?.()
                    }}
                  />
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await deleteChoice.mutateAsync({ id: choice.id })
                    onOptionChanged?.()
                    toast.success("Escolha excluída com sucesso!")
                  } catch {
                    toast.error("Erro ao excluir escolha")
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente de formulário de escolha
function OptionChoiceForm({ optionId, choice, onSuccess }: { optionId: string; choice?: MenuItemOptionChoice; onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    name: choice?.name ?? "",
    priceModifier: choice?.priceModifier ?? 0,
    available: choice?.available ?? true,
  })

  const utils = api.useUtils()

  const createChoice = api.menuItemOptionChoice.create.useMutation({
    onSuccess: () => {
      toast.success("Escolha criada com sucesso!")
      onSuccess?.()
      void utils.menuItemOptionChoice.byOption.invalidate({ optionId })
    },
    onError: (error) => {
      toast.error(`Erro ao criar escolha: ${error.message}`)
    },
  })

  const updateChoice = api.menuItemOptionChoice.update.useMutation({
    onSuccess: () => {
      toast.success("Escolha atualizada com sucesso!")
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar escolha: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (choice) {
      void updateChoice.mutate({
        id: choice.id,
        ...formData,
        optionId,
      })
    } else {
      void createChoice.mutate({
        ...formData,
        optionId,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="choiceName">Nome da Escolha</Label>
        <Input
          id="choiceName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Pequeno, Médio, Grande"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priceModifier">Modificador de Preço (R$)</Label>
        <Input
          id="priceModifier"
          type="number"
          step="0.01"
          value={formData.priceModifier}
          onChange={(e) => setFormData({ ...formData, priceModifier: parseFloat(e.target.value) || 0 })}
          placeholder="0.00 (use negativo para desconto)"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="available"
          checked={formData.available}
          onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
        />
        <Label htmlFor="available">Disponível</Label>
      </div>

      <Button type="submit" className="w-full">
        {choice ? "Atualizar" : "Criar"} Escolha
      </Button>
    </form>
  )
}

// Componente para gerenciar categorias
function CategoriesManager({ restaurantId }: { restaurantId: string }) {
  const menuItems = api.menuItem.byRestaurant.useQuery({ restaurantId })
  
  const categories = menuItems.data?.reduce((acc, item) => {
    if (!acc.includes(item.category)) {
      acc.push(item.category)
    }
    return acc
  }, [] as string[]) ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const itemsInCategory = menuItems.data?.filter(item => item.category === category) ?? []
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
                <CardDescription>
                  {itemsInCategory.length} prato(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {itemsInCategory.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span>{item.name}</span>
                      <Badge variant="outline">R$ {item.price.toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 