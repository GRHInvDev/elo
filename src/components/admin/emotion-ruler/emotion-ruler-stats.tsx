"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { api } from "@/trpc/react"
import { Loader2, Download } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import * as XLSX from "xlsx"

interface EmotionRulerStatsProps {
  rulers: Array<{
    id: string
    question: string
    isActive: boolean
  }>
}

export function EmotionRulerStats({ rulers }: EmotionRulerStatsProps) {
  const [selectedRulerId, setSelectedRulerId] = useState<string | null>(
    rulers.find((r) => r.isActive)?.id ?? rulers[0]?.id ?? null
  )
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const { data: stats, isLoading } = api.emotionRuler.getStats.useQuery(
    {
      rulerId: selectedRulerId!,
      startDate: startDate,
      endDate: endDate,
    },
    {
      enabled: !!selectedRulerId,
    }
  )

  const utils = api.useUtils()

  const exportToExcel = async () => {
    if (!selectedRulerId) {
      toast.error("Selecione uma régua para exportar")
      return
    }

    try {
      // Buscar respostas usando tRPC
      const result = await utils.emotionRuler.getResponses.fetch({
        rulerId: selectedRulerId,
        startDate: startDate,
        endDate: endDate,
        limit: 10000,
        offset: 0,
      })
      
      const responses = result.responses

      // Criar planilha Excel
      const dataToExport = responses.map((response) => {
        const emotionLabel = stats?.emotionPercentages.find(
          (e) => e.value === response.emotionValue
        )?.value ?? response.emotionValue

        return {
          "Nome": `${response.user.firstName ?? ""} ${response.user.lastName ?? ""}`.trim() || "N/A",
          "Email": response.user.email ?? "N/A",
          "Setor": response.user.setor ?? "N/A",
          "Empresa": response.user.enterprise ?? "N/A",
          "Emoção": emotionLabel.toString(),
          "Valor": response.emotionValue,
          "Comentário": response.comment ?? "",
          "Data/Hora": format(new Date(response.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
        }
      })

      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Régua de Emoções")

      const fileName = `regua-emocoes-${format(new Date(), "yyyy-MM-dd")}.xlsx`
      XLSX.writeFile(wb, fileName)

      toast.success("Dados exportados com sucesso!")
    } catch (error) {
      toast.error("Erro ao exportar dados. Tente novamente.")
      console.error("Erro ao exportar:", error)
    }
  }

  if (rulers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Nenhuma régua disponível para visualizar estatísticas.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Selecione a régua e o período para visualizar as estatísticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Régua</label>
              <Select
                value={selectedRulerId ?? ""}
                onValueChange={setSelectedRulerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma régua" />
                </SelectTrigger>
                <SelectContent>
                  {rulers.map((ruler) => (
                    <SelectItem key={ruler.id} value={ruler.id}>
                      {ruler.question}
                      {ruler.isActive && " (Ativa)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <DatePicker
                date={startDate}
                onDateChange={(date) => setStartDate(date)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <DatePicker
                date={endDate}
                onDateChange={(date) => setEndDate(date)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {selectedRulerId && (
        <>
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              </CardContent>
            </Card>
          ) : stats ? (
            <div className="grid gap-4 md:grid-cols-2">
              {/* KPIs Principais */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Acessos</p>
                    <p className="text-2xl font-bold">{stats.totalAccesses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Respostas</p>
                    <p className="text-2xl font-bold">{stats.totalResponses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
                    <p className="text-2xl font-bold">
                      {stats.responseRate.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por Emoção */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Emoção</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.emotionPercentages
                      .sort((a, b) => b.value - a.value)
                      .map((item) => (
                        <div key={item.value} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Valor {item.value}</span>
                            <span className="font-medium">
                              {item.count} ({item.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Botão de Exportação */}
          <Card>
            <CardContent className="pt-6">
              <Button onClick={exportToExcel} className="w-full md:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Exportar para Excel
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
