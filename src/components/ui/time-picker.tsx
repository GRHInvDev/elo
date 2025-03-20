"use client"

import * as React from "react"
import { Clock } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
}

export function TimePicker({ date, setDate, disabled }: TimePickerProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null)
  const hourRef = React.useRef<HTMLInputElement>(null)

  const [hour, setHour] = React.useState<string>(date ? String(date.getHours()).padStart(2, "0") : "")
  const [minute, setMinute] = React.useState<string>(date ? String(date.getMinutes()).padStart(2, "0") : "")

  // Update the date when the hour or minute changes
  React.useEffect(() => {
    if (hour && minute && date) {
      const newDate = new Date(date)
      newDate.setHours(parseInt(hour, 10))
      newDate.setMinutes(parseInt(minute, 10))
      setDate(newDate)
    }
  }, [hour, minute, date, setDate])

  // Update hour and minute when date changes
  React.useEffect(() => {
    if (date) {
      setHour(String(date.getHours()).padStart(2, "0"))
      setMinute(String(date.getMinutes()).padStart(2, "0"))
    }
  }, [date])

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setHour("")
      return
    }

    const numericValue = parseInt(value, 10)
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 23) {
      setHour(String(numericValue).padStart(2, "0"))
      if (value.length === 2) {
        minuteRef.current?.focus()
      }
    }
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setMinute("")
      return
    }

    const numericValue = parseInt(value, 10)
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 59) {
      setMinute(String(numericValue).padStart(2, "0"))
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          Horas
        </Label>
        <Input
          ref={hourRef}
          id="hours"
          value={hour}
          onChange={handleHourChange}
          className="w-12 text-center"
          disabled={disabled}
          maxLength={2}
        />
      </div>
      <div className="text-xl">:</div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          Minutos
        </Label>
        <Input
          ref={minuteRef}
          id="minutes"
          value={minute}
          onChange={handleMinuteChange}
          className="w-12 text-center"
          disabled={disabled}
          maxLength={2}
        />
      </div>
      <div className="flex h-10 items-center">
        <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}
