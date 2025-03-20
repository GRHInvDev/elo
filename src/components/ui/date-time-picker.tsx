"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TimePicker } from "@/components/ui/time-picker"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
}

export function DateTimePicker({ date, setDate, disabled }: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = React.useState<Date | undefined>(date)

  // Update the parent state when the date changes
  React.useEffect(() => {
    setDate(selectedDateTime)
  }, [selectedDateTime, setDate])

  // Update our local state when the parent date changes
  React.useEffect(() => {
    setSelectedDateTime(date)
  }, [date])

  const handleSelect = (selected: Date | undefined) => {
    if (selected) {
      const newDate = new Date(selected)
      if (selectedDateTime) {
        // Preserve the time when selecting a new date
        newDate.setHours(selectedDateTime.getHours())
        newDate.setMinutes(selectedDateTime.getMinutes())
      } else {
        // Default to current time if no time was previously selected
        const now = new Date()
        newDate.setHours(now.getHours())
        newDate.setMinutes(now.getMinutes())
      }
      setSelectedDateTime(newDate)
    } else {
      setSelectedDateTime(undefined)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPp", { locale: ptBR }) : <span>Selecione a data e hora</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDateTime}
          onSelect={handleSelect}
          initialFocus
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />
        <div className="border-t border-border p-3">
          <TimePicker date={selectedDateTime} setDate={setSelectedDateTime} disabled={!selectedDateTime} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

