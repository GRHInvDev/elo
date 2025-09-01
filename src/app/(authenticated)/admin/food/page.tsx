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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Eye, Calendar } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { type Restaurant } from "@prisma/client"
import MenuEditor from "./_components/menu-editor"
import { DatePicker } from "@/components/ui/date-picker"
import * as XLSX from "xlsx"
import { Select as UiSelect } from "@/components/ui/select"

export default function AdminFoodPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [userName, setUserName] = useState<string>("")

  // Debug: Log da data selecionada
  console.log("Data selecionada para filtro:", selectedDate)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportMonth, setExportMonth] = useState<number>(selectedDate.getMonth() + 1)
  const [exportYear, setExportYear] = useState<number>(selectedDate.getFullYear())
  const [signatureExportDialogOpen, setSignatureExportDialogOpen] = useState(false)
  const [signatureExportDate, setSignatureExportDate] = useState<Date>(new Date())
  const [signatureExportRestaurant, setSignatureExportRestaurant] = useState<string>("")

  // Buscar restaurantes
  const restaurants = api.restaurant.list.useQuery()

  // Buscar pedidos com filtros
  const queryParams = {
    startDate: selectedDate ? (() => {
      const start = new Date(selectedDate)
      start.setHours(0, 0, 0, 0)
      console.log("Start date para query:", start)
      return start
    })() : undefined,
    endDate: selectedDate ? (() => {
      const end = new Date(selectedDate)
      end.setHours(23, 59, 59, 999)
      console.log("End date para query:", end)
      return end
    })() : undefined,
    restaurantId: selectedRestaurant || undefined,
    status: selectedStatus ? (selectedStatus as "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED") : undefined,
    userName: userName || undefined,
  }

  console.log("Parâmetros da query filteredOrders:", queryParams)

  const filteredOrders = api.foodOrder.list.useQuery(queryParams, {
    // Força a re-execução da query quando os filtros mudam
    enabled: true,
    refetchOnWindowFocus: false,
  })

  // Buscar todos os pedidos (para compatibilidade)
  const allOrders = api.foodOrder.list.useQuery()

  // Atualizar status do pedido
  const updateOrderStatus = api.foodOrder.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!")
      void filteredOrders.refetch()
      void allOrders.refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`)
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800"
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pendente"
      case "CONFIRMED":
        return "Confirmado"
      case "DELIVERED":
        return "Entregue"
      case "CANCELLED":
        return "Cancelado"
      default:
        return status
    }
  }

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatus.mutate({
      id: orderId,
      status: newStatus as "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED",
    })
  }

  const {mutate: listToExcel} = api.foodOrder.listToExcel.useMutation({
    onSuccess: (data) => {
      if (!data || data.length === 0) {
        toast.error("Nenhum pedido encontrado para o mês selecionado.")
        return
      }

      // Agrupar pedidos por usuário
      const resumoPorUsuario: Record<string, {
        nome: string
        email: string
        empresa?: string
        setor?: string | null
        totalPedidos: number
        valorTotal: number
      }> = {}

      data.forEach((order: typeof data[0]) => {
        const email = order.user?.email ?? "(sem email)"
        const nome = `${order.user?.firstName ?? ""} ${order.user?.lastName ?? ""}`.trim()
        const empresa = order.user?.enterprise ?? undefined
        const setor = order.user?.setor ?? null
        const valor = order.menuItem?.price ?? 0
        resumoPorUsuario[email] ??= {
          nome,
          email,
          empresa,
          setor,
          totalPedidos: 0,
          valorTotal: 0,
        }
        resumoPorUsuario[email].totalPedidos += 1
        resumoPorUsuario[email].valorTotal += valor
      })

      // Montar os dados para exportação
      const dataToExport = Object.values(resumoPorUsuario).map((usuario) => ({
        "Nome do Usuário": usuario.nome,
        "Email do Usuário": usuario.email,
        "Empresa": usuario.empresa ?? "",
        "Setor": usuario.setor ?? "",
        "Total de Pedidos": usuario.totalPedidos,
        "Valor Total (R$)": usuario.valorTotal.toFixed(2),
      }))
      // Gerar a planilha
      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Resumo Usuários")
      // Gerar arquivo e baixar
      XLSX.writeFile(wb, `resumo_pedidos_usuarios_${exportYear}_${String(exportMonth).padStart(2, "0")}.xlsx`)
      toast.success("Arquivo Excel gerado com sucesso!")
      setExportDialogOpen(false)
    },
    onError: (error) => {
      toast.error(`Erro ao exportar pedidos: ${error.message}`)
    },
  })

  // Exportação de pedidos por restaurante para assinatura
  const {mutate: exportForSignature} = api.foodOrder.exportOrdersByRestaurantAndDate.useMutation({
    onSuccess: (data) => {
      console.log("Dados recebidos para exportação:", data)
      
      if (!data || data.length === 0) {
        toast.error("Nenhum pedido encontrado para a data e restaurante selecionados.")
        return
      }

      try {
        // Formatar dados conforme SQL especificado
        const dataToExport = data.map((order) => ({
          "Nome": `${order.user?.firstName ?? ""} ${order.user?.lastName ?? ""}`.trim(),
          "Email": order.user?.email ?? "",
          "Restaurante": order.restaurant?.name ?? "",
          "Cidade": order.restaurant?.city ?? "",
          "Prato": order.menuItem?.name ?? "",
          "Assinatura": "" // Campo vazio para assinatura manual
        }))

        console.log("Dados formatados para Excel:", dataToExport)

        // Gerar a planilha
        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Pedidos para Assinatura")
        
        // Nome do arquivo com data e restaurante
        const restaurantName = signatureExportRestaurant 
          ? restaurants.data?.find(r => r.id === signatureExportRestaurant)?.name?.replace(/[^a-zA-Z0-9]/g, "_") ?? "Todos"
          : "Todos"
        const fileName = `pedidos_assinatura_${restaurantName}_${format(signatureExportDate, "yyyy-MM-dd")}.xlsx`
        
        console.log("Tentando baixar arquivo:", fileName)
        
        // Tentar múltiplas abordagens para garantir o download
        try {
          XLSX.writeFile(wb, fileName)
        } catch (writeError) {
          console.error("Erro com XLSX.writeFile:", writeError)
          // Fallback: usar writeFileXLSX se disponível
          try {
            XLSX.writeFileXLSX(wb, fileName)
          } catch (fallbackError) {
            console.error("Erro com fallback:", fallbackError)
            // Último recurso: salvar como CSV
            const csv = XLSX.utils.sheet_to_csv(ws)
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName.replace('.xlsx', '.csv')
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            toast.success("Arquivo CSV baixado (fallback)!")
            return
          }
        }
        toast.success("Arquivo Excel para assinatura gerado com sucesso!")
        setSignatureExportDialogOpen(false)
      } catch (error) {
        console.error("Erro ao gerar Excel:", error)
        toast.error("Erro ao gerar arquivo Excel. Verifique o console para mais detalhes.")
      }
    },
    onError: (error) => {
      console.error("Erro na API:", error)
      toast.error(`Erro ao exportar pedidos: ${error.message}`)
    },
  })


  const totalOrders = filteredOrders.data?.length ?? 0
  const pendingOrders = filteredOrders.data?.filter(order => order.status === "PENDING").length ?? 0
  const confirmedOrders = filteredOrders.data?.filter(order => order.status === "CONFIRMED").length ?? 0
  const deliveredOrders = filteredOrders.data?.filter(order => order.status === "DELIVERED").length ?? 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administração - Pedidos de Comida</h1>
          <p className="text-muted-foreground">
            Gerencie restaurantes e acompanhe pedidos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total de Pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{confirmedOrders}</div>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">Entregues</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="restaurants">Restaurantes</TabsTrigger>
          <TabsTrigger value="menu">Cardápios</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Botões de exportação */}
          <div className="flex justify-end gap-2">
            <Dialog open={signatureExportDialogOpen} onOpenChange={setSignatureExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Exportar para Assinatura
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Exportar pedidos para assinatura</DialogTitle>
                  <DialogDescription>
                    Selecione uma data e opcionalmente um restaurante específico
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div>
                    <Label>Data dos pedidos</Label>
                    <DatePicker 
                      date={signatureExportDate} 
                      onDateChange={(date: Date) => setSignatureExportDate(date)} 
                    />
                  </div>
                  <div>
                    <Label>Restaurante (opcional)</Label>
                    <Select value={signatureExportRestaurant} onValueChange={setSignatureExportRestaurant}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os restaurantes" />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.data?.map((restaurant) => (
                          <SelectItem key={restaurant.id} value={restaurant.id}>
                            {restaurant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      exportForSignature({
                        orderDate: signatureExportDate,
                        restaurantId: signatureExportRestaurant || undefined,
                      })
                    }}
                  >
                    Exportar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Exportar pedidos do mês para Excel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Exportar pedidos para Excel</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Mês</label>
                      <UiSelect value={String(exportMonth)} onValueChange={v => setExportMonth(Number(v))}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                              {new Date(0, i).toLocaleString("pt-BR", { month: "long" })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </UiSelect>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Ano</label>
                      <UiSelect value={String(exportYear)} onValueChange={v => setExportYear(Number(v))}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 6 }, (_, i) => {
                            const year = new Date().getFullYear() - 2 + i
                            return (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </UiSelect>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      const startDate = new Date(exportYear, exportMonth - 1, 1)
                      const endDate = new Date(exportYear, exportMonth, 0)
                      listToExcel({ startDate, endDate })
                    }}
                  >
                    Exportar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Label>Data</Label>
                  <DatePicker 
                    date={selectedDate} 
                    onDateChange={(date: Date) => {
                      console.log("Nova data selecionada:", date)
                      setSelectedDate(date)
                    }} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Restaurante</Label>
                  <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os restaurantes" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.data?.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                      <SelectItem value="DELIVERED">Entregue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nome do Colaborador</Label>
                  <Input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Filtrados</CardTitle>
              <CardDescription>
                {(() => {
                  const filters = []
                  if (selectedRestaurant) {
                    filters.push(`Restaurante: ${restaurants.data?.find(r => r.id === selectedRestaurant)?.name}`)
                  }
                  if (selectedStatus) {
                    filters.push(`Status: ${getStatusText(selectedStatus)}`)
                  }
                  if (userName) {
                    filters.push(`Nome: ${userName}`)
                  }
                  if (selectedDate) {
                    filters.push(`Data: ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`)
                  }
                  return filters.length > 0 ? filters.join(" | ") : "Todos os pedidos"
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredOrders.data && filteredOrders.data.length > 0 ? (
                <div className="space-y-4">
                  {filteredOrders.data.map((order) => (
                    <Card key={order.id} className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">
                                {order.user.firstName} {order.user.lastName}
                              </p>
                              <Badge variant="outline">{order.user.email}</Badge>
                              <Badge variant="secondary">{order.restaurant.name}</Badge>
                            </div>
                            <p className="text-sm">{order.menuItem.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Pedido feito às {format(new Date(order.orderTime), "HH:mm", { locale: ptBR })} - {format(new Date(order.orderTime), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            {order.observations && (
                              <p className="text-xs text-muted-foreground">
                                Obs: {order.observations}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <p className="font-medium">R$ {order.menuItem.price.toFixed(2)}</p>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                            <div className="flex space-x-1">
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleStatusUpdate(order.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDING">Pendente</SelectItem>
                                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                                  <SelectItem value="DELIVERED">Entregue</SelectItem>
                                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pedido encontrado com os filtros aplicados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

                  <TabsContent value="restaurants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Restaurantes Parceiros</CardTitle>
                <CardDescription>
                  Gerencie os restaurantes parceiros e seus cardápios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Restaurante
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Restaurante</DialogTitle>
                        <DialogDescription>
                          Preencha as informações do novo restaurante parceiro
                        </DialogDescription>
                      </DialogHeader>
                      <RestaurantForm />
                    </DialogContent>
                  </Dialog>
                </div>

                {restaurants.data && restaurants.data.length > 0 ? (
                  <div className="space-y-4">
                    {restaurants.data.map((restaurant) => (
                      <Card key={restaurant.id} className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{restaurant.name}</p>
                                <Badge variant="outline">{restaurant.city}</Badge>
                                <Badge variant={restaurant.active ? "default" : "secondary"}>
                                  {restaurant.active ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {restaurant.description}
                              </p>
                              <div className="flex items-center space-x-4 text-sm">
                                <span>{restaurant.address}</span>
                                <span>{restaurant.phone}</span>
                                <span>{restaurant.email}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {restaurant._count?.orders || 0} pedidos realizados
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Editar Restaurante</DialogTitle>
                                  </DialogHeader>
                                  <RestaurantForm restaurant={restaurant} />
                                </DialogContent>
                              </Dialog>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum restaurante cadastrado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            <Card>
              <MenuEditor />
            </Card>
          </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente de formulário de restaurante
function RestaurantForm({ restaurant }: { restaurant?: Restaurant }) {
  const [formData, setFormData] = useState({
    name: restaurant?.name ?? "",
    description: restaurant?.description ?? "",
    city: restaurant?.city ?? "",
    address: restaurant?.address ?? "",
    phone: restaurant?.phone ?? "",
    email: restaurant?.email ?? "",
    active: restaurant?.active ?? true,
  })

  const createRestaurant = api.restaurant.create.useMutation({
    onSuccess: () => {
      toast.success("Restaurante criado com sucesso!")
    },
    onError: (error) => {
      toast.error(`Erro ao criar restaurante: ${error.message}`)
    },
  })

  const updateRestaurant = api.restaurant.update.useMutation({
    onSuccess: () => {
      toast.success("Restaurante atualizado com sucesso!")
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar restaurante: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (restaurant) {
      updateRestaurant.mutate({
        id: restaurant.id,
        ...formData,
      })
    } else {
      createRestaurant.mutate(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
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

      <Button type="submit" className="w-full">
        {restaurant ? "Atualizar" : "Criar"} Restaurante
      </Button>
    </form>
  )
} 