"use client"

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AnimatedBrl, AnimatedInteger, AnimatedPercent } from "@/components/ui/animated-stat"
import { BarChart3, PieChartIcon, Sparkles, Wallet } from "lucide-react"

const PIE_COLORS = [
  "hsl(12, 76%, 55%)",
  "hsl(173, 58%, 40%)",
  "hsl(197, 37%, 45%)",
  "hsl(43, 74%, 52%)",
  "hsl(280, 55%, 50%)",
  "hsl(27, 87%, 55%)",
  "hsl(220, 70%, 50%)",
  "hsl(340, 75%, 52%)",
]

/** Tooltip do Recharts: padrão usa fundo claro + texto herdado; no dark mode isso some. Usa tokens do tema. */
const chartTooltipProps = {
  contentStyle: {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--popover-foreground))",
  },
  labelStyle: { color: "hsl(var(--popover-foreground))" },
  itemStyle: { color: "hsl(var(--popover-foreground))" },
} as const

export function EvaluatorDashboardTab() {
  const { data, isLoading, isError, error } = api.suggestion.evaluatorDashboard.useQuery()

  if (isError) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Erro ao carregar dashboard</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-base font-semibold tracking-tight">Suas estatísticas como avaliador</h2>
        <p className="text-xs text-muted-foreground max-w-2xl">
          Indicadores apenas das ideias em que você é o responsável pela avaliação.
        </p>
        {isLoading ? (
          <Skeleton className="h-5 w-56 mt-1" aria-hidden />
        ) : data ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{data.analyst.displayName}</span>
          </p>
        ) : null}
      </div>

      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
          <Skeleton className="h-80 w-full md:col-span-2" />
          <Skeleton className="h-80 w-full md:col-span-2" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Taxa de aprovação</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  <AnimatedPercent value={data.approvalRate} delayMs={0} />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Entre ideias com desfecho de aprovação (em orçamento, execução ou concluídas) e recusadas
                (não implantadas).
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Uso de IA pelos autores
                </CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  <AnimatedPercent value={data.authorAiUsagePct} delayMs={100} />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Share de ideias sob sua avaliação em que o colaborador usou “Aprimorar com IA” no problema ou na
                solução.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Uso da análise Morrison (IA)
                </CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  <AnimatedPercent value={data.morrisonUsagePct} delayMs={200} />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Ideias atribuídas a você que possuem nota auxiliar Morrison gerada por IA.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" aria-hidden />
                  Valor pago registrado
                </CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  <AnimatedBrl value={data.totalPaidAmount} delayMs={300} />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Soma dos valores marcados como pagos nas ideias sob sua avaliação (campo de pagamento da ideia).
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" aria-hidden />
                  Volume por status
                </CardTitle>
                <CardDescription>Avaliadas = ideias fora de “novo” e “em avaliação”.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.statusBarData} margin={{ top: 8, right: 8, left: 8, bottom: 32 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip {...chartTooltipProps} />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="Quantidade"
                      isAnimationActive
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="h-4 w-4" aria-hidden />
                  Índice de ideias por área
                </CardTitle>
                <CardDescription>
                  Distribuição das ideias sob avaliação deste responsável (área informada na ideia ou setor do autor).
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {data.areaShare.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem ideias atribuídas a este avaliador.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.areaShare}
                        dataKey="count"
                        nameKey="area"
                        cx="50%"
                        cy="50%"
                        outerRadius={88}
                        isAnimationActive
                        animationDuration={950}
                        animationEasing="ease-out"
                      >
                        {data.areaShare.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...chartTooltipProps} />
                      <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Previsão simples por área</CardTitle>
              <CardDescription>
                Com base em todas as ideias criadas nos últimos 90 dias: total no período e média mensal estimada
                (÷ 3). Útil como referência de ritmo por área.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Área</TableHead>
                    <TableHead className="text-right">Ideias (90 dias)</TableHead>
                    <TableHead className="text-right">Média mensal est.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.areaForecast.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground text-sm">
                        Sem dados recentes por área.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.areaForecast.map((row, idx) => (
                      <TableRow key={row.area}>
                        <TableCell className="font-medium">{row.area}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <AnimatedInteger value={row.ideasLast90Days} delayMs={80 + idx * 40} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <AnimatedInteger value={row.projectedMonthly} delayMs={100 + idx * 40} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo de diagnóstico (Morrison) por área</CardTitle>
              <CardDescription>
                Agregação das ideias atribuídas a este avaliador: quantas têm análise Morrison e um trecho da nota mais
                recente por área.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.areaDiagnostics.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma ideia atribuída.</p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {data.areaDiagnostics.map((d, idx) => (
                    <AccordionItem key={d.area} value={d.area}>
                      <AccordionTrigger className="text-left text-sm">
                        <span className="font-medium">{d.area}</span>
                        <span className="ml-2 text-muted-foreground font-normal tabular-nums">
                          (
                          <AnimatedInteger value={d.ideasCount} delayMs={120 + idx * 35} durationMs={700} /> ideia(s),{" "}
                          <AnimatedInteger value={d.withMorrison} delayMs={140 + idx * 35} durationMs={700} /> com
                          Morrison)
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        {d.snippet ? (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap border rounded-md p-3 bg-muted/30">
                            {d.snippet}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Nenhuma nota Morrison registrada para esta área nas ideias deste avaliador.
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
