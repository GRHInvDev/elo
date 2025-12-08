"use client"

import React, { useState } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calculator, Download, FileText } from "lucide-react"
import * as XLSX from "xlsx"

interface DREData {
  enterprise: string
  sector: string | null
  totalOrders: number
  totalValue: number
  representativeness: number
  costCenterRateio?: number
}

interface DREApiItem {
  enterprise: string
  sector: string | null
  totalOrders: number
  totalValue: number
}

interface DREReportProps {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
}

type RateioType = 'proportional' | 'headquarters' | 'branch'

// Constante com os valores do enum Enterprise que representam filiais
const BRANCH_ENTERPRISES = ['Box_Filial', 'Cristallux_Filial'] as const

export default function DREReport({ selectedDate, setSelectedDate }: DREReportProps) {
  const [invoiceValue, setInvoiceValue] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [rateioType, setRateioType] = useState<RateioType>('proportional')

  // Buscar dados DRE por empresa/setor
  const dreQuery = api.foodOrder.getDREData.useQuery(
    {
      year: selectedYear,
      period: selectedPeriod,
      date: selectedPeriod === 'month' ? selectedDate : undefined,
    },
    {
      enabled: true,
    }
  )

  // Função helper para determinar se empresa é matriz ou filial
  const getEnterpriseType = (enterprise: string): 'headquarters' | 'branch' => {
    // Verificar explicitamente os valores do enum Enterprise
    return BRANCH_ENTERPRISES.includes(enterprise as typeof BRANCH_ENTERPRISES[number]) ? 'branch' : 'headquarters'
  }

  // Calcular representatividade e rateio quando os dados mudam
  const processedData: DREData[] = React.useMemo(() => {
    if (!dreQuery.data) return []

    const invoiceNumber = parseFloat(invoiceValue) || 0

    // Calcular totais globais para matrizes e filiais
    const headquartersTotal = dreQuery.data
      .filter((d: DREApiItem) => getEnterpriseType(d.enterprise) === 'headquarters')
      .reduce((sum: number, d: DREApiItem) => sum + d.totalValue, 0)

    const branchTotal = dreQuery.data
      .filter((d: DREApiItem) => getEnterpriseType(d.enterprise) === 'branch')
      .reduce((sum: number, d: DREApiItem) => sum + d.totalValue, 0)

    return dreQuery.data.map((item: DREApiItem) => {
      let representativeness = 0
      let costCenterRateio = 0

      if (rateioType === 'proportional') {
        // Rateio proporcional - dentro da própria empresa
        const enterpriseTotal = dreQuery.data
          ?.filter((d: DREApiItem) => d.enterprise === item.enterprise)
          .reduce((sum: number, d: DREApiItem) => sum + d.totalValue, 0) ?? 0

        const globalTotal = dreQuery.data.reduce((sum: number, d: DREApiItem) => sum + d.totalValue, 0)

        // Primeiro calcula quanto a empresa merece do valor total da nota
        const enterpriseShare = globalTotal > 0
          ? (enterpriseTotal / globalTotal) * invoiceNumber
          : 0

        // Depois distribui proporcionalmente entre os setores da empresa
        representativeness = enterpriseTotal > 0
          ? (item.totalValue / enterpriseTotal) * 100
          : 0

        costCenterRateio = (enterpriseShare * representativeness) / 100
      } else if (rateioType === 'headquarters') {
        // Rateio completo para matriz - representatividade global das matrizes
        const enterpriseType = getEnterpriseType(item.enterprise)
        if (enterpriseType === 'headquarters') {
          representativeness = headquartersTotal > 0
            ? (item.totalValue / headquartersTotal) * 100
            : 0

          costCenterRateio = (invoiceNumber * representativeness) / 100
        } else {
          // Para filial: rateio = 0
          representativeness = 0
          costCenterRateio = 0
        }
      } else if (rateioType === 'branch') {
        // Rateio completo para filial - representatividade global das filiais
        const enterpriseType = getEnterpriseType(item.enterprise)
        if (enterpriseType === 'branch') {
          representativeness = branchTotal > 0
            ? (item.totalValue / branchTotal) * 100
            : 0

          costCenterRateio = (invoiceNumber * representativeness) / 100
        } else {
          // Para matriz: rateio = 0
          representativeness = 0
          costCenterRateio = 0
        }
      }

      return {
        ...item,
        representativeness,
        costCenterRateio,
      }
    })
  }, [dreQuery.data, invoiceValue, rateioType])

  const handleGenerateReport = () => {
    if (!dreQuery.data || dreQuery.data.length === 0) {
      toast.error("Nenhum dado encontrado para o período selecionado")
      return
    }

    toast.success("Relatório DRE gerado com sucesso!")
  }

  const handleExportToExcel = () => {
    if (filteredData.length === 0) {
      toast.error("Gere o relatório primeiro antes de exportar")
      return
    }

    try {
      const exportData = filteredData.map(item => ({
        "Empresa": item.enterprise,
        "Setor": item.sector ?? "Não informado",
        "Total de Pedidos": item.totalOrders,
        "Valor Total (R$)": item.totalValue.toFixed(2).replace('.', ','),
        "Representatividade (%)": item.representativeness.toFixed(2).replace('.', ','),
        "Valor da Nota (R$)": invoiceValue ? parseFloat(invoiceValue).toFixed(2).replace('.', ',') : "0,00",
        "Rateio Centro de Custo (R$)": item.costCenterRateio?.toFixed(2).replace('.', ',') ?? "0,00",
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      
      // Garantir que as colunas monetárias sejam tratadas como texto para manter a vírgula
      const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
      // Colunas: A=Empresa, B=Setor, C=Pedidos, D=Valor Total, E=Representatividade, F=Valor Nota, G=Rateio
      const monetaryColumns = [3, 4, 5, 6] // Índices das colunas D, E, F, G (0-indexed)
      
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        monetaryColumns.forEach(colIndex => {
          const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: R })
          const rawCell = ws[cellAddress] as unknown
          const cell = rawCell as XLSX.CellObject | undefined
          if (cell) {
            // Forçar o tipo como string para manter a formatação com vírgula
            cell.t = 's' // 's' = string type
            // Garantir que o valor seja uma string
            const cellValue: string | number | boolean | Date | undefined = cell.v
            cell.v = typeof cellValue === 'string' ? cellValue : (cellValue != null ? String(cellValue) : '')
          }
        })
      }
      
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "DRE_Report")

      const fileName = `dre_report_${selectedYear}_${selectedPeriod}_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      XLSX.writeFile(wb, fileName)

      toast.success("Relatório DRE exportado com sucesso!")
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast.error("Erro ao exportar relatório")
    }
  }

  const filteredData = React.useMemo(() => {
    return processedData.filter((item) => {
      const isBranch = BRANCH_ENTERPRISES.includes(item.enterprise as typeof BRANCH_ENTERPRISES[number])
      
      if (rateioType === 'branch') {
        return isBranch
      }
      if (rateioType === 'headquarters') {
        return !isBranch
      }
      return true // para rateio proporcional, mostra tudo
    })
  }, [processedData, rateioType])

  const totalValue = React.useMemo(() =>
    filteredData.reduce((sum: number, item: DREData) => sum + item.totalValue, 0),
    [filteredData]
  )
  const totalOrders = React.useMemo(() =>
    filteredData.reduce((sum: number, item: DREData) => sum + item.totalOrders, 0),
    [filteredData]
  )
  const totalRateio = React.useMemo(() =>
    filteredData.reduce((sum: number, item: DREData) => sum + (item.costCenterRateio ?? 0), 0),
    [filteredData]
  )

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Relatório DRE - Demonstrativo de Resultados do Exercício
          </CardTitle>
          <CardDescription>
            Análise de pedidos de almoço por empresa e setor com cálculo de representatividade
            {invoiceValue && (
              <span className="block mt-1 text-sm">
                Rateio: {
                  rateioType === 'proportional' ? 'Proporcional' :
                  rateioType === 'headquarters' ? 'Matriz' :
                  'Filial'
                } | Valor da nota: R$ {parseFloat(invoiceValue).toFixed(2)}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Primeira linha: Período, Ano, Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <Label>Período</Label>
                <Select
                  value={selectedPeriod}
                  onValueChange={(value: 'month' | 'quarter' | 'year') => setSelectedPeriod(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Mensal</SelectItem>
                    <SelectItem value="quarter">Trimestral</SelectItem>
                    <SelectItem value="year">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ano</Label>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedPeriod === 'month' && (
                <div className="space-y-2">
                  <Label>Data</Label> <br />
                  <DatePicker
                    date={selectedDate}
                    onDateChange={(date: Date | undefined) => {
                      if (date) setSelectedDate(date)
                    }}
                  />
                </div>
              )}
            </div>

            {/* Segunda linha: Valor da Nota, Tipo de Rateio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-2">
                <Label>Valor da Nota Fiscal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={invoiceValue}
                  onChange={(e) => setInvoiceValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Rateio</Label>
                <Select
                  value={rateioType}
                  onValueChange={(value: RateioType) => setRateioType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proportional">Proporcional</SelectItem>
                    <SelectItem value="headquarters">Matriz</SelectItem>
                    <SelectItem value="branch">Filial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={handleGenerateReport} disabled={dreQuery.isLoading}>
              {dreQuery.isLoading ? "Carregando..." : "Gerar Relatório"}
            </Button>

            <Button
              variant="outline"
              onClick={handleExportToExcel}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
      )}

      {/* Tabela de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultado DRE por Empresa e Setor</CardTitle>
          <CardDescription>
            {selectedPeriod === 'month' && `Dados do mês ${format(selectedDate, "MM/yyyy", { locale: ptBR })}`}
            {selectedPeriod === 'quarter' && `Dados do trimestre ${Math.ceil((selectedDate.getMonth() + 1) / 3)}/${selectedYear}`}
            {selectedPeriod === 'year' && `Dados do ano ${selectedYear}`}
            {rateioType !== 'proportional' && (
              <span className="block mt-1 text-sm font-medium text-blue-600">
                Rateio aplicado: {
                  rateioType === 'headquarters' ? 'Somente Matriz' :
                  'Somente Filial'
                }
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dreQuery.isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando dados DRE...</p>
          ) : filteredData.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>  
                    <TableHead>Empresa</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Valor (R$)</TableHead>
                    <TableHead className="text-right">Representatividade (%)</TableHead>
                    <TableHead className="text-right">Rateio Centro Custo (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                      <TableRow key={`${item.enterprise}-${item.sector}-${index}`}>
                        <TableCell>
                          <Badge variant="outline">{item.enterprise}</Badge>
                        </TableCell>
                        <TableCell>{item.sector ?? "Não informado"}</TableCell>
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

              {/* Totais */}
              <div className="border-t pt-4">
                <div className="flex justify-end space-x-6 text-sm font-medium">
                  <span>Total Geral:</span>
                  <span>{totalOrders} pedidos</span>
                  <span>R$ {totalValue.toFixed(2)}</span>
                  <span>100.00%</span>
                  <span>R$ {totalRateio.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Clique em &quot;Gerar Relatório&quot; para visualizar os dados DRE
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
