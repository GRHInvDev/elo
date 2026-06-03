"use client"

import React, { useEffect, useState } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DateRangeCalendar } from "@/components/forms/date-range-calendar"
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calculator, FileText, Eye, FileSpreadsheet, ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import * as XLSX from "xlsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const FILTER_ALL = "__all__" as const

type RateioType = "proportional" | "headquarters" | "branch"
type DreGroupBy = "enterprise_sector" | "restaurant" | "filial"

interface DREApiItem {
  groupBy: DreGroupBy
  enterprise: string | null
  empresaId: string | null
  empresaName: string | null
  sector: string | null
  restaurantId: string | null
  restaurantName: string | null
  filialId: string | null
  filialName: string | null
  filialCode: string | null
  totalOrders: number
  totalValue: number
  valueFromHeadquartersOrders: number
  valueFromBranchOrders: number
}

interface DREData extends DREApiItem {
  representativeness: number
  costCenterRateio?: number
}

interface DREReportProps {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  /** Navega para a aba de Pedidos já filtrada por data e e-mail do colaborador. */
  onOpenOrder?: (params: { date: Date; email: string }) => void
}

const BRANCH_ENTERPRISES = ["Box_Filial", "Cristallux_Filial"] as const

function getEnterpriseType(enterprise: string | null): "headquarters" | "branch" {
  if (!enterprise) return "headquarters"
  return BRANCH_ENTERPRISES.includes(enterprise as (typeof BRANCH_ENTERPRISES)[number])
    ? "branch"
    : "headquarters"
}

// Identidade da Empresa (cadastro novo) para agrupar/comparar linhas do DRE.
function empresaKey(item: { empresaId: string | null; enterprise: string | null }): string {
  return item.empresaId ?? `enum:${item.enterprise ?? ""}`
}

// Rótulo de exibição da Empresa: nome do cadastro novo, com fallback no enum legado.
function empresaLabel(item: { empresaName: string | null; enterprise: string | null }): string {
  return item.empresaName ?? item.enterprise ?? "Não informado"
}

