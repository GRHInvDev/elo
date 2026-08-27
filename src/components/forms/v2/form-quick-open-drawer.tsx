"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, Clock, Eye, FileText, Send, X, ArrowRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import type { Field } from "@/lib/form-types"
import { getSectorVisualInfo } from "@/lib/form-icons"
import { api } from "@/trpc/react"

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
  const { data: sectorConfigs } = api.setores.getSectorConfigs.useQuery()
  const { icon: IconComponent, color: sectorColor } = getSectorVisualInfo(form?.sector, sectorConfigs)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px] border-l border-border/70 bg-card/95 backdrop-blur-xl shadow-xl"
      >
        {form && (
          <>
            <div className="flex items-start gap-3.5 border-b border-border/60 px-6 pb-5 pt-6 bg-muted/20">
              <div
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-xs"
                style={{
                  backgroundColor: `${sectorColor}18`,
                  borderColor: `${sectorColor}40`,
                  color: sectorColor,
                }}
              >
                <IconComponent className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 border shadow-2xs"
                    style={{
                      backgroundColor: `${sectorColor}15`,
                      borderColor: `${sectorColor}40`,
                      color: sectorColor,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block shrink-0 shadow-xs"
                      style={{ backgroundColor: sectorColor }}
                    />
                    {form.sector}
                  </Badge>
                </div>
                <SheetTitle className="mt-1.5 text-base font-bold leading-snug tracking-tight text-foreground">
                  {form.title}
                </SheetTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 -mr-1 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => onOpenChange(false)}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <SheetDescription className="text-sm leading-relaxed text-muted-foreground">
                {form.description ?? "Este tipo de solicitação não possui descrição detalhada."}
              </SheetDescription>

              <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-border/50 bg-background/50 p-3.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Setor de Destino
                  </span>
                  <strong className="text-xs font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    {form.sector}
                  </strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Estrutura
                  </span>
                  <strong className="text-xs font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    {form.fieldsCount} {form.fieldsCount === 1 ? "campo" : "campos"}
                  </strong>
                </div>
                <div className="col-span-2 flex flex-col gap-0.5 pt-2 border-t border-border/30">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Acompanhamento
                  </span>
                  <strong className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Notificações e chat disponíveis após o envio
                  </strong>
                </div>
              </div>

              <div>
                <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3 text-primary" />
                  Campos a Preencher
                </div>
                <div className="flex flex-col gap-2.5">
                  {(fieldsPreview ?? []).slice(0, 6).map((field, i) => (
                    <div key={`${field.id ?? i}`} className="flex flex-col gap-1 rounded-xl border border-border/40 bg-muted/20 p-2.5">
                      <div className="flex items-center justify-between text-xs font-medium text-foreground">
                        <span>{field.label ?? field.name ?? `Campo ${i + 1}`}</span>
                        {field.required ? (
                          <Badge variant="outline" className="text-[9px] py-0 border-primary/30 text-primary">
                            obrigatório
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">opcional</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {!fieldsPreview?.length && form.fieldsCount > 0 && (
                    <div className="space-y-2">
                      {Array.from({ length: Math.min(form.fieldsCount, 4) }).map((_, i) => (
                        <div key={i} className="h-9 rounded-xl border border-border/40 bg-muted/20 animate-pulse" />
                      ))}
                    </div>
                  )}
                  {(fieldsPreview?.length ?? 0) > 6 && (
                    <span className="text-xs text-muted-foreground font-medium text-center pt-1">
                      + {(fieldsPreview?.length ?? 0) - 6} outros campos no formulário completo
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-border/60 px-6 py-4 bg-muted/20">
              <Link href={`/forms/${form.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-border/60 text-xs font-semibold gap-1.5"
                  title="Ver detalhes, histórico de respostas e gerenciar formulário"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Gerenciar</span>
                </Button>
              </Link>
              <Link href={`/forms/${form.id}/respond`} className="flex-1">
                <Button
                  size="sm"
                  className="w-full rounded-xl font-semibold gap-2 shadow-sm text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  Preencher Formulário
                  <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

