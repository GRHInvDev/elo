"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { qualityDocumentFormSchema, type QualityDocumentFormInput } from "@/schemas/quality-document.schema"
import type { QualityDocumentWithRelations, QualityDocumentForForm } from "@/types/quality-document"
import type { RouterOutputs } from "@/trpc/react"

type QualityDocumentFromAPI = RouterOutputs["qualityDocument"]["getById"]

interface QualityDocumentFormProps {
  documentId?: string
  onSuccess: () => void
  onCancel: () => void
}

// Helper para converter data para string no formato YYYY-MM-DD
const formatDateToString = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const isoString = dateObj.toISOString()
  const datePart = isoString.split("T")[0]
  if (datePart) {
    return datePart
  }
  // Fallback: usar data atual se não conseguir extrair
  const fallbackDate = new Date().toISOString().split("T")[0]
  return fallbackDate ?? ""
}

// Helper function para converter documento do router para formato do formulário
function documentToFormValues(document: QualityDocumentFromAPI): QualityDocumentFormInput {
  const doc: QualityDocumentForForm = document

  const docLastEditValue: string = doc.docLastEdit
    ? formatDateToString(doc.docLastEdit)
    : formatDateToString(new Date())

  return {
    docName: String(doc.docName ?? ""),
    docDesc: String(doc.docDesc ?? ""),
    docURL: doc.docURL ?? "",
    docLink: doc.docLink ?? "",
    docProcess: String(doc.docProcess ?? ""),
    docCod: String(doc.docCod ?? ""),
    docLastEdit: docLastEditValue,
    docTypeArc: String(doc.docTypeArc ?? ""),
    docResponsibleId: doc.docResponsibleId ?? "",
    docApprovedManagerId: doc.docApprovedManagerId ?? "",
    docRevPeriod: (doc.docRevPeriod ?? "ANUAL") as "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL",
    docAvailability: String(doc.docAvailability ?? ""),
  }
}

