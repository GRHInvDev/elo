"use client"

import type React from "react"
import { addHours, format, parse } from "date-fns"
import { Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"

export interface Room {
  id: string
  name: string
  capacity: number
  floor: number
  description?: string | undefined
}

interface RoomDialogProps {
  room: Room | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoomDialog({ room, open, onOpenChange }: RoomDialogProps) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const createBooking = api.booking.create.useMutation({
    onSuccess: async () => {
      toast({
        title: "Reserva confirmada",
        description: `Sala ${room?.name} reservada com sucesso.`,
      })
      onOpenChange(false)
      // Invalida as queries que dependem dos agendamentos
      await utils.booking.list.invalidate()
      await utils.booking.listMine.invalidate()
      await utils.room.list.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro aa reservar",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  if (!room) return undefined

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const date = parse(formData.get("date") as string, "yyyy-MM-dd", new Date())
    const time = parse(formData.get("time") as string, "HH:mm", new Date())
    const duration = Number(formData.get("duration"))

    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes())

    const end = addHours(start, duration)

    createBooking.mutate({
      roomId: room?.id ?? "",
      title: formData.get("title") as string,
      start,
      end,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reservar Sala</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da sua reserva para {room.name}
            {room.description && <span className="block text-xs">{room.description}</span>}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Reunião</Label>
            <Input id="title" name="title" placeholder="Digite o título da reunião" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" name="date" type="date" required min={format(new Date(), "yyyy-MM-dd")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                name="time"
                type="time"
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duração (horas)</Label>
            <Input id="duration" name="duration" type="number" defaultValue="1" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createBooking.isPending}>
              <Calendar className="mr-2 h-4 w-4" />
              {createBooking.isPending ? "Reservando..." : "Confirmar Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

