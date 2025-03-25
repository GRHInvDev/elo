"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlusCircle } from "lucide-react"
import type { FieldType } from "@/lib/form-types"

const fieldTypes = [
  { type: "text", label: "Texto" },
  { type: "number", label: "Número" },
  { type: "checkbox", label: "Checkbox" },
  { type: "formatted", label: "Texto Formatado" },
  { type: "combobox", label: "Combobox" },
  { type: "file", label: "Arquivo" },
  { type: "textarea", label: "Texto Longo" },
] as const

interface FieldTypeSelectorProps {
  onSelect: (type: FieldType) => void
}

export function FieldTypeSelector({ onSelect }: FieldTypeSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Campo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {fieldTypes.map((fieldType) => (
          <DropdownMenuItem key={fieldType.type} onClick={() => onSelect(fieldType.type as FieldType)}>
            {fieldType.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

