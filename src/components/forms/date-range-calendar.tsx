"use client"

import { useState, useMemo, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { DateRange as DateRangeType } from "react-day-picker"

interface DateRangeCalendarProps {
  startDate?: Date
  endDate?: Date
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  className?: string
  label?: string
  placeholder?: string
}

export function DateRangeCalendar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
  label = "Período",
  placeholder = "Selecione o período",
}: DateRangeCalendarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startDate ?? new Date())

  // Criar objeto DateRange para o Calendar
  const dateRange: DateRangeType | undefined = useMemo(() => {
    if (startDate && endDate) {
      return {
        from: startDate,
        to: endDate,
      }
    }
    if (startDate) {
      return {
        from: startDate,
        to: undefined,
      }
    }
    return undefined
  }, [startDate, endDate])

  // Sincronizar o mês do calendário quando startDate mudar
  useEffect(() => {
    if (startDate) {
      setCalendarMonth(startDate)
    }
  }, [startDate])

  // Quando o popover abrir, resetar o mês para a primeira data selecionada
  const handleOpenChange = (open: boolean) => {
    // Não permitir fechar se apenas a primeira data está selecionada
    if (!open && startDate && !endDate) {
      return
    }
    setIsOpen(open)
    if (open) {
      // Quando abrir, mostrar o calendário a partir da primeira data selecionada
      setCalendarMonth(startDate ?? new Date())
    }
  }

  const handleSelect = (range: DateRangeType | undefined) => {
    if (!range) {
      onStartDateChange(undefined)
      onEndDateChange(undefined)
      return
    }

    // Atualizar data inicial
    onStartDateChange(range.from)

    // Atualizar data final (pode ser undefined se ainda está selecionando)
    onEndDateChange(range.to)

    // Fechar o popover quando o período estiver completo
    if (range.from && range.to) {
      setIsOpen(false)
    }
  }

  const clearDates = () => {
    onStartDateChange(undefined)
    onEndDateChange(undefined)
  }

  const formatDisplay = () => {
    if (startDate && endDate) {
      return `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`
    }
    if (startDate) {
      return `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} - ...`
    }
    return placeholder
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDisplay()}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0" 
            align="start"
            onInteractOutside={(e) => {
              // Prevenir fechamento ao clicar fora se apenas a primeira data está selecionada
              if (startDate && !endDate) {
                e.preventDefault()
              }
            }}
            onEscapeKeyDown={(e) => {
              // Prevenir fechamento com ESC se apenas a primeira data está selecionada
              if (startDate && !endDate) {
                e.preventDefault()
              }
            }}
          >
            {startDate && !endDate && (
              <div className="px-3 pt-2 pb-1 text-xs text-muted-foreground border-b bg-muted/50">
                <span className="font-medium">Aguardando seleção da data final...</span>
              </div>
            )}
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleSelect}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              numberOfMonths={1}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {(startDate ?? endDate) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearDates}
            className="shrink-0"
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

