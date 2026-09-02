"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { InputMask } from "@/components/forms/input-mask"
import { MultiSelect } from "@/components/forms/multi-select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, Send, Lock, RefreshCw, FileText, Loader2 } from "lucide-react"
// Email de criação de solicitação agora é enviado no router (form-response.ts)
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Field } from "@/lib/form-types"
import { useUploadThing } from "@/components/uploadthing"

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Valores iniciais vazios para nova solicitação (após envio ou fluxo equivalente). */
function buildEmptyFormValues(fields: Field[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const field of fields) {
    switch (field.type) {
      case "text":
      case "textarea":
      case "formatted":
        values[field.name] = ""
        break
      case "number":
        values[field.name] = undefined
        break
      case "checkbox":
        values[field.name] = false
        break
      case "combobox":
        values[field.name] = field.multiple ? [] : ""
        break
      case "file":
        values[field.name] = undefined
        break
      case "dynamic":
        values[field.name] = ""
        break
    }
  }
  return values
}

interface FormResponseComponentProps {
  formId: string
  fields: Field[]
  existingResponse?: Record<string, unknown>
  isEditing?: boolean
  onSubmit?: (data: Record<string, unknown>) => void
  isSubmitting?: boolean
}

export function FormResponseComponent({
  formId,
  fields,
  existingResponse,
  isEditing = false,
  onSubmit: customOnSubmit,
  isSubmitting: customIsSubmitting,
}: FormResponseComponentProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [createdInfo, setCreatedInfo] = useState<{ id: string; number?: number | null } | null>(null)
  /** Incrementado ao limpar o formulário para remontar Select/arquivo (defaultValue não segue reset). */
  const [formResetKey, setFormResetKey] = useState(0)
  const router = useRouter()
  // Criar um schema Zod dinâmico baseado nos campos
  const schemaObj: Record<string, z.ZodTypeAny> = {}
  fields.forEach((field) => {
    let schema: z.ZodTypeAny = z.any()

    switch (field.type) {
      case "text": {
        let s = z.string()
        if (field.required) s = s.min(1, "Este campo é obrigatório")
        if (field.minLength) s = s.min(field.minLength, `Deve ter pelo menos ${field.minLength} caracteres`)
        if (field.maxLength) s = s.max(field.maxLength, `Deve ter no máximo ${field.maxLength} caracteres`)
        schema = field.required ? s : s.optional()
        break
      }
      case "number": {
        let s = z.coerce.number()
        if (field.min !== undefined) s = s.min(field.min, `Deve ser maior ou igual a ${field.min}`)
        if (field.max !== undefined) s = s.max(field.max, `Deve ser menor ou igual a ${field.max}`)
        schema = field.required ? s : s.optional()
        break
      }
      case "checkbox":
        schema = field.required
          ? z.boolean().refine((val) => val === true, "Este campo é obrigatório")
          : z.boolean().optional()
        break
      case "formatted": {
        let s = z.string()
        if (field.required) s = s.min(1, "Este campo é obrigatório")
        schema = field.required ? s : s.optional()
        break
      }
      case "combobox":
        if (field.multiple) {
          const s = z.array(z.string())
          schema = field.required ? s.min(1, "Selecione pelo menos uma opção") : s.optional()
        } else {
          const s = z.string()
          schema = field.required ? s.min(1, "Selecione uma opção") : s.optional()
        }
        break
      case "file":
        if (field.required) {
          schema = z.any().refine((val) => {
            if (!val) return false
            if (typeof FileList !== "undefined" && val instanceof FileList) return val.length > 0
            if (Array.isArray(val)) return val.length > 0
            return true
          }, "Este campo é obrigatório")
        } else {
          schema = z.any().optional().nullable()
        }
        break
      case "textarea": {
        let s = z.string()
        if (field.required) s = s.min(1, "Este campo é obrigatório")
        if (field.minLength) s = s.min(field.minLength, `Deve ter pelo menos ${field.minLength} caracteres`)
        if (field.maxLength) s = s.max(field.maxLength, `Deve ter no máximo ${field.maxLength} caracteres`)
        schema = field.required ? s : s.optional()
        break
      }
      case "dynamic":
        schema = z.string().optional()
        break
    }

    schemaObj[field.name] = schema
  })

  const formSchema = z.object(schemaObj)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: existingResponse ?? {},
  })

  // Buscar dados do usuário para preencher campos dinâmicos
  const { data: userData } = api.user.me.useQuery()

  const fillDynamicFields = useCallback(() => {
    if (!userData) return
    for (const field of fields) {
      if (field.type !== "dynamic") continue
      if (field.dynamicType === "user_name") {
        const fullName = `${userData.firstName ?? ""} ${userData.lastName ?? ""}`.trim()
        const name = fullName.length > 0 ? fullName : (userData.email ?? "")
        setValue(field.name, name)
      } else if (field.dynamicType === "user_sector" || (field.dynamicType as string) === "user_setor") {
        setValue(field.name, userData.setor ?? "")
      }
    }
  }, [fields, userData, setValue])

  useEffect(() => {
    if (existingResponse && Object.keys(existingResponse).length > 0) return
    fillDynamicFields()
  }, [existingResponse, fillDynamicFields])

  const { toast } = useToast()
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const { startUpload } = useUploadThing("formAttachmentUploader", {
    onUploadError: (e) => {
      console.warn("UploadThing aviso:", e.message)
    },
  })

  const submitResponse = api.formResponse.create.useMutation({
    onSuccess: (data) => {
      setIsSubmitted(true)
      if (Array.isArray(data) && data[0]) {
        const first = data[0] as { id: string; number?: number | null }
        setCreatedInfo({ id: first.id, number: first.number ?? undefined })
      } else if (data && typeof data === "object" && "id" in data) {
        const item = data as { id: string; number?: number | null }
        setCreatedInfo({ id: item.id, number: item.number ?? undefined })
      }
      toast({
        title: "Sucesso",
        description: "Solicitação enviada com sucesso!",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setUploadingFiles(true)
      const processedData: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(data)) {
        if (value instanceof File) {
          let fileUrl: string | undefined
          let keyStr: string | undefined

          try {
            const res = await startUpload([value])
            if (res?.[0]) {
              fileUrl = (res[0] as { ufsUrl?: string; url?: string }).ufsUrl ?? res[0].url
              keyStr = res[0].key
            }
          } catch {
            // Se UploadThing falhar ou estiver offline, faz fallback para base64 local
          }

          fileUrl ??= await readFileAsBase64(value)

          processedData[key] = {
            name: value.name,
            url: fileUrl,
            size: value.size,
            type: value.type,
            key: keyStr,
          }
        } else if (typeof FileList !== "undefined" && value instanceof FileList) {
          const filesArray = Array.from(value)
          if (filesArray.length > 0) {
            const uploadedItems: Array<{ name: string; url: string; size: number; type: string; key?: string }> = []

            for (const file of filesArray) {
              let fileUrl: string | undefined
              let keyStr: string | undefined

              try {
                const res = await startUpload([file])
                if (res?.[0]) {
                  fileUrl = (res[0] as { ufsUrl?: string; url?: string }).ufsUrl ?? res[0].url
                  keyStr = res[0].key
                }
              } catch {
                // Fallback para base64
              }

              fileUrl ??= await readFileAsBase64(file)

              uploadedItems.push({
                name: file.name,
                url: fileUrl,
                size: file.size,
                type: file.type,
                key: keyStr,
              })
            }

            processedData[key] = uploadedItems
          } else {
            processedData[key] = []
          }
        } else if (typeof value === "string") {
          let str = value.trim()
          if (
            (str.startsWith('"') && str.endsWith('"')) ||
            (str.startsWith("'") && str.endsWith("'"))
          ) {
            try {
              const parsed: unknown = JSON.parse(str)
              if (typeof parsed === "string") str = parsed
            } catch {
              str = str.slice(1, -1)
            }
          }
          processedData[key] = str
        } else {
          processedData[key] = value
        }
      }

      if (isEditing && customOnSubmit) {
        customOnSubmit(processedData)
      } else {
        submitResponse.mutate({
          formId,
          responses: [processedData],
        })
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Erro no envio",
        description: "Ocorreu um erro ao processar os arquivos.",
        variant: "destructive",
      })
    } finally {
      setUploadingFiles(false)
    }
  }

  // Função para renderizar mensagens de erro
  const renderError = (fieldName: string) => {
    const error = errors[fieldName]
    if (!error) return null
    const message = typeof error.message === "string" ? error.message : null
    return message ? <p className="text-xs font-medium text-destructive mt-1">{message}</p> : null
  }

  if (isSubmitted && !isEditing) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-6 text-center flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-bold tracking-tight text-foreground">Solicitação Enviada!</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Seu chamado foi registrado e já está na fila de atendimento do setor responsável.
          </p>

          {createdInfo?.number != null && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary shadow-2xs">
                Chamado #{createdInfo.number}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-sm">
          <Link href="/forms/my-responses" className="w-full sm:flex-1">
            <Button className="w-full rounded-xl text-xs font-semibold gap-2 shadow-sm">
              <FileText className="h-4 w-4" />
              Minhas Solicitações
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full sm:flex-1 rounded-xl text-xs font-medium border-border/60"
            onClick={() => {
              const empty = buildEmptyFormValues(fields)
              reset(empty)
              fillDynamicFields()
              setFormResetKey((k) => k + 1)
              setIsSubmitted(false)
              setCreatedInfo(null)
              router.refresh()
            }}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Nova Solicitação
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form key={formResetKey} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.name} className="font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {field.type === "text" && (
            <Input
              id={field.name}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className="h-10 rounded-xl border-border/70 bg-background text-sm"
              {...register(field.name)}
            />
          )}

          {field.type === "number" && (
            <Input
              id={field.name}
              type="number"
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              className="h-10 rounded-xl border-border/70 bg-background text-sm"
              {...register(field.name, { valueAsNumber: true })}
            />
          )}

          {field.type === "checkbox" && (
            <div className="flex items-center space-x-2.5 rounded-xl border border-border/60 bg-background/80 p-3">
              <Checkbox
                id={field.name}
                checked={!!watch(field.name)}
                onCheckedChange={(checked) => {
                  setValue(field.name, checked === true)
                }}
              />
              <label
                htmlFor={field.name}
                className="text-xs sm:text-sm font-medium leading-none cursor-pointer select-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {field.placeholder ?? "Sim"}
              </label>
            </div>
          )}

          {field.type === "textarea" && (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              rows={field.rows ?? 3}
              maxLength={field.maxLength}
              className="rounded-xl border-border/70 bg-background text-sm"
              {...register(field.name)}
            />
          )}

          {field.type === "formatted" && (
            <InputMask
              id={field.name}
              type={field.formattedType ?? "cpf"}
              placeholder={field.placeholder}
              value={(watch(field.name) as string) ?? ""}
              onChange={(value) => setValue(field.name, value)}
            />
          )}

          {field.type === "combobox" && !field.multiple && (
            <Select onValueChange={(value) => setValue(field.name, value)} defaultValue={watch(field.name) as string}>
              <SelectTrigger id={field.name} className="h-10 rounded-xl border-border/70 bg-background text-sm">
                <SelectValue placeholder={field.placeholder ?? "Selecione uma opção"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.type === "combobox" && field.multiple && (
            <MultiSelect
              options={field.options ?? []}
              selected={(watch(field.name) as string[]) ?? []}
              onChange={(selected) => setValue(field.name, selected)}
              placeholder={field.placeholder ?? "Selecione opções"}
            />
          )}

          {field.type === "file" && (
            <Input
              id={field.name}
              type="file"
              accept={field.acceptedFileTypes}
              multiple={field.multipleFiles}
              className="cursor-pointer h-10 rounded-xl border-border/70 bg-background text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              onChange={(e) => {
                setValue(field.name, field.multipleFiles ? e.target.files : (e.target.files?.[0] ?? null))
              }}
            />
          )}

          {field.type === "dynamic" && (
            <div className="rounded-xl border border-border/60 bg-background/80 px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-semibold text-foreground">
                  {watch(field.name) ? (
                    watch(field.name)
                  ) : (
                    <span className="text-muted-foreground italic">
                      Coletando seu {field.dynamicType === "user_name" ? "nome" : "setor"}...
                    </span>
                  )}
                </p>
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <Lock className="h-3 w-3 text-primary" />
                  Preenchido automaticamente
                </span>
              </div>
              <input type="hidden" {...register(field.name)} />
            </div>
          )}

          {field.helpText && (
            <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{field.helpText}</ReactMarkdown>
            </div>
          )}

          {renderError(field.name)}
        </div>
      ))}

      <Button
        type="submit"
        className="mt-6 w-full sm:w-auto rounded-xl gap-2 font-semibold shadow-xs"
        disabled={uploadingFiles || (customIsSubmitting ?? isSubmitting)}
      >
        {uploadingFiles || customIsSubmitting || isSubmitting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          !isEditing && <Send className="h-3.5 w-3.5" />
        )}
        {uploadingFiles
          ? "Enviando anexos..."
          : customIsSubmitting !== undefined
            ? (customIsSubmitting ? "Salvando..." : "Salvar Alterações")
            : (isSubmitting ? "Enviando..." : (isEditing ? "Salvar Alterações" : "Enviar solicitação"))
        }
      </Button>
    </form>
  )
}
