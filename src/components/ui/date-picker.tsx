"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({
  date,
  onDateChange,
  className,
  placeholder = "Selecionar data",
}: {
  date: Date | undefined
  onDateChange: (date: Date) => void
  className?: string
  placeholder?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left font-normal transition-colors",
            !date && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50 ml-2 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            if (selectedDate) {
              onDateChange(selectedDate)
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
