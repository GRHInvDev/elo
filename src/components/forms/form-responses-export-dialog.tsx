"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DateRangePicker } from "@/components/forms/date-range-picker"
import { api } from "@/trpc/react"
import type { Field } from "@/lib/form-types"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface FormResponsesExportDialogProps {
  formId: string
  formTitle: string
  fields: Field[]
}

export function FormResponsesExportDialog({ formId, formTitle, fields }: FormResponsesExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const exportableFields = useMemo(
    () => fields.filter((f) => f.type !== "file"),
    [fields],
  )

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(exportableFields.map((f) => f.id)))
    }
  }, [open, exportableFields])

  const exportMutation = api.formResponse.exportSpreadsheetCsv.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = data.filename
      a.click()
      URL.revokeObjectURL(url)
      if (data.truncated) {
        toast.warning("Exportação limitada", {
          description: `Foram incluídas no máximo ${data.rowCount} linhas. Refine o período se precisar de outro recorte.`,
        })
      } else {
        toast.success("Planilha gerada", { description: `${data.rowCount} linha(s) exportada(s).` })
      }
      setOpen(false)
    },
    onError: (err) => {
      toast.error("Não foi possível exportar", { description: err.message })
    },
  })

  const toggleField = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(exportableFields.map((f) => f.id)))
  const clearAll = () => setSelectedIds(new Set())

  const handleExport = () => {
    if (selectedIds.size === 0) {
      toast.error("Selecione ao menos um campo")
      return
    }
    if (startDate && endDate && startDate > endDate) {
      toast.error("A data inicial não pode ser posterior à data final")
      return
    }
    exportMutation.mutate({
      formId,
      fieldIds: [...selectedIds],
      startDate,
      endDate,
    })
  }

  if (exportableFields.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Exportar respostas (CSV)</DialogTitle>
          <DialogDescription>
            Escolha o período (opcional) e os campos do formulário &quot;{formTitle}&quot;. Sempre incluímos número,
            data, status e dados do respondente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Campos do formulário</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={selectAll}>
                  Todos
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={clearAll}>
                  Limpar
                </Button>
              </div>
            </div>
            {fields.some((f) => f.type === "file") && (
              <p className="text-xs text-muted-foreground">
                Campos de arquivo não entram no CSV; abra o detalhe de cada resposta para ver anexos.
              </p>
            )}
            <ScrollArea className="h-[220px] rounded-md border p-3">
              <div className="space-y-3 pr-3">
                {exportableFields.map((field) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`export-field-${field.id}`}
                      checked={selectedIds.has(field.id)}
                      onCheckedChange={(c) => toggleField(field.id, c === true)}
                    />
                    <Label htmlFor={`export-field-${field.id}`} className="cursor-pointer font-normal leading-snug">
                      {field.label}
                      <span className="ml-1 text-xs text-muted-foreground">({field.type})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleExport} disabled={exportMutation.isPending || selectedIds.size === 0}>
            {exportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
