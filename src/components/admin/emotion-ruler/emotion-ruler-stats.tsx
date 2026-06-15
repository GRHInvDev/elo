"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/trpc/react"
import { Loader2, Download, FileText, Star, Users, TrendingUp, BarChart2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  type PieLabelRenderProps,
} from "recharts"

interface EmotionRulerStatsProps {
  rulers: Array<{
    id: string
    question: string
    isActive: boolean
  }>
}

const EMOTION_COLORS: Record<number, string> = {
  0: "#ef4444",
  1: "#f97316",
  2: "#eab308",
  3: "#84cc16",
  4: "#22c55e",
  5: "#16a34a",
}

// Escapa texto controlado pelo usuário/admin antes de interpolar no HTML do relatório PDF.
const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

// Resolve o nível exibido na exportação a partir do valor armazenado (emotionValue, 0-indexado).
// O usuário percebe os níveis pela posição na régua (1-indexada, baseada em `order`), então
// exibimos o nome do nível quando definido ou "Nível {order + 1}" para evitar o "nível abaixo".
function makeLevelLabelResolver(
  emotions?: Array<{ value: number; label: string | null; order: number }>
) {
  const byValue = new Map((emotions ?? []).map((e) => [e.value, e]))
  return (value: number): string => {
    const emotion = byValue.get(value)
    const label = emotion?.label?.trim()
    if (label) return label
    return `Nível ${(emotion?.order ?? value) + 1}`
  }
}

const AREA_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b",
  "#3b82f6", "#10b981", "#f43f5e", "#06b6d4", "#a855f7",
]

