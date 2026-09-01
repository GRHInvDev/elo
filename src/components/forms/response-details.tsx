"use client"

import React, { useState } from "react"
import type { Field } from "@/lib/form-types"
import { Download, ExternalLink, FileIcon, FileText, Image as ImageIcon, FileSpreadsheet, FileArchive, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ResponseDetailsProps {
  responseData: Record<string, unknown>[]
  formFields: Field[]
}

interface FileMetadata {
  name?: string
  url?: string
  size?: number
  type?: string
  key?: string
}

function getFileIcon(type?: string, name?: string) {
  const fileName = (name ?? "").toLowerCase()
  const mime = (type ?? "").toLowerCase()

  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName)) {
    return <ImageIcon className="h-4 w-4 text-emerald-500 shrink-0" />
  }
  if (mime.includes("pdf") || fileName.endsWith(".pdf")) {
    return <FileText className="h-4 w-4 text-rose-500 shrink-0" />
  }
  if (mime.includes("sheet") || mime.includes("excel") || /\.(xlsx?|csv)$/i.test(fileName)) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
  }
  if (mime.includes("zip") || mime.includes("rar") || /\.(zip|rar|7z|tar|gz)$/i.test(fileName)) {
    return <FileArchive className="h-4 w-4 text-amber-500 shrink-0" />
  }
  return <FileIcon className="h-4 w-4 text-primary shrink-0" />
}

function formatSize(bytes?: number) {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes) || bytes === 0) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatCleanValue(val: unknown): string {
  if (val === undefined || val === null) return ""
  if (typeof val === "string") {
    let cleaned = val.trim()
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      try {
        const parsed: unknown = JSON.parse(cleaned)
        if (typeof parsed === "string") return parsed
      } catch {
        cleaned = cleaned.slice(1, -1)
      }
    }
    return cleaned
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val)
  }
  if (Array.isArray(val)) {
    return val.map((v) => formatCleanValue(v)).filter(Boolean).join(", ")
  }
  try {
    return JSON.stringify(val)
  } catch {
    return ""
  }
}

function triggerDownload(url?: string, name?: string) {
  if (!url) return

  if (url.startsWith("data:")) {
    const a = document.createElement("a")
    a.href = url
    a.download = name ?? "arquivo"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return
  }

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Erro na rede")
      return res.blob()
    })
    .then((blob) => {
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = name ?? "arquivo"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    })
    .catch(() => {
      const a = document.createElement("a")
      a.href = url
      a.download = name ?? "arquivo"
      a.target = "_blank"
      a.rel = "noopener noreferrer"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    })
}

function AttachmentCard({ file, onPreviewImage }: { file: FileMetadata; onPreviewImage?: (url: string, name: string) => void }) {
  const name = file.name ?? "Arquivo anexado"
  const url = file.url
  const size = formatSize(file.size)
  const isImage = (file.type?.startsWith("image/") ?? false) || /\.(png|jpe?g|webp|gif|svg)$/i.test(name)

  const handleOpen = () => {
    if (!url) return
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-background/80 p-2.5 shadow-2xs transition-all hover:border-primary/40 hover:bg-background">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/70 border border-border/60">
          {getFileIcon(file.type, name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground" title={name}>
            {name}
          </p>
          {size && <span className="text-[10.5px] text-muted-foreground font-mono">{size}</span>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {url ? (
          <>
            {isImage && onPreviewImage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-[11px] font-medium gap-1 rounded-lg hover:bg-primary/10 hover:text-primary cursor-pointer"
                onClick={() => onPreviewImage(url, name)}
                title="Pré-visualizar imagem"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Visualizar</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpen}
              className="h-8 px-2.5 rounded-lg border border-border/70 bg-background text-[11px] font-semibold text-foreground shadow-2xs hover:bg-muted transition-colors gap-1 cursor-pointer"
              title="Abrir arquivo em nova aba"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Abrir</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => triggerDownload(url, name)}
              className="h-8 px-2.5 rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-colors gap-1 cursor-pointer"
              title="Baixar arquivo"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Baixar</span>
            </Button>
          </>
        ) : (
          <span className="text-[11px] italic text-muted-foreground">
            Anexado no envio (sem URL)
          </span>
        )}
      </div>
    </div>
  )
}

export function ResponseDetails({ responseData, formFields }: ResponseDetailsProps) {
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null)
  const responseObj = responseData[0]
  const fieldsToShow = formFields

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

  const renderValue = (fieldName: string, fieldType: string, value: unknown) => {
    if (value === undefined || value === null || value === "") {
      return <span className="text-muted-foreground italic">Não respondido</span>
    }

    switch (fieldType) {
      case "checkbox": {
        if (
          value === true ||
          value === "true" ||
          value === "Sim" ||
          value === "sim" ||
          value === "1" ||
          value === 1 ||
          value === "on"
        ) {
          return "Sim"
        }
        return "Não"
      }

      case "combobox": {
        if (Array.isArray(value)) {
          const list = value.map((v) => formatCleanValue(v)).filter(Boolean)
          return list.length > 0 ? list.join(", ") : <span className="text-muted-foreground italic">Não respondido</span>
        }
        return formatCleanValue(value)
      }

      case "file": {
        const files: FileMetadata[] = []

        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === "object") {
              files.push(item as FileMetadata)
            } else if (typeof item === "string") {
              files.push({ name: item.split("/").pop() ?? "Arquivo", url: item })
            }
          }
        } else if (value && typeof value === "object") {
          files.push(value)
        } else if (typeof value === "string") {
          if (value.startsWith("http") || value.startsWith("/") || value.startsWith("data:")) {
            files.push({ name: value.split("/").pop() ?? "Arquivo", url: value })
          } else {
            return formatCleanValue(value)
          }
        }

        if (files.length === 0) {
          return <span className="text-muted-foreground italic">Nenhum arquivo anexado</span>
        }

        return (
          <div className="space-y-2 pt-1">
            {files.map((file, idx) => (
              <AttachmentCard
                key={idx}
                file={file}
                onPreviewImage={(url, name) => setPreviewImage({ url, name })}
              />
            ))}
          </div>
        )
      }

      case "textarea":
      case "text":
      case "dynamic":
      case "formatted": {
        const clean = formatCleanValue(value)
        return renderTextWithLineBreaks(clean)
      }

      default: {
        const clean = formatCleanValue(value)
        if (clean.includes("\n")) {
          return renderTextWithLineBreaks(clean)
        }
        return clean
      }
    }
  }

  if (fieldsToShow.length === 0) {
    return <p className="text-muted-foreground text-xs">Nenhum campo marcado para exibição em respostas.</p>
  }

  return (
    <div className="space-y-3">
      {fieldsToShow.map((field) => {
        const value = responseObj?.[field.name]

        return (
          <div
            key={field.id}
            className="rounded-xl border border-border/70 bg-card/60 dark:bg-card/40 p-3.5 space-y-1.5 shadow-2xs transition-colors"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {field.label}
            </span>
            <div className="text-xs sm:text-sm text-foreground font-medium break-words leading-relaxed">
              {renderValue(field.name, field.type, value)}
            </div>
          </div>
        )
      })}

      {/* Modal de Prévia de Imagem */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl p-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold truncate">
                {previewImage.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-2 max-h-[75vh] overflow-hidden rounded-lg bg-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[70vh] max-w-full object-contain rounded-md shadow-sm"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
