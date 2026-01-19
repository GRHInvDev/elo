"use client"

import type React from "react"

import { useState } from "react"
import { Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type RoomsListProps = React.HTMLAttributes<HTMLDivElement>

// Dados mockados - substituir por dados reais do banco
const rooms = [
  {
    id: "1",
    name: "Sala de Reunião 1",
    capacity: 8,
    floor: 1,
    available: true,
  },
  {
    id: "2",
    name: "Sala de Reunião 2",
    capacity: 12,
    floor: 1,
    available: false,
  },
  {
    id: "3",
    name: "Sala de Conferência",
    capacity: 20,
    floor: 2,
    available: true,
  },
]

export function RoomsList({ className, ...props }: RoomsListProps) {
  const [, setSelectedRoom] = useState<(typeof rooms)[0] | null>(null)

  return (
    <div className={className} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Salas Disponíveis</CardTitle>
          <CardDescription>Selecione uma sala para fazer sua reserva</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{room.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Capacidade: {room.capacity} pessoas • Andar: {room.floor}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant={room.available ? "default" : "secondary"}
                      disabled={!room.available}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {room.available ? "Reservar" : "Ocupada"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reservar Sala</DialogTitle>
                      <DialogDescription>Preencha os detalhes da sua reserva para {room.name}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Título da Reunião</Label>
                        <Input id="title" placeholder="Digite o título da reunião" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="date">Data</Label>
                          <Input id="date" type="date" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="time">Horário</Label>
                          <Input id="time" type="time" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Duração (horas)</Label>
                        <Input id="duration" type="number" min="1" max="4" defaultValue="1" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Confirmar Reserva</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

