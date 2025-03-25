"use client"

import { useState } from "react"
import type { Field } from "@/lib/form-types"
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
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { sendEmail } from "@/lib/mail/email-utils"
import { mockEmailRespostaFormulario } from "@/lib/mail/html-mock"

interface FormResponseComponentProps {
  formId: string
  fields: Field[]
}

export function FormResponseComponent({ formId, fields }: FormResponseComponentProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()
  const {data: form} = api.form.getById.useQuery({id: formId})
  const user = api.user.me.useQuery()
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
        if (field.maxLength) schema = schema.max(field.maxLength, `Deve ter no máximo ${field.maxLength} caracteres`)
        if (!field.required) schema = schema.optional()
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
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  const submitResponse = api.formResponse.create.useMutation({
    onSuccess: async () => {
      toast.success("Resposta enviada com sucesso!")
      setIsSubmitted(true)
      if(form && user.data){
        await sendEmail(form.user?.email??'', `Resposta ao formulário "${form.title}"`, mockEmailRespostaFormulario(
          form.user?.firstName??'',
          formId,
          form.title
        ))
      }
    },
    onError: (error) => {
      toast.error(`Erro ao enviar resposta: ${error.message}`)
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

    submitResponse.mutate({
      formId,
      responses: [processedData],
    })


  }

  // Função para renderizar mensagens de erro
  const renderError = (fieldName: string) => {
    const error = errors[fieldName]
    return error ? <p className="text-sm font-medium text-destructive mt-1">{JSON.stringify(error.message)}</p> : null
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <Alert className="bg-success/10 border-success">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle>Resposta enviada com sucesso!</AlertTitle>
          <AlertDescription>Sua resposta foi registrada. Obrigado por participar.</AlertDescription>
        </Alert>

        <div className="flex justify-between md:flex-row flex-col gap-y-2">
          <Button variant="outline" onClick={() => router.push("/forms")}>
            Voltar para formulários
          </Button>
          <Button
            onClick={() => {
              setIsSubmitted(false)
              router.refresh()
            }}
          >
            Responder novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              {...register(field.name, { valueAsNumber: true })}
            />
          )}

          {field.type === "checkbox" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                onCheckedChange={(checked) => {
                  setValue(field.name, checked as boolean)
                }}
                {...register(field.name)}
              />
              <label
                htmlFor={field.name}
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={field.placeholder ?? "Selecione uma opção"} />
              </SelectTrigger>
              <SelectContent>
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
              className="cursor-pointer"
              onChange={(e) => {
                setValue(field.name, field.multipleFiles ? e.target.files : (e.target.files?.[0] ?? null))
              }}
            />
          )}

          {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}

          {renderError(field.name)}
        </div>
      ))}

      <Button type="submit" className="mt-6" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar Resposta"}
      </Button>
    </form>
  )
}

