"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Loader2 } from "lucide-react"

import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { UPLTButton } from "@/components/ui/uplt-button"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addDays } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createBirthdaySchema } from "@/schemas/birthday.schema"
import type { z } from "zod"
import { Check, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [nameSearchOpen, setNameSearchOpen] = useState(false)
  const [nameInputValue, setNameInputValue] = useState("")

  const { data: users } = api.user.listAll.useQuery()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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

  // Inicializar o input value com o nome atual
  useEffect(() => {
    const currentName = watch("name")
    if (currentName && currentName !== nameInputValue) {
      setNameInputValue(currentName)
    }
  }, [nameInputValue, watch])

  // Atualizar o campo imageUrl quando uma nova imagem for enviada
  useEffect(() => {
    if (uploadedImageUrl) {
      setValue("imageUrl", uploadedImageUrl)
    }
  }, [uploadedImageUrl, setValue])

  // Função para lidar com a URL da imagem gerada pelo upload
  const handleImageUrlGenerated = (url: string) => {
    setUploadedImageUrl(url)
    toast({
      title: "Imagem enviada com sucesso!",
      description: "A imagem foi enviada com sucesso.",
    })
  }

  // Filtrar usuários baseado no termo de busca
  const filteredUsers = users?.filter(user => {
    if (!nameInputValue.trim()) return true
    const term = nameInputValue.toLowerCase()
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
    return fullName.includes(term) || user.email.toLowerCase().includes(term)
  }) ?? []

  // Função para selecionar um usuário da lista
  const handleUserSelect = (user: NonNullable<typeof users>[0]) => {
    const fullName = `${user.firstName} ${user.lastName}`
    setValue("name", fullName)
    setValue("userId", user.id)
    setNameInputValue(fullName)
    setNameSearchOpen(false)
  }

  // Função para quando o usuário digita manualmente
  const handleNameInputChange = (value: string) => {
    setNameInputValue(value)
    setValue("name", value)
    // Limpar userId se o nome foi alterado manualmente
    if (value !== selectedUserName) {
      setValue("userId", undefined)
    }
    // Abrir o popover se há texto e usuários filtrados
    setNameSearchOpen(value.length > 0 && filteredUsers.length > 0)
  }

  // Fechar popover quando não há resultados
  useEffect(() => {
    if (nameInputValue.length > 0 && filteredUsers.length === 0) {
      setNameSearchOpen(false)
    }
  }, [nameInputValue, filteredUsers.length])

  // Verificar se há um usuário selecionado
  const selectedUser = users?.find(user => user.id === watch("userId"))
  const selectedUserName = selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : null

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

  const isLoading = createBirthday.isPending || updateBirthday.isPending

  const onSubmit = async (data: z.infer<typeof createBirthdaySchema>) => {
    const date = addDays(data.data, 1)

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
      // O erro já é tratado no hook de mutação -- pq? como? sla <gambiarra />
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Popover open={nameSearchOpen} onOpenChange={setNameSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                id="name"
                value={nameInputValue}
                onChange={(e) => handleNameInputChange(e.target.value)}
                onFocus={() => {
                  if (nameInputValue.length > 0 && filteredUsers.length > 0) {
                    setNameSearchOpen(true)
                  }
                }}
                placeholder="Nome da pessoa ou busque um usuário"
                className={cn(selectedUserName && "pr-10")}
              />
              {selectedUser && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-full p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandList>
                <CommandEmpty>
                  {nameInputValue ? "Nenhum usuário encontrado." : "Digite para buscar usuários..."}
                </CommandEmpty>
                {filteredUsers.length > 0 && (
                  <CommandGroup>
                    {filteredUsers.map((user) => {
                      const fullName = `${user.firstName} ${user.lastName}`
                      const isSelected = user.id === watch("userId")

                      return (
                        <CommandItem
                          key={user.id}
                          onSelect={() => handleUserSelect(user)}
                          className="flex items-center gap-2"
                        >
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{fullName}</span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-green-600 shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </div>
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedUser && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            Usuário da plataforma: {selectedUserName}
          </p>
        )}
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="date">Data de Aniversário</Label>
        <Input
          id="date"
          type="date"
          {...register("data", { valueAsDate: true })}
        />
        {errors.data && (
          <p className="text-sm text-destructive">{errors.data.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Upload de Foto do Aniversariante</Label>
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
      </div>


      <Button type="submit" disabled={isLoading || isSubmitting} className="w-full">
        {(isLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {birthday ? "Salvar Alterações" : "Adicionar Aniversário"}
      </Button>
    </form>
  )
}

