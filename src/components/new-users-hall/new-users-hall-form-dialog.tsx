"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UPLTButton } from "@/components/ui/uplt-button"
import { UserSearch } from "@/components/forms/user-search"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import type { RouterOutputs } from "@/trpc/react"

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  setor: z.string().optional(),
  imageUrl: z.string().optional(),
  published: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

export type NewUsersHallEntryRow = RouterOutputs["newUsersHall"]["listPublished"][number]

interface NewUsersHallFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: NewUsersHallEntryRow | null
  onSuccess?: () => void
}

export function NewUsersHallFormDialog({
  open,
  onOpenChange,
  entry,
  onSuccess,
}: NewUsersHallFormDialogProps) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const [selectedUserId, setSelectedUserId] = useState<string[]>([])
  const [uploadedImageUrl, setUploadedImageUrl] = useState("")
  const [collaboratorSearch, setCollaboratorSearch] = useState("")
  const debouncedCollaboratorSearch = useDebounce(collaboratorSearch, 300)

  const { data: usersRaw, isFetching: isFetchingUsers } = api.user.searchMinimal.useQuery(
    { query: debouncedCollaboratorSearch.trim() || undefined },
    { enabled: open },
  )

  const { data: linkedUserForEdit } = api.user.getById.useQuery(
    { id: entry?.userId ?? "" },
    { enabled: open && !!entry?.userId },
  )

  const usersForSearch = useMemo(() => {
    const base =
      usersRaw?.map((u) => ({
        id: u.id,
        name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
        email: u.email,
        setor: u.setor,
      })) ?? []

    if (linkedUserForEdit && !base.some((u) => u.id === linkedUserForEdit.id)) {
      return [
        ...base,
        {
          id: linkedUserForEdit.id,
          name:
            `${linkedUserForEdit.firstName ?? ""} ${linkedUserForEdit.lastName ?? ""}`.trim() ||
            linkedUserForEdit.email,
          email: linkedUserForEdit.email,
          setor: linkedUserForEdit.setor ?? null,
        },
      ]
    }
    return base
  }, [usersRaw, linkedUserForEdit])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      setor: "",
      imageUrl: "",
      published: true,
    },
  })

  const imageUrl = watch("imageUrl")

  useEffect(() => {
    if (!open) {
      setCollaboratorSearch("")
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (entry) {
      reset({
        name: entry.name,
        setor: entry.setor ?? "",
        imageUrl: entry.imageUrl ?? "",
        published: entry.published,
      })
      setUploadedImageUrl("")
      setSelectedUserId(entry.userId ? [entry.userId] : [])
    } else {
      reset({
        name: "",
        setor: "",
        imageUrl: "",
        published: true,
      })
      setUploadedImageUrl("")
      setSelectedUserId([])
    }
  }, [open, entry, reset])

  useEffect(() => {
    if (uploadedImageUrl) {
      setValue("imageUrl", uploadedImageUrl, { shouldDirty: true })
    }
  }, [uploadedImageUrl, setValue])

  useEffect(() => {
    if (selectedUserId.length === 0) return
    const u = usersRaw?.find((x) => x.id === selectedUserId[0])
    if (u) {
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email
      setValue("name", fullName, { shouldDirty: true })
      setValue("setor", u.setor ?? "", { shouldDirty: true })
    }
  }, [selectedUserId, usersRaw, setValue])

  const create = api.newUsersHall.create.useMutation({
    onSuccess: () => {
      toast({ title: "Colaborador adicionado ao Hall" })
      void utils.newUsersHall.listPublished.invalidate()
      void utils.newUsersHall.listAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (e) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    },
  })

  const update = api.newUsersHall.update.useMutation({
    onSuccess: () => {
      toast({ title: "Entrada atualizada" })
      void utils.newUsersHall.listPublished.invalidate()
      void utils.newUsersHall.listAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (e) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    },
  })

  const onSubmit = async (data: FormValues) => {
    const uid = selectedUserId[0]
    const payload = {
      name: data.name.trim(),
      setor: data.setor?.trim() ? data.setor.trim() : null,
      imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : null,
      published: data.published,
      userId: uid ?? null,
    }
    try {
      if (entry) {
        await update.mutateAsync({
          id: entry.id,
          ...payload,
        })
      } else {
        await create.mutateAsync(payload)
      }
    } catch {
      /* toast on mutation */
    }
  }

  const trimmedImg = imageUrl?.trim()
  const previewUrl =
    trimmedImg && trimmedImg.length > 0 ? trimmedImg : (uploadedImageUrl ?? null)

  const busy = isSubmitting || create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[calc(100vh-2rem)] sm:max-h-[85vh] overflow-y-auto p-4 sm:p-6 !translate-y-[-50%] top-[50%] left-[50%] fixed">
        <DialogHeader className="space-y-1.5 sm:space-y-2 pb-3 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">
            {entry ? "Editar colaborador no Hall" : "Novo colaborador no Hall"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Vincule a um usuário da intranet ou preencha nome e setor manualmente. A foto pode ser enviada
            aqui ou vir do perfil do usuário vinculado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Vincular usuário (opcional)</Label>
            <UserSearch
              users={usersForSearch}
              selectedUsers={selectedUserId}
              onSelectionChange={(ids) => setSelectedUserId(ids.length ? [ids[ids.length - 1]!] : [])}
              onSearchTermChange={setCollaboratorSearch}
              placeholder="Buscar por nome, e-mail ou setor..."
            />
            {isFetchingUsers ? (
              <p className="text-xs text-muted-foreground">Buscando colaboradores…</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Ao selecionar um colaborador, nome e setor são preenchidos automaticamente (podem ser
              ajustados).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hall-name">Nome de exibição</Label>
            <Input id="hall-name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hall-setor">Setor</Label>
            <Input id="hall-setor" {...register("setor")} placeholder="Ex.: TI, RH..." />
          </div>

          <div className="space-y-2">
            <Label>Foto</Label>
            <UPLTButton
              onImageUrlGenerated={(url) => {
                setUploadedImageUrl(url)
                toast({ title: "Imagem enviada" })
              }}
            />
            {previewUrl ? (
              <div className="relative mt-2 h-32 w-32 overflow-hidden rounded-md border bg-muted">
                <Image src={previewUrl} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : null}
            <input type="hidden" {...register("imageUrl")} />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hall-published"
              checked={watch("published")}
              onCheckedChange={(c) => setValue("published", c === true, { shouldDirty: true })}
            />
            <Label htmlFor="hall-published" className="cursor-pointer font-normal">
              Publicado (visível no Hall)
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : entry ? (
                "Salvar"
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