export default function DREReport({ selectedDate, onOpenOrder }: DREReportProps) {
  const [invoiceValue, setInvoiceValue] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(selectedDate))
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(selectedDate))
  const [rateioType, setRateioType] = useState<RateioType>("proportional")
  const [groupBy, setGroupBy] = useState<DreGroupBy>("enterprise_sector")
  const [filterRestaurantId, setFilterRestaurantId] = useState<string>(FILTER_ALL)
  const [filterFilialId, setFilterFilialId] = useState<string>(FILTER_ALL)
  const [filterEmpresaId, setFilterEmpresaId] = useState<string>(FILTER_ALL)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<{
    empresaId: string | null
    empresaName: string | null
    enterprise: string | null
    sector: string | null
  } | null>(null)

  const selectedYear = startDate?.getFullYear() ?? new Date().getFullYear()

  const restaurantsQuery = api.restaurant.list.useQuery({ active: true })
  const filiaisQuery = api.filiais.list.useQuery()
  const empresasQuery = api.empresas.list.useQuery()

  const dreQuery = api.foodOrder.getDREData.useQuery(
    {
      year: selectedYear,
      period: "month",
      date: startDate,
      startDate: startDate,
      endDate: endDate,
      groupBy,
      restaurantId: filterRestaurantId === FILTER_ALL ? undefined : filterRestaurantId,
      filialId: filterFilialId === FILTER_ALL ? undefined : filterFilialId,
      empresaId: filterEmpresaId === FILTER_ALL ? undefined : filterEmpresaId,
    },
    {
      enabled: !!(startDate && endDate),
      retry: false,
    },
  )

  const detailQuery = api.foodOrder.getEnterpriseSectorOrders.useQuery(
    {
      year: selectedYear,
      period: "month",
      date: startDate,
      startDate: startDate,
      endDate: endDate,
      restaurantId: filterRestaurantId === FILTER_ALL ? undefined : filterRestaurantId,
      filialId: filterFilialId === FILTER_ALL ? undefined : filterFilialId,
      // Identidade do grupo (empresa do cadastro novo) da linha expandida.
      empresaId: expandedGroup?.empresaId ?? undefined,
      enterprise: expandedGroup?.enterprise ?? "",
      sector: expandedGroup?.sector ?? null,
    },
    {
      enabled: !!(expandedGroup && startDate && endDate),
      retry: false,
    },
  )

  // Fecha a linha expandida quando os filtros/período do relatório mudam
  useEffect(() => {
    setExpandedGroup(null)
  }, [startDate, endDate, groupBy, filterRestaurantId, filterFilialId, filterEmpresaId])

  useEffect(() => {
    const err = dreQuery.error
    if (!err) return
    toast.error(err.message ?? "Erro ao carregar dados do DRE")
  }, [dreQuery.error])

  const processedData: DREData[] = React.useMemo(() => {
    const raw = dreQuery.data
    if (!raw?.length) return []

    const invoiceNumber = parseFloat(invoiceValue) || 0

    const headquartersTotalEnterprise = raw
      .filter((d) => getEnterpriseType(d.enterprise) === "headquarters")
      .reduce((sum, d) => sum + d.totalValue, 0)

    const branchTotalEnterprise = raw
      .filter((d) => getEnterpriseType(d.enterprise) === "branch")
      .reduce((sum, d) => sum + d.totalValue, 0)

    const globalTotalAllRows = raw.reduce((sum, d) => sum + d.totalValue, 0)
    const hqSplitTotal = raw.reduce((sum, d) => sum + d.valueFromHeadquartersOrders, 0)
    const branchSplitTotal = raw.reduce((sum, d) => sum + d.valueFromBranchOrders, 0)

    return raw.map((item) => {
      let representativeness = 0
      let costCenterRateio = 0

      if (item.groupBy === "enterprise_sector") {
        if (rateioType === "proportional") {
          const itemEmpresaKey = empresaKey(item)
          const enterpriseTotal =
            raw.filter((d) => empresaKey(d) === itemEmpresaKey).reduce((s, d) => s + d.totalValue, 0) ?? 0

          const globalTotal = globalTotalAllRows

          const enterpriseShare = globalTotal > 0 ? (enterpriseTotal / globalTotal) * invoiceNumber : 0

          representativeness = enterpriseTotal > 0 ? (item.totalValue / enterpriseTotal) * 100 : 0

          costCenterRateio = (enterpriseShare * representativeness) / 100
        } else if (rateioType === "headquarters") {
          const enterpriseType = getEnterpriseType(item.enterprise)
          if (enterpriseType === "headquarters") {
            representativeness =
              headquartersTotalEnterprise > 0 ? (item.totalValue / headquartersTotalEnterprise) * 100 : 0

            costCenterRateio = (invoiceNumber * representativeness) / 100
          } else {
            representativeness = 0
            costCenterRateio = 0
          }
        } else {
          const enterpriseType = getEnterpriseType(item.enterprise)
          if (enterpriseType === "branch") {
            representativeness =
              branchTotalEnterprise > 0 ? (item.totalValue / branchTotalEnterprise) * 100 : 0

            costCenterRateio = (invoiceNumber * representativeness) / 100
          } else {
            representativeness = 0
            costCenterRateio = 0
          }
        }
      } else {
        if (rateioType === "proportional") {
          representativeness =
            globalTotalAllRows > 0 ? (item.totalValue / globalTotalAllRows) * 100 : 0
          costCenterRateio = (invoiceNumber * representativeness) / 100
        } else if (rateioType === "headquarters") {
          representativeness =
            hqSplitTotal > 0 ? (item.valueFromHeadquartersOrders / hqSplitTotal) * 100 : 0
          costCenterRateio = (invoiceNumber * representativeness) / 100
        } else {
          representativeness =
            branchSplitTotal > 0 ? (item.valueFromBranchOrders / branchSplitTotal) * 100 : 0
          costCenterRateio = (invoiceNumber * representativeness) / 100
        }
      }

      return {
        ...item,
        representativeness,
        costCenterRateio,
      }
    })
  }, [dreQuery.data, invoiceValue, rateioType])

  const filteredData = React.useMemo(() => {
    return processedData.filter((item) => {
      if (item.groupBy === "enterprise_sector") {
        const isBranch = BRANCH_ENTERPRISES.includes(
          item.enterprise as (typeof BRANCH_ENTERPRISES)[number],
        )
        if (rateioType === "branch") return isBranch
        if (rateioType === "headquarters") return !isBranch
        return true
      }
      if (rateioType === "branch") return item.valueFromBranchOrders > 0
      if (rateioType === "headquarters") return item.valueFromHeadquartersOrders > 0
      return true
    })
  }, [processedData, rateioType])

  const handleGenerateReport = () => {
    if (dreQuery.isError) {
      toast.error("Não foi possível carregar os dados do DRE")
      return
    }
    if (!dreQuery.data || dreQuery.data.length === 0) {
      toast.error("Nenhum dado encontrado para o período selecionado")
      return
    }

    if (filteredData.length === 0) {
      toast.error("Nenhum dado encontrado para os filtros selecionados")
      return
    }

    setIsPreviewModalOpen(true)
  }

  const buildExportRows = (): Record<string, string | number>[] => {
    return filteredData.map((item) => {
      const base: Record<string, string | number> = {
        "Total de Pedidos": item.totalOrders,
        "Valor Total (R$)": item.totalValue.toFixed(2).replace(".", ","),
        "Representatividade (%)": item.representativeness.toFixed(2).replace(".", ","),
        "Valor da Nota (R$)": invoiceValue ? parseFloat(invoiceValue).toFixed(2).replace(".", ",") : "0,00",
        "Rateio Centro de Custo (R$)": item.costCenterRateio?.toFixed(2).replace(".", ",") ?? "0,00",
      }

      if (item.groupBy === "enterprise_sector") {
        return {
          Empresa: empresaLabel(item),
          Setor: item.sector ?? "Não informado",
          ...base,
        }
      }
      if (item.groupBy === "restaurant") {
        return {
          Restaurante: item.restaurantName ?? "Não informado",
          ...base,
        }
      }
      return {
        Filial: item.filialName ?? "Não informado",
        "Código filial": item.filialCode ?? "",
        ...base,
      }
    })
  }

  const handleExportToExcel = () => {
    if (filteredData.length === 0) {
      toast.error("Gere o relatório primeiro antes de exportar")
      return
    }

    try {
      const exportData = buildExportRows()
      const ws = XLSX.utils.json_to_sheet(exportData)

      const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1")
      const keys = Object.keys(exportData[0] ?? {})
      const monetaryKeys = new Set([
        "Valor Total (R$)",
        "Representatividade (%)",
        "Valor da Nota (R$)",
        "Rateio Centro de Custo (R$)",
      ])
      const monetaryColIndexes = keys
        .map((k, i) => (monetaryKeys.has(k) ? i : -1))
        .filter((i) => i >= 0)

      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        monetaryColIndexes.forEach((colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: R })
          const rawCell = ws[cellAddress] as unknown
          const cell = rawCell as XLSX.CellObject | undefined
          if (cell) {
            cell.t = "s"
            const cellValue: string | number | boolean | Date | undefined = cell.v
            cell.v = typeof cellValue === "string" ? cellValue : cellValue != null ? String(cellValue) : ""
          }
        })
      }

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "DRE_Report")

      const isFullMonth =
        startDate &&
        endDate &&
        startDate.getTime() === startOfMonth(startDate).getTime() &&
        endDate.getTime() === endOfMonth(startDate).getTime()
      const periodLabel = isFullMonth
        ? format(startDate ?? new Date(), "MM-yyyy", { locale: ptBR })
        : `${format(startDate ?? new Date(), "dd-MM-yyyy", { locale: ptBR })}_${format(endDate ?? new Date(), "dd-MM-yyyy", { locale: ptBR })}`
      const fileName = `dre_report_${periodLabel}_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      XLSX.writeFile(wb, fileName)

      toast.success("Relatório DRE exportado com sucesso!")
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast.error("Erro ao exportar relatório")
    }
  }

  const totalValue = React.useMemo(
    () => filteredData.reduce((sum, item) => sum + item.totalValue, 0),
    [filteredData],
  )
  const totalOrders = React.useMemo(
    () => filteredData.reduce((sum, item) => sum + item.totalOrders, 0),
    [filteredData],
  )
  const totalRateio = React.useMemo(
    () => filteredData.reduce((sum, item) => sum + (item.costCenterRateio ?? 0), 0),
    [filteredData],
  )

  const groupByLabel =
    groupBy === "enterprise_sector"
      ? "Empresa e setor"
      : groupBy === "restaurant"
        ? "Restaurante"
        : "Filial"

  const tableTitle =
    groupBy === "enterprise_sector"
      ? "Resultado DRE por Empresa e Setor"
      : groupBy === "restaurant"
        ? "Resultado DRE por Restaurante"
        : "Resultado DRE por Filial"

  const rateioHelp =
    rateioType !== "proportional"
      ? rateioType === "headquarters"
        ? "Somente linhas com pedidos de colaboradores de empresa matriz entram no rateio desta nota."
        : "Somente linhas com pedidos de colaboradores de empresa filial entram no rateio desta nota."
      : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Relatório DRE - Demonstrativo de Resultados do Exercício
          </CardTitle>
          <CardDescription>
            Análise de pedidos de almoço com cálculo de representatividade e rateio por nota fiscal.
            {invoiceValue ? (
              <span className="mt-1 block text-sm">
                Agrupamento: {groupByLabel} | Rateio:{" "}
                {rateioType === "proportional"
                  ? "Proporcional"
                  : rateioType === "headquarters"
                    ? "Matriz"
                    : "Filial"}{" "}
                | Valor da nota: R$ {parseFloat(invoiceValue).toFixed(2)}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <DateRangeCalendar
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              label="Período"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dre-group-by">Agrupamento do relatório</Label>
                <Select
                  value={groupBy}
                  onValueChange={(v: DreGroupBy) => {
                    setGroupBy(v)
                    setFilterRestaurantId(FILTER_ALL)
                    setFilterFilialId(FILTER_ALL)
                    setFilterEmpresaId(FILTER_ALL)
                  }}
                >
                  <SelectTrigger id="dre-group-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enterprise_sector">Empresa e setor</SelectItem>
                    <SelectItem value="restaurant">Restaurante</SelectItem>
                    <SelectItem value="filial">Filial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dre-rateio-type">Tipo de rateio</Label>
                <Select value={rateioType} onValueChange={(value: RateioType) => setRateioType(value)}>
                  <SelectTrigger id="dre-rateio-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proportional">Proporcional</SelectItem>
                    <SelectItem value="headquarters">Matriz</SelectItem>
                    <SelectItem value="branch">Filial (empresa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dre-filter-empresa">Empresa (filtro)</Label>
                <Select value={filterEmpresaId} onValueChange={(v) => { setFilterEmpresaId(v); setFilterFilialId(FILTER_ALL) }}>
                  <SelectTrigger id="dre-filter-empresa">
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas as empresas</SelectItem>
                    {empresasQuery.data?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dre-filter-filial">Filial (filtro)</Label>
                <Select value={filterFilialId} onValueChange={setFilterFilialId}>
                  <SelectTrigger id="dre-filter-filial">
                    <SelectValue placeholder="Todas as filiais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas as filiais</SelectItem>
                    {(filterEmpresaId === FILTER_ALL
                      ? filiaisQuery.data
                      : filiaisQuery.data?.filter((f) => f.empresaId === filterEmpresaId)
                    )?.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dre-filter-restaurant">Restaurante (filtro)</Label>
                <Select value={filterRestaurantId} onValueChange={setFilterRestaurantId}>
                  <SelectTrigger id="dre-filter-restaurant">
                    <SelectValue placeholder="Todos os restaurantes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todos os restaurantes</SelectItem>
                    {restaurantsQuery.data?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dre-invoice">Valor da Nota Fiscal (R$)</Label>
                <Input
                  id="dre-invoice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={invoiceValue}
                  onChange={(e) => setInvoiceValue(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={dreQuery.isLoading || !(startDate && endDate) || dreQuery.isError}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {dreQuery.isLoading ? "Carregando..." : "Gerar e Visualizar Relatório"}
            </Button>

            <Button
              variant="outline"
              onClick={handleExportToExcel}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredData.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">Total de Pedidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">R$ {totalRateio.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total Rateio (nota)</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tableTitle}</CardTitle>
          <CardDescription>
            {startDate && endDate && (
              <>
                {startDate.getTime() === startOfMonth(startDate).getTime() &&
                endDate.getTime() === endOfMonth(startDate).getTime()
                  ? `Dados do mês ${format(startDate, "MMMM 'de' yyyy", { locale: ptBR })}`
                  : `Dados do período de ${format(startDate, "dd/MM/yyyy", { locale: ptBR })} até ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`}
              </>
            )}
            {rateioHelp ? (
              <span className="mt-1 block text-sm font-medium text-blue-600">{rateioHelp}</span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dreQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Carregando dados DRE...</p>
          ) : dreQuery.isError ? (
            <p className="py-8 text-center text-muted-foreground">
              Você não tem permissão para ver estes dados ou ocorreu um erro ao carregar.
            </p>
          ) : filteredData.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    {groupBy === "enterprise_sector" ? (
                      <>
                        <TableHead className="w-8" />
                        <TableHead>Empresa</TableHead>
                        <TableHead>Setor</TableHead>
                      </>
                    ) : null}
                    {groupBy === "restaurant" ? <TableHead>Restaurante</TableHead> : null}
                    {groupBy === "filial" ? (
                      <>
                        <TableHead>Filial</TableHead>
                        <TableHead>Código</TableHead>
                      </>
                    ) : null}
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Valor (R$)</TableHead>
                    <TableHead className="text-right">Representatividade (%)</TableHead>
                    <TableHead className="text-right">Rateio Centro Custo (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => {
                    const isEnterpriseSector = groupBy === "enterprise_sector"
                    const rowKey = isEnterpriseSector
                      ? `${empresaKey(item)}-${item.sector}-${index}`
                      : groupBy === "restaurant"
                        ? `${item.restaurantId ?? "nr"}-${index}`
                        : `${item.filialId ?? "nf"}-${index}`
                    const isExpanded =
                      isEnterpriseSector &&
                      expandedGroup != null &&
                      empresaKey(expandedGroup) === empresaKey(item) &&
                      expandedGroup.sector === item.sector

                    return (
                      <React.Fragment key={rowKey}>
                        <TableRow
                          className={isEnterpriseSector ? "cursor-pointer" : undefined}
                          onClick={
                            isEnterpriseSector
                              ? () =>
                                  setExpandedGroup((prev) =>
                                    prev != null &&
                                    empresaKey(prev) === empresaKey(item) &&
                                    prev.sector === item.sector
                                      ? null
                                      : {
                                          empresaId: item.empresaId,
                                          empresaName: item.empresaName,
                                          enterprise: item.enterprise,
                                          sector: item.sector,
                                        },
                                  )
                              : undefined
                          }
                        >
                          {isEnterpriseSector ? (
                            <>
                              <TableCell className="w-8 pr-0">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{empresaLabel(item)}</Badge>
                              </TableCell>
                              <TableCell>{item.sector ?? "Não informado"}</TableCell>
                            </>
                          ) : null}
                          {groupBy === "restaurant" ? (
                            <TableCell>{item.restaurantName ?? "Não informado"}</TableCell>
                          ) : null}
                          {groupBy === "filial" ? (
                            <>
                              <TableCell>{item.filialName ?? "Não informado"}</TableCell>
                              <TableCell>{item.filialCode ?? "—"}</TableCell>
                            </>
                          ) : null}
                          <TableCell className="text-right">{item.totalOrders}</TableCell>
                          <TableCell className="text-right">R$ {item.totalValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.representativeness.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">
                            R$ {item.costCenterRateio?.toFixed(2) ?? "0.00"}
                          </TableCell>
                        </TableRow>

                        {isExpanded ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={7} className="bg-muted/30 p-0">
                              <div className="p-3">
                                {detailQuery.isLoading ? (
                                  <p className="py-2 text-sm text-muted-foreground">Carregando pedidos...</p>
                                ) : detailQuery.isError ? (
                                  <p className="py-2 text-sm text-muted-foreground">
                                    Erro ao carregar os pedidos deste grupo.
                                  </p>
                                ) : detailQuery.data && detailQuery.data.length > 0 ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Pessoa</TableHead>
                                        <TableHead>Empresa</TableHead>
                                        <TableHead>Setor</TableHead>
                                        <TableHead>Data do pedido</TableHead>
                                        <TableHead>Prato</TableHead>
                                        <TableHead className="text-right">Valor (R$)</TableHead>
                                        <TableHead className="text-right">Pedido</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {detailQuery.data.map((order) => (
                                        <TableRow key={order.id}>
                                          <TableCell>
                                            <div className="font-medium">{order.userName || "—"}</div>
                                            <div className="text-xs text-muted-foreground">{order.email}</div>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant="outline">{order.empresaName ?? order.enterprise}</Badge>
                                          </TableCell>
                                          <TableCell>{order.sector ?? "Não informado"}</TableCell>
                                          <TableCell>
                                            {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: ptBR })}
                                          </TableCell>
                                          <TableCell>{order.menuItemName}</TableCell>
                                          <TableCell className="text-right">R$ {order.price.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="flex items-center gap-1"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenOrder?.({
                                                  date: new Date(order.orderDate),
                                                  email: order.email,
                                                })
                                              }}
                                            >
                                              <ExternalLink className="h-3.5 w-3.5" />
                                              Ir para o pedido
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <p className="py-2 text-sm text-muted-foreground">
                                    Nenhum pedido encontrado para este grupo.
                                  </p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="border-t pt-4">
                <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-sm font-medium">
                  <span>Total Geral:</span>
                  <span>{totalOrders} pedidos</span>
                  <span>R$ {totalValue.toFixed(2)}</span>
                  <span>100.00%</span>
                  <span>R$ {totalRateio.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Clique em &quot;Gerar Relatório&quot; para visualizar os dados DRE
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pré-visualização do Relatório DRE
            </DialogTitle>
            <DialogDescription>
              {startDate && endDate && (
                <>
                  {startDate.getTime() === startOfMonth(startDate).getTime() &&
                  endDate.getTime() === endOfMonth(startDate).getTime()
                    ? `Período: ${format(startDate, "MMMM 'de' yyyy", { locale: ptBR })}`
                    : `Período: ${format(startDate, "dd/MM/yyyy", { locale: ptBR })} até ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`}
                  {invoiceValue ? (
                    <span className="mt-1 block">
                      Valor da Nota Fiscal: R$ {parseFloat(invoiceValue).toFixed(2)} | Agrupamento:{" "}
                      {groupByLabel} | Tipo de Rateio:{" "}
                      {rateioType === "proportional"
                        ? "Proporcional"
                        : rateioType === "headquarters"
                          ? "Matriz"
                          : "Filial (empresa)"}
                    </span>
                  ) : null}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {filteredData.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{totalOrders}</div>
                    <p className="text-xs text-muted-foreground">Total de Pedidos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">R$ {totalRateio.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total Rateio</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {filteredData.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {groupBy === "enterprise_sector" ? (
                          <>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Setor</TableHead>
                          </>
                        ) : null}
                        {groupBy === "restaurant" ? <TableHead>Restaurante</TableHead> : null}
                        {groupBy === "filial" ? (
                          <>
                            <TableHead>Filial</TableHead>
                            <TableHead>Código</TableHead>
                          </>
                        ) : null}
                        <TableHead className="text-right">Pedidos</TableHead>
                        <TableHead className="text-right">Valor (R$)</TableHead>
                        <TableHead className="text-right">Representatividade (%)</TableHead>
                        <TableHead className="text-right">Rateio Centro Custo (R$)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item, index) => (
                        <TableRow
                          key={
                            groupBy === "enterprise_sector"
                              ? `m-${empresaKey(item)}-${item.sector}-${index}`
                              : groupBy === "restaurant"
                                ? `m-${item.restaurantId ?? "nr"}-${index}`
                                : `m-${item.filialId ?? "nf"}-${index}`
                          }
                        >
                          {groupBy === "enterprise_sector" ? (
                            <>
                              <TableCell>
                                <Badge variant="outline">{empresaLabel(item)}</Badge>
                              </TableCell>
                              <TableCell>{item.sector ?? "Não informado"}</TableCell>
                            </>
                          ) : null}
                          {groupBy === "restaurant" ? (
                            <TableCell>{item.restaurantName ?? "Não informado"}</TableCell>
                          ) : null}
                          {groupBy === "filial" ? (
                            <>
                              <TableCell>{item.filialName ?? "Não informado"}</TableCell>
                              <TableCell>{item.filialCode ?? "—"}</TableCell>
                            </>
                          ) : null}
                          <TableCell className="text-right">{item.totalOrders}</TableCell>
                          <TableCell className="text-right">R$ {item.totalValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.representativeness.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">
                            R$ {item.costCenterRateio?.toFixed(2) ?? "0.00"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="rounded-lg border-t bg-muted/50 p-4 pt-4">
                  <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-sm font-medium">
                    <span>Total Geral:</span>
                    <span>{totalOrders} pedidos</span>
                    <span>R$ {totalValue.toFixed(2)}</span>
                    <span>100.00%</span>
                    <span>R$ {totalRateio.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum dado encontrado para os filtros selecionados</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                handleExportToExcel()
                setIsPreviewModalOpen(false)
              }}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