export function QualityDocumentForm({ documentId, onSuccess, onCancel }: QualityDocumentFormProps) {
  // Buscar documento do banco quando documentId for fornecido
  const { data: qualityDocument } = api.qualityDocument.getById.useQuery(
    { id: documentId! },
    { enabled: !!documentId }
  ) as { data: QualityDocumentFromAPI | undefined; isLoading: boolean }
  const [responsibleSearch, setResponsibleSearch] = useState("")
  const [approvedManagerSearch, setApprovedManagerSearch] = useState("")
  const [selectedResponsible, setSelectedResponsible] = useState<{
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  } | null>(null)
  const [selectedApprovedManager, setSelectedApprovedManager] = useState<{
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<QualityDocumentFormInput>({
    resolver: zodResolver(qualityDocumentFormSchema),
    defaultValues: {
      docRevPeriod: "ANUAL",
      docLastEdit: new Date().toISOString().split("T")[0],
    },
  })

  // Inicializar valores do formulário quando documento for carregado
  useEffect(() => {
    if (qualityDocument) {
      reset(documentToFormValues(qualityDocument))
    }
  }, [qualityDocument, reset])

  // Buscar usuários para seleção
  const { data: responsibleUsers, isLoading: isLoadingResponsible } = api.user.searchMinimal.useQuery(
    { query: responsibleSearch },
    { enabled: responsibleSearch.length > 2 }
  )

  const { data: approvedManagerUsers, isLoading: isLoadingApprovedManager } =
    api.user.searchMinimal.useQuery({ query: approvedManagerSearch }, { enabled: approvedManagerSearch.length > 2 })

  // Inicializar usuários selecionados se estiver editando
  useEffect(() => {
    if (!qualityDocument) {
      return
    }

    const responsible = qualityDocument.docResponsible
    if (responsible) {
      setSelectedResponsible({
        id: responsible.id,
        firstName: responsible.firstName,
        lastName: responsible.lastName,
        email: responsible.email,
      })
    }

    const approvedManager = qualityDocument.docApprovedManager
    if (approvedManager) {
      setSelectedApprovedManager({
        id: approvedManager.id,
        firstName: approvedManager.firstName,
        lastName: approvedManager.lastName,
        email: approvedManager.email,
      })
    }
  }, [qualityDocument])

  const createDocument = api.qualityDocument.create.useMutation()
  const updateDocument = api.qualityDocument.update.useMutation()

  const onSubmit = async (data: QualityDocumentFormInput) => {
    try {
      const submitData = {
        ...data,
        docLastEdit: new Date(data.docLastEdit),
        docURL: data.docURL || undefined,
        docLink: data.docLink || undefined,
        docResponsibleId: selectedResponsible?.id || undefined,
        docApprovedManagerId: selectedApprovedManager?.id || undefined,
      }

      if (qualityDocument) {
        await updateDocument.mutateAsync({
          id: qualityDocument.id,
          ...submitData,
        })
        toast.success("Documento atualizado com sucesso!")
      } else {
        await createDocument.mutateAsync(submitData)
        toast.success("Documento criado com sucesso!")
      }

      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar documento")
    }
  }

  const formatUserName = (user: { firstName: string | null; lastName: string | null; email: string }) => {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim()
    return name || user.email
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="docName">
            Nome do Documento <span className="text-destructive">*</span>
          </Label>
          <Input id="docName" {...register("docName")} />
          {errors.docName && <p className="text-sm text-destructive mt-1">{errors.docName.message}</p>}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="docDesc">
            Descrição <span className="text-destructive">*</span>
          </Label>
          <Textarea id="docDesc" {...register("docDesc")} rows={3} />
          {errors.docDesc && <p className="text-sm text-destructive mt-1">{errors.docDesc.message}</p>}
        </div>

        <div>
          <Label htmlFor="docCod">
            Código <span className="text-destructive">*</span>
          </Label>
          <Input id="docCod" {...register("docCod")} />
          {errors.docCod && <p className="text-sm text-destructive mt-1">{errors.docCod.message}</p>}
        </div>

        <div>
          <Label htmlFor="docProcess">
            Processo <span className="text-destructive">*</span>
          </Label>
          <Input id="docProcess" {...register("docProcess")} />
          {errors.docProcess && <p className="text-sm text-destructive mt-1">{errors.docProcess.message}</p>}
        </div>

        <div>
          <Label htmlFor="docTypeArc">
            Tipo de Arquivo <span className="text-destructive">*</span>
          </Label>
          <Input id="docTypeArc" {...register("docTypeArc")} placeholder="Ex: PDF, DOCX, XLSX" />
          {errors.docTypeArc && <p className="text-sm text-destructive mt-1">{errors.docTypeArc.message}</p>}
        </div>

        <div>
          <Label htmlFor="docAvailability">
            Disponibilidade <span className="text-destructive">*</span>
          </Label>
          <Input id="docAvailability" {...register("docAvailability")} />
          {errors.docAvailability && <p className="text-sm text-destructive mt-1">{errors.docAvailability.message}</p>}
        </div>

        <div>
          <Label htmlFor="docLastEdit">
            Data da Última Revisão <span className="text-destructive">*</span>
          </Label>
          <Input id="docLastEdit" type="date" {...register("docLastEdit")} />
          {errors.docLastEdit && <p className="text-sm text-destructive mt-1">{errors.docLastEdit.message}</p>}
        </div>

        <div>
          <Label htmlFor="docRevPeriod">
            Periodicidade de Revisão <span className="text-destructive">*</span>
          </Label>
          <Select
            value={watch("docRevPeriod")}
            onValueChange={(value) => setValue("docRevPeriod", value as "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MENSAL">Mensal</SelectItem>
              <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
              <SelectItem value="SEMESTRAL">Semestral</SelectItem>
              <SelectItem value="ANUAL">Anual</SelectItem>
            </SelectContent>
          </Select>
          {errors.docRevPeriod && <p className="text-sm text-destructive mt-1">{errors.docRevPeriod.message}</p>}
        </div>

        <div>
          <Label htmlFor="docURL">URL do Documento</Label>
          <Input id="docURL" type="url" {...register("docURL")} placeholder="https://..." />
          {errors.docURL && <p className="text-sm text-destructive mt-1">{errors.docURL.message}</p>}
        </div>

        <div>
          <Label htmlFor="docLink">Link Alternativo</Label>
          <Input id="docLink" type="url" {...register("docLink")} placeholder="https://..." />
          {errors.docLink && <p className="text-sm text-destructive mt-1">{errors.docLink.message}</p>}
        </div>

        <div>
          <Label>Responsável</Label>
          <div className="space-y-2">
            {selectedResponsible ? (
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted">
                <span>{formatUserName(selectedResponsible)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedResponsible(null)
                    setValue("docResponsibleId", "")
                  }}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Buscar responsável..."
                  value={responsibleSearch}
                  onChange={(e) => setResponsibleSearch(e.target.value)}
                />
                {isLoadingResponsible && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando...
                  </div>
                )}
                {responsibleUsers && responsibleUsers.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {responsibleUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedResponsible({
                            id: user.id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                          })
                          setValue("docResponsibleId", user.id)
                          setResponsibleSearch("")
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <div className="font-medium">{formatUserName(user)}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div>
          <Label>Aprovador por Gestor</Label>
          <div className="space-y-2">
            {selectedApprovedManager ? (
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted">
                <span>{formatUserName(selectedApprovedManager)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedApprovedManager(null)
                    setValue("docApprovedManagerId", "")
                  }}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Buscar aprovador..."
                  value={approvedManagerSearch}
                  onChange={(e) => setApprovedManagerSearch(e.target.value)}
                />
                {isLoadingApprovedManager && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando...
                  </div>
                )}
                {approvedManagerUsers && approvedManagerUsers.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {approvedManagerUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedApprovedManager({
                            id: user.id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                          })
                          setValue("docApprovedManagerId", user.id)
                          setApprovedManagerSearch("")
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <div className="font-medium">{formatUserName(user)}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {qualityDocument ? "Atualizar" : "Criar"} Documento
        </Button>
      </div>
    </form>
  )
}

