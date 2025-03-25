import { z } from "zod"
import type { Field, FieldType } from "./form-types"

// Tipo para representar o schema de um campo específico
export type FieldSchema<T extends FieldType> = 
  T extends "text" ? z.ZodString :
  T extends "number" ? z.ZodNumber :
  T extends "checkbox" ? z.ZodBoolean :
  T extends "formatted" ? z.ZodString :
  T extends "combobox" ? (z.ZodString | z.ZodArray<z.ZodString>) :
  T extends "file" ? z.ZodType<File | FileList> :
  T extends "textarea" ? z.ZodString :
  never;

// Tipo para representar o schema completo do formulário
export type FormSchema = z.ZodObject<Record<string, z.ZodTypeAny>>;

export function generateFormSchema(fields: Field[]): FormSchema {
  const schemaFields: Record<string, z.ZodTypeAny> = {}

  fields.forEach((field) => {
    let fieldSchema;

    switch (field.type) {
      case "text":
        fieldSchema = z.string()

        if (field.minLength) {
          fieldSchema = fieldSchema.min(field.minLength, {
            message: `Deve ter pelo menos ${field.minLength} caracteres`,
          })
        }

        if (field.maxLength) {
          fieldSchema = fieldSchema.max(field.maxLength, {
            message: `Deve ter no máximo ${field.maxLength} caracteres`,
          })
        }
        break

      case "number":
        fieldSchema = z.coerce.number()

        if (field.min !== undefined) {
          fieldSchema = fieldSchema.min(field.min, {
            message: `Deve ser maior ou igual a ${field.min}`,
          })
        }

        if (field.max !== undefined) {
          fieldSchema = fieldSchema.max(field.max, {
            message: `Deve ser menor ou igual a ${field.max}`,
          })
        }
        break

      case "checkbox":
        fieldSchema = z.boolean().optional()
        break

      case "formatted":
        switch (field.formattedType) {
          case "cpf":
            fieldSchema = z
              .string()
              .refine((value) => /^\d{11}$/.test(value.replace(/\D/g, "")), { message: "CPF inválido" })
            break
          case "cnpj":
            fieldSchema = z
              .string()
              .refine((value) => /^\d{14}$/.test(value.replace(/\D/g, "")), { message: "CNPJ inválido" })
            break
          case "phone":
            fieldSchema = z.string().refine(
              (value) => {
                const digits = value.replace(/\D/g, "")
                return digits.length >= 10 && digits.length <= 11
              },
              { message: "Telefone inválido" },
            )
            break
          case "email":
            fieldSchema = z.string().email({ message: "Email inválido" })
            break
          default:
            fieldSchema = z.string()
        }
        break

      case "combobox":
        if (field.multiple) {
          fieldSchema = z.array(z.string()).min(1, {
            message: "Selecione pelo menos uma opção",
          })
        } else {
          fieldSchema = z.string().min(1, {
            message: "Selecione uma opção",
          })
        }
        break

      case "file":
        if (field.multipleFiles) {
          // Tipo específico para FileList
          fieldSchema = z.custom<FileList>((val) => {
            return val instanceof FileList
          }, { message: "Arquivo inválido" })
        } else {
          // Tipo específico para File
          fieldSchema = z.custom<File>((val) => {
            return val instanceof File
          }, { message: "Arquivo inválido" })
        }
        break

      case "textarea":
        fieldSchema = z.string()

        if (field.maxLength) {
          fieldSchema = fieldSchema
        }
        break

      default:
        fieldSchema = z.string()
    }

    // Adicionar required se necessário
    if (field.required) {
      if (field.type === "checkbox") {
        fieldSchema = z.boolean().refine((val) => val === true, {
          message: "Este campo é obrigatório",
        })
      } else if (field.type !== "file") {
        // Para arquivos, a validação de required é mais complexa
        fieldSchema = fieldSchema
      }
    } else {
      if (field.type !== "checkbox" && field.type !== "file") {
        fieldSchema = fieldSchema.optional()
      }
    }

    schemaFields[field.name] = fieldSchema
  })

  return z.object(schemaFields)
}
