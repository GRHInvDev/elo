import { z } from "zod"
import { Enterprise } from "@prisma/client"

export const DocRevPeriodEnum = z.enum(["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"])

export const createQualityDocumentSchema = z.object({
  docName: z.string().min(1, "Nome do documento é obrigatório"),
  docDesc: z.string().min(1, "Descrição é obrigatória"),
  docURL: z.string().url("URL inválida").optional().or(z.literal("")),
  docLink: z.string().url("Link inválido").optional().or(z.literal("")),
  docProcess: z.string().min(1, "Processo é obrigatório"),
  docCod: z.string().min(1, "Código é obrigatório"),
  docLastEdit: z.date(),
  docTypeArc: z.string().min(1, "Tipo de arquivo é obrigatório"),
  docResponsibleId: z.string().optional(),
  docApprovedManagerId: z.string().optional(),
  docRevPeriod: DocRevPeriodEnum,
  docAvailability: z.string().optional(),
})

export const updateQualityDocumentSchema = createQualityDocumentSchema.extend({
  id: z.string().cuid("ID inválido"),
})

export const qualityDocumentIdSchema = z.object({
  id: z.string().cuid("ID inválido"),
})

export const listQualityDocumentsSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  enterprise: z.nativeEnum(Enterprise).optional(),
  setor: z.string().optional(),
  docLastEditFrom: z.date().optional(),
  docLastEditTo: z.date().optional(),
  docResponsibleId: z.string().optional(),
  search: z.string().optional(),
  searchColumn: z.enum([
    "docName",
    "docDesc",
    "docProcess",
    "docCod",
    "docTypeArc",
    "docAvailability",
  ]).optional(),
})

// Schema para formulário (aceita string para data)
export const qualityDocumentFormSchema = z.object({
  docName: z.string().min(1, "Nome do documento é obrigatório"),
  docDesc: z.string().min(1, "Descrição é obrigatória"),
  docURL: z.string().url("URL inválida").optional().or(z.literal("")),
  docLink: z.string().url("Link inválido").optional().or(z.literal("")),
  docProcess: z.string().min(1, "Processo é obrigatório"),
  docCod: z.string().min(1, "Código é obrigatório"),
  docLastEdit: z.string().min(1, "Data da última revisão é obrigatória"),
  docTypeArc: z.string().min(1, "Tipo de arquivo é obrigatório"),
  docResponsibleId: z.string().optional(),
  docApprovedManagerId: z.string().optional(),
  docRevPeriod: DocRevPeriodEnum,
  docAvailability: z.string().optional(),
})

// Tipos inferidos
export type CreateQualityDocumentInput = z.infer<typeof createQualityDocumentSchema>
export type UpdateQualityDocumentInput = z.infer<typeof updateQualityDocumentSchema>
export type QualityDocumentIdInput = z.infer<typeof qualityDocumentIdSchema>
export type ListQualityDocumentsInput = z.infer<typeof listQualityDocumentsSchema>
export type QualityDocumentFormInput = z.infer<typeof qualityDocumentFormSchema>

