"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AlertTriangle, Clock, Eye, Users } from "lucide-react"

import { api } from "@/trpc/react"
import { SLOW_CALL_THRESHOLD_MS } from "@/const/access-log"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/** Opções de janela. O teto é a retenção da tabela (30 dias). */
const PERIODS = [
  { value: "1", label: "Últimas 24h" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
] as const

const KINDS = [
  { value: "ALL", label: "Tudo" },
  { value: "PAGE_VIEW", label: "Navegação" },
  { value: "API_CALL", label: "Chamadas de API" },
] as const

type KindFilter = (typeof KINDS)[number]["value"]

/** Acima disso a duração é destacada como candidata a gargalo. */
const SLOW_MS = SLOW_CALL_THRESHOLD_MS

function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return "—"
  if (durationMs < 1000) return `${durationMs} ms`
  return `${(durationMs / 1000).toFixed(1)} s`
}

function durationClassName(durationMs: number | null): string {
  if (durationMs === null) return "text-muted-foreground"
  if (durationMs >= SLOW_MS * 2) return "font-semibold text-destructive"
  if (durationMs >= SLOW_MS) return "font-medium text-amber-600 dark:text-amber-500"
  return "text-foreground"
}

function userLabel(
  user: { firstName: string | null; lastName: string | null; email: string } | null,
): string {
  if (!user) return "—"
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ")
  return name.length > 0 ? name : user.email
}

function KindBadge({ kind }: { kind: "PAGE_VIEW" | "API_CALL" }) {
  return (
    <Badge variant={kind === "PAGE_VIEW" ? "secondary" : "outline"}>
      {kind === "PAGE_VIEW" ? "Navegação" : "API"}
    </Badge>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  isLoading,
}: {
  icon: React.ElementType
  label: string
  value: number
  hint?: string
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-2xl font-semibold">{value.toLocaleString("pt-BR")}</p>
        )}
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

/**
 * Tela de logs de acesso.
 *
 * "Rotas" é a visão que responde onde está o gargalo: agrupa por rota e ordena
 * pela duração média. "Registros" é a linha do tempo crua, para investigar um
 * horário ou um usuário específico.
 */
export function AccessLogsView() {
  const [period, setPeriod] = useState<string>("7")
  const [kind, setKind] = useState<KindFilter>("ALL")
  const [pathFilter, setPathFilter] = useState("")
  const [onlyErrors, setOnlyErrors] = useState(false)

  const periodDays = Number(period)
  const kindInput = kind === "ALL" ? undefined : kind

  const overview = api.accessLog.overview.useQuery({ period: periodDays })

  const summary = api.accessLog.summary.useQuery({
    period: periodDays,
    kind: kindInput,
  })

  const logs = api.accessLog.list.useInfiniteQuery(
    {
      period: periodDays,
      kind: kindInput,
      path: pathFilter.trim().length > 0 ? pathFilter.trim() : undefined,
      onlyErrors,
      limit: 50,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: undefined,
    },
  )

  const logItems = logs.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Logs de acesso</h1>
          <p className="text-sm text-muted-foreground">
            Navegação dos colaboradores e chamadas de API lentas ou com erro.
          </p>
        </div>
        <Select onValueChange={setPeriod} value={period}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Eye}
          isLoading={overview.isLoading}
          label="Navegações"
          value={overview.data?.pageViews ?? 0}
        />
        <MetricCard
          icon={Users}
          isLoading={overview.isLoading}
          label="Usuários distintos"
          value={overview.data?.distinctUsers ?? 0}
        />
        <MetricCard
          hint={`Só chamadas acima de ${SLOW_MS} ms`}
          icon={Clock}
          isLoading={overview.isLoading}
          label="Chamadas lentas"
          value={overview.data?.apiCalls ?? 0}
        />
        <MetricCard
          icon={AlertTriangle}
          isLoading={overview.isLoading}
          label="Erros"
          value={overview.data?.errors ?? 0}
        />
      </div>

      <Tabs defaultValue="rotas">
        <TabsList>
          <TabsTrigger value="rotas">Rotas</TabsTrigger>
          <TabsTrigger value="registros">Registros</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4" value="rotas">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rotas por tempo médio</CardTitle>
              <CardDescription>
                Da mais lenta para a mais rápida. Rotas sem medição aparecem no
                fim — navegações client-side não têm duração.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                onValueChange={(value) => setKind(value as KindFilter)}
                value={kind}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {summary.isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : summary.data && summary.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rota</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Acessos</TableHead>
                        <TableHead className="text-right">Média</TableHead>
                        <TableHead className="text-right">Pior caso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.data.map((row) => (
                        <TableRow key={`${row.kind}-${row.path}`}>
                          <TableCell className="max-w-[18rem] break-words font-mono text-xs">
                            {row.path}
                          </TableCell>
                          <TableCell>
                            <KindBadge kind={row.kind} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.total.toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell
                            className={`text-right tabular-nums ${durationClassName(row.avgDurationMs)}`}
                          >
                            {formatDuration(row.avgDurationMs)}
                          </TableCell>
                          <TableCell
                            className={`text-right tabular-nums ${durationClassName(row.maxDurationMs)}`}
                          >
                            {formatDuration(row.maxDurationMs)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum acesso registrado no período.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="mt-4" value="registros">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Linha do tempo</CardTitle>
              <CardDescription>
                Do mais recente para o mais antigo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  className="sm:max-w-xs"
                  onChange={(event) => setPathFilter(event.target.value)}
                  placeholder="Filtrar por rota (ex.: /dashboard)"
                  value={pathFilter}
                />
                <Select
                  onValueChange={(value) => setKind(value as KindFilter)}
                  value={kind}
                >
                  <SelectTrigger className="sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KINDS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setOnlyErrors((previous) => !previous)}
                  variant={onlyErrors ? "default" : "outline"}
                >
                  Só erros
                </Button>
              </div>

              {logs.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : logItems.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quando</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Rota</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead className="text-right">Duração</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {format(item.createdAt, "dd/MM HH:mm:ss", {
                                locale: ptBR,
                              })}
                            </TableCell>
                            <TableCell>
                              <KindBadge kind={item.kind} />
                            </TableCell>
                            <TableCell className="max-w-[16rem] break-words font-mono text-xs">
                              {item.path}
                            </TableCell>
                            <TableCell className="max-w-[12rem] break-words text-sm">
                              {userLabel(item.user)}
                            </TableCell>
                            <TableCell
                              className={`text-right tabular-nums ${durationClassName(item.durationMs)}`}
                            >
                              {formatDuration(item.durationMs)}
                            </TableCell>
                            <TableCell>
                              {item.ok ? (
                                <span className="text-xs text-muted-foreground">
                                  ok
                                </span>
                              ) : (
                                <Badge variant="destructive">
                                  {item.errorCode ?? "erro"}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {logs.hasNextPage ? (
                    <div className="flex justify-center">
                      <Button
                        disabled={logs.isFetchingNextPage}
                        onClick={() => void logs.fetchNextPage()}
                        variant="outline"
                      >
                        {logs.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum registro para os filtros escolhidos.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
