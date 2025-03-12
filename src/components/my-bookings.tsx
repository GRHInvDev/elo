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
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { type z } from "zod"

export function MyBookings({ className }: { className?: string }) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const auth = useAuth(); 

  const { data: bookings, isLoading } = api.booking.listMine.useQuery()

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
    <Card className={className}>
      <CardHeader>
        <CardTitle>Minhas Reservas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : bookings ? (
          <div className="space-y-4">
            {bookings?.length ? (
              <div className="space-y-2">
                {bookings?.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 justify-between">
                        <p className="truncate font-medium">{booking.room.name}</p>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                        {format(booking.start, "PP", { locale: ptBR })} | {format(booking.start, "HH:mm")} - {format(booking.end, "HH:mm")}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-sm text-muted-foreground overflow-hidden overflow-ellipsis text-nowrap">{booking.title}</p>
                        <div className="ml-auto">
                          {
                            auth.userId === booking.userId &&
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteBooking.mutate({ id: booking.id })}
                                disabled={deleteBooking.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Cancelar reserva</span>
                              </Button>
                              <UpdateBookingDialog {...{booking}}/>
                            </>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma reserva para esta data.</p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

interface UpdateBookingDialogProps {
  booking: z.TypeOf<typeof createBookingSchema>
} 


function UpdateBookingDialog({
  booking
}:UpdateBookingDialogProps){
  const utils = api.useUtils();
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
        <Button variant="ghost" size="icon">
          <LucidePencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>
          Editar reserva
        </DialogTitle>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Reunião</Label>
            <Input id="title" name="title" placeholder="Digite o título da reunião" required defaultValue={booking.title}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" name="date" type="date" defaultValue={formatDateForInput(booking.start)} required min={format(new Date(), "yyyy-MM-dd")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                name="time"
                type="time"
                required
                defaultValue={format(booking.start, "HH:mm")}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duração (horas)</Label>
            <Input id="duration" name="duration" type="number" defaultValue={differenceInHours(booking.end, booking.start)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateBooking.isPending}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {updateBooking.isPending ? "Reservando..." : "Alterar Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}