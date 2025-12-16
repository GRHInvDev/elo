"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, Loader2, Plus, Pencil, Trash2 } from "lucide-react"

import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BirthdayForm } from "@/components/birthday-form"
import { BirthdayImport } from "@/components/birthday-import"
import { type Birthday } from "@prisma/client"

export function BirthdayAdmin() {
  const [open, setOpen] = useState(false)
  const [editingBirthday, setEditingBirthday] = useState<Birthday|null>(null)
  const { toast } = useToast()
  const utils = api.useUtils()

  const { data: birthdays, isLoading } = api.birthday.list.useQuery()

  const deleteBirthday = api.birthday.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Aniversário removido",
        description: "O aniversário foi removido com sucesso.",
      })
      void utils.birthday.list.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este aniversário?")) {
      deleteBirthday.mutate({ id })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Gerenciar Aniversários</h2>
          <p className="text-sm text-muted-foreground">Adicione, edite ou remova aniversários da intranet</p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={open}
            onOpenChange={(newOpen) => {
              setOpen(newOpen)
              if (!newOpen) {
                setEditingBirthday(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Aniversário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[calc(100vh-2rem)] sm:max-h-[85vh] overflow-y-auto p-4 sm:p-6 !translate-y-[-50%] top-[50%] left-[50%] fixed">
              <DialogHeader className="space-y-1.5 sm:space-y-2 pb-3 sm:pb-4">
                <DialogTitle className="text-base sm:text-lg">{editingBirthday ? "Editar Aniversário" : "Novo Aniversário"}</DialogTitle>
                <DialogDescription className="text-sm">
                  {editingBirthday
                    ? "Edite os dados do aniversário"
                    : "Preencha os dados para adicionar um novo aniversário"}
                </DialogDescription>
              </DialogHeader>
              <BirthdayForm
                birthday={editingBirthday}
                onSuccess={() => {
                  setOpen(false)
                  setEditingBirthday(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista de Aniversários</TabsTrigger>
          <TabsTrigger value="import">Importar Aniversários</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aniversários Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !birthdays?.length ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Nenhum aniversário cadastrado</p>
                </div>
              ) : (
                <div className="divide-y">
                  {birthdays.map((birthday) => (
                    <div key={birthday.id} className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{birthday.name}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-1 h-4 w-4" />
                          {format(birthday.data, "PPP", { locale: ptBR })}
                        </div>
                        {birthday.user && (
                          <p className="text-sm text-muted-foreground">
                            Usuário: {birthday.user.firstName} {birthday.user.lastName}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingBirthday(birthday)
                            setOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(birthday.id)}
                          disabled={deleteBirthday.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="import">
          <BirthdayImport />
        </TabsContent>
      </Tabs>
    </div>
  )
}

