"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/trpc/react"

export interface EmpresaFilialValue {
  empresaId: string
  filialId: string
}

interface EmpresaFilialFilterProps {
  value: EmpresaFilialValue
  onChange: (value: EmpresaFilialValue) => void
}

/**
 * Filtro no padrão novo (empresa → filial) em cascata. Controlado pelo pai:
 * recebe `value` e emite `onChange`. Ao trocar a empresa, a filial é limpa.
 */
export function EmpresaFilialFilter({ value, onChange }: EmpresaFilialFilterProps) {
  const { data: empresas = [] } = api.empresas.list.useQuery()
  const { data: filiaisData = [] } = api.filiais.list.useQuery()

  const filiais = useMemo(
    () => filiaisData.filter((f) => f.empresa.id === value.empresaId),
    [filiaisData, value.empresaId],
  )

  const hasFilter = Boolean(value.empresaId || value.filialId)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={value.empresaId}
        onValueChange={(empresaId) => onChange({ empresaId, filialId: "" })}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Todas as empresas" />
        </SelectTrigger>
        <SelectContent>
          {empresas.map((emp) => (
            <SelectItem key={emp.id} value={emp.id}>
              {emp.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.filialId}
        onValueChange={(filialId) => onChange({ ...value, filialId })}
        disabled={!value.empresaId}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder={value.empresaId ? "Todas as filiais" : "Selecione a empresa"} />
        </SelectTrigger>
        <SelectContent>
          {filiais.map((filial) => (
            <SelectItem key={filial.id} value={filial.id}>
              {filial.name} ({filial.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ empresaId: "", filialId: "" })}
        >
          Limpar filtro
        </Button>
      )}
    </div>
  )
}
