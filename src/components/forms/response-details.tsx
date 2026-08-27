"use client"

import React from "react"
import type { Field } from "@/lib/form-types"

interface ResponseDetailsProps {
  responseData: Record<string, unknown>[]
  formFields: Field[]
}

export function ResponseDetails({ responseData, formFields }: ResponseDetailsProps) {
  // Obter o primeiro objeto de resposta (normalmente só há um)
  const responseObj = responseData[0]
  const fieldsToShow = formFields

  // Função auxiliar para converter \n em quebras de linha
  const renderTextWithLineBreaks = (text: string) => {
    const parts = text.split("\n")
    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    )
  }

  // Função para renderizar o valor de acordo com o tipo de campo
  const renderValue = (fieldName: string, fieldType: string, value: string | number | File[] | null | undefined | string[]) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground italic">Não respondido</span>
    }

    switch (fieldType) {
      case "checkbox":
        return value ? "Sim" : "Não"
      case "combobox":
        if (Array.isArray(value) && value.every(item => typeof item === "string")) {
          return value.join(", ")
        }
        return JSON.stringify(value)
      case "file":
        if (Array.isArray(value) && value.every(item => item instanceof File)) {
          return (
            <ul className="list-disc pl-5">
              {value.map((file, i) => {
                if (file instanceof File) {
                  return (
                    <li key={i}>
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </li>
                  )
                }
                return null
              })}
            </ul>
          )
        } else if (value && typeof value === "object" && "name" in value && "size" in value) {
          return `${value.name as string} (${(value.size as number / 1024).toFixed(2)} KB)`
        }
        // Converter de forma segura
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          return String(value)
        }
        return JSON.stringify(value)
      case "textarea":
      case "text":
      case "dynamic":
      case "formatted":
        // Para campos de texto, converter \n em quebras de linha
        if (typeof value === "string") {
          return renderTextWithLineBreaks(value)
        }
        // Se não for string, converter de forma segura
        if (typeof value === "number" || typeof value === "boolean") {
          return String(value)
        }
        return JSON.stringify(value)
      default:
        // Para outros tipos, verificar se é string e converter \n
        if (typeof value === "string" && value.includes("\n")) {
          return renderTextWithLineBreaks(value)
        }
        // Converter de forma segura baseado no tipo
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          return String(value)
        }
        return JSON.stringify(value)
    }
  }

  if (fieldsToShow.length === 0) {
    return <p className="text-muted-foreground">Nenhum campo marcado para exibição em respostas.</p>
  }

  return (
    <div className="space-y-3">
      {fieldsToShow.map((field) => {
        const value = responseObj?.[field.name]

        return (
          <div
            key={field.id}
            className="rounded-xl border border-border/70 bg-neutral-50 dark:bg-neutral-900 p-3.5 space-y-1.5 shadow-2xs transition-colors"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {field.label}
            </span>
            <div className="text-xs sm:text-sm text-foreground font-medium break-words leading-relaxed">
              {renderValue(field.name, field.type, value as string)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
