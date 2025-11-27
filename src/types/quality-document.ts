import type { RouterOutputs } from "@/trpc/react"

export type QualityDocument = RouterOutputs["qualityDocument"]["getById"]
export type QualityDocumentListItem = RouterOutputs["qualityDocument"]["list"]["items"][number]

export interface QualityDocumentForForm {
  docName: string
  docDesc: string
  docURL: string | null
  docLink: string | null
  docProcess: string
  docCod: string
  docLastEdit: Date | string
  docTypeArc: string
  docResponsibleId: string | null
  docApprovedManagerId: string | null
  docRevPeriod: "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL"
  docAvailability: string
}

export type QualityDocumentWithRelations = QualityDocument

export const enumTypeLabels = {
  PROCESS: "Processo",
  FILE_TYPE: "Tipo de Arquivo",
  DEPARTMENT: "Departamento",
  ENTERPRISE: "Empresa",
}


export type EnumType = "PROCESS" | "FILE_TYPE" | "DEPARTMENT" | "ENTERPRISE"
export type QualityEnumListItem = RouterOutputs["qualityEnum"]["list"][number]

export interface EnumFormData {
  type: EnumType
  name: string
  description: string
  active: boolean
}

export interface UpdateEnumFormData {
  id: string
  name?: string
  description?: string
  active?: boolean
}

export type EnumSubmitData = EnumFormData | UpdateEnumFormData


export type QualityDocumentFromAPI = RouterOutputs["qualityDocument"]["getById"]

export interface QualityDocumentFormProps {
  documentId?: string
  onSuccess: () => void
  onCancel: () => void
}