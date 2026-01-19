"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, MapPin } from "lucide-react"

import { api } from "@/trpc/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Loader2, LucideEllipsis, LucidePencil, LucideTrash2 } from "lucide-react"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { UpdateEventDialogProps } from "@/types/event"

export function EventsList() {
  const { data: events, isLoading } = api.event.list.useQuery()
  const auth = useAuth();

  const deleteEvent = api.event.delete.useMutation({
    onSuccess: () => utils.event.list.invalidate()
  });

  const utils = api.useUtils();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!events?.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-md border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">Nenhum evento encontrado</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">Não há eventos agendados no momento.</p>
        </div>
      </div>
    )
  }

  const eventosOrdenados = [...events].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {eventosOrdenados.map((event) => (
        <Card key={event.id}>
          <CardHeader className="flex justify-between flex-row">
            <div className="space-y-1">
              <h3 className="font-semibold">{event.title}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                {format(event.startDate, "PPp", { locale: ptBR })}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-1 h-4 w-4" />
                {event.location}
              </div>
            </div>
            <div>
              {auth.userId === event.authorId && (
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <LucideEllipsis className="size-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 flex flex-col p-1">
                      <UpdateEventDialog {...event} />
                      <Button size="sm" disabled={deleteEvent.isPending} className="text-red-500 hover:text-red-800" variant="ghost" onClick={() => { deleteEvent.mutate({ id: event.id }) }}>
                        {
                          deleteEvent.isPending ?
                            <Loader2 className="size-4 animate-spin" />
                            :
                            <LucideTrash2 className="size-4" />
                        }
                        Excluir
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{event.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatDateForInput(date: Date): string {
  // Format: YYYY-MM-DDThh:mm
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function UpdateEventDialog({
  id,
  title,
  description,
  location,
  startDate,
  endDate
}: UpdateEventDialogProps) {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const updateEvent = api.event.update.useMutation({
    onSuccess: async () => {
      toast({
        title: "Encarte alterado",
        description: "Seu encarte foi alterado com sucesso.",
      })
      setOpen(false)
      await utils.event.list.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })


  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    updateEvent.mutate({
      id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
      published: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <LucidePencil className="h-4 w-4" />
          Editar Evento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>Compartilhe um evento com a equipe</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" defaultValue={title} placeholder="Digite o título do encarte..." required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Descrição</Label>
              <Textarea id="content" name="description" defaultValue={description} placeholder="Digite a descrição do encarte..." required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Local</Label>
              <Input id="location" name="location" defaultValue={location} placeholder="Local do evento..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input id="startDate" name="startDate" type="datetime-local" defaultValue={formatDateForInput(startDate)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Data de Término</Label>
                <Input id="endDate" name="endDate" type="datetime-local" defaultValue={formatDateForInput(endDate)} required />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateEvent.isPending}>
              {updateEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}