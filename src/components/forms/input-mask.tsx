"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

type MaskType = "cpf" | "cnpj" | "phone" | "email"

interface InputMaskProps {
  value: string
  onChange: (value: string) => void
  type: MaskType
  placeholder?: string
  id?: string
  disabled?: boolean
}

export function InputMask({ value, onChange, type, placeholder, id, disabled = false }: InputMaskProps) {
  const [displayValue, setDisplayValue] = useState("")

  useEffect(() => {
    if (value) {
      setDisplayValue(formatValue(value, type))
    } else {
      setDisplayValue("")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, type])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")

    if (type === "email") {
      onChange(e.target.value)
      setDisplayValue(e.target.value)
      return
    }

    onChange(rawValue)
    setDisplayValue(formatValue(rawValue, type))
  }

  const formatValue = (value: string, type: MaskType): string => {
    switch (type) {
      case "cpf":
        return formatCPF(value)
      case "cnpj":
        return formatCNPJ(value)
      case "phone":
        return formatPhone(value)
      case "email":
        return value
      default:
        return value
    }
  }

  const formatCPF = (value: string): string => {
    if (!value) return ""

    value = value.slice(0, 11)

    if (value.length <= 3) {
      return value
    } else if (value.length <= 6) {
      return `${value.slice(0, 3)}.${value.slice(3)}`
    } else if (value.length <= 9) {
      return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`
    } else {
      return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`
    }
  }

  const formatCNPJ = (value: string): string => {
    if (!value) return ""

    value = value.slice(0, 14)

    if (value.length <= 2) {
      return value
    } else if (value.length <= 5) {
      return `${value.slice(0, 2)}.${value.slice(2)}`
    } else if (value.length <= 8) {
      return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`
    } else if (value.length <= 12) {
      return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8)}`
    } else {
      return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`
    }
  }

  const formatPhone = (value: string): string => {
    if (!value) return ""

    value = value.slice(0, 11)

    if (value.length <= 2) {
      return `(${value}`
    } else if (value.length <= 6) {
      return `(${value.slice(0, 2)}) ${value.slice(2)}`
    } else {
      const hasNineDigit = value.length > 10
      if (hasNineDigit) {
        return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
      } else {
        return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`
      }
    }
  }

  const getInputType = (type: MaskType): string => {
    return type === "email" ? "email" : "text"
  }

  return (
    <Input disabled={disabled} id={id} type={getInputType(type)} value={displayValue} onChange={handleChange} placeholder={placeholder} />
  )
}

