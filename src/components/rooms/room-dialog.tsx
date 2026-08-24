"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { addMinutes, format, parse } from "date-fns"
import { Calendar, Clock, Loader2, Users } from "lucide-react"

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
import { useAccessControl } from "@/hooks/use-access-control"
import { cn } from "@/lib/utils"
import type { Room } from "@/types/room"

export type { Room } from "@/types/room"

interface RoomDialogProps {
  room: Room | undefined | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PRESET_DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "1h", value: 60 },
  { label: "1h 30m", value: 90 },
  { label: "2h", value: 120 },
]

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

export function RoomDialog({ room, open, onOpenChange }: RoomDialogProps) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const { canCreateBooking } = useAccessControl()

  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false)
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [time, setTime] = useState<string>("09:00")
  const [title, setTitle] = useState<string>("")

  const endTimeString = useMemo(() => {
    try {
      if (!time || !durationMinutes || durationMinutes <= 0) return null
      const [h, m] = time.split(":").map(Number)
      if (h === undefined || m === undefined || isNaN(h) || isNaN(m)) return null
      const base = new Date()
      base.setHours(h, m, 0, 0)
      const end = addMinutes(base, durationMinutes)
      return format(end, "HH:mm")
    } catch {
      return null
    }
  }, [time, durationMinutes])

  const createBooking = api.booking.create.useMutation({
    onSuccess: async () => {
      toast({
        title: "Reserva confirmada!",
        description: `Sala ${room?.name} reservada com sucesso.`,
      })
      onOpenChange(false)
      setTitle("")
      await utils.booking.list.invalidate()
      await utils.booking.listMine.invalidate()
      await utils.room.list.invalidate()
      await utils.room.listAvailable.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro ao reservar sala",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  if (!room) return null

  if (!canCreateBooking()) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acesso Restrito</DialogTitle>
            <DialogDescription>
              Você não possui permissão para agendar reservas de salas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor informe o título ou assunto da reunião.",
        variant: "destructive",
      })
      return
    }

    if (!durationMinutes || durationMinutes <= 0) {
      toast({
        title: "Duração inválida",
        description: "Por favor informe uma duração válida maior que 0 minutos.",
        variant: "destructive",
      })
      return
    }

    const parsedDate = parse(date, "yyyy-MM-dd", new Date())
    const parsedTime = parse(time, "HH:mm", new Date())

    const start = new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
      parsedTime.getHours(),
      parsedTime.getMinutes(),
    )

    const end = addMinutes(start, durationMinutes)

    createBooking.mutate({
      roomId: room?.id ?? "",
      title: title.trim(),
      start,
      end,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-1 pb-1">
          <DialogTitle className="text-base font-semibold">
            Reservar {room.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span>Filial {room.filial ?? "SCS"}</span>
            <span>•</span>
            <span>{room.floor}º Andar</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              Até {room.capacity} pessoas
            </span>
          </DialogDescription>
          {room.description && (
            <p className="text-xs text-muted-foreground/80 bg-muted/40 p-2 rounded-md border text-left mt-1">
              {room.description}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3.5 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Título da Reunião *
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex: Alinhamento de Projeto, Reunião de Equipe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs font-medium">
                Data
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                min={format(new Date(), "yyyy-MM-dd")}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time" className="text-xs font-medium">
                Horário de Início
              </Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="duration" className="text-xs font-medium">
                Duração
              </Label>
              {endTimeString && (
                <span className="text-muted-foreground">
                  Término: <strong className="text-foreground">{endTimeString}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_DURATIONS.map((preset) => {
                const isSelected = !isCustomDuration && durationMinutes === preset.value
                return (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "h-8 text-xs font-medium transition-all",
                      isSelected ? "shadow-xs" : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => {
                      setIsCustomDuration(false)
                      setDurationMinutes(preset.value)
                    }}
                  >
                    {preset.label}
                  </Button>
                )
              })}
              <Button
                type="button"
                size="sm"
                variant={isCustomDuration ? "default" : "outline"}
                className={cn(
                  "h-8 text-xs font-medium transition-all",
                  isCustomDuration ? "shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => {
                  setIsCustomDuration(true)
                  if ([30, 60, 90, 120].includes(durationMinutes)) {
                    setDurationMinutes(45)
                  }
                }}
              >
                Outro
              </Button>
            </div>

            {isCustomDuration && (
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <Input
                    id="custom-duration"
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={durationMinutes || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setDurationMinutes(isNaN(val) ? 0 : Math.max(1, Math.min(val, 1440)))
                    }}
                    placeholder="Ex: 45"
                    className="h-8 text-xs pr-14"
                    autoFocus
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none font-medium">
                    minutos
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                  ({formatMinutes(durationMinutes || 0)})
                </span>
              </div>
            )}
          </div>

          {endTimeString && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Horário:</span>
              </div>
              <span className="font-semibold text-foreground">
                {time} às {endTimeString} ({formatMinutes(durationMinutes)})
              </span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={createBooking.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={createBooking.isPending} className="gap-2">
              {createBooking.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Confirmar Reserva
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}