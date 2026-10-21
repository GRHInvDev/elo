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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import * as XLSX from "xlsx"
import {
  FileSpreadsheet,
  Search,
  X,
  Utensils,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
} from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { formatOrderDate } from "@/lib/date-utils"

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
  // Sincronizar data inicial baseada no mês em exibição
  const baseDate = initialDate ?? new Date()
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
  const [userSearch, setUserSearch] = useState("")
  const [selectedSetor, setSelectedSetor] = useState(ALL_FILTER)
  const [selectedRestaurant, setSelectedRestaurant] = useState(ALL_FILTER)
  const [selectedFilial, setSelectedFilial] = useState(ALL_FILTER)

  // Atualizar e sincronizar todos os filtros com a tela sempre que o modal for aberto
  useEffect(() => {
    if (isOpen) {
      const sDate = initialDate ?? new Date()
      setStartDate(new Date(sDate.getFullYear(), sDate.getMonth(), 1))
      setEndDate(new Date(sDate.getFullYear(), sDate.getMonth() + 1, 0))
      setUserSearch(initialUserSearch ?? "")
      setSelectedRestaurant(
        initialRestaurant && initialRestaurant !== "" ? initialRestaurant : ALL_FILTER,
      )
      setSelectedFilial(
        initialFilial && initialFilial !== "" && initialFilial !== "__all__" ? initialFilial : ALL_FILTER,
      )
      setSelectedSetor(ALL_FILTER)
      setPage(1)
    }
  }, [isOpen, initialDate, initialRestaurant, initialFilial, initialUserSearch])

  // Paginação interna do modal
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Debounce da busca de colaborador
  const debouncedUserSearch = useDebounce(userSearch, 400)

  // Consultas auxiliares para os filtros
  const setoresQuery = api.setores.list.useQuery({ onlyActive: true }, { enabled: isOpen })
  const restaurantsQuery = api.restaurant.list.useQuery(undefined, { enabled: isOpen })
  const filiaisQuery = api.filiais.list.useQuery(undefined, { enabled: isOpen })

  // Query principal do relatório de pedidos
  const reportQuery = api.foodOrder.listDetailedReport.useQuery(
    {
      startDate,
      endDate,
      restaurantId: selectedRestaurant !== ALL_FILTER ? selectedRestaurant : undefined,
      filialId: selectedFilial !== ALL_FILTER ? selectedFilial : undefined,
      setor: selectedSetor !== ALL_FILTER ? selectedSetor : undefined,
      userName: debouncedUserSearch.trim() || undefined,
    },
    {
      enabled: isOpen,
      refetchOnWindowFocus: false,
    },
  )

  const orders = reportQuery.data ?? []

  // Resetar página quando filtros mudam
  const handleFilterChange = () => {
    setPage(1)
  }

  const resetFilters = () => {
    setStartDate(defaultStart)
    setEndDate(defaultEnd)
    setUserSearch("")
    setSelectedSetor(ALL_FILTER)
    setSelectedRestaurant(ALL_FILTER)
    setSelectedFilial(ALL_FILTER)
    setPage(1)
  }

  const isFiltered =
    userSearch.trim() !== "" ||
    selectedSetor !== ALL_FILTER ||
    selectedRestaurant !== ALL_FILTER ||
    selectedFilial !== ALL_FILTER ||
    startDate.getTime() !== defaultStart.getTime() ||
    endDate.getTime() !== defaultEnd.getTime()

  // Paginação dos dados
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize))
  const paginatedOrders = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return orders.slice(startIndex, startIndex + pageSize)
  }, [orders, page, pageSize])

  // Badges de status dos pedidos nas linhas da tabela
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 gap-1 font-medium text-xs">
            <Clock className="h-3 w-3" /> Pendente
          </Badge>
        )
      case "CONFIRMED":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 gap-1 font-medium text-xs">
            <CheckCircle2 className="h-3 w-3" /> Confirmado
          </Badge>
        )
      case "DELIVERED":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 gap-1 font-medium text-xs">
            <Truck className="h-3 w-3" /> Entregue
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 gap-1 font-medium text-xs">
            <XCircle className="h-3 w-3" /> Cancelado
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val)
  }

  // Exportação Excel a partir dos dados filtrados exibidos no modal
  const handleExportExcel = () => {
    if (!orders || orders.length === 0) {
      toast.error("Nenhum pedido encontrado nos filtros selecionados para exportação.")
      return
    }

    try {
      // 1. Aba de Pedidos Detalhados
      const detailedRows = orders.map((order) => {
        const user = order.user
        const matricula = user?.matricula ?? ""
        const nome = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Não identificado"
        const email = user?.email ?? ""
        const setor = user?.setor ?? ""
        const empresa = user?.filial?.empresa?.name ?? user?.enterprise ?? ""
        const filial = user?.filial ? `${user.filial.name} (${user.filial.code})` : ""
        const restaurante = order.restaurant?.name ?? "Restaurante excluído"
        const prato = order.menuItem?.name ?? ""
        const categoria = order.menuItem?.category ?? ""
        const valor = order.unitPrice ?? order.menuItem?.price ?? 0

        const optionsText =
          order.optionSelections && order.optionSelections.length > 0
            ? order.optionSelections
                .map((sel) => sel.choice?.name)
                .filter(Boolean)
                .join(", ")
            : ""

        const orderDateStr = formatOrderDate(order.orderDate)
        const orderTimeStr = order.orderTime
          ? format(new Date(order.orderTime), "HH:mm", { locale: ptBR })
          : ""

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
          "Data do Pedido": orderDateStr,
          "Hora": orderTimeStr,
          "Matrícula": matricula,
          "Colaborador": nome,
          "E-mail": email,
          "Setor": setor,
          "Empresa": empresa,
          "Filial": filial,
          "Restaurante": restaurante,
          "Prato": prato,
          "Categoria": categoria,
          "Opcionais": optionsText,
          "Observações": order.observations ?? "",
          "Valor (R$)": valor,
          "Status": statusLabel,
        }
      })

      // 2. Aba de Resumo por Colaborador
      const userSummaryMap = new Map<
        string,
        {
          matricula: string
          nome: string
          email: string
          setor: string
          empresa: string
          filial: string
          totalPedidos: number
          valorTotal: number
        }
      >()

      for (const order of orders) {
        const user = order.user
        const key = user?.id ?? order.userId
        const email = user?.email ?? "(sem email)"
        const matricula = user?.matricula ?? ""
        const nome = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || email
        const setor = user?.setor ?? ""
        const empresa = user?.filial?.empresa?.name ?? user?.enterprise ?? ""
        const filial = user?.filial ? `${user.filial.name} (${user.filial.code})` : ""
        const valor = order.unitPrice ?? order.menuItem?.price ?? 0

        const existing = userSummaryMap.get(key)
        if (existing) {
          existing.totalPedidos += 1
          existing.valorTotal += valor
        } else {
          userSummaryMap.set(key, {
            matricula,
            nome,
            email,
            setor,
            empresa,
            filial,
            totalPedidos: 1,
            valorTotal: valor,
          })
        }
      }

      const summaryRows = Array.from(userSummaryMap.values()).map((row) => ({
        "Matrícula": row.matricula,
        "Colaborador": row.nome,
        "E-mail": row.email,
        "Setor": row.setor,
        "Empresa": row.empresa,
        "Filial": row.filial,
        "Total de Pedidos": row.totalPedidos,
        "Valor Total (R$)": row.valorTotal,
      }))

      // Criar Workbook XLSX com as duas abas
      const wb = XLSX.utils.book_new()

      const wsDetailed = XLSX.utils.json_to_sheet(detailedRows)
      wsDetailed["!cols"] = [
        { wch: 14 }, // Data
        { wch: 8 },  // Hora
        { wch: 12 }, // Matrícula
        { wch: 28 }, // Colaborador
        { wch: 28 }, // E-mail
        { wch: 22 }, // Setor
        { wch: 16 }, // Empresa
        { wch: 20 }, // Filial
        { wch: 22 }, // Restaurante
        { wch: 26 }, // Prato
        { wch: 15 }, // Categoria
        { wch: 24 }, // Opcionais
        { wch: 24 }, // Observações
        { wch: 14 }, // Valor
        { wch: 14 }, // Status
      ]
      XLSX.utils.book_append_sheet(wb, wsDetailed, "Pedidos Detalhados")

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
      wsSummary["!cols"] = [
        { wch: 14 }, // Matrícula
        { wch: 28 }, // Colaborador
        { wch: 28 }, // E-mail
        { wch: 22 }, // Setor
        { wch: 16 }, // Empresa
        { wch: 20 }, // Filial
        { wch: 18 }, // Total de Pedidos
        { wch: 18 }, // Valor Total
      ]
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo por Colaborador")

      const fileStart = format(startDate, "yyyy-MM-dd")
      const fileEnd = format(endDate, "yyyy-MM-dd")
      const filename = `relatorio_pedidos_almoco_${fileStart}_a_${fileEnd}.xlsx`

      XLSX.writeFile(wb, filename)
      toast.success(`Planilha exportada com sucesso! (${orders.length} pedidos)`)
    } catch (err: unknown) {
      console.error(err)
      toast.error("Ocorreu um erro ao exportar a planilha.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[96vw] w-[1480px] h-[92vh] max-h-[92vh] flex flex-col p-0 overflow-hidden gap-0 bg-background">
        {/* Cabeçalho do Modal */}
        <DialogHeader className="shrink-0 border-b px-6 py-4 bg-muted/20">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Relatório Geral de Pedidos de Almoço
            </DialogTitle>
            <DialogDescription className="text-sm mt-0.5">
              Visualize todos os pedidos solicitados, filtre por colaborador, setor ou restaurante e exporte os resultados para Excel.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Barra de Filtros */}
        <div className="shrink-0 p-4 border-b bg-card space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Data Início */}
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                Data Início
              </Label>
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
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                Data Fim
              </Label>
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

            {/* Colaborador (Busca) */}
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                Colaborador
              </Label>
              <div className="relative w-full min-w-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value)
                    handleFilterChange()
                  }}
                  placeholder="Nome, e-mail ou matrícula..."
                  className="pl-8 pr-7 h-9 text-sm w-full min-w-0"
                />
                {userSearch && (
                  <button
                    onClick={() => {
                      setUserSearch("")
                      handleFilterChange()
                    }}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                    title="Limpar pesquisa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Setor */}
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                Setor
              </Label>
              <Select
                value={selectedSetor}
                onValueChange={(val) => {
                  setSelectedSetor(val)
                  handleFilterChange()
                }}
              >
                <SelectTrigger className="h-9 text-sm w-full min-w-0 truncate">
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
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
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                Restaurante
              </Label>
              <Select
                value={selectedRestaurant}
                onValueChange={(val) => {
                  setSelectedRestaurant(val)
                  handleFilterChange()
                }}
              >
                <SelectTrigger className="h-9 text-sm w-full min-w-0 truncate">
                  <SelectValue placeholder="Todos os restaurantes" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
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
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                Filial
              </Label>
              <Select
                value={selectedFilial}
                onValueChange={(val) => {
                  setSelectedFilial(val)
                  handleFilterChange()
                }}
              >
                <SelectTrigger className="h-9 text-sm w-full min-w-0 truncate">
                  <SelectValue placeholder="Todas as filiais" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
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

          {/* Linha auxiliar com indicador de período e botão de limpar filtros */}
          <div className="flex items-center justify-between gap-4 flex-wrap pt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar filtros
                </Button>
              )}
            </div>

            <div>
              Período selecionado:{" "}
              <span className="font-medium text-foreground">
                {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
              </span>{" "}
              até{" "}
              <span className="font-medium text-foreground">
                {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>

        {/* Tabela de Pedidos (Scrollável) */}
        <div className="flex-1 overflow-auto bg-card relative">
          {reportQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Carregando registros de almoço...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-muted-foreground p-6 text-center">
              <div className="p-4 rounded-full bg-muted">
                <Utensils className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-foreground text-base">
                Nenhum pedido encontrado
              </h3>
              <p className="text-sm max-w-sm">
                Não foram encontrados registros para o período e filtros selecionados. Tente ajustar as datas ou limpar os filtros.
              </p>
              {isFiltered && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Resetar filtros
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur z-10 shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[110px] font-semibold">Data</TableHead>
                  <TableHead className="min-w-[200px] font-semibold">Colaborador</TableHead>
                  <TableHead className="w-[110px] font-semibold">Matrícula</TableHead>
                  <TableHead className="min-w-[140px] font-semibold">Setor</TableHead>
                  <TableHead className="min-w-[150px] font-semibold">Empresa / Filial</TableHead>
                  <TableHead className="min-w-[140px] font-semibold">Restaurante</TableHead>
                  <TableHead className="min-w-[200px] font-semibold">Prato e Detalhes</TableHead>
                  <TableHead className="w-[100px] text-right font-semibold">Valor</TableHead>
                  <TableHead className="w-[120px] text-center font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => {
                  const user = order.user
                  const nome =
                    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
                    "Não identificado"
                  const email = user?.email ?? ""
                  const matricula = user?.matricula ?? "-"
                  const setor = user?.setor ?? "-"
                  const empresa = user?.filial?.empresa?.name ?? user?.enterprise ?? "-"
                  const filial = user?.filial ? `${user.filial.name} (${user.filial.code})` : null
                  const price = order.unitPrice ?? order.menuItem?.price ?? 0

                  const optionChoices = order.optionSelections?.map((s) => s.choice?.name).filter(Boolean) ?? []

                  return (
                    <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                      {/* Data / Hora */}
                      <TableCell className="font-medium text-xs whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {formatOrderDate(order.orderDate)}
                        </div>
                        {order.orderTime && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {format(new Date(order.orderTime), "HH:mm", { locale: ptBR })}
                          </div>
                        )}
                      </TableCell>

                      {/* Colaborador */}
                      <TableCell>
                        <div className="font-medium text-sm text-foreground leading-tight">
                          {nome}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                          {email}
                        </div>
                      </TableCell>

                      {/* Matrícula */}
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {matricula}
                      </TableCell>

                      {/* Setor */}
                      <TableCell>
                        {setor !== "-" ? (
                          <Badge variant="outline" className="text-xs font-normal bg-secondary/40">
                            {setor}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>

                      {/* Empresa / Filial */}
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{empresa}</div>
                        {filial && (
                          <div className="text-muted-foreground text-[11px] truncate max-w-[180px]">
                            {filial}
                          </div>
                        )}
                      </TableCell>

                      {/* Restaurante */}
                      <TableCell className="text-xs font-medium">
                        {order.restaurant?.name ?? (
                          <span className="text-muted-foreground italic">Restaurante excluído</span>
                        )}
                      </TableCell>

                      {/* Prato e Detalhes */}
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">
                          {order.menuItem?.name ?? "Prato"}
                        </div>
                        {optionChoices.length > 0 && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            <span className="font-semibold">Opcionais:</span> {optionChoices.join(", ")}
                          </div>
                        )}
                        {order.observations && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 italic">
                            Obs: {order.observations}
                          </div>
                        )}
                      </TableCell>

                      {/* Valor */}
                      <TableCell className="text-right font-medium text-sm whitespace-nowrap">
                        {formatCurrency(price)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {getStatusBadge(order.status)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Rodapé do Modal com Paginação e Ações */}
        <DialogFooter className="shrink-0 border-t px-6 py-3 bg-muted/20 flex items-center justify-between gap-4 flex-wrap sm:flex-row">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              Mostrando{" "}
              <strong className="text-foreground">
                {orders.length === 0 ? 0 : (page - 1) * pageSize + 1}
              </strong>{" "}
              a{" "}
              <strong className="text-foreground">
                {Math.min(page * pageSize, orders.length)}
              </strong>{" "}
              de <strong className="text-foreground">{orders.length}</strong> pedidos
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span>Linhas por página:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-7 w-[70px] text-xs">
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
            {/* Controles de página */}
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
                <span className="text-xs px-2">
                  Página <strong>{page}</strong> de <strong>{totalPages}</strong>
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

            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={handleExportExcel}
              disabled={orders.length === 0 || reportQuery.isFetching}
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel ({orders.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
