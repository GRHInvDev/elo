"use client"

import type { Field } from "@/lib/form-types"
import { Separator } from "@/components/ui/separator"

interface ResponseDetailsProps {
  responseData: Record<string, string | number | File[] | null | undefined | string[]>[]
  formFields: Field[]
}

export function ResponseDetails({ responseData, formFields }: ResponseDetailsProps) {
  if (!responseData || responseData.length === 0) {
    return <p className="text-muted-foreground">Nenhuma resposta encontrada.</p>
  }

  // Obter o primeiro objeto de resposta (normalmente só há um)
  const responseObj = responseData[0]

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
              {value.map((file, i) => (
                <li key={i}>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </li>
              ))}
            </ul>
          )
        } else if (value && typeof value === "object" && "name" in value && "size" in value) {
          return `${value.name as string} (${(value.size as number / 1024).toFixed(2)} KB)`
        }
        return String(value)
      default:
        return JSON.stringify(value)
    }
  }

  return (
    <div className="space-y-6">
      {formFields.map((field) => {
        const value = responseObj?.[field.name]

        return (
          <div key={field.id} className="space-y-2">
            <div className="flex flex-col">
              <h3 className="font-medium">{field.label}</h3>
              <div className="mt-1 text-sm">{renderValue(field.name, field.type, value)}</div>
            </div>
            <Separator />
          </div>
        )
      })}
    </div>
  )
}

