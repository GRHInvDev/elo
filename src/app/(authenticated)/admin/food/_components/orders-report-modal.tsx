"use client"

import { useEffect, useMemo, useState } from "react"
import { api } from "@/trpc/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import * as XLSX from "xlsx"
import {
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  RotateCcw,
  ChevronDown,
  Utensils,
} from "lucide-react"
import { formatOrderDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface OrdersReportModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date
  initialRestaurant?: string
  initialFilial?: string
  initialUserSearch?: string
}

const ALL_FILTER = "__all__"

export function OrdersReportModal({
  isOpen,
  onClose,
  initialDate,
  initialRestaurant,
  initialFilial,
  initialUserSearch,
}: OrdersReportModalProps) {
  // Sincronizar período padrão no mês em exibição
  const baseDate = useMemo(() => initialDate ?? new Date(), [initialDate])
  const defaultStart = useMemo(
    () => new Date(baseDate.getFullYear(), baseDate.getMonth(), 1),
    [baseDate],
  )
  const defaultEnd = useMemo(
    () => new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0),
    [baseDate],
  )

  const [startDate, setStartDate] = useState<Date>(defaultStart)
  const [endDate, setEndDate] = useState<Date>(defaultEnd)
  const [selectedSetor, setSelectedSetor] = useState(ALL_FILTER)
  const [selectedRestaurant, setSelectedRestaurant] = useState(ALL_FILTER)
  const [selectedFilial, setSelectedFilial] = useState(ALL_FILTER)

  // Filtro de colaboradores
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [userPopoverOpen, setUserPopoverOpen] = useState(false)
  const [userSearchText, setUserSearchText] = useState("")

  // Seleção de itens na tabela para cálculo da soma e exportação
  const [deselectedOrderIds, setDeselectedOrderIds] = useState<Set<string>>(new Set())

  // Opção de agrupar por usuário (ativo por padrão)
  const [groupByUser, setGroupByUser] = useState(true)

  // Paginação
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Consultas auxiliares
  const usersQuery = api.user.listAll.useQuery(undefined, { enabled: isOpen })
  const setoresQuery = api.setores.list.useQuery({ onlyActive: true }, { enabled: isOpen })
  const restaurantsQuery = api.restaurant.list.useQuery(undefined, { enabled: isOpen })
  const filiaisQuery = api.filiais.list.useQuery(undefined, { enabled: isOpen })

  // Lista de colaboradores disponíveis
  const availableUsers = useMemo(() => {
    const list = usersQuery.data ?? []
    return list
      .map((u) => ({
        id: u.id,
        name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
        email: u.email,
        matricula: u.matricula,
        setor: u.setor,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  }, [usersQuery.data])

  // Filtro interno de busca do combobox
  const filteredAvailableUsers = useMemo(() => {
    if (!userSearchText.trim()) return availableUsers
    const term = userSearchText.trim().toLowerCase()
    return availableUsers.filter((u) => {
      const matchName = u.name.toLowerCase().includes(term)
      const matchEmail = u.email.toLowerCase().includes(term)
      const matchMatricula = u.matricula?.toLowerCase().includes(term) ?? false
      const matchSetor = u.setor?.toLowerCase().includes(term) ?? false
      return matchName || matchEmail || matchMatricula || matchSetor
    })
  }, [availableUsers, userSearchText])

  // Sincronizar ao abrir
  useEffect(() => {
    if (isOpen) {
      const sDate = initialDate ?? new Date()
      setStartDate(new Date(sDate.getFullYear(), sDate.getMonth(), 1))
      setEndDate(new Date(sDate.getFullYear(), sDate.getMonth() + 1, 0))
      setSelectedRestaurant(
        initialRestaurant && initialRestaurant !== "" ? initialRestaurant : ALL_FILTER,
      )
      setSelectedFilial(
        initialFilial && initialFilial !== "" && initialFilial !== "__all__" ? initialFilial : ALL_FILTER,
      )
      setSelectedSetor(ALL_FILTER)
      setSelectedUserIds([])
      setUserSearchText(initialUserSearch ? initialUserSearch.trim() : "")
      setDeselectedOrderIds(new Set())
      setGroupByUser(true)
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Query dos pedidos
  const reportQuery = api.foodOrder.listDetailedReport.useQuery(
    {
      startDate,
      endDate,
      restaurantId: selectedRestaurant !== ALL_FILTER ? selectedRestaurant : undefined,
      filialId: selectedFilial !== ALL_FILTER ? selectedFilial : undefined,
      setor: selectedSetor !== ALL_FILTER ? selectedSetor : undefined,
      userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
    },
    {
      enabled: isOpen,
      refetchOnWindowFocus: false,
    },
  )

  const orders = useMemo(() => reportQuery.data ?? [], [reportQuery.data])

  // Pedidos selecionados
  const selectedOrders = useMemo(() => {
    if (deselectedOrderIds.size === 0) return orders
    return orders.filter((o) => !deselectedOrderIds.has(o.id))
  }, [orders, deselectedOrderIds])

  const selectedTotalValue = useMemo(() => {
    return selectedOrders.reduce(
      (acc, o) => acc + (o.unitPrice ?? o.menuItem?.price ?? 0),
      0,
    )
  }, [selectedOrders])

  const isAllSelected = orders.length > 0 && selectedOrders.length === orders.length
  const isSomeSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length

  // Agrupamento de pedidos por colaborador
  const groupedUsers = useMemo(() => {
    const map = new Map<
      string,
      {
        userId: string
        name: string
        email: string
        matricula: string
        setor: string
        empresa: string
        filial: string
        orders: typeof orders
      }
    >()

    for (const order of orders) {
      const user = order.user
      const key = user?.id ?? order.userId ?? "unknown"
      const existing = map.get(key)
      if (existing) {
        existing.orders.push(order)
      } else {
        const matricula = user?.matricula ?? "-"
        const name =
          `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
          user?.email ||
          "Não identificado"
        const email = user?.email ?? ""
        const setor = user?.setor ?? "-"
        const empresa = user?.filial?.empresa?.name ?? user?.enterprise ?? "-"
        const filial = user?.filial ? `${user.filial.name} (${user.filial.code})` : ""

        map.set(key, {
          userId: key,
          name,
          email,
          matricula,
          setor,
          empresa,
          filial,
          orders: [order],
        })
      }
    }

    return Array.from(map.values())
      .map((item) => {
        const selectedOrdersOfUser = item.orders.filter((o) => !deselectedOrderIds.has(o.id))
        const totalValue = item.orders.reduce(
          (acc, o) => acc + (o.unitPrice ?? o.menuItem?.price ?? 0),
          0,
        )
        const selectedTotalValue = selectedOrdersOfUser.reduce(
          (acc, o) => acc + (o.unitPrice ?? o.menuItem?.price ?? 0),
          0,
        )
        const isUserAllSelected =
          selectedOrdersOfUser.length === item.orders.length && item.orders.length > 0
        const isUserSomeSelected =
          selectedOrdersOfUser.length > 0 && selectedOrdersOfUser.length < item.orders.length

        return {
          ...item,
          selectedOrders: selectedOrdersOfUser,
          ordersCount: item.orders.length,
          totalValue,
          selectedTotalValue,
          isAllSelected: isUserAllSelected,
          isSomeSelected: isUserSomeSelected,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  }, [orders, deselectedOrderIds])

  const selectedGroupedUsers = useMemo(() => {
    return groupedUsers.filter((u) => u.selectedOrders.length > 0)
  }, [groupedUsers])

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setDeselectedOrderIds(new Set(orders.map((o) => o.id)))
    } else {
      setDeselectedOrderIds(new Set())
    }
  }

  const handleToggleOrder = (orderId: string) => {
    setDeselectedOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const handleToggleUserGroup = (userGroup: (typeof groupedUsers)[number]) => {
    setDeselectedOrderIds((prev) => {
      const next = new Set(prev)
      if (userGroup.isAllSelected) {
        // Desmarcar todos os pedidos deste colaborador
        userGroup.orders.forEach((o) => next.add(o.id))
      } else {
        // Marcar todos os pedidos deste colaborador
        userGroup.orders.forEach((o) => next.delete(o.id))
      }
      return next
    })
  }

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
    handleFilterChange()
  }

  const handleFilterChange = () => {
    setPage(1)
    setDeselectedOrderIds(new Set())
  }

  const resetFilters = () => {
    setStartDate(defaultStart)
    setEndDate(defaultEnd)
    setSelectedUserIds([])
    setUserSearchText("")
    setSelectedSetor(ALL_FILTER)
    setSelectedRestaurant(ALL_FILTER)
    setSelectedFilial(ALL_FILTER)
    setDeselectedOrderIds(new Set())
    setGroupByUser(true)
    setPage(1)
  }

  const isFiltered =
    selectedUserIds.length > 0 ||
    selectedSetor !== ALL_FILTER ||
    selectedRestaurant !== ALL_FILTER ||
    selectedFilial !== ALL_FILTER ||
    startDate.getTime() !== defaultStart.getTime() ||
    endDate.getTime() !== defaultEnd.getTime()

  // Paginação
  const totalItems = groupByUser ? groupedUsers.length : orders.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const paginatedOrders = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return orders.slice(startIndex, startIndex + pageSize)
  }, [orders, page, pageSize])

  const paginatedGroupedUsers = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return groupedUsers.slice(startIndex, startIndex + pageSize)
  }, [groupedUsers, page, pageSize])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val)
  }

  // Exportação Excel
  const handleExportExcel = () => {
    const ordersToExport = selectedOrders.length > 0 ? selectedOrders : orders

    if (!ordersToExport || ordersToExport.length === 0) {
      toast.error("Nenhum pedido selecionado para exportação.")
      return
    }

    try {
      const wb = XLSX.utils.book_new()
      const fileStart = format(startDate, "yyyy-MM-dd")
      const fileEnd = format(endDate, "yyyy-MM-dd")

      if (groupByUser) {
        // Agrupar por usuário somando os gastos totais do período
        const userGroupsMap = new Map<
          string,
          {
            matricula: string
            nome: string
            email: string
            setor: string
            empresa: string
            filial: string
            ordersCount: number
            totalValue: number
          }
        >()

        for (const order of ordersToExport) {
          const user = order.user
          const key = user?.id ?? order.userId ?? "unknown"
          const val = order.unitPrice ?? order.menuItem?.price ?? 0

          const existing = userGroupsMap.get(key)
          if (existing) {
            existing.ordersCount += 1
            existing.totalValue += val
          } else {
            const matricula = user?.matricula ?? ""
            const nome =
              `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
              user?.email ||
              "Não identificado"
            const email = user?.email ?? ""
            const setor = user?.setor ?? ""
            const empresa = user?.filial?.empresa?.name ?? user?.enterprise ?? ""
            const filial = user?.filial ? `${user.filial.name} (${user.filial.code})` : ""

            userGroupsMap.set(key, {
              matricula,
              nome,
              email,
              setor,
              empresa,
              filial,
              ordersCount: 1,
              totalValue: val,
            })
          }
        }

        const groupedRows = Array.from(userGroupsMap.values())
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
          .map((group) => ({
            "Matrícula": group.matricula,
            "Colaborador": group.nome,
            "E-mail": group.email,
            "Setor": group.setor,
            "Empresa": group.empresa,
            "Filial": group.filial,
            "Qtd. de Pedidos": group.ordersCount,
            "Gasto Total (R$)": Number(group.totalValue.toFixed(2)),
          }))

        const wsGrouped = XLSX.utils.json_to_sheet(groupedRows)
        XLSX.utils.book_append_sheet(wb, wsGrouped, "Gastos por Usuário")
        XLSX.writeFile(wb, `pedidos_almoco_agrupado_${fileStart}_a_${fileEnd}.xlsx`)
        toast.success(
          `Planilha agrupada exportada com sucesso! (${groupedRows.length} colaboradores, ${ordersToExport.length} pedidos)`,
        )
      } else {
        const detailedRows = ordersToExport.map((order) => {
          const user = order.user
          const matricula = user?.matricula ?? ""
          const nome =
            `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Não identificado"
          const email = user?.email ?? ""
          const setor = user?.setor ?? ""
          const empresa = user?.filial?.empresa?.name ?? user?.enterprise ?? ""
          const filial = user?.filial ? `${user.filial.name} (${user.filial.code})` : ""
          const restaurante = order.restaurant?.name ?? "Restaurante excluído"
          const prato = order.menuItem?.name ?? ""
          const valor = order.unitPrice ?? order.menuItem?.price ?? 0

          const statusLabel =
            order.status === "DELIVERED"
              ? "Entregue"
              : order.status === "CONFIRMED"
                ? "Confirmado"
                : order.status === "PENDING"
                  ? "Pendente"
                  : order.status === "CANCELLED"
                    ? "Cancelado"
                    : order.status

          return {
            "Data do Pedido": formatOrderDate(order.orderDate),
            "Hora": order.orderTime
              ? format(new Date(order.orderTime), "HH:mm", { locale: ptBR })
              : "",
            "Matrícula": matricula,
            "Colaborador": nome,
            "E-mail": email,
            "Setor": setor,
            "Empresa": empresa,
            "Filial": filial,
            "Restaurante": restaurante,
            "Prato": prato,
            "Valor (R$)": valor,
            "Status": statusLabel,
          }
        })

        const wb = XLSX.utils.book_new()
        const wsDetailed = XLSX.utils.json_to_sheet(detailedRows)
        XLSX.utils.book_append_sheet(wb, wsDetailed, "Pedidos")

        XLSX.writeFile(wb, `pedidos_almoco_${fileStart}_a_${fileEnd}.xlsx`)
        toast.success(`Planilha exportada com sucesso! (${ordersToExport.length} pedidos)`)
      }
    } catch (err: unknown) {
      console.error(err)
      toast.error("Ocorreu um erro ao exportar a planilha.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[1300px] h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0 bg-background">
        {/* Cabeçalho */}
        <DialogHeader className="shrink-0 border-b px-6 py-3.5 bg-muted/10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg font-semibold">
              Relatório Geral de Pedidos
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Consulta e exportação detalhada de pedidos de almoço.
            </DialogDescription>
          </div>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          )}
        </DialogHeader>

        {/* Barra de Filtros */}
        <div className="shrink-0 p-4 border-b bg-card">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Data Início */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data Início</Label>
              <DatePicker
                date={startDate}
                onDateChange={(d) => {
                  if (d) {
                    setStartDate(d)
                    handleFilterChange()
                  }
                }}
                className="h-9 w-full"
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data Fim</Label>
              <DatePicker
                date={endDate}
                onDateChange={(d) => {
                  if (d) {
                    setEndDate(d)
                    handleFilterChange()
                  }
                }}
                className="h-9 w-full"
              />
            </div>

            {/* Colaborador */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Colaborador</Label>
              <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring text-left font-normal truncate",
                      selectedUserIds.length === 0 && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {selectedUserIds.length === 0
                        ? "Todos"
                        : selectedUserIds.length === 1
                          ? availableUsers.find((u) => u.id === selectedUserIds[0])?.name ?? "1 selecionado"
                          : `${selectedUserIds.length} selecionados`}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-1" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 shadow-md" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar colaborador..."
                      value={userSearchText}
                      onValueChange={setUserSearchText}
                      className="h-9 text-xs"
                    />
                    <CommandList className="max-h-[220px]">
                      <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                        {usersQuery.isLoading ? "Carregando..." : "Nenhum colaborador encontrado."}
                      </CommandEmpty>
                      {filteredAvailableUsers.length > 0 && (
                        <CommandGroup>
                          {filteredAvailableUsers.map((user) => {
                            const isChecked = selectedUserIds.includes(user.id)
                            return (
                              <CommandItem
                                key={user.id}
                                onSelect={() => handleToggleUser(user.id)}
                                className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer text-xs"
                              >
                                <Checkbox checked={isChecked} className="pointer-events-none" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{user.name}</div>
                                  {Boolean(user.matricula ?? user.setor) && (
                                    <div className="text-[10px] text-muted-foreground truncate">
                                      {[user.matricula ? `Mat: ${user.matricula}` : null, user.setor]
                                        .filter(Boolean)
                                        .join(" • ")}
                                    </div>
                                  )}
                                </div>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Setor */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Setor</Label>
              <Select
                value={selectedSetor}
                onValueChange={(val) => {
                  setSelectedSetor(val)
                  handleFilterChange()
                }}
              >
                <SelectTrigger className="h-9 text-sm truncate">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value={ALL_FILTER}>Todos os setores</SelectItem>
                  {setoresQuery.data?.map((s) => (
                    <SelectItem key={s.id} value={s.value}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Restaurante */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Restaurante</Label>
              <Select
                value={selectedRestaurant}
                onValueChange={(val) => {
                  setSelectedRestaurant(val)
                  handleFilterChange()
                }}
              >
                <SelectTrigger className="h-9 text-sm truncate">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value={ALL_FILTER}>Todos os restaurantes</SelectItem>
                  {restaurantsQuery.data?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filial */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Filial</Label>
              <Select
                value={selectedFilial}
                onValueChange={(val) => {
                  setSelectedFilial(val)
                  handleFilterChange()
                }}
              >
                <SelectTrigger className="h-9 text-sm truncate">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value={ALL_FILTER}>Todas as filiais</SelectItem>
                  {filiaisQuery.data?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabela de Pedidos */}
        <div className="flex-1 overflow-auto bg-card relative">
          {reportQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-2.5 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs">Carregando pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-2 text-muted-foreground p-6 text-center">
              <Utensils className="h-8 w-8 text-muted-foreground/40 mb-1" />
              <p className="text-sm font-medium text-foreground">Nenhum pedido encontrado</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Ajuste as datas ou os filtros selecionados para visualizar os registros.
              </p>
            </div>
          ) : groupByUser ? (
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur z-10">
                <TableRow>
                  <TableHead className="w-[44px] text-center">
                    <Checkbox
                      checked={
                        isAllSelected
                          ? true
                          : isSomeSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={handleToggleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead className="min-w-[200px]">Colaborador</TableHead>
                  <TableHead className="w-[110px]">Matrícula</TableHead>
                  <TableHead className="min-w-[140px]">Setor</TableHead>
                  <TableHead className="min-w-[160px]">Empresa / Filial</TableHead>
                  <TableHead className="w-[120px] text-center">Qtd. Pedidos</TableHead>
                  <TableHead className="w-[120px] text-right">Gasto Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroupedUsers.map((group) => {
                  return (
                    <TableRow key={group.userId} className="hover:bg-muted/40">
                      <TableCell className="text-center py-2.5">
                        <Checkbox
                          checked={
                            group.isAllSelected
                              ? true
                              : group.isSomeSelected
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={() => handleToggleUserGroup(group)}
                        />
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="text-xs font-medium text-foreground">{group.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                          {group.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground py-2.5">
                        {group.matricula}
                      </TableCell>
                      <TableCell className="py-2.5">
                        {group.setor !== "-" ? (
                          <Badge variant="outline" className="text-[11px] font-normal py-0 px-1.5">
                            {group.setor}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs py-2.5">
                        <div>{group.empresa}</div>
                        {group.filial && (
                          <div className="text-muted-foreground text-[10px] truncate max-w-[170px]">
                            {group.filial}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs py-2.5">
                        <Badge variant="secondary" className="text-[11px] font-medium py-0 px-2">
                          {group.ordersCount} {group.ordersCount === 1 ? "pedido" : "pedidos"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-xs font-medium py-2.5 whitespace-nowrap",
                          !group.isAllSelected && !group.isSomeSelected && "text-muted-foreground/60",
                        )}
                      >
                        {formatCurrency(
                          group.selectedTotalValue > 0
                            ? group.selectedTotalValue
                            : group.totalValue,
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur z-10">
                <TableRow>
                  <TableHead className="w-[44px] text-center">
                    <Checkbox
                      checked={
                        isAllSelected
                          ? true
                          : isSomeSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={handleToggleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead className="w-[110px]">Data</TableHead>
                  <TableHead className="min-w-[200px]">Colaborador</TableHead>
                  <TableHead className="w-[110px]">Matrícula</TableHead>
                  <TableHead className="min-w-[140px]">Setor</TableHead>
                  <TableHead className="min-w-[160px]">Empresa / Filial</TableHead>
                  <TableHead className="w-[110px] text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => {
                  const user = order.user
                  const nome = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Não identificado"
                  const email = user?.email ?? ""
                  const matricula = user?.matricula ?? "-"
                  const setor = user?.setor ?? "-"
                  const empresa = user?.filial?.empresa?.name ?? user?.enterprise ?? "-"
                  const filial = user?.filial ? `${user.filial.name} (${user.filial.code})` : null
                  const price = order.unitPrice ?? order.menuItem?.price ?? 0
                  const isSelected = !deselectedOrderIds.has(order.id)

                  return (
                    <TableRow key={order.id} className="hover:bg-muted/40">
                      <TableCell className="text-center py-2.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleOrder(order.id)}
                        />
                      </TableCell>
                      <TableCell className="text-xs py-2.5 whitespace-nowrap">
                        <div className="font-medium">{formatOrderDate(order.orderDate)}</div>
                        {order.orderTime && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {format(new Date(order.orderTime), "HH:mm", { locale: ptBR })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="text-xs font-medium text-foreground">{nome}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                          {email}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground py-2.5">
                        {matricula}
                      </TableCell>
                      <TableCell className="py-2.5">
                        {setor !== "-" ? (
                          <Badge variant="outline" className="text-[11px] font-normal py-0 px-1.5">
                            {setor}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs py-2.5">
                        <div>{empresa}</div>
                        {filial && (
                          <div className="text-muted-foreground text-[10px] truncate max-w-[170px]">
                            {filial}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium py-2.5 whitespace-nowrap">
                        {formatCurrency(price)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Faixa Fixa de Totalização (Presa no final, sempre visível sem precisar rolar) */}
        <div className="shrink-0 border-t bg-muted/40 px-6 py-2.5 flex items-center justify-between text-xs text-muted-foreground z-10">
          <span>
            Total selecionado:{" "}
            <strong className="text-foreground font-semibold">
              {selectedOrders.length}
            </strong>{" "}
            de {orders.length} pedidos
            {groupByUser && (
              <span className="text-muted-foreground ml-1.5 font-normal">
                ({selectedGroupedUsers.length} de {groupedUsers.length} colaboradores)
              </span>
            )}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(selectedTotalValue)}
          </span>
        </div>

        {/* Rodapé */}
        <DialogFooter className="shrink-0 border-t px-6 py-3 bg-muted/10 flex items-center justify-between gap-4 flex-wrap sm:flex-row">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              Mostrando {totalItems === 0 ? 0 : (page - 1) * pageSize + 1} a{" "}
              {Math.min(page * pageSize, totalItems)} de {totalItems}{" "}
              {groupByUser ? "colaboradores" : "pedidos"}
              {groupByUser && orders.length > 0 && ` (${orders.length} pedidos)`}
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-muted-foreground">Linhas:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-7 w-[65px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs px-1.5 text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Checkbox sutil para agrupar usuários (default marcado) */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/40 border border-border/50 select-none mr-1">
              <Checkbox
                id="group-by-user-checkbox"
                checked={groupByUser}
                onCheckedChange={(checked) => {
                  setGroupByUser(!!checked)
                  setPage(1)
                }}
                className="h-3.5 w-3.5 rounded"
              />
              <Label
                htmlFor="group-by-user-checkbox"
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-normal whitespace-nowrap"
              >
                Agrupar usuários
              </Label>
            </div>

            <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8">
              Fechar
            </Button>
            <Button
              onClick={handleExportExcel}
              disabled={orders.length === 0 || reportQuery.isFetching}
              size="sm"
              className="gap-1.5 text-xs h-8 font-medium"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar Excel ({groupByUser ? selectedGroupedUsers.length : selectedOrders.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
