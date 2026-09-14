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
import { downloadBase64File, XLSX_MIME } from "@/lib/download-file"
import type { Field } from "@/lib/form-types"
import { Download, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FormResponsesExportDialogProps {
  formId: string
  formTitle: string
  fields: Field[]
}

export function FormResponsesExportDialog({ formId, formTitle, fields }: FormResponsesExportDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [groupByUser, setGroupByUser] = useState(false)

  const exportableFields = useMemo(
    () => fields.filter((f) => f.type !== "file"),
    [fields],
  )

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(exportableFields.map((f) => f.id)))
      setGroupByUser(false)
    }
  }, [open, exportableFields])

  const exportMutation = api.formResponse.exportSpreadsheetXlsx.useMutation({
    onSuccess: (data) => {
      downloadBase64File(data.xlsxBase64, data.filename, XLSX_MIME)
      if (data.truncated) {
        toast({
          title: "Exportação limitada",
          description: `Foram incluídas no máximo ${data.rowCount} linhas. Refine o período se precisar de outro recorte.`,
        })
      } else {
        toast({
          title: "Planilha gerada",
          description: `${data.rowCount} linha(s) exportada(s).`,
        })
      }
      setOpen(false)
    },
    onError: (err) => {
      toast({
        title: "Não foi possível exportar",
        description: err.message,
        variant: "destructive",
      })
    },
  })

  const exportByUserMutation = api.formResponse.exportByUserXlsx.useMutation({
    onSuccess: (data) => {
      downloadBase64File(data.xlsxBase64, data.filename, XLSX_MIME)
      if (data.truncated) {
        toast({
          title: "Exportação limitada",
          description: `Foram incluídas no máximo ${data.rowCount} linhas. Refine o período para outro recorte.`,
        })
      } else {
        toast({
          title: "Planilha gerada",
          description: `${data.rowCount} linha(s) exportada(s), organizada(s) por usuário.`,
        })
      }
      setOpen(false)
    },
    onError: (err) => {
      toast({
        title: "Não foi possível exportar",
        description: err.message,
        variant: "destructive",
      })
    },
  })

  const isPending = exportMutation.isPending || exportByUserMutation.isPending

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
      toast({
        title: "Atenção",
        description: "Selecione ao menos um campo",
        variant: "destructive",
      })
      return
    }
    if (startDate && endDate && startDate > endDate) {
      toast({
        title: "Atenção",
        description: "A data inicial não pode ser posterior à data final",
        variant: "destructive",
      })
      return
    }

    const mutation = groupByUser ? exportByUserMutation : exportMutation
    mutation.mutate({
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
          <DialogTitle>Exportar respostas (XLSX)</DialogTitle>
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

          <div className="flex items-start space-x-2.5 rounded-xl border border-border/70 bg-muted/30 p-3">
            <Checkbox
              id="export-group-by-user"
              checked={groupByUser}
              onCheckedChange={(checked) => setGroupByUser(checked === true)}
              className="mt-0.5"
            />
            <div className="grid gap-1 leading-none cursor-pointer" onClick={() => setGroupByUser((v) => !v)}>
              <Label htmlFor="export-group-by-user" className="text-xs font-semibold cursor-pointer">
                Organizar planilha por usuário
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Agrupa as respostas por solicitante e inclui a contagem total de envios de cada um no período.
              </p>
            </div>
          </div>

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
                Campos de arquivo não entram na planilha; abra o detalhe de cada resposta para ver anexos.
              </p>
            )}
            <ScrollArea className="h-[200px] rounded-md border p-3">
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
          <Button type="button" onClick={handleExport} disabled={isPending || selectedIds.size === 0}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar XLSX
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
