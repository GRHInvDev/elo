"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, Clock, FileText, Send, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { Field } from "@/lib/form-types"

export interface CatalogForm {
  id: string
  title: string
  description: string | null
  sector: string
  fieldsCount: number
}

interface FormQuickOpenDrawerProps {
  form: CatalogForm | null
  onOpenChange: (open: boolean) => void
  fieldsPreview?: Field[]
}

export function FormQuickOpenDrawer({ form, onOpenChange, fieldsPreview }: FormQuickOpenDrawerProps) {
  const open = !!form
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[460px]"
      >
        {form && (
          <>
            <div className="flex items-start gap-3 border-b border-[hsl(var(--v2-border-soft))] px-6 pb-5 pt-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--brand-accent)/.2)] bg-[hsl(var(--brand-accent)/.1)] text-[hsl(var(--brand-accent))]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base font-semibold leading-snug">
                  {form.title}
                </SheetTitle>
                <div className="mt-1 flex items-center gap-2 text-xs text-[hsl(var(--v2-faint))]">
                  <span className="truncate">{form.sector}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-current opacity-60" />
                  <span>{form.fieldsCount} campos</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 -mr-1"
                onClick={() => onOpenChange(false)}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <SheetDescription className="text-sm leading-relaxed text-muted-foreground">
                {form.description ?? "Este tipo de solicitação não possui descrição cadastrada."}
              </SheetDescription>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2)/.7)] p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--v2-faint))]">
                    Setor responsável
                  </span>
                  <strong className="text-sm font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[hsl(var(--v2-faint))]" />
                      {form.sector}
                    </span>
                  </strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--v2-faint))]">
                    Campos
                  </span>
                  <strong className="text-sm font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-[hsl(var(--v2-faint))]" />
                      {form.fieldsCount} ao todo
                    </span>
                  </strong>
                </div>
                <div className="col-span-2 flex flex-col gap-0.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--v2-faint))]">
                    Acompanhamento
                  </span>
                  <strong className="text-sm font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[hsl(var(--v2-faint))]" />
                      Em &quot;Minhas solicitações&quot; após o envio
                    </span>
                  </strong>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Campos do formulário
              </div>
              <div className="flex flex-col gap-3">
                {(fieldsPreview ?? []).slice(0, 5).map((field, i) => (
                  <div key={`${field.id ?? i}`} className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-foreground">
                      {field.label ?? field.name ?? `Campo ${i + 1}`}
                      {field.required && <Badge variant="outline" className="ml-2 text-[9px]">obrigatório</Badge>}
                    </span>
                    <div className="h-9 rounded-md border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2))]" />
                  </div>
                ))}
                {!fieldsPreview?.length && form.fieldsCount > 0 && (
                  <>
                    {Array.from({ length: Math.min(form.fieldsCount, 5) }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div
                          className="h-2.5 rounded bg-[hsl(var(--v2-border-soft))]"
                          style={{ width: 90 + (i % 3) * 30 }}
                        />
                        <div className="h-9 rounded-md border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2))]" />
                      </div>
                    ))}
                  </>
                )}
                {(fieldsPreview?.length ?? 0) > 5 && (
                  <span className="text-xs text-[hsl(var(--v2-faint))]">
                    + {(fieldsPreview?.length ?? 0) - 5} outros campos
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-[hsl(var(--v2-border-soft))] px-6 py-4">
              <Button
                variant="ghost"
                className="flex-shrink-0"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Link href={`/forms/${form.id}/respond`} className="flex-1">
                <Button
                  className="w-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] hover:bg-[hsl(var(--brand-accent)/.9)]"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Iniciar solicitação
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
