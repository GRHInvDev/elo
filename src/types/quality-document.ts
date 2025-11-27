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

