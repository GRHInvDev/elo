"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"

import { Loader2, Trash2, Calendar, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { UPLTButton } from "@/components/ui/uplt-button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createBirthdaySchema } from "@/schemas/birthday.schema"
import type { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { UserSearch } from "@/components/forms/user-search"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"

interface Birthday {
  id: string
  name: string
  data: Date
  userId: string | null
  imageUrl?: string | null
}

interface BirthdayFormProps {
  birthday?: Birthday | null
  onSuccess?: () => void
}

export function BirthdayForm({ birthday, onSuccess }: BirthdayFormProps) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("")
  const [selectedUserId, setSelectedUserId] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { data: users } = api.user.listAll.useQuery()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof createBirthdaySchema>>({
    resolver: zodResolver(createBirthdaySchema),
    defaultValues: birthday ? {
      name: birthday.name,
      data: new Date(birthday.data),
      userId: birthday.userId ?? undefined,
      imageUrl: birthday.imageUrl ?? "",
    } : {
      name: "",
      data: new Date(),
      imageUrl: "",
    },
  })

  // Converter usuários para o formato esperado pelo UserSearch
  const usersForSearch = useMemo(() => {
    if (!users) return []
    return users.map(user => ({
      id: user.id,
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
      email: user.email,
      setor: user.setor,
    }))
  }, [users])

  // Inicializar userId selecionado quando há birthday (apenas uma vez)
  useEffect(() => {
    if (birthday?.userId && selectedUserId.length === 0) {
      setSelectedUserId([birthday.userId])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthday?.userId])

  // Atualizar o campo imageUrl quando uma nova imagem for enviada
  useEffect(() => {
    if (uploadedImageUrl) {
      setValue("imageUrl", uploadedImageUrl, { shouldDirty: true })
    }
  }, [uploadedImageUrl, setValue])

  // Atualizar nome e userId quando seleção mudar
  useEffect(() => {
    if (selectedUserId.length > 0) {
      const selectedUser = users?.find(u => u.id === selectedUserId[0])
      if (selectedUser) {
        const fullName = `${selectedUser.firstName ?? ""} ${selectedUser.lastName ?? ""}`.trim() || selectedUser.email
        setValue("name", fullName, { shouldDirty: true })
        setValue("userId", selectedUser.id, { shouldDirty: true })
      }
    } else {
      setValue("userId", undefined, { shouldDirty: true })
    }
  }, [selectedUserId, users, setValue])

  // Usuário selecionado
  const selectedUser = useMemo(() => {
    if (selectedUserId.length === 0) return null
    return users?.find(u => u.id === selectedUserId[0])
  }, [selectedUserId, users])

  // Função para lidar com a URL da imagem gerada pelo upload
  const handleImageUrlGenerated = (url: string) => {
    setUploadedImageUrl(url)
    toast({
      title: "Imagem enviada com sucesso!",
      description: "A imagem foi enviada com sucesso.",
    })
  }

  // Data formatada do aniversário salvo
  const savedBirthdayDate = useMemo(() => {
    return birthday?.data ? format(new Date(birthday.data), "dd/MM/yyyy", { locale: ptBR }) : null
  }, [birthday?.data])

  const currentImageUrl = uploadedImageUrl || (!!birthday?.imageUrl ? (birthday.imageUrl || "") : "")

  const createBirthday = api.birthday.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Aniversário adicionado",
        description: "O aniversário foi adicionado com sucesso.",
      })
      void utils.birthday.list.invalidate()
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateBirthday = api.birthday.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Aniversário atualizado",
        description: "O aniversário foi atualizado com sucesso.",
      })
      void utils.birthday.list.invalidate()
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const deleteBirthday = api.birthday.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Aniversário deletado",
        description: "O aniversário foi deletado com sucesso.",
      })
      void utils.birthday.list.invalidate()
      setIsDeleteDialogOpen(false)
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const isLoading = createBirthday.isPending || updateBirthday.isPending || deleteBirthday.isPending

  const handleDelete = () => {
    if (birthday) {
      deleteBirthday.mutate({ id: birthday.id })
    }
  }

  const onSubmit = async (data: z.infer<typeof createBirthdaySchema>) => {
    const date = data.data

    try {
      if (birthday) {
        await updateBirthday.mutateAsync({
          id: birthday.id,
          name: data.name,
          data: date,
          userId: data.userId === "none" ? undefined : data.userId,
          imageUrl: data.imageUrl,
        })
      } else {
        await createBirthday.mutateAsync({
          name: data.name,
          data: date,
          userId: data.userId === "none" ? undefined : data.userId,
          imageUrl: data.imageUrl,
        })
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // O erro já é tratado no hook de mutação
    }
  }

  return (
    <div className="space-y-4 max-w-4xl w-full px-4 sm:px-0">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Nome da pessoa"
              className="w-full"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date" className="text-sm font-medium">Data de Aniversário</Label>
            <Input
              id="date"
              type="date"
              {...register("data", { valueAsDate: true })}
              className="w-full"
            />
            {birthday && savedBirthdayDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="break-words">Data salva: <strong>{savedBirthdayDate}</strong></span>
              </p>
            )}
            {errors.data && (
              <p className="text-sm text-destructive mt-1">{errors.data.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-medium">Buscar Usuário</Label>
          <UserSearch
            users={usersForSearch}
            selectedUsers={selectedUserId}
            onSelectionChange={(userIds) => {
              // Limitar a seleção a apenas um usuário
              setSelectedUserId(userIds.slice(0, 1))
            }}
            placeholder="Buscar colaborador..."
            maxHeight="200px"
          />
          {selectedUser && (
            <p className="text-xs text-muted-foreground mt-1 break-words">
              Usuário selecionado: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Upload de Foto do Aniversariante</Label>
            <UPLTButton
              onImageUrlGenerated={handleImageUrlGenerated}
              onUploadError={(error) => {
                console.error("Erro no upload:", error)
                toast({
                  title: "Erro ao fazer upload da imagem",
                  description: "Ocorreu um erro ao fazer upload da imagem.",
                  variant: "destructive",
                })
              }}
              onUploadBegin={(filename) => {
                toast({
                  title: `Enviando ${filename}...`,
                  description: "A imagem está sendo enviada...",
                })
              }}
            />
          </div>
          
          {currentImageUrl && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview da imagem</Label>
              <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border">
                <Image
                  src={currentImageUrl}
                  alt="Preview da imagem"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
          <Button 
            type="submit" 
            disabled={isLoading || isSubmitting} 
            className="flex-1 w-full sm:w-auto min-h-[44px]"
          >
            {(isLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <span className="text-sm sm:text-base">
              {birthday ? "Salvar Alterações" : "Adicionar Aniversário"}
            </span>
          </Button>
          
          {birthday && (
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isLoading || isSubmitting}
                  className="w-full sm:w-auto min-h-[44px] sm:min-w-[44px]"
                >
                  {deleteBirthday.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 sm:mr-0" />
                      <span className="sm:hidden ml-2">Deletar</span>
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg p-4 sm:p-6 !translate-y-[-40%] sm:!translate-y-[-50%] max-h-[85vh] overflow-y-auto">
                <AlertDialogHeader className="space-y-1.5 sm:space-y-3 pb-2 sm:pb-4">
                  <AlertDialogTitle className="text-base sm:text-lg leading-tight">Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm leading-relaxed">
                    Tem certeza que deseja deletar o aniversário de <strong>{birthday.name}</strong>?
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-2 sm:pt-0">
                  <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] text-sm">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto order-1 sm:order-2 min-h-[44px] text-sm"
                  >
                    {deleteBirthday.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deletando...
                      </>
                    ) : (
                      "Deletar"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </div>
  )
}
