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
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Buscar restaurantes
  const restaurants = api.restaurant.list.useQuery()

  // Buscar itens do menu do restaurante selecionado
  const menuItems = api.menuItem.byRestaurant.useQuery(
    { restaurantId: selectedRestaurant },
    { enabled: !!selectedRestaurant }
  )

  // Buscar opções do item selecionado
  const menuItemOptions = api.menuItemOption.byMenuItem.useQuery(
    { menuItemId: selectedMenuItem },
    { enabled: !!selectedMenuItem }
  )

  const createMenuItem = api.menuItem.create.useMutation({
    onSuccess: () => {
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
          createMenuItem.mutate({
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
                  <Dialog>
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
                      <MenuItemForm restaurantId={selectedRestaurant} />
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

                                  <MenuItemOptionsList menuItemId={item.id} />
                                  <Dialog>
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
                                        <MenuItemOptionForm menuItemId={item.id} />
                                      </DialogContent>
                                    </Dialog>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Editar Prato</DialogTitle>
                                  </DialogHeader>
                                  <MenuItemForm restaurantId={selectedRestaurant} menuItem={item} />
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
function MenuItemForm({ restaurantId, menuItem }: { restaurantId: string; menuItem?: MenuItem }) {
  const [formData, setFormData] = useState({
    name: menuItem?.name ?? "",
    description: menuItem?.description ?? "",
    price: menuItem?.price ?? 0,
    category: menuItem?.category ?? "",
    available: menuItem?.available ?? true,
  })

  const createMenuItem = api.menuItem.create.useMutation({
    onSuccess: () => {
      toast.success("Prato criado com sucesso!")
    },
    onError: (error) => {
      toast.error(`Erro ao criar prato: ${error.message}`)
    },
  })

  const updateMenuItem = api.menuItem.update.useMutation({
    onSuccess: () => {
      toast.success("Prato atualizado com sucesso!")
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar prato: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (menuItem) {
      updateMenuItem.mutate({
        id: menuItem.id,
        ...formData,
        restaurantId,
      })
    } else {
      createMenuItem.mutate({
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
function MenuItemOptionForm({ menuItemId, option }: { menuItemId: string; option?: MenuItemOption }) {
  const [formData, setFormData] = useState({
    name: option?.name ?? "",
    description: option?.description ?? "",
    required: option?.required ?? false,
    multiple: option?.multiple ?? false,
  })

  const createOption = api.menuItemOption.create.useMutation({
    onSuccess: () => {
      toast.success("Opção criada com sucesso!")
    },
    onError: (error) => {
      toast.error(`Erro ao criar opção: ${error.message}`)
    },
  })

  const updateOption = api.menuItemOption.update.useMutation({
    onSuccess: () => {
      toast.success("Opção atualizada com sucesso!")
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar opção: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (option) {
      updateOption.mutate({
        id: option.id,
        ...formData,
        menuItemId,
      })
    } else {
      createOption.mutate({
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
function MenuItemOptionsList({ menuItemId }: { menuItemId: string }) {
  const options = api.menuItemOption.byMenuItem.useQuery({ menuItemId })

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
                <OptionChoicesList optionId={option.id} />
              </div>
              <div className="flex space-x-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Opção</DialogTitle>
                    </DialogHeader>
                    <MenuItemOptionForm menuItemId={menuItemId} option={option} />
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm">
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
function OptionChoicesList({ optionId }: { optionId: string }) {
  const choices = api.menuItemOptionChoice.byOption.useQuery({ optionId })

  if (!choices.data || choices.data.length === 0) {
    return (
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Nenhuma escolha cadastrada</p>
        <Dialog>
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
            <OptionChoiceForm optionId={optionId} />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xs font-medium">Escolhas disponíveis:</p>
        <Dialog>
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
            <OptionChoiceForm optionId={optionId} />
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
              <Button variant="ghost" size="sm">
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente de formulário de escolha
function OptionChoiceForm({ optionId, choice }: { optionId: string; choice?: MenuItemOptionChoice }) {
  const [formData, setFormData] = useState({
    name: choice?.name ?? "",
    priceModifier: choice?.priceModifier ?? 0,
    available: choice?.available ?? true,
  })

  const createChoice = api.menuItemOptionChoice.create.useMutation({
    onSuccess: () => {
      toast.success("Escolha criada com sucesso!")
    },
    onError: (error) => {
      toast.error(`Erro ao criar escolha: ${error.message}`)
    },
  })

  const updateChoice = api.menuItemOptionChoice.update.useMutation({
    onSuccess: () => {
      toast.success("Escolha atualizada com sucesso!")
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar escolha: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (choice) {
      updateChoice.mutate({
        id: choice.id,
        ...formData,
        optionId,
      })
    } else {
      createChoice.mutate({
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