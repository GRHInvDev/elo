import { v4 as uuidv4 } from "uuid"

export type FieldType = "text" | "number" | "checkbox" | "formatted" | "combobox" | "file" | "textarea"

export type FormattedType = "cpf" | "cnpj" | "phone" | "email"

export interface FieldOption {
  label: string
  value: string
}

export interface BaseField {
  id: string
  type: FieldType
  name: string
  label: string
  placeholder?: string
  required?: boolean
  helpText?: string
  showInResponses?: boolean // Se true, o campo será exibido na página /[id]/responses
}

export interface TextField extends BaseField {
  type: "text"
  minLength?: number
  maxLength?: number
}

export interface NumberField extends BaseField {
  type: "number"
  min?: number
  max?: number
  step?: number
}

export interface CheckboxField extends BaseField {
  type: "checkbox"
}

export interface FormattedField extends BaseField {
  type: "formatted"
  formattedType?: FormattedType
}

export interface ComboboxField extends BaseField {
  type: "combobox"
  options?: FieldOption[]
  multiple?: boolean
}

export interface FileField extends BaseField {
  type: "file"
  acceptedFileTypes?: string
  maxFileSize?: number
  multipleFiles?: boolean
}

export interface TextareaField extends BaseField {
  type: "textarea"
  rows?: number
  maxLength?: number
}

export type Field = TextField | NumberField | CheckboxField | FormattedField | ComboboxField | FileField | TextareaField

export function getFieldTypeLabel(type: FieldType): string {
  switch (type) {
    case "text":
      return "Texto"
    case "number":
      return "Número"
    case "checkbox":
      return "Checkbox"
    case "formatted":
      return "Texto Formatado"
    case "combobox":
      return "Combobox"
    case "file":
      return "Arquivo"
    case "textarea":
      return "Texto Longo"
    default:
      return type
  }
}

export function createDefaultField(type: FieldType): Field {
  const id = uuidv4()
  const name = `field_${id.substring(0, 8)}`

  const baseField: BaseField = {
    id,
    type,
    name,
    label: getFieldTypeLabel(type),
  }

  switch (type) {
    case "text":
      return {
        ...baseField,
        type: "text",
      }
    case "number":
      return {
        ...baseField,
        type: "number",
      }
    case "checkbox":
      return {
        ...baseField,
        type: "checkbox",
      }
    case "formatted":
      return {
        ...baseField,
        type: "formatted",
        formattedType: "cpf",
      }
    case "combobox":
      return {
        ...baseField,
        type: "combobox",
        options: [
          { label: "Opção 1", value: "option1" },
          { label: "Opção 2", value: "option2" },
        ],
      }
    case "file":
      return {
        ...baseField,
        type: "file",
        acceptedFileTypes: ".pdf,.jpg,.png",
      }
    case "textarea":
      return {
        ...baseField,
        type: "textarea",
        rows: 3,
      }
    default:
      return {
        ...baseField,
        type: "text",
      }
  }
}

