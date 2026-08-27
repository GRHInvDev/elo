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
import { toast } from "sonner"
import { CheckCircle2, Send, Lock, RefreshCw, FileText } from "lucide-react"
// Email de criação de solicitação agora é enviado no router (form-response.ts)
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Field } from "@/lib/form-types"

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
  isSubmitting: customIsSubmitting
}: FormResponseComponentProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [createdInfo, setCreatedInfo] = useState<{ id: string; number?: number | null } | null>(null)
  /** Incrementado ao limpar o formulário para remontar Select/arquivo (defaultValue não segue reset). */
  const [formResetKey, setFormResetKey] = useState(0)
  const router = useRouter()
  // Criar um schema Zod dinâmico baseado nos campos
  const schemaObj: Record<string, z.ZodTypeAny> = {}
  fields.forEach((field) => {
    let schema;

    switch (field.type) {
      case "text":
        schema = z.string()
        if (field.required) schema = schema.min(1, "Este campo é obrigatório")
        if (field.minLength) schema = schema.min(field.minLength, `Deve ter pelo menos ${field.minLength} caracteres`)
        if (field.maxLength) schema = schema.max(field.maxLength, `Deve ter no máximo ${field.maxLength} caracteres`)
        if (!field.required) schema = schema.optional()
        break
      case "number":
        schema = z.coerce.number()
        if (field.min !== undefined) schema = schema.min(field.min, `Deve ser maior ou igual a ${field.min}`)
        if (field.max !== undefined) schema = schema.max(field.max, `Deve ser menor ou igual a ${field.max}`)
        if (!field.required) schema = schema.optional()
        break
      case "checkbox":
        schema = z.boolean().optional()
        if (field.required) schema = z.boolean().refine((val) => val === true, "Este campo é obrigatório")
        break
      case "formatted":
        schema = z.string()
        if (field.required) schema = schema.min(1, "Este campo é obrigatório")
        if (!field.required) schema = schema.optional()
        break
      case "combobox":
        if (field.multiple) {
          schema = z.array(z.string())
          if (field.required) schema = schema.min(1, "Selecione pelo menos uma opção")
          if (!field.required) schema = schema.optional()
        } else {
          schema = z.string()
          if (field.required) schema = schema.min(1, "Selecione uma opção")
          if (!field.required) schema = schema.optional()
        }
        break
      case "file":
        if (field.multipleFiles) {
          schema = z.custom<FileList>((val) => val instanceof FileList, { message: "Arquivo inválido" })
        } else {
          schema = z.custom<File>((val) => val instanceof File, { message: "Arquivo inválido" })
        }
        if (!field.required) schema = schema.optional().nullable()
        break
      case "textarea":
        schema = z.string()
        if (field.required) schema = schema.min(1, "Este campo é obrigatório")
        if (field.minLength) schema = schema.min(field.minLength, `Deve ter pelo menos ${field.minLength} caracteres`)
        if (field.maxLength) schema = schema.max(field.maxLength, `Deve ter no máximo ${field.maxLength} caracteres`)
        if (!field.required) schema = schema.optional()
        break
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
      toast.success("Solicitação enviada com sucesso!")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Converter File e FileList para representação legível
    const processedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (value instanceof File) {
          return [key, { name: value.name, type: value.type, size: value.size }]
        } else if (value instanceof FileList) {
          return [key, Array.from(value).map((file) => ({ name: file.name, type: file.type, size: file.size }))]
        }
        return [key, value]
      }),
    )

    if (isEditing && customOnSubmit) {
      customOnSubmit(processedData)
    } else {
      submitResponse.mutate({
        formId,
        responses: [processedData],
      })
    }
  }

  // Função para renderizar mensagens de erro
  const renderError = (fieldName: string) => {
    const error = errors[fieldName]
    return error ? <p className="text-xs font-medium text-destructive mt-1">{JSON.stringify(error.message)}</p> : null
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
                onCheckedChange={(checked) => {
                  setValue(field.name, checked as boolean)
                }}
                {...register(field.name)}
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
        disabled={customIsSubmitting ?? isSubmitting}
      >
        {!isEditing && customIsSubmitting === undefined && (
          <Send className="h-3.5 w-3.5" />
        )}
        {customIsSubmitting !== undefined
          ? (customIsSubmitting ? "Salvando..." : "Salvar Alterações")
          : (isSubmitting ? "Enviando..." : (isEditing ? "Salvar Alterações" : "Enviar solicitação"))
        }
      </Button>
    </form>
  )
}