export function EmotionRulerStats({ rulers }: EmotionRulerStatsProps) {
  const [selectedRulerId, setSelectedRulerId] = useState<string | null>(
    rulers.find((r) => r.isActive)?.id ?? rulers[0]?.id ?? null
  )
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const { data: stats, isLoading } = api.emotionRuler.getStats.useQuery(
    {
      rulerId: selectedRulerId!,
      startDate,
      endDate,
    },
    { enabled: !!selectedRulerId }
  )

  const utils = api.useUtils()

  const exportToExcel = async () => {
    if (!selectedRulerId) {
      toast.error("Selecione uma régua para exportar")
      return
    }

    try {
      const [result, ruler] = await Promise.all([
        utils.emotionRuler.getResponses.fetch({
          rulerId: selectedRulerId,
          startDate,
          endDate,
          limit: 10000,
          offset: 0,
        }),
        utils.emotionRuler.getById.fetch({ id: selectedRulerId }),
      ])

      const getLevelLabel = makeLevelLabelResolver(ruler?.emotions)

      const dataToExport = result.responses.map((response) => ({
        "Nome": `${response.user.firstName ?? ""} ${response.user.lastName ?? ""}`.trim() || "N/A",
        "Email": response.user.email ?? "N/A",
        "Setor": response.user.setor ?? "N/A",
        "Empresa": response.user.enterprise ?? "N/A",
        "Nível de Emoção": getLevelLabel(response.emotionValue),
        "Comentário": response.comment ?? "",
        "Pontos Ganhos": (response as { pointsEarned?: number }).pointsEarned ?? 0,
        "Data/Hora": format(new Date(response.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      }))

      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Régua de Emoções")
      XLSX.writeFile(wb, `regua-emocoes-${format(new Date(), "yyyy-MM-dd")}.xlsx`)

      toast.success("Dados exportados com sucesso!")
    } catch {
      toast.error("Erro ao exportar dados. Tente novamente.")
    }
  }

  const exportToPdf = async () => {
    if (!selectedRulerId || !stats) {
      toast.error("Selecione uma régua para exportar")
      return
    }

    try {
      const [result, ruler] = await Promise.all([
        utils.emotionRuler.getResponses.fetch({
          rulerId: selectedRulerId,
          startDate,
          endDate,
          limit: 10000,
          offset: 0,
        }),
        utils.emotionRuler.getById.fetch({ id: selectedRulerId }),
      ])

      const getLevelLabel = makeLevelLabelResolver(ruler?.emotions)

      const rulerName = escapeHtml(rulers.find((r) => r.id === selectedRulerId)?.question ?? "Régua de Emoções")
      const periodLabel = startDate && endDate
        ? `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} a ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`
        : "Todo o período"

      const rows = result.responses.map((r) => `
        <tr>
          <td>${escapeHtml(`${r.user.firstName ?? ""} ${r.user.lastName ?? ""}`.trim() || "N/A")}</td>
          <td>${escapeHtml(r.user.setor ?? "N/A")}</td>
          <td>${escapeHtml(r.user.enterprise ?? "N/A")}</td>
          <td style="text-align:center">${escapeHtml(getLevelLabel(r.emotionValue))}</td>
          <td>${escapeHtml(r.comment ?? "")}</td>
          <td style="text-align:center">${(r as { pointsEarned?: number }).pointsEarned ?? 0}</td>
          <td>${format(new Date(r.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
        </tr>
      `).join("")

      const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Relatório - ${rulerName}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #111; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            .meta { color: #555; margin-bottom: 16px; font-size: 11px; }
            .kpis { display: flex; gap: 24px; margin-bottom: 20px; }
            .kpi { background: #f4f4f4; border-radius: 8px; padding: 12px 20px; min-width: 120px; }
            .kpi-label { font-size: 10px; color: #555; }
            .kpi-value { font-size: 22px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #111; color: #fff; padding: 6px 8px; text-align: left; }
            td { padding: 5px 8px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) td { background: #f9f9f9; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>${rulerName}</h1>
          <div class="meta">Período: ${periodLabel} &nbsp;|&nbsp; Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
          <div class="kpis">
            <div class="kpi"><div class="kpi-label">Total de acessos</div><div class="kpi-value">${stats.totalAccesses}</div></div>
            <div class="kpi"><div class="kpi-label">Total de respostas</div><div class="kpi-value">${stats.totalResponses}</div></div>
            <div class="kpi"><div class="kpi-label">Taxa de resposta</div><div class="kpi-value">${stats.responseRate.toFixed(1)}%</div></div>
            <div class="kpi"><div class="kpi-label">Pontos distribuídos</div><div class="kpi-value">${stats.totalPoints}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nome</th><th>Setor</th><th>Empresa</th>
                <th>Nível</th><th>Comentário</th><th>Pontos</th><th>Data/Hora</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = () => { window.print(); }</script>
        </body>
        </html>
      `

      const win = window.open("", "_blank")
      if (win) {
        win.document.write(html)
        win.document.close()
      } else {
        toast.error("Permita pop-ups para exportar o PDF")
      }
    } catch {
      toast.error("Erro ao gerar PDF. Tente novamente.")
    }
  }

  if (rulers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Nenhuma régua disponível para visualizar estatísticas.</p>
        </CardContent>
      </Card>
    )
  }

  const emotionChartData = stats?.emotionPercentages
    .sort((a, b) => a.value - b.value)
    .map((item) => ({
      name: `Nível ${item.value}`,
      value: item.count,
      percentage: item.percentage,
      fill: EMOTION_COLORS[item.value] ?? "#6366f1",
    })) ?? []

  const areaChartData = stats?.statsByArea.slice(0, 15).map((area) => ({
    name: area.setor.length > 18 ? `${area.setor.slice(0, 18)}…` : area.setor,
    fullName: area.setor,
    respostas: area.totalResponses,
    media: area.averageEmotion,
    pontos: area.totalPoints,
  })) ?? []

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione a régua e o período para visualizar as estatísticas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Régua</label>
              <Select value={selectedRulerId ?? ""} onValueChange={setSelectedRulerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma régua" />
                </SelectTrigger>
                <SelectContent>
                  {rulers.map((ruler) => (
                    <SelectItem key={ruler.id} value={ruler.id}>
                      {ruler.question}{ruler.isActive && " (Ativa)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <DatePicker date={startDate} onDateChange={(d) => setStartDate(d)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <DatePicker date={endDate} onDateChange={(d) => setEndDate(d)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedRulerId && (
        <>
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              </CardContent>
            </Card>
          ) : stats ? (
            <Tabs defaultValue="resumo" className="space-y-4">
              <TabsList>
                <TabsTrigger value="resumo">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Resumo
                </TabsTrigger>
                <TabsTrigger value="por-area">
                  <Users className="mr-2 h-4 w-4" />
                  Por Área
                </TabsTrigger>
                <TabsTrigger value="distribuicao">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Distribuição
                </TabsTrigger>
              </TabsList>

              {/* Aba Resumo */}
              <TabsContent value="resumo" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total de Acessos</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalAccesses}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total de Respostas</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalResponses}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
                      <p className="text-3xl font-bold mt-1">{stats.responseRate.toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 flex items-start gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Pontos Distribuídos</p>
                        <p className="text-3xl font-bold mt-1">{stats.totalPoints}</p>
                      </div>
                      <Star className="h-5 w-5 text-yellow-500 mt-1 shrink-0" />
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico de pizza da distribuição */}
                {emotionChartData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição de Emoções</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={emotionChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={(props: PieLabelRenderProps) => `${String(props.name ?? "")} (${((props.percent ?? 0) * 100).toFixed(1)}%)`}
                            labelLine={false}
                          >
                            {emotionChartData.map((entry, index) => (
                              <Cell key={index} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${String(value ?? 0)} respostas`, "Quantidade"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Aba Por Área */}
              <TabsContent value="por-area" className="space-y-4">
                {stats.statsByArea.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Nenhum dado de área encontrado.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Respostas por Área</CardTitle>
                        <CardDescription>Total de respostas e média de emoção por setor</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={360}>
                          <BarChart data={areaChartData} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              angle={-35}
                              textAnchor="end"
                              tick={{ fontSize: 11 }}
                              interval={0}
                            />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                            <Tooltip
                              formatter={(value, name) => [
                                name === "respostas" ? value : Number(value).toFixed(1),
                                name === "respostas" ? "Respostas" : "Média de Emoção",
                              ]}
                              labelFormatter={(label) => {
                                const item = areaChartData.find((d) => d.name === String(label))
                                return item?.fullName ?? String(label)
                              }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="respostas" name="Respostas" fill="#6366f1" radius={[4, 4, 0, 0]}>
                              {areaChartData.map((_, index) => (
                                <Cell key={index} fill={AREA_COLORS[index % AREA_COLORS.length]} />
                              ))}
                            </Bar>
                            <Bar yAxisId="right" dataKey="media" name="Média de Emoção" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Tabela de áreas */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Detalhamento por Área</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3 font-medium">Área / Setor</th>
                                <th className="text-right py-2 px-3 font-medium">Respostas</th>
                                <th className="text-right py-2 px-3 font-medium">Média</th>
                                <th className="text-right py-2 px-3 font-medium">Pontos</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.statsByArea.map((area, i) => (
                                <tr key={i} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                                  <td className="py-2 px-3">{area.setor}</td>
                                  <td className="py-2 px-3 text-right tabular-nums">{area.totalResponses}</td>
                                  <td className="py-2 px-3 text-right tabular-nums">{area.averageEmotion.toFixed(1)}</td>
                                  <td className="py-2 px-3 text-right tabular-nums">
                                    <span className="inline-flex items-center gap-1">
                                      {area.totalPoints}
                                      {area.totalPoints > 0 && <Star className="h-3 w-3 text-yellow-500" />}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Aba Distribuição */}
              <TabsContent value="distribuicao" className="space-y-4">
                {emotionChartData.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Nenhuma resposta encontrada no período.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Nível de Emoção</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={emotionChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            formatter={(value, _name, props: { payload?: { percentage: number } }) => [
                              `${String(value ?? 0)} (${props.payload?.percentage.toFixed(1) ?? "0.0"}%)`,
                              "Respostas",
                            ]}
                          />
                          <Bar dataKey="value" name="Respostas" radius={[4, 4, 0, 0]}>
                            {emotionChartData.map((entry, index) => (
                              <Cell key={index} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="mt-4 space-y-2">
                        {emotionChartData.map((item) => (
                          <div key={item.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{item.name}</span>
                              <span className="font-medium tabular-nums">
                                {item.value} ({item.percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{ width: `${item.percentage}%`, backgroundColor: item.fill }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : null}

          {/* Exportação */}
          <Card>
            <CardHeader>
              <CardTitle>Exportar Relatório</CardTitle>
              <CardDescription>Baixe os dados em Excel ou gere um PDF para impressão</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={exportToExcel} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
              <Button onClick={exportToPdf} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
