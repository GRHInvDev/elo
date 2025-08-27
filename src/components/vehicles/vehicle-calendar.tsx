"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon, List, Car, Clock, MapPin, Users } from "lucide-react"
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { type inferProcedureOutput } from "@trpc/server"
import { type AppRouter } from "@/server/api/root"

// Helper to convert a date that is in UTC to a local date with same clock time.
// E.g. 2024-01-10T00:00:00Z becomes a local Date object for 2024-01-10 00:00:00
function utcToLocalDate(date: Date | string | null | undefined): Date | null {
    if (!date) return null
    const d = new Date(date)
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds())
}

function CalendarSkeleton() {
    return (
        <div className="grid grid-cols-7 gap-1">
            {Array(7)
                .fill(null)
                .map((_, index) => (
                    <div key={index} className="text-center font-medium py-2 text-sm">
                        <Skeleton className="h-6 w-12" />
                    </div>
                ))}
            {Array(35)
                .fill(null)
                .map((_, index) => (
                    <div key={index} className="h-24 sm:h-32 p-1 bg-muted/20 rounded-md">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="mt-1 space-y-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>
                    </div>
                ))}
        </div>
    )
}

export function VehicleCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined)
    const [selectedEvent, setSelectedEvent] = useState<inferProcedureOutput<AppRouter['vehicleRent']['getAll']>['items'][number] | null>(null)
    const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

    const isMobile = useMediaQuery("(max-width: 768px)")

    // Automatically switch to list view on mobile
    useEffect(() => {
        if (isMobile) {
            setViewMode("list")
        } else {
            setViewMode("calendar")
        }
    }, [isMobile])

    // Get first and last day of current month
    const firstDayOfMonth = startOfMonth(currentDate)
    const lastDayOfMonth = endOfMonth(currentDate)

    // Fetch vehicles for the dropdown
    const { data: vehiclesData } = api.vehicle.getAll.useQuery({})

    // Fetch reservations for the current month
    const { data: reservationsData, isLoading: isLoadingReservations } = api.vehicleRent.getAll.useQuery({
        vehicleId: selectedVehicleId,
        initial_date: firstDayOfMonth,
        final_date: lastDayOfMonth,
    })

    // Generate days for the calendar
    const calendarDays = useMemo(() => {
        return eachDayOfInterval({
            start: firstDayOfMonth,
            end: lastDayOfMonth,
        })
    }, [firstDayOfMonth, lastDayOfMonth])

    // Group reservations by day
    const reservationsByDay = useMemo(() => {
        const grouped: Record<string, inferProcedureOutput<AppRouter['vehicleRent']['getAll']>['items'][number][]> = {}
        
        if (reservationsData?.items) {
            reservationsData.items.forEach((reservation) => {
                const startDate = utcToLocalDate(reservation.startDate)
                if (!startDate) return

                const dateKey = format(startDate, "yyyy-MM-dd")

                grouped[dateKey] ??= []
                grouped[dateKey].push(reservation)
            })
        }
        return grouped
    }, [reservationsData])

    // Navigation functions
    const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const goToToday = () => setCurrentDate(new Date())

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap sm:justify-center">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold min-w-[180px] text-center">
                        {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                    </h2>
                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Hoje
                    </Button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select
                        value={selectedVehicleId ?? "all"}
                        onValueChange={(value) => setSelectedVehicleId(value === "all" ? undefined : value)}
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Todos os veículos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os veículos</SelectItem>
                            {vehiclesData?.items?.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                    {vehicle.model} ({vehicle.plate})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Tabs
                        value={viewMode}
                        onValueChange={(v) => setViewMode(v as "calendar" | "list")}
                        className="hidden sm:block"
                    >
                        <TabsList>
                            <TabsTrigger value="calendar">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                Calendário
                            </TabsTrigger>
                            <TabsTrigger value="list">
                                <List className="h-4 w-4 mr-2" />
                                Lista
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {isLoadingReservations ? (
                <CalendarSkeleton />
            ) : (
                <>
                    {viewMode === "calendar" && (
                        <div className="grid grid-cols-7 gap-1">
                            {/* Day headers */}
                            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                                <div key={day} className="text-center font-medium py-2 text-sm">
                                    {day}
                                </div>
                            ))}

                            {/* Calendar grid */}
                            {Array(firstDayOfMonth.getDay())
                                .fill(null)
                                .map((_, index) => (
                                    <div key={`empty-${index}`} className="h-24 sm:h-32 p-1 bg-muted/20 rounded-md"></div>
                                ))}

                            {calendarDays.map((day) => {
                                const dateKey = format(day, "yyyy-MM-dd")
                                const dayReservations = reservationsByDay[dateKey] ?? []
                                const isToday = isSameDay(day, new Date())

                                return (
                                    <div
                                        key={dateKey}
                                        className={cn(
                                            "h-24 sm:h-32 p-1 border rounded-md overflow-hidden",
                                            isToday ? "bg-primary/5 border-primary" : "hover:bg-muted/10",
                                            !isSameMonth(day, currentDate) && "opacity-50",
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span
                                                className={cn(
                                                    "font-medium text-sm h-6 w-6 flex items-center justify-center rounded-full",
                                                    isToday && "bg-primary text-primary-foreground",
                                                )}
                                            >
                                                {format(day, "d")}
                                            </span>
                                            {dayReservations.length > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {`${dayReservations.length} Reservas`}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-24px)]">
                                            {dayReservations.slice(0, 3).map((reservation) => (
                                                <button
                                                    key={reservation.id}
                                                    onClick={() => setSelectedEvent(reservation)}
                                                    className="w-full text-left p-1 text-xs rounded bg-secondary/50 hover:bg-secondary truncate block"
                                                >
                                                    <div className="font-medium truncate">{reservation.vehicle.model}</div>
                                                    <div className="truncate text-muted-foreground">
                                                        {reservation.user.firstName} {reservation.user.lastName}
                                                    </div>
                                                </button>
                                            ))}

                                            {dayReservations.length > 3 && (
                                                <div className="text-xs text-muted-foreground text-center">
                                                    +{dayReservations.length - 3} mais
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {viewMode === "list" && (
                        <div className="space-y-4">
                            {Object.entries(reservationsByDay)
                                .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                                .map(([dateKey, reservations]) => (
                                    <div key={dateKey} className="space-y-2">
                                        <h3 className="font-medium">{format(new Date(`${dateKey}T00:00:00`), "EEEE, d MMMM", { locale: ptBR })}</h3>
                                        <div className="space-y-2">
                                            {reservations.map((reservation) => {
                                                const reservationStartDate = utcToLocalDate(reservation.startDate)
                                                return (
                                                <Card
                                                    key={reservation.id}
                                                    className="p-3 cursor-pointer hover:bg-muted/10"
                                                    onClick={() => setSelectedEvent(reservation)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={reservation.user.imageUrl ?? undefined} />
                                                            <AvatarFallback>
                                                                {reservation.user.firstName?.[0]}
                                                                {reservation.user.lastName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium truncate">
                                                                {reservation.vehicle.model} ({reservation.vehicle.plate})
                                                            </div>
                                                            <div className="text-sm text-muted-foreground truncate">
                                                                {reservation.user.firstName} {reservation.user.lastName}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-right">
                                                            {reservationStartDate && format(reservationStartDate, "HH:mm", { locale: ptBR })}
                                                        </div>
                                                    </div>
                                                </Card>
                                            )})}
                                        </div>
                                    </div>
                                ))}

                            {Object.keys(reservationsByDay).length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    Nenhuma reserva encontrada para este período
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Event details sheet */}
            <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Detalhes da Reserva</SheetTitle>
                        <SheetDescription>Informações sobre a reserva do veículo</SheetDescription>
                    </SheetHeader>

                    {selectedEvent && (
                        (() => {
                            const selectedEventStartDate = utcToLocalDate(selectedEvent.startDate)
                            const selectedEventPossibleEnd = utcToLocalDate(selectedEvent.possibleEnd)

                            return (
                        <div className="mt-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={selectedEvent.user.imageUrl ?? undefined} />
                                    <AvatarFallback>
                                        {selectedEvent.user.firstName?.[0]}
                                        {selectedEvent.user.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-medium">
                                        {selectedEvent.user.firstName} {selectedEvent.user.lastName}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{selectedEvent.user.email}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-start gap-3">
                                    <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium">Veículo</p>
                                        <p className="text-sm">
                                            {selectedEvent.vehicle.model} ({selectedEvent.vehicle.plate})
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium">Data e Hora</p>
                                        <p className="text-sm">{selectedEventStartDate && format(selectedEventStartDate, "PPp", { locale: ptBR })}</p>
                                        {selectedEvent.possibleEnd && selectedEventPossibleEnd && (
                                            <p className="text-sm text-muted-foreground">
                                                Retorno previsto: {format(selectedEventPossibleEnd, "PPp", { locale: ptBR })}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {selectedEvent.destiny && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">Destino</p>
                                            <p className="text-sm">{selectedEvent.destiny}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedEvent.driver && (
                                    <div className="flex items-start gap-3">
                                        <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">Motorista</p>
                                            <p className="text-sm">{selectedEvent.driver}</p>
                                            {selectedEvent.passangers && (
                                                <p className="text-sm text-muted-foreground">Passageiros: {selectedEvent.passangers}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <Badge variant={selectedEvent.finished ? "outline" : "secondary"}>
                                    {selectedEvent.finished ? "Finalizado" : "Em andamento"}
                                </Badge>
                            </div>
                        </div>
                            )
                        })()
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
