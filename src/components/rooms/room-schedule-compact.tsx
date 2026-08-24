"use client"

import React, { useState, useMemo } from "react"
import {
  addDays,
  addHours,
  differenceInHours,
  format,
  isSameDay,
  isToday,
  parse,
  startOfToday,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorClosed,
  Loader2,
  LucidePencil,
  Plus,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { useAuth } from "@clerk/nextjs"
import { cn, formatDateForInput } from "@/lib/utils"
import type { Room } from "@/types/room"
import { RoomDialog } from "./room-dialog"

interface RoomScheduleCompactProps {
  className?: string
  filial?: string
  rooms?: Room[]
}

export function RoomScheduleCompact({ className = "", filial, rooms = [] }: RoomScheduleCompactProps) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const auth = useAuth()

  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
  const [stripStartDate, setStripStartDate] = useState<Date>(startOfToday())
  const [selectedRoomToBook, setSelectedRoomToBook] = useState<Room | null>(null)
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<{
    id: string
    roomId: string
    title: string
    start: Date
    end: Date
    roomName: string
  } | null>(null)

  const { data: bookings = [], isLoading } = api.booking.list.useQuery({
    startDate: startOfToday(),
    endDate: addDays(startOfToday(), 45),
  })

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => !filial || b.room.filial === filial)
  }, [bookings, filial])

  const stripDays = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => addDays(stripStartDate, i))
  }, [stripStartDate])

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, typeof filteredBookings>()
    for (const b of filteredBookings) {
      const key = format(b.start, "yyyy-MM-dd")
      const list = map.get(key) ?? []
      list.push(b)
      map.set(key, list)
    }
    return map
  }, [filteredBookings])

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd")
  const dayBookings = bookingsByDate.get(selectedDateKey) ?? []

  const deleteBooking = api.booking.delete.useMutation({
    onSuccess: async () => {
      toast({
        title: "Reserva cancelada",
        description: "A reunião foi removida do calendário.",
      })
      await utils.booking.list.invalidate()
      await utils.booking.listMine.invalidate()
      await utils.room.list.invalidate()
      await utils.room.listAvailable.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro ao cancelar",
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
      setEditingBooking(null)
      await utils.booking.list.invalidate()
      await utils.booking.listMine.invalidate()
      await utils.room.list.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleShiftStrip = (days: number) => {
    setStripStartDate((prev) => addDays(prev, days))
  }

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingBooking) return
    const formData = new FormData(e.currentTarget)

    const dateVal = parse(formData.get("date") as string, "yyyy-MM-dd", new Date())
    const timeVal = parse(formData.get("time") as string, "HH:mm", new Date())
    const duration = Number(formData.get("duration")) || 1

    const start = new Date(
      dateVal.getFullYear(),
      dateVal.getMonth(),
      dateVal.getDate(),
      timeVal.getHours(),
      timeVal.getMinutes(),
    )
    const end = addHours(start, duration)

    updateBooking.mutate({
      id: editingBooking.id,
      roomId: editingBooking.roomId,
      title: formData.get("title") as string,
      start,
      end,
    })
  }

  return (
    <Card className={`overflow-hidden border shadow-sm ${className}`}>
      <CardHeader className="p-4 pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-base font-semibold">Agenda de Reuniões</CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 px-2"
              onClick={() => {
                setSelectedDate(startOfToday())
                setStripStartDate(startOfToday())
              }}
            >
              Hoje
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-2.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>Escolher Data</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) {
                      setSelectedDate(d)
                      setStripStartDate(addDays(d, -1))
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center gap-1 pt-3 max-w-full">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={() => handleShiftStrip(-3)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 flex-1 min-w-0">
            {stripDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate)
              const today = isToday(day)
              const dayKey = format(day, "yyyy-MM-dd")
              const count = bookingsByDate.get(dayKey)?.length ?? 0

              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[56px] sm:min-w-[60px] py-1.5 px-2 rounded-lg border text-xs transition-all duration-200 shrink-0 cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold scale-105"
                      : "bg-background hover:bg-muted text-foreground border-border",
                    today && !isSelected && "border-primary/50 text-primary font-medium",
                  )}
                >
                  <span className="text-[10px] uppercase opacity-80">
                    {today ? "Hoje" : format(day, "EEE", { locale: ptBR })}
                  </span>
                  <span className="text-sm font-bold my-0.5">{format(day, "dd")}</span>
                  {count > 0 ? (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-primary",
                      )}
                    />
                  ) : (
                    <span className="h-1.5" />
                  )}
                </button>
              )
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={() => handleShiftStrip(3)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <span className="text-xs">Carregando horários...</span>
          </div>
        ) : dayBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
              <DoorClosed className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">Nenhuma reunião agendada para este dia</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
              Todas as salas de {filial ?? "todas as filiais"} estão totalmente livres nesta data.
            </p>
            {rooms.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs gap-1.5"
                onClick={() => {
                  setSelectedRoomToBook(rooms[0] ?? null)
                  setIsRoomDialogOpen(true)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Agendar Reunião
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {dayBookings.map((booking) => {
              const isOwner = auth.userId === booking.userId

              return (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-md bg-muted text-foreground shrink-0 mt-0.5">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {booking.title}
                        </p>
                        <Badge variant="outline" className="text-[10px] py-0 font-medium shrink-0">
                          {booking.room.name} ({booking.room.floor}º Andar)
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Avatar className="h-4 w-4 shrink-0">
                            <AvatarImage src={booking.user.imageUrl ?? undefined} />
                            <AvatarFallback className="text-[9px]">
                              {booking.user.firstName?.at(0)?.toUpperCase() ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[140px]">
                            {booking.user.firstName} {booking.user.lastName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {format(booking.start, "HH:mm")} - {format(booking.end, "HH:mm")}
                    </span>

                    {isOwner && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setEditingBooking({
                              id: booking.id,
                              roomId: booking.roomId,
                              title: booking.title,
                              start: booking.start,
                              end: booking.end,
                              roomName: booking.room.name,
                            })
                          }
                        >
                          <LucidePencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteBooking.mutate({ id: booking.id })}
                          disabled={deleteBooking.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Modal de Edição de Agendamento */}
      {editingBooking && (
        <Dialog open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}>
          <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Editar Reserva</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Título da Reunião</Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={editingBooking.title}
                  className="text-base sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-date">Data</Label>
                  <Input
                    id="edit-date"
                    name="date"
                    type="date"
                    defaultValue={formatDateForInput(editingBooking.start)}
                    className="text-base sm:text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-time">Horário</Label>
                  <Input
                    id="edit-time"
                    name="time"
                    type="time"
                    defaultValue={format(editingBooking.start, "HH:mm")}
                    className="text-base sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-duration">Duração (horas)</Label>
                <Input
                  id="edit-duration"
                  name="duration"
                  type="number"
                  step="0.5"
                  defaultValue={Math.max(
                    1,
                    differenceInHours(editingBooking.end, editingBooking.start),
                  )}
                  className="text-base sm:text-sm"
                  required
                />
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingBooking(null)}
                  disabled={updateBooking.isPending}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateBooking.isPending} className="rounded-xl">
                  {updateBooking.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Nova Reserva */}
      <RoomDialog
        room={selectedRoomToBook}
        open={isRoomDialogOpen}
        onOpenChange={setIsRoomDialogOpen}
      />
    </Card>
  )
}
