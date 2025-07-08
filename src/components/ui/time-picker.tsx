"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
}

export function TimePicker({ date, setDate, disabled }: TimePickerProps) {
  const [selectedHours, setSelectedHours] = useState(date ? date.getHours() : 0)
  const [selectedMinutes, setSelectedMinutes] = useState(date ? date.getMinutes() : 0)

  useEffect(() => {
    if (date) {
      setSelectedHours(date.getHours())
      setSelectedMinutes(date.getMinutes())
    }
  }, [date])

  const handleHoursChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const hours = Number.parseInt(event.target.value)
    setSelectedHours(hours)
    updateDateTime(hours - 3, selectedMinutes)
  }

  const handleMinutesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const minutes = Number.parseInt(event.target.value)
    setSelectedMinutes(minutes)
    updateDateTime(selectedHours - 3, minutes)
  }

  const updateDateTime = (hours: number, minutes: number) => {
    if (date) {
      const newDate = new Date(date)
      newDate.setHours(hours)
      newDate.setMinutes(minutes)
      setDate(newDate)
    } else {
      const now = new Date()
      const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      setDate(newDate)
    }
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => i)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className="flex items-center space-x-2">
      <select
        value={selectedHours}
        onChange={handleHoursChange}
        disabled={disabled}
        className="border rounded px-2 py-1"
      >
        {hourOptions.map((hour) => (
          <option key={hour} value={hour}>
            {hour.toString().padStart(2, "0")}
          </option>
        ))}
      </select>
      :
      <select
        value={selectedMinutes}
        onChange={handleMinutesChange}
        disabled={disabled}
        className="border rounded px-2 py-1"
      >
        {minuteOptions.map((minute) => (
          <option key={minute} value={minute}>
            {minute.toString().padStart(2, "0")}
          </option>
        ))}
      </select>
    </div>
  )
}

