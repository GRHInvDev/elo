"use client"

import type React from "react"

import { Loader2 } from "lucide-react"

import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDays } from "date-fns"

interface Birthday {
  id: string
  name: string
  data: Date
  userId: string | null
}

interface BirthdayFormProps {
  birthday?: Birthday | null
  onSuccess?: () => void
}

function formatDateForInput(date: Date): string {
  // Format: YYYY-MM-DD
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function BirthdayForm({ birthday, onSuccess }: BirthdayFormProps) {
  const { toast } = useToast()
  const utils = api.useUtils()

  const { data: users } = api.user.listAll.useQuery()

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const dateStr = formData.get("date") as string
    const userId = formData.get("userId") as string

    if (!dateStr) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data.",
        variant: "destructive",
      })
      return
    }

    const date = addDays(new Date(dateStr), 1)

    if (isNaN(date.getTime())) {
      toast({
        title: "Erro",
        description: "Data inválida.",
        variant: "destructive",
      })
      return
    }

    if (birthday) {
      updateBirthday.mutate({
        id: birthday.id,
        name,
        data: date,
        userId: userId === "none" ? undefined : userId ?? undefined,
      })
    } else {
      createBirthday.mutate({
        name,
        data: date,
        userId: userId === "none" ? undefined : userId ?? undefined,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={birthday?.name ?? ""} placeholder="Nome da pessoa" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="date">Data de Aniversário</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={birthday?.data ? formatDateForInput(new Date(birthday.data)) : undefined}
          required
        />
      </div>

      {birthday && (
        <div className="grid gap-2">
          <Label htmlFor="userId">Usuário (opcional)</Label>
          <Select name="userId" defaultValue={birthday.userId ?? "none"}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um usuário (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Associar o aniversário a um usuário da plataforma</p>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {birthday ? "Salvar Alterações" : "Adicionar Aniversário"}
      </Button>
    </form>
  )
}

