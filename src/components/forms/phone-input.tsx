"use client"

import React, { useState, useEffect, useId } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  formatBrazilianPhone,
  normalizePhoneDigits,
  isValidBrazilianCellPhone,
  parsePhoneFieldValue,
  type PhoneTypeValue,
} from "@/lib/phone-validation"
import { cn } from "@/lib/utils"
import { Check, AlertCircle } from "lucide-react"

export type { PhoneTypeValue }

export interface PhoneFieldValue {
  phone: string
  phoneType?: PhoneTypeValue
}

interface PhoneInputProps {
  id?: string
  name?: string
  value?: unknown
  onChange: (value: PhoneFieldValue | string) => void
  placeholder?: string
  disabled?: boolean
  askPhoneType?: boolean
  required?: boolean
  className?: string
  showValidationHint?: boolean
}

function parseInitialValue(val: unknown): PhoneFieldValue {
  const { phone, phoneType } = parsePhoneFieldValue(val)
  return { phone: formatBrazilianPhone(phone), phoneType }
}

export function PhoneInput({
  id,
  name,
  value,
  onChange,
  placeholder = "(99) 99999-9999",
  disabled = false,
  askPhoneType = false,
  required = false,
  className,
  showValidationHint = true,
}: PhoneInputProps) {
  const generatedId = useId()
  const inputId = id ?? name ?? generatedId

  const initial = parseInitialValue(value)
  const [phone, setPhone] = useState(initial.phone)
  const [phoneType, setPhoneType] = useState<PhoneTypeValue | undefined>(initial.phoneType)

  useEffect(() => {
    const updated = parseInitialValue(value)
    setPhone(updated.phone)
    setPhoneType(updated.phoneType)
  }, [value])

  const digits = normalizePhoneDigits(phone)
  const isComplete = digits.length === 11
  const isValid = isValidBrazilianCellPhone(phone)
  const hasError = isComplete && !isValid

  const emitChange = (newPhone: string, newType?: PhoneTypeValue) => {
    if (askPhoneType) {
      onChange({
        phone: newPhone,
        phoneType: newType,
      })
    } else {
      onChange(newPhone)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const formatted = formatBrazilianPhone(raw)
    setPhone(formatted)
    emitChange(formatted, phoneType)
  }

  const handleTypeSelect = (selected: PhoneTypeValue) => {
    const nextType = phoneType === selected ? undefined : selected
    setPhoneType(nextType)
    emitChange(phone, nextType)
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Campo do Celular com DDI +55 Fixo */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center rounded-xl border bg-background transition-all shadow-2xs",
            "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary",
            hasError
              ? "border-destructive ring-1 ring-destructive/40"
              : isComplete && isValid
                ? "border-emerald-500/80"
                : "border-border/70",
            disabled && "opacity-60 pointer-events-none bg-muted/30"
          )}
        >
          {/* Badge fixo de DDI +55 (Brasil) */}
          <div
            className="flex items-center gap-1 px-3 py-2 bg-muted/40 border-r border-border/60 text-xs font-semibold text-foreground select-none shrink-0"
            title="Código do país (+55 Brasil fixo)"
          >
            <span className="text-sm leading-none" role="img" aria-label="Brasil">
              🇧🇷
            </span>
            <span className="text-muted-foreground font-medium">+55</span>
          </div>

          {/* Input com máscara */}
          <Input
            id={inputId}
            name={name}
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={15}
            className="h-10 border-0 bg-transparent rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3 text-sm font-medium tracking-wide"
          />

          {/* Indicador visual de validação */}
          {showValidationHint && digits.length > 0 && (
            <div className="pr-3 flex items-center shrink-0">
              {isComplete && isValid ? (
                <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-medium gap-1" title="Número válido">
                  <Check className="h-4 w-4" />
                </span>
              ) : hasError ? (
                <span className="inline-flex items-center text-destructive text-xs font-medium gap-1" title="Número de celular inválido (DDD inválido ou falta o 9)">
                  <AlertCircle className="h-4 w-4" />
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Opção Empresarial / Pessoal (Dois Checkboxes Alinhados Horizontalmente) */}
      {askPhoneType && (
        <div className="flex flex-wrap items-center gap-5 pt-0.5 px-0.5 text-xs text-foreground">
          <span className="text-muted-foreground font-medium text-xs">
            Tipo de número:{required && <span className="text-destructive ml-0.5">*</span>}
          </span>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${inputId}-empresarial`}
              checked={phoneType === "empresarial"}
              onCheckedChange={() => handleTypeSelect("empresarial")}
              disabled={disabled}
            />
            <Label
              htmlFor={`${inputId}-empresarial`}
              className="text-xs sm:text-sm font-medium cursor-pointer select-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Empresarial
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${inputId}-pessoal`}
              checked={phoneType === "pessoal"}
              onCheckedChange={() => handleTypeSelect("pessoal")}
              disabled={disabled}
            />
            <Label
              htmlFor={`${inputId}-pessoal`}
              className="text-xs sm:text-sm font-medium cursor-pointer select-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Pessoal
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}
