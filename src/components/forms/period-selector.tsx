"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type PeriodMode = "month" | "range"

interface PeriodSelectorProps {
  mode?: PeriodMode
  startDate?: Date
  endDate?: Date
  onModeChange?: (mode: PeriodMode) => void
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  className?: string
  label?: string
}

export function PeriodSelector({
  mode: externalMode,
  startDate,
  endDate,
  onModeChange,
  onStartDateChange,
  onEndDateChange,
  className,
  label = "Período",
}: PeriodSelectorProps) {
  const [internalMode, setInternalMode] = useState<PeriodMode>(externalMode ?? "month")
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isEndOpen, setIsEndOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number>(
    startDate?.getMonth() ?? new Date().getMonth()
  )
  const [selectedYear, setSelectedYear] = useState<number>(
    startDate?.getFullYear() ?? new Date().getFullYear()
  )

  const currentMode = externalMode ?? internalMode

  // Quando muda o mês/ano no modo month, atualizar as datas
  useEffect(() => {
    if (currentMode === "month") {
      const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1))
      const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1))
      
      // Só atualizar se as datas realmente mudaram para evitar loops
      if (!startDate || startDate.getTime() !== monthStart.getTime()) {
        onStartDateChange(monthStart)
      }
      if (!endDate || endDate.getTime() !== monthEnd.getTime()) {
        onEndDateChange(monthEnd)
      }
    }
  }, [selectedMonth, selectedYear, currentMode, onStartDateChange, onEndDateChange, startDate, endDate])

  // Sincronizar mês/ano quando startDate muda externamente (apenas no modo month)
  useEffect(() => {
    if (startDate && currentMode === "month") {
      const month = startDate.getMonth()
      const year = startDate.getFullYear()
      
      if (month !== selectedMonth || year !== selectedYear) {
        setSelectedMonth(month)
        setSelectedYear(year)
      }
    }
  }, [startDate, currentMode, selectedMonth, selectedYear])

  const handleModeChange = useCallback((newMode: PeriodMode) => {
    if (onModeChange) {
      onModeChange(newMode)
    } else {
      setInternalMode(newMode)
    }

    // Ao mudar para modo range, manter as datas atuais se existirem
    if (newMode === "range" && !startDate && !endDate) {
      // Se não há datas, usar o mês atual como padrão
      const now = new Date()
      onStartDateChange(startOfMonth(now))
      onEndDateChange(endOfMonth(now))
    }
  }, [onModeChange, startDate, endDate, onStartDateChange, onEndDateChange])

  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(parseInt(month))
  }, [])

  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(parseInt(year))
  }, [])

  // Gerar lista de anos (últimos 5 anos + próximos 2)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 8 }, (_, i) => currentYear - 5 + i)
  }, [])

  // Meses do ano
  const months = [
    { value: "0", label: "Janeiro" },
    { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Maio" },
    { value: "5", label: "Junho" },
    { value: "6", label: "Julho" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" },
    { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" },
    { value: "11", label: "Dezembro" },
  ]

  const formatPeriodDisplay = () => {
    if (!startDate || !endDate) return "Selecione o período"

    if (currentMode === "month") {
      return format(startDate, "MMMM 'de' yyyy", { locale: ptBR })
    }

    return `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      
      {/* Seletor de modo */}
      <div className="space-y-4">
        <Select
          value={currentMode}
          onValueChange={(value: PeriodMode) => handleModeChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Por Mês</SelectItem>
            <SelectItem value="range">Por Período</SelectItem>
          </SelectContent>
        </Select>

        {/* Conteúdo baseado no modo */}
        {currentMode === "month" ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Mês</Label>
              <Select
                value={String(selectedMonth)}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Ano</Label>
              <Select
                value={String(selectedYear)}
                onValueChange={handleYearChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Data inicial</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      onStartDateChange(date)
                      setIsStartOpen(false)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Data final</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      onEndDateChange(date)
                      setIsEndOpen(false)
                    }
                  }}
                  disabled={(date) => {
                    if (startDate) {
                      return date < startDate
                    }
                    return false
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Exibição do período selecionado */}
        {(startDate && endDate) && (
          <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
            <span className="font-medium">Período selecionado:</span> {formatPeriodDisplay()}
          </div>
        )}
      </div>
    </div>
  )
}

