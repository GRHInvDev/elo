"use client"

import { useState } from "react"
import { addDays, format, startOfToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2, Trash2 } from "lucide-react"

import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { AvatarFallback, AvatarImage, Avatar } from "./ui/avatar"

export function RoomCalendar({ className }: { className?: string }) {
  const [date, setDate] = useState<Date>(startOfToday())
  const { toast } = useToast()
  const utils = api.useUtils()

  const { data: bookings, isLoading } = api.booking.list.useQuery({
    startDate: startOfToday(),
    endDate: addDays(startOfToday(), 30),
  })

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

  // Agrupa as reservas por data
  const bookingsByDate = bookings?.reduce(
    (acc, booking) => {
      const dateKey = format(booking.start, "yyyy-MM-dd")
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(booking)
      return acc
    },
    {} as Record<string, typeof bookings>,
  )

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calendário de Reservas</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : date && bookingsByDate ? (
          <div className="space-y-4">
            <h3 className="font-medium">Reservas para {format(date, "PP", { locale: ptBR })}</h3>
            {bookingsByDate[format(date, "yyyy-MM-dd")]?.length ? (
              <div className="space-y-2">
                {bookingsByDate[format(date, "yyyy-MM-dd")]?.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{booking.room.name}</p>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                          {format(booking.start, "HH:mm")} - {format(booking.end, "HH:mm")}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{booking.title}</p>
                        <span className="text-sm text-muted-foreground">•</span>
                        <div className="flex gap-2 items-center">
                          <Avatar className="size-6">
                            <AvatarFallback>{booking.user.firstName?.at(0)?.toUpperCase()}</AvatarFallback>
                            <AvatarImage src={booking.user.imageUrl ?? undefined}/>
                          </Avatar>
                          <p className="text-sm text-muted-foreground">
                            {booking.user.firstName} {booking.user.lastName}
                          </p>
                        </div>
                      </div>
                    </div>
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

