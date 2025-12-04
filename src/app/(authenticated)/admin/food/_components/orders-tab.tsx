"use client"

import { useMemo, useState } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DatePicker } from "@/components/ui/date-picker"
import * as XLSX from "xlsx"
import { useEffect } from "react"
import { Select as UiSelect } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { type UserMinimal } from "@/trpc/react"

interface OrdersTabProps {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  selectedRestaurant: string
  setSelectedRestaurant: (restaurant: string) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  userName: string
  setUserName: (name: string) => void
  onStatsChange?: (s: { total: number; pending: number; confirmed: number; delivered: number }) => void
}

export default function OrdersTab({
  selectedDate,
  setSelectedDate,
  selectedRestaurant,
  setSelectedRestaurant,
  selectedStatus,
  setSelectedStatus,
  userName,
  setUserName,
  onStatsChange
}: OrdersTabProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportMonth, setExportMonth] = useState<number>(new Date().getMonth() + 1)
  const [exportYear, setExportYear] = useState<number>(new Date().getFullYear())
  const [signatureExportDialogOpen, setSignatureExportDialogOpen] = useState(false)
  const [signatureExportDate, setSignatureExportDate] = useState<Date>(new Date())
  const [signatureExportRestaurant, setSignatureExportRestaurant] = useState<string>("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createDate, setCreateDate] = useState<Date>(new Date())
  const [createRestaurant, setCreateRestaurant] = useState<string>("")
  const [createMenuItem, setCreateMenuItem] = useState<string>("")
  const [createUser, setCreateUser] = useState<string>("")
  const [createStatus, setCreateStatus] = useState<string>("PENDING")
  const [createObservations, setCreateObservations] = useState<string>("")
  const [createIncludeOptions, setCreateIncludeOptions] = useState<Record<string, string[]>>({})
  const [createUserSearch, setCreateUserSearch] = useState<string>("")

  const resetCreateState = () => {
    setCreateDate(new Date())
    setCreateRestaurant("")
    setCreateMenuItem("")
    setCreateUser("")
    setCreateStatus("PENDING")
    setCreateObservations("")
    setCreateIncludeOptions({})
    setCreateUserSearch("")
  }

  // Buscar restaurantes
  const restaurants = api.restaurant.list.useQuery()
  const currentUser = api.user.me.useQuery()

  const menuItemsQuery = api.menuItem.byRestaurant.useQuery(
    { restaurantId: createRestaurant, date: createDate },
    { enabled: !!createRestaurant }
  )


  const isSudo = currentUser.data?.role_config?.sudo ?? false
  const canViewAddManualPed = currentUser.data?.role_config?.can_view_add_manual_ped ?? false
  const canAddManualOrder = isSudo || canViewAddManualPed

  const usersQuery = api.user.searchMinimal.useQuery(
    { query: createUserSearch },
    { enabled: canAddManualOrder && createDialogOpen }
  )

  // Buscar pedidos com filtros - período da data selecionada
  const queryParams = {
    startDate: (() => {
      // Criar data no formato UTC para evitar problemas de timezone
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()
      const day = selectedDate.getDate()
      const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
      return start
    })(),
    endDate: (() => {
      // Criar data no formato UTC para evitar problemas de timezone
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()
      const day = selectedDate.getDate()
      const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
      return end
    })(),
    restaurantId: selectedRestaurant || undefined,
    status: selectedStatus ? (selectedStatus as "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED") : undefined,
    userName: userName || undefined,
  }

  const filteredOrders = api.foodOrder.list.useQuery(queryParams, {
    // Força a re-execução da query quando os filtros mudam
    enabled: true,
    refetchOnWindowFocus: false,
  })

  // Reportar estatísticas para a página
  useEffect(() => {
    const data = filteredOrders.data ?? []
    const total = data.length
    const pending = data.filter(o => o.status === "PENDING").length
    const confirmed = data.filter(o => o.status === "CONFIRMED").length
    const delivered = data.filter(o => o.status === "DELIVERED").length
    onStatsChange?.({ total, pending, confirmed, delivered })
  }, [filteredOrders.data, onStatsChange])

  // Atualizar status do pedido
  const updateOrderStatus = api.foodOrder.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!")
      void filteredOrders.refetch()
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
        matricula: string
        nome: string
        email: string
        empresa?: string
        setor?: string | null
        totalPedidos: number
        valorTotal: number
      }> = {}

      data.forEach((order) => {
        const user = order.user
        const matricula = user && "matricula" in user ? (user.matricula as string | null | undefined) ?? "" : ""
        const email = user?.email ?? "(sem email)"
        const nome = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
        const empresa = user?.enterprise ?? undefined
        const setor = user?.setor ?? null
        const valor = order.menuItem?.price ?? 0
        let resumo = resumoPorUsuario[email]
        if (!resumo) {
          resumo = {
            matricula,
            nome,
            email,
            empresa,
            setor,
            totalPedidos: 0,
            valorTotal: 0,
          }
          resumoPorUsuario[email] = resumo
        }
        resumo.totalPedidos += 1
        resumo.valorTotal += valor
      })

      // Montar os dados para exportação
      const dataToExport = Object.values(resumoPorUsuario).map((usuario) => ({
        "Matrícula": usuario.matricula,
        "Nome do Usuário": usuario.nome,
        "Email do Usuário": usuario.email,
        "Empresa": usuario.empresa ?? "",
        "Setor": usuario.setor ?? "",
        "Total de Pedidos": usuario.totalPedidos,
        "Valor Total (R$)": usuario.valorTotal.toFixed(2).replace('.', ','),
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
        // Coletar todas as opções únicas de todos os pedidos (escalável)
        const allOptions = new Set<string>()
        
        data.forEach((order) => {
          const orderWithSelections = order as typeof order & {
            optionSelections?: Array<{
              choice?: {
                name?: string
                option?: {
                  name?: string
                }
              }
            }>
          }
          const selections = orderWithSelections.optionSelections
          
          if (Array.isArray(selections)) {
            selections.forEach((selection) => {
              const optionName = selection?.choice?.option?.name
              if (optionName && typeof optionName === "string") {
                allOptions.add(optionName)
              }
            })
          }
        })

        // Converter Set para Array e ordenar para manter consistência
        const sortedOptions = Array.from(allOptions).sort()

        // Função auxiliar para obter a escolha de uma opção específica
        const getOptionChoice = (order: (typeof data)[number], optionName: string): string => {
          try {
            const orderWithSelections = order as typeof order & {
              optionSelections?: Array<{
                choice?: {
                  name?: string
                  option?: {
                    name?: string
                  }
                }
              }>
            }
            const selections = orderWithSelections.optionSelections
            
            if (!Array.isArray(selections) || selections.length === 0) {
              return ""
            }

            // Normalizar nome da opção para comparação
            const normalizedOptionName = optionName.trim().toLowerCase()

            // Procurar a seleção correspondente à opção
            const matchingSelection = selections.find((selection) => {
              const optionNameValue = selection?.choice?.option?.name
              if (!optionNameValue || typeof optionNameValue !== "string") {
                return false
              }
              const normalizedOption = optionNameValue.trim().toLowerCase()
              return normalizedOption === normalizedOptionName
            })

            // Retornar o nome da escolha (choice.name) ou string vazia
            return matchingSelection?.choice?.name?.trim() ?? ""
          } catch (error) {
            console.error(`[getOptionChoice] Erro ao obter escolha da opção "${optionName}":`, error)
            return ""
          }
        }

        // Formatar dados dinamicamente com colunas para cada opção encontrada
        const dataToExport = data.map((order) => {
          const baseRow: Record<string, string> = {
            "Nome": `${order.user?.firstName ?? ""} ${order.user?.lastName ?? ""}`.trim(),
            "Email": order.user?.email ?? "",
            "Restaurante": order.restaurant?.name ?? "",
            "Cidade": order.restaurant?.city ?? "",
            "Prato": order.menuItem?.name ?? "",
          }

          // Adicionar uma coluna para cada opção encontrada
          sortedOptions.forEach((optionName) => {
            const choice = getOptionChoice(order, optionName)
            baseRow[optionName] = choice
          })

          // Adicionar coluna de assinatura ao final
          baseRow.Assinatura = ""

          return baseRow
        })

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

  const manualCreate = api.foodOrder.createManual.useMutation({
    onSuccess: async () => {
      toast.success("Pedido criado com sucesso!")
      resetCreateState()
      setCreateDialogOpen(false)
      await filteredOrders.refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao criar pedido: ${error.message}`)
    },
  })

  const userOptions = useMemo(() => {
    if (!usersQuery.data) return []
    return usersQuery.data.map((user: UserMinimal) => ({
      value: user.id,
      label: `${[user.firstName, user.lastName].filter(Boolean).join(" ")}`.trim() || user.email,
    }))
  }, [usersQuery.data])

  const handleCreateManualOrder = () => {
    if (!createRestaurant || !createMenuItem || !createUser) {
      toast.error("Selecione restaurante, prato e colaborador")
      return
    }

    manualCreate.mutate({
      userId: createUser,
      restaurantId: createRestaurant,
      menuItemId: createMenuItem,
      orderDate: createDate,
      observations: createObservations || undefined,
      status: createStatus as "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED",
      optionChoices: Object.values(createIncludeOptions).flat(),
    })
  }

  return (
    <div className="space-y-4">
      {/* Botões de exportação */}
      <div className="flex justify-end gap-2 flex-wrap">
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

        {canAddManualOrder && (
          <Dialog
            open={createDialogOpen}
            onOpenChange={(isOpen) => {
              setCreateDialogOpen(isOpen)
              if (!isOpen) {
                resetCreateState()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                Adicionar Pedido Manual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Pedido Manual</DialogTitle>
                <DialogDescription>
                  Registre um pedido em nome de um colaborador.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Colaborador</Label>
                  <Input
                    placeholder="Buscar colaborador"
                    value={createUserSearch}
                    onChange={(event) => setCreateUserSearch(event.target.value)}
                  />
                  <Select value={createUser} onValueChange={setCreateUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {userOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data do Pedido</Label>
                  <DatePicker date={createDate} onDateChange={(date) => { if (date) setCreateDate(date) }} />
                </div>
                <div className="space-y-2">
                  <Label>Restaurante</Label>
                  <Select
                    value={createRestaurant}
                    onValueChange={(value) => {
                      setCreateRestaurant(value)
                      setCreateMenuItem("")
                      setCreateIncludeOptions({})
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o restaurante" />
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
                  <Label>Prato</Label>
                  <Select
                    value={createMenuItem}
                    onValueChange={(value) => {
                      setCreateMenuItem(value)
                      setCreateIncludeOptions({})
                    }}
                    disabled={!createRestaurant || menuItemsQuery.isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={menuItemsQuery.isLoading ? "Carregando pratos..." : "Selecione o prato"} />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItemsQuery.data?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - R$ {item.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={createStatus} onValueChange={setCreateStatus}>
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={createObservations} onChange={(event) => setCreateObservations(event.target.value)} placeholder="Observações opcionais" rows={3} />
                </div>
                {menuItemsQuery.data && menuItemsQuery.data.length > 0 && createMenuItem && (
                  <div className="space-y-2">
                    <Label>Opcionais</Label>
                    <p className="text-xs text-muted-foreground">Selecione opcionais aplicáveis ao prato.</p>
                    {menuItemsQuery.data
                      .find((item) => item.id === createMenuItem)?.options?.map((option) => (
                        <div key={option.id} className="space-y-1 border rounded-md p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{option.name}</span>
                            {option.required && <Badge variant="outline" className="text-xs">Obrigatório</Badge>}
                            {option.multiple && <Badge variant="secondary" className="text-xs">Múltipla</Badge>}
                          </div>
                          {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
                          <div className="space-y-1">
                            {option.choices.map((choice) => {
                              const selectedChoices = createIncludeOptions[option.id] ?? []
                              const isMultiple = option.multiple
                              const isChecked = selectedChoices.includes(choice.id)

                              const handleChange = (checked: boolean) => {
                                setCreateIncludeOptions((prev) => {
                                  const next = { ...prev }
                                  const current = next[option.id] ?? []
                                  if (isMultiple) {
                                    next[option.id] = checked
                                      ? [...current, choice.id]
                                      : current.filter((id) => id !== choice.id)
                                  } else {
                                    next[option.id] = checked ? [choice.id] : []
                                  }
                                  return next
                                })
                              }

                              return (
                                <label key={choice.id} className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => handleChange(Boolean(checked))}
                                  />
                                  <span>{choice.name}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleCreateManualOrder} disabled={manualCreate.isPending}>
                  {manualCreate.isPending ? "Criando..." : "Criar pedido"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <Label>Data</Label>
              <DatePicker
                date={selectedDate}
                onDateChange={setSelectedDate}
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

              // Período da data selecionada
              filters.push(`Data: ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`)

              if (selectedRestaurant) {
                filters.push(`Restaurante: ${restaurants.data?.find(r => r.id === selectedRestaurant)?.name}`)
              }
              if (selectedStatus) {
                filters.push(`Status: ${getStatusText(selectedStatus)}`)
              }
              if (userName) {
                filters.push(`Nome: ${userName}`)
              }

              return filters.length > 0 ? filters.join(" | ") : "Todos os pedidos da data selecionada"
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
                          <Badge variant="secondary">{order.restaurant?.name ?? "Restaurante excluído"}</Badge>
                        </div>
                        <p className="text-sm">{order.menuItem.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Pedido do dia {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: ptBR })} - feito às {format(new Date(order.orderTime), "HH:mm", { locale: ptBR })}
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
    </div>
  )
}
