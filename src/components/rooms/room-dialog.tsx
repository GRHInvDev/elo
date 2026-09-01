"use client"

import React, { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { addMinutes, differenceInMinutes, format, parse } from "date-fns"
import {
  Clock,
  Loader2,
  Image as ImageIcon,
  Box,
} from "lucide-react"

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
import { IsometricRoomCanvas } from "./isometric-room-canvas"
import type { IsometricRoomModel } from "@/types/isometric-room"

export interface RoomForDialog {
  id: string
  name: string
  capacity: number
  floor: number
  filial?: string
  description?: string | null
  photos?: string[]
  visualModel?: IsometricRoomModel | null
}

export interface BookingForDialog {
  id: string
  roomId: string
  title: string
  start: Date
  end: Date
  roomName: string
}

interface RoomDialogProps {
  room?: RoomForDialog | undefined | null
  booking?: BookingForDialog | undefined | null
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

export function RoomDialog({ room, booking, open, onOpenChange }: RoomDialogProps) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const { canCreateBooking } = useAccessControl()

  const isEditMode = Boolean(booking)

  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false)
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [time, setTime] = useState<string>("09:00")
  const [title, setTitle] = useState<string>("")

  const has3DModel = Boolean(room?.visualModel?.imageUrl)
  const hasPhotos = Boolean(room?.photos && room.photos.length > 0)
  const hasMedia = !isEditMode && (has3DModel || hasPhotos)

  const [activeMediaTab, setActiveMediaTab] = useState<"3d" | "photos">("3d")

  useEffect(() => {
    if (open) {
      if (booking) {
        setTitle(booking.title ?? "")
        setDate(format(booking.start, "yyyy-MM-dd"))
        setTime(format(booking.start, "HH:mm"))
        const diff = Math.max(1, differenceInMinutes(booking.end, booking.start))
        setDurationMinutes(diff)
        setIsCustomDuration(![30, 60, 90, 120].includes(diff))
      } else {
        setTitle("")
        setDate(format(new Date(), "yyyy-MM-dd"))
        setTime("09:00")
        setDurationMinutes(60)
        setIsCustomDuration(false)
      }
    }
  }, [open, booking, room?.id])

  useEffect(() => {
    if (has3DModel) {
      setActiveMediaTab("3d")
    } else if (hasPhotos) {
      setActiveMediaTab("photos")
    }
  }, [has3DModel, hasPhotos, room?.id])

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
        title: "Erro ao reservar",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateBooking = api.booking.update.useMutation({
    onSuccess: async () => {
      toast({
        title: "Reserva atualizada!",
        description: "Os novos horários foram salvos.",
      })
      onOpenChange(false)
      await utils.booking.list.invalidate()
      await utils.booking.listMine.invalidate()
      await utils.room.list.invalidate()
      await utils.room.listAvailable.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  if (!room && !booking) return null

  if (!isEditMode && !canCreateBooking()) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Acesso Restrito</DialogTitle>
            <DialogDescription>
              Você não possui permissão para agendar reservas de salas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="rounded-xl">Fechar</Button>
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

    if (isEditMode && booking) {
      updateBooking.mutate({
        id: booking.id,
        roomId: booking.roomId,
        title: title.trim(),
        start,
        end,
      })
    } else if (room) {
      createBooking.mutate({
        roomId: room.id,
        title: title.trim(),
        start,
        end,
      })
    }
  }

  const roomDisplayName = isEditMode ? (booking?.roomName ?? room?.name) : room?.name
  const roomDescription = !isEditMode ? room?.description : null
  const isPending = isEditMode ? updateBooking.isPending : createBooking.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-xl flex flex-col gap-4">
        <DialogHeader className="space-y-2 text-left shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {isEditMode ? "Editar Reserva" : roomDisplayName}
              </DialogTitle>
              {isEditMode && roomDisplayName ? (
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  {roomDisplayName}
                </DialogDescription>
              ) : roomDescription ? (
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  {roomDescription}
                </DialogDescription>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        {hasMedia && room && (
          <div className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden border border-border/50 bg-black/40 shrink-0 flex items-center justify-center">
            {activeMediaTab === "3d" && has3DModel && room.visualModel ? (
              <div className="w-full h-full flex items-center justify-center">
                <IsometricRoomCanvas model={room.visualModel} interactive={true} />
              </div>
            ) : hasPhotos && room.photos && room.photos.length > 0 ? (
              <div className="w-full h-full flex items-center gap-2 overflow-x-auto p-2 bg-muted/15 scrollbar-thin">
                {room.photos.map((photo, i) => (
                  <div key={i} className="relative h-full aspect-video shrink-0 rounded-lg overflow-hidden border border-border/40 shadow-xs">
                    <Image
                      src={photo}
                      alt={`Foto ${i + 1} de ${room.name}`}
                      fill
                      sizes="(max-width: 768px) 150px, 200px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : has3DModel && room.visualModel ? (
              <div className="w-full h-full flex items-center justify-center">
                <IsometricRoomCanvas model={room.visualModel} interactive={true} />
              </div>
            ) : null}

            {hasPhotos && has3DModel && (
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-background/85 backdrop-blur-md border border-border/50 rounded-lg p-1 shadow-md z-20">
                <Button
                  type="button"
                  variant={activeMediaTab === "3d" ? "default" : "ghost"}
                  size="sm"
                  className="h-6 text-[11px] px-2 rounded-md gap-1 cursor-pointer"
                  onClick={() => setActiveMediaTab("3d")}
                >
                  <Box className="size-3" />
                  3D
                </Button>
                <Button
                  type="button"
                  variant={activeMediaTab === "photos" ? "default" : "ghost"}
                  size="sm"
                  className="h-6 text-[11px] px-2 rounded-md gap-1 cursor-pointer"
                  onClick={() => setActiveMediaTab("photos")}
                >
                  <ImageIcon className="size-3" />
                  Fotos ({room.photos?.length})
                </Button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Título da Reunião *
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex: Alinhamento de Projeto, Reunião de Diretoria"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="h-9 text-base sm:text-sm rounded-xl border-border/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs font-medium">
                Data da Reserva
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                min={isEditMode ? undefined : format(new Date(), "yyyy-MM-dd")}
                className="h-9 text-base sm:text-sm rounded-xl border-border/60"
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
                className="h-9 text-base sm:text-sm rounded-xl border-border/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <Label className="text-xs font-medium">Duração</Label>
              {endTimeString && (
                <span className="text-muted-foreground text-[11px]">
                  Término previsto: <strong className="text-foreground">{endTimeString}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {PRESET_DURATIONS.map((preset) => {
                const isSelected = !isCustomDuration && durationMinutes === preset.value
                return (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "h-8 text-xs font-medium transition-all rounded-lg cursor-pointer truncate",
                      isSelected ? "shadow-2xs" : "text-muted-foreground hover:text-foreground",
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
                  "h-8 text-xs font-medium transition-all rounded-lg cursor-pointer truncate",
                  isCustomDuration ? "shadow-2xs" : "text-muted-foreground hover:text-foreground",
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
                    className="h-8 text-base sm:text-xs pr-14 rounded-xl"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 py-2.5 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground gap-1">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-primary shrink-0" />
                <span>Horário Reservado:</span>
              </div>
              <span className="font-semibold text-foreground">
                {time} às {endTimeString} ({formatMinutes(durationMinutes)})
              </span>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="rounded-xl gap-2 font-medium shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {isEditMode ? "Salvando..." : "Confirmando..."}
                </>
              ) : (
                isEditMode ? "Salvar Alterações" : "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}