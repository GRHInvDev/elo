"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, LucidePencil, Trash2 } from "lucide-react"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@clerk/nextjs"
import { RoomDialog, type BookingForDialog } from "@/components/rooms/room-dialog"

export function MyBookings({ className = "", filial }: { className?: string; filial?: string }) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const auth = useAuth()
  const [editingBooking, setEditingBooking] = useState<BookingForDialog | null>(null)

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
      await utils.room.listAvailable.invalidate()
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
                        <div className="ml-auto shrink-0 flex items-center gap-1">
                          {auth.userId === booking.userId && (
                            <>
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
                                <span className="sr-only">Editar reserva</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteBooking.mutate({ id: booking.id })}
                                disabled={deleteBooking.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="sr-only">Cancelar reserva</span>
                              </Button>
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

      <RoomDialog
        booking={editingBooking}
        open={Boolean(editingBooking)}
        onOpenChange={(open) => {
          if (!open) setEditingBooking(null)
        }}
      />
    </Card>
  )
}