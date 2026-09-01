"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Inbox,
  LifeBuoy,
  PlusCircle,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"
import { getSectorVisualInfo } from "@/lib/form-icons"
import { formatFormResponseNumber } from "@/lib/utils/form-response-number"

interface FormsListV2Props {
  userCanCreateForm: boolean
  showCentralLink?: boolean
}

interface FormItem {
  id: string
  title: string | null
  description: string | null
  fields: unknown
  createdAt: Date | string
  user?: {
    setor?: string | null
  } | null
}

const ALL_CHIP = "Todos"

function getSector(form: FormItem): string {
  const setor = form.user?.setor?.trim()
  return setor && setor.length > 0 ? setor : "Geral"
}



export function FormsListV2({ userCanCreateForm, showCentralLink }: FormsListV2Props) {
  const [query, setQuery] = React.useState("")
  const [sector, setSector] = React.useState<string>(ALL_CHIP)
  const sectorsScrollRef = React.useRef<HTMLDivElement>(null)
  const selectedSectorBtnRef = React.useRef<HTMLButtonElement>(null)

  const { data: forms, isLoading: isLoadingForms } = api.form.list.useQuery()
  const { data: myResponses } = api.formResponse.listUserResponses.useQuery()
  const { data: sectorConfigs } = api.setores.getSectorConfigs.useQuery()

  const allForms = React.useMemo(() => (forms ?? []) as FormItem[], [forms])

  const availableSectors = React.useMemo(() => {
    const set = new Set<string>()
    for (const f of allForms) {
      set.add(getSector(f))
    }
    return [ALL_CHIP, ...Array.from(set).sort()]
  }, [allForms])

  const handlePrevSector = () => {
    if (availableSectors.length === 0) return
    const idx = availableSectors.indexOf(sector)
    const prevIdx = idx > 0 ? idx - 1 : availableSectors.length - 1
    const target = availableSectors[prevIdx]
    if (target) setSector(target)
  }

  const handleNextSector = () => {
    if (availableSectors.length === 0) return
    const idx = availableSectors.indexOf(sector)
    const nextIdx = idx >= 0 && idx < availableSectors.length - 1 ? idx + 1 : 0
    const target = availableSectors[nextIdx]
    if (target) setSector(target)
  }

  React.useEffect(() => {
    if (selectedSectorBtnRef.current) {
      selectedSectorBtnRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      })
    }
  }, [sector])

  const filteredForms = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return allForms.filter((f) => {
      const matchSector = sector === ALL_CHIP || getSector(f) === sector
      if (!matchSector) return false
      if (!q) return true
      const title = (f.title ?? "").toLowerCase()
      const desc = (f.description ?? "").toLowerCase()
      const s = getSector(f).toLowerCase()
      return title.includes(q) || desc.includes(q) || s.includes(q)
    })
  }, [allForms, query, sector])

  const kpis = React.useMemo(() => {
    const list = myResponses ?? []
    const open = list.filter((r) => r.status !== "COMPLETED").length
    const waiting = list.filter((r) => r.status === "NOT_STARTED").length
    const completed = list.filter((r) => r.status === "COMPLETED").length
    return { open, waiting, completed, total: list.length }
  }, [myResponses])

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-10">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Central de Solicitações
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Escolha o serviço desejado para abrir um chamado direto ao setor responsável
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Link href="/forms/my-responses">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold gap-2 border-border/80 bg-card shadow-xs hover:border-primary/50"
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Minhas Solicitações</span>
              {kpis.open > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-bold text-primary-foreground">
                  {kpis.open}
                </span>
              )}
            </Button>
          </Link>
          {showCentralLink && (
            <Link href="/forms/central">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs font-semibold gap-1.5 border-border/80 bg-card hover:border-primary/50"
              >
                <LifeBuoy className="h-4 w-4" />
                <span>Central de Chamados</span>
              </Button>
            </Link>
          )}
          {userCanCreateForm && (
            <Link href="/forms/new">
              <Button size="sm" className="h-9 rounded-xl text-xs font-semibold gap-1.5 shadow-sm">
                <PlusCircle className="h-4 w-4" />
                <span>Criar Formulário</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {myResponses && myResponses.length > 0 && (
        <div className="rounded-[22px] border border-border/70 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border/60">

            {/* Bloco: Métricas */}
            <div className="md:col-span-7 grid grid-cols-3 divide-x divide-border/60">
              <Link
                href="/forms/my-responses"
                className="group flex flex-col items-center justify-center gap-0.5 p-5 hover:bg-muted/30 transition-colors"
              >
                <span className="text-3xl font-black tracking-tight text-foreground tabular-nums group-hover:text-primary transition-colors">
                  {kpis.open}
                </span>
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Abertas
                </span>
              </Link>
              <Link
                href="/forms/my-responses"
                className="group flex flex-col items-center justify-center gap-0.5 p-5 hover:bg-muted/30 transition-colors"
              >
                <span className="text-3xl font-black tracking-tight text-amber-500 tabular-nums">
                  {kpis.waiting}
                </span>
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Novas
                </span>
              </Link>
              <Link
                href="/forms/my-responses"
                className="group flex flex-col items-center justify-center gap-0.5 p-5 hover:bg-muted/30 transition-colors"
              >
                <span className="text-3xl font-black tracking-tight text-emerald-500 tabular-nums">
                  {kpis.completed}
                </span>
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Concluídas
                </span>
              </Link>
            </div>

            {/* Bloco: Último Chamado + Ação */}
            <div className="md:col-span-5 flex flex-col justify-center gap-3 p-5">
              {myResponses[0] && (
                <>
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Última solicitação
                    </p>
                    <Link
                      href="/forms/my-responses"
                      className="group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-background/50 border border-border/50 hover:bg-background hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-primary shrink-0">
                          {myResponses[0].number != null
                            ? formatFormResponseNumber(myResponses[0].number)
                            : `#${myResponses[0].id.slice(0, 6)}`}
                        </span>
                        <span className="truncate text-xs font-semibold text-foreground/90 group-hover:text-primary transition-colors">
                          {myResponses[0].form?.title ?? "Sem título"}
                        </span>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                  <Link href="/forms/my-responses" className="block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 rounded-full text-xs font-bold gap-1.5 border-border/70 hover:bg-foreground hover:text-background transition-all"
                    >
                      <span>Ver Todas</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      <div className="space-y-4 text-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por serviço, departamento ou palavra-chave..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 rounded-2xl bg-card border-border/80 text-sm shadow-xs focus-visible:ring-primary/30"
          />
        </div>

        {availableSectors.length > 1 && (
          <div className="relative flex items-center justify-center w-full py-1 select-none">
            <button
              type="button"
              onClick={handlePrevSector}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-white transition-all cursor-pointer hover:scale-110 active:scale-95"
              aria-label="Setor anterior"
              title="Setor anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              ref={sectorsScrollRef}
              className="flex flex-1 items-center justify-center gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-2 py-1"
            >
              {availableSectors.map((sec) => {
                const isSelected = sector === sec
                return (
                  <button
                    key={sec}
                    ref={isSelected ? selectedSectorBtnRef : null}
                    type="button"
                    onClick={() => setSector(sec)}
                    className={cn(
                      "inline-flex items-center whitespace-nowrap transition-all duration-300 cursor-pointer shrink-0 border-none bg-transparent outline-none",
                      isSelected
                        ? "dark:text-white font-semibold text-sm tracking-wide scale-101 drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]"
                        : "text-zinc-500 hover:text-zinc-300 font-normal text-xs opacity-50 hover:opacity-85 hover:scale-102",
                    )}
                  >
                    {sec}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={handleNextSector}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-white transition-all cursor-pointer hover:scale-110 active:scale-95"
              aria-label="Próximo setor"
              title="Próximo setor"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Serviços Disponíveis
          </span>
          <span className="font-mono">
            {filteredForms.length} {filteredForms.length === 1 ? "opção" : "opções"}
          </span>
        </div>

        {isLoadingForms ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-[26px] border border-white/10 bg-card/40"
              />
            ))}
          </div>
        ) : filteredForms.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 rounded-[26px] border border-border/80 bg-card p-12 text-center text-muted-foreground shadow-xs">
            <div className="p-4 rounded-2xl bg-muted/50 text-muted-foreground">
              <Inbox className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Nenhuma solicitação encontrada</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                {query
                  ? `Não encontramos nenhum serviço com o termo "${query}". Tente buscar por outras palavras.`
                  : "Nenhum tipo de solicitação disponível para este setor."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredForms.map((form) => (
              <FuturisticServiceCard
                key={form.id}
                form={form}
                sectorConfigs={sectorConfigs}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ServiceCardProps {
  form: FormItem
  sectorConfigs?: Record<string, { icon: string; color: string }>
}

function FuturisticServiceCard({ form, sectorConfigs }: ServiceCardProps) {
  const sectorLabel = getSector(form)
  const { icon: SectorIcon, color: sectorColor } = getSectorVisualInfo(sectorLabel, sectorConfigs)
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const cardBackground = isDark
    ? `radial-gradient(ellipse 120% 90% at 90% 20%, ${sectorColor}20 0%, transparent 35%), linear-gradient(145deg, #0d0e12 0%, #161820 10%, #0d0e12 100%)`
    : `radial-gradient(ellipse 120% 90% at 90% 20%, ${sectorColor}18 0%, transparent 35%), linear-gradient(145deg, #f5f5f4 0%, #fafaf9 10%, #f5f5f4 100%)`

  const descriptionText = form.description && form.description.trim().length > 0
    ? form.description
    : `Solicitação de atendimento direto para o setor de ${sectorLabel}.`

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="h-full"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/forms/${form.id}/respond`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            router.push(`/forms/${form.id}/respond`)
          }
        }}
        className={cn(
          "group relative flex flex-col justify-between rounded-[26px] p-5 sm:p-6 text-left transition-all duration-300 cursor-pointer overflow-hidden h-full min-h-[230px] shadow-md",
          "border border-white/10 dark:border-white/10 hover:border-white/25 hover:shadow-2xl",
        )}
        style={{
          background: cardBackground,
        }}
      >
        {/* Emblema / Ícone do Setor Gigante em Marca d'água à Direita com opacidade equilibrada */}
        <div
          className="absolute -right-4 -top-6 w-48 h-48 pointer-events-none select-none transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-3"
          aria-hidden="true"
        >
          <SectorIcon
            className="w-full h-full opacity-15 dark:opacity-12 transition-opacity duration-300 group-hover:opacity-30"
            style={{ color: sectorColor }}
          />
        </div>

        {/* Informações: Setor, Título, Descrição */}
        <div className="relative z-10 pr-14">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-400 dark:text-white/70">
              {sectorLabel}
            </span>
          </div>
          <h3 className="text-[15px] font-extrabold tracking-tight text-stone-800 dark:text-white line-clamp-2 drop-shadow-xs">
            {form.title ?? "Sem título"}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-white/80 leading-relaxed line-clamp-2 font-normal">
            {descriptionText}
          </p>
        </div>

        {/* Rodapé: Ações com z-index alto para não conflitar com o clique do card */}
        <div className="relative z-20 mt-2 flex items-center justify-between gap-3">
          {/* Botão Ver Detalhes → /forms/[id] */}
          <Link
            href={`/forms/${form.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center h-8 px-2.5 rounded-xl text-[11px] font-semibold text-stone-500 dark:text-white/80 hover:text-stone-800 dark:hover:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors border border-black/10 dark:border-white/10 gap-1"
            title="Ver detalhes e respostas"
          >
            <Eye className="size-3.5" />
            <span className="hidden sm:inline">Ver</span>
          </Link>

          {/* Botão Solicitar → /forms/[id]/respond */}
          <Link
            href={`/forms/${form.id}/respond`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 h-8 px-3.5 rounded-xl text-xs font-bold dark:text-white"
              /*//
              style={{
                backgroundColor: sectorColor,
              }}
              */
          >
            <span>Solicitar</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default FormsListV2
