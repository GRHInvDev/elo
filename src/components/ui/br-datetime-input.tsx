"use client"

import * as React from "react"
import { format } from "date-fns"

import { Input } from "@/components/ui/input"

/**
 * Inputs de data e hora no formato brasileiro (dd/mm/aa e hh:mm), com atalho:
 * digitar "H" preenche a data de hoje / o horário atual.
 *
 * Estratégia: o input visível é mascarado e apenas exibe/edita no formato BR.
 * Um `<input type="hidden">` com o mesmo `name` carrega o valor canônico
 * (yyyy-MM-dd para data, HH:mm para hora), de forma que a leitura via FormData
 * nos formulários continua idêntica — sem alterar a lógica de submit.
 */

// dd/mm/aa -> Date (ano assumido como 20aa). Retorna null se inválida/incompleta.
function parseBRDate(text: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(text)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = 2000 + Number(match[3])
  const date = new Date(year, month - 1, day)
  // Rejeita datas impossíveis (ex.: 31/02) que o Date "corrige" silenciosamente.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

function maskBRDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 6)
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 2))
  if (digits.length > 2) parts.push(digits.slice(2, 4))
  if (digits.length > 4) parts.push(digits.slice(4, 6))
  return parts.join("/")
}

interface DateInputBRProps {
  id?: string
  name: string
  defaultValue?: Date | null
  required?: boolean
  /** Bloqueia datas no passado (equivalente ao antigo `min={hoje}`). */
  minToday?: boolean
  className?: string
}

export function DateInputBR({
  id,
  name,
  defaultValue,
  required,
  minToday,
  className,
}: DateInputBRProps) {
  const [text, setText] = React.useState(
    defaultValue ? format(defaultValue, "dd/MM/yy") : "",
  )
  const inputRef = React.useRef<HTMLInputElement>(null)

  const parsed = parseBRDate(text)
  const canonical = parsed ? format(parsed, "yyyy-MM-dd") : ""

  React.useEffect(() => {
    const el = inputRef.current
    if (!el) return
    if (text === "") {
      el.setCustomValidity("")
      return
    }
    if (!parsed) {
      el.setCustomValidity("Data inválida. Use o formato dd/mm/aa.")
      return
    }
    if (minToday) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (parsed < today) {
        el.setCustomValidity("A data não pode ser no passado.")
        return
      }
    }
    el.setCustomValidity("")
  }, [text, parsed, minToday])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    // Atalho: "H"/"h" preenche a data de hoje.
    if (/[hH]/.test(value)) {
      setText(format(new Date(), "dd/MM/yy"))
      return
    }
    setText(maskBRDate(value))
  }

  return (
    <>
      <Input
        id={id}
        ref={inputRef}
        value={text}
        onChange={handleChange}
        placeholder="dd/mm/aa"
        autoComplete="off"
        required={required}
        title="Digite H para preencher com hoje"
        className={className}
      />
      <input type="hidden" name={name} value={canonical} />
    </>
  )
}

// HH:mm válido? Retorna null caso contrário.
function parseBRTime(text: string): string | null {
  const match = /^(\d{2}):(\d{2})$/.exec(text)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return text
}

function maskBRTime(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
}

interface TimeInputBRProps {
  id?: string
  name: string
  defaultValue?: Date | null
  required?: boolean
  className?: string
}

export function TimeInputBR({
  id,
  name,
  defaultValue,
  required,
  className,
}: TimeInputBRProps) {
  const [text, setText] = React.useState(
    defaultValue ? format(defaultValue, "HH:mm") : "",
  )
  const inputRef = React.useRef<HTMLInputElement>(null)

  const canonical = parseBRTime(text) ?? ""

  React.useEffect(() => {
    const el = inputRef.current
    if (!el) return
    if (text === "") {
      el.setCustomValidity("")
      return
    }
    if (!parseBRTime(text)) {
      el.setCustomValidity("Horário inválido. Use o formato hh:mm.")
      return
    }
    el.setCustomValidity("")
  }, [text])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    // Atalho: "H"/"h" preenche com o horário atual.
    if (/[hH]/.test(value)) {
      setText(format(new Date(), "HH:mm"))
      return
    }
    setText(maskBRTime(value))
  }

  return (
    <>
      <Input
        id={id}
        ref={inputRef}
        value={text}
        onChange={handleChange}
        placeholder="hh:mm"
        autoComplete="off"
        required={required}
        title="Digite H para preencher com o horário atual"
        className={className}
      />
      <input type="hidden" name={name} value={canonical} />
    </>
  )
}
