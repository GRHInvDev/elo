"use client"

import type React from "react"

import { useState } from "react"
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

interface Room {
  id: string
  name: string
  capacity: number
  floor: number
  available: boolean
}

interface RoomDialogProps {
  room: Room | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoomDialog({ room, open, onOpenChange }: RoomDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  if (!room) return null

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      roomId: room?.id,
      title: formData.get("title"),
      date: formData.get("date"),
      time: formData.get("time"),
      duration: formData.get("duration"),
    }

    // Aqui você faria a chamada para sua API
    try {
      // await createBooking(data)
      toast({
        title: "Reserva confirmada",
        description: `Sala ${room?.name} reservada com sucesso.`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro ao reservar",
        description: "Não foi possível completar sua reserva. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reservar Sala</DialogTitle>
          <DialogDescription>Preencha os detalhes da sua reserva para {room.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Reunião</Label>
            <Input id="title" name="title" placeholder="Digite o título da reunião" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" name="date" type="date" required min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                name="time"
                type="time"
                required
                step="1800" // Intervalos de 30 minutos
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duração (horas)</Label>
            <Input id="duration" name="duration" type="number" min="1" max="4" defaultValue="1" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              <Calendar className="mr-2 h-4 w-4" />
              {isLoading ? "Reservando..." : "Confirmar Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

