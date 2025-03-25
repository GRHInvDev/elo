"use client"

import { useState } from "react"
import type { Field } from "@/lib/form-types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { InputMask } from "@/components/forms/input-mask"
import { MultiSelect } from "@/components/forms/multi-select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { FormSchema } from "@/lib/form-schema"

interface FormPreviewProps {
  title: string
  setTitle?: (title: string) => void
  fields: Field[]
  readOnly?: boolean
}

// Tipo para representar os valores do formulário
type FormValues = Record<string, string | number | boolean | string[] | File | FileList | null>

export function FormPreview({ title, fields, readOnly = false }: FormPreviewProps) {
  const [formData, setFormData] = useState<FormValues>({})

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

  const formSchema = z.object(schemaObj) as FormSchema

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setFormData(data)
    console.log("Form submitted:", data)
  }

  // Função para renderizar mensagens de erro
  const renderError = (fieldName: string) => {
    const error = errors[fieldName]
    return error ? <p className="text-sm font-medium text-destructive mt-1">{JSON.stringify(error.message)}</p> : null
  }

  if (fields.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="text-center py-10 text-muted-foreground">
          {readOnly ? "Este formulário não possui campos." : "Adicione campos ao formulário para visualizar"}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>
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
                disabled={readOnly}
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
                disabled={readOnly}
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
                  disabled={readOnly}
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
                disabled={readOnly}
              />
            )}

            {field.type === "formatted" && (
              <InputMask
                id={field.name}
                type={field.formattedType ?? "cpf"}
                placeholder={field.placeholder}
                value={(watch(field.name) as string) ?? ""}
                onChange={(value) => setValue(field.name, value)}
                disabled={readOnly}
              />
            )}

            {field.type === "combobox" && !field.multiple && (
              <Select
                onValueChange={(value) => setValue(field.name, value)}
                defaultValue={watch(field.name) as string}
                disabled={readOnly}
              >
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
                disabled={readOnly}
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
                disabled={readOnly}
              />
            )}

            {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}

            {!readOnly && renderError(field.name)}
          </div>
        ))}

        {!readOnly && (
          <Button type="submit" className="mt-6">
            Enviar
          </Button>
        )}
      </form>

      {!readOnly && Object.keys(formData).length > 0 && (
        <div className="mt-8 p-4 border rounded-md bg-muted/50">
          <h3 className="text-lg font-medium mb-2">Dados Enviados:</h3>
          <pre className="text-sm overflow-auto p-2 bg-background rounded">
            {JSON.stringify(
              Object.fromEntries(
                Object.entries(formData).map(([key, value]) => {
                  // Converter File e FileList para representação legível
                  if (value instanceof File) {
                    return [key, { name: value.name, type: value.type, size: value.size }]
                  } else if (value instanceof FileList) {
                    return [
                      key,
                      Array.from(value).map((file) => ({ name: file.name, type: file.type, size: file.size })),
                    ]
                  }
                  return [key, value]
                }),
              ),
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  )
}

