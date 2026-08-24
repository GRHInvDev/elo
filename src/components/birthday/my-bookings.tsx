"use client"

import { useState } from "react"
import { addHours, differenceInHours, format, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2, LucidePencil, Trash2 } from "lucide-react"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateForInput } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@clerk/nextjs"
import { type createBookingSchema } from "@/server/api/routers/booking"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { type z } from "zod"

export function MyBookings({ className = "", filial }: { className?: string; filial?: string }) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const auth = useAuth()

  const { data: bookings, isLoading } = api.booking.listMine.useQuery()
  const filtered = (bookings ?? []).filter((b) => !filial || b.room.filial === filial)

  const deleteBooking = api.booking.delete.useMutation({
    onSuccess: async () => {
      toast({
        title: "Reserva cancelada",
        description: "A reserva foi cancelada com sucesso.",
      })
      await utils.booking.list.invalidate()
      await utils.booking.listMine.invalidate()
      await utils.room.list.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <Card className={`rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Minhas Próximas Reservas</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-1 flex-1 flex flex-col min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.length ? (
              <div className="space-y-2">
                {filtered.map((booking) => (
                  <div key={booking.id} className="flex flex-col gap-2 rounded-lg border p-3 bg-background/50">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 justify-between">
                        <p className="truncate font-medium text-sm text-foreground">{booking.room.name}</p>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-inset ring-primary/20 shrink-0 self-start sm:self-auto">
                          {format(booking.start, "PP", { locale: ptBR })} | {format(booking.start, "HH:mm")} - {format(booking.end, "HH:mm")}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 justify-between">
                        <p className="text-xs text-muted-foreground truncate">{booking.title}</p>
                        <div className="ml-auto shrink-0 flex items-center">
                          {auth.userId === booking.userId && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => deleteBooking.mutate({ id: booking.id })}
                                disabled={deleteBooking.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="sr-only">Cancelar reserva</span>
                              </Button>
                              <UpdateBookingDialog {...{ booking }} />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma reserva para esta data.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface UpdateBookingDialogProps {
  booking: z.TypeOf<typeof createBookingSchema>
}

function UpdateBookingDialog({
  booking
}: UpdateBookingDialogProps) {
  const utils = api.useUtils()
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const updateBooking = api.booking.update.useMutation({
    onSuccess: async () => {
      toast({
        title: "Reserva alterada",
        description: "Sua reserva foi alterada com sucesso.",
      })
      setOpen(false)
      await utils.booking.list.invalidate()
      await utils.booking.listMine.invalidate()
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

    const date = parse(formData.get("date") as string, "yyyy-MM-dd", new Date())
    const time = parse(formData.get("time") as string, "HH:mm", new Date())
    const duration = Number(formData.get("duration"))

    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes())
    const end = addHours(start, duration)

    updateBooking.mutate({
      id: booking.id,
      roomId: booking.roomId,
      title: formData.get("title") as string,
      start,
      end,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <LucidePencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogTitle>
          Editar reserva
        </DialogTitle>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Reunião</Label>
            <Input id="title" name="title" placeholder="Digite o título da reunião" required defaultValue={booking.title} className="text-base sm:text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" name="date" type="date" defaultValue={formatDateForInput(booking.start)} required min={format(new Date(), "yyyy-MM-dd")} className="text-base sm:text-sm" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                name="time"
                type="time"
                required
                defaultValue={format(booking.start, "HH:mm")}
                className="text-base sm:text-sm"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duração (horas)</Label>
            <Input id="duration" name="duration" type="number" step="0.5" defaultValue={differenceInHours(booking.end, booking.start)} required className="text-base sm:text-sm" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="submit" disabled={updateBooking.isPending} className="rounded-xl">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {updateBooking.isPending ? "Reservando..." : "Alterar Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}