"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useTheme } from "next-themes"
import { Calendar, Layers } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"
import type { Coordinates, Room } from "@/types/room"
import { RoomDialog } from "./room-dialog"

type RoomMapProps = React.HTMLAttributes<HTMLDivElement> & { filial?: string }

export function RoomMap({ className = "", filial = "SCS", ...props }: RoomMapProps) {
  const [selectedFloor, setSelectedFloor] = useState<number>(1)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { theme } = useTheme()

  const { data: rawRooms, isLoading } = api.room.list.useQuery({ filial })

  const rooms: Room[] = useMemo(() => {
    if (!rawRooms) return []
    return rawRooms.map((r) => {
      const coords = r.coordinates as unknown as Coordinates
      return {
        id: r.id,
        name: r.name,
        description: r.description ?? null,
        capacity: r.capacity,
        floor: r.floor,
        filial: (r as { filial?: string }).filial ?? filial,
        coordinates: {
          x: Number(coords?.x) || 50,
          y: Number(coords?.y) || 50,
          width: Number(coords?.width) || 120,
          height: Number(coords?.height) || 80,
        },
        bookings: r.bookings ?? [],
      }
    })
  }, [rawRooms, filial])

  const floors = useMemo(() => {
    const unique = Array.from(new Set(rooms.map((room) => room.floor))).sort((a, b) => a - b)
    return unique.length > 0 ? unique : [1]
  }, [rooms])

  useEffect(() => {
    if (floors.length > 0 && !floors.includes(selectedFloor)) {
      setSelectedFloor(floors[0] ?? 1)
    }
  }, [floors, selectedFloor])

  const floorRooms = useMemo(() => {
    return rooms.filter((r) => r.floor === selectedFloor)
  }, [rooms, selectedFloor])

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room)
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Card className={`border shadow-sm ${className}`}>
        <CardHeader className="p-4 pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-[420px] w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className} {...props}>
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center p-1 rounded-xl bg-background/80 backdrop-blur border shadow-xs gap-1 overflow-x-auto">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase px-2 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Piso:
              </span>
              {floors.map((floor) => {
                const isCurrent = selectedFloor === floor

                return (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => setSelectedFloor(floor)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-sm scale-102"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    )}
                  >
                    <span>{floor}º Andar</span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-2">
          {/* SVG MAP */}
          <div className="relative w-full aspect-video border rounded-xl overflow-hidden bg-muted/20 shadow-inner">
            <TooltipProvider>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 450"
                preserveAspectRatio="xMidYMid meet"
                className="bg-background select-none"
              >
                <defs>
                  <pattern id="user-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-muted-foreground/15"
                    />
                  </pattern>

                  {/* disponiveis */}
                  <linearGradient id="avail-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
                  </linearGradient>

                  {/* ocupadas */}
                  <linearGradient id="busy-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.06" />
                  </linearGradient>
                </defs>

                <rect width="800" height="450" fill="url(#user-map-grid)" />

                <rect
                  x="50"
                  y="50"
                  width="700"
                  height="350"
                  fill="none"
                  stroke={theme === "dark" ? "#52525b" : "#cbd5e1"}
                  strokeWidth="3"
                  rx="8"
                />

                <path
                  d="M 400 50 L 400 400"
                  stroke={theme === "dark" ? "#3f3f46" : "#e2e8f0"}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <path
                  d="M 50 200 L 750 200"
                  stroke={theme === "dark" ? "#3f3f46" : "#e2e8f0"}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />


                {floorRooms.length === 0 ? (
                  <text
                    x="400"
                    y="225"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm fill-muted-foreground pointer-events-none"
                  >
                    Nenhuma sala cadastrada no {selectedFloor}º andar da filial {filial}
                  </text>
                ) : (
                  floorRooms.map((room) => {
                    const coords = room.coordinates
                    const now = new Date()
                    const activeBooking = room.bookings?.find((b) => {
                      const start = new Date(b.start)
                      const end = new Date(b.end)
                      return now >= start && now <= end
                    })
                    const isAvailable = !activeBooking

                    return (
                      <Tooltip key={room.id}>
                        <TooltipTrigger asChild>
                          <g
                            onClick={() => handleRoomClick(room)}
                            className="cursor-pointer group"
                          >
                            <rect
                              x={coords.x}
                              y={coords.y}
                              width={coords.width}
                              height={coords.height}
                              rx="8"
                              fill={isAvailable ? "url(#avail-gradient)" : "url(#busy-gradient)"}
                              stroke={isAvailable ? "hsl(var(--primary))" : "#f43f5e"}
                              strokeWidth="2"
                              className="transition-all duration-300 group-hover:stroke-[3] group-hover:brightness-110"
                            />

                            <circle
                              cx={coords.x + 14}
                              cy={coords.y + 14}
                              r="4"
                              fill={isAvailable ? "#10b981" : "#f43f5e"}
                              className={isAvailable ? "animate-pulse" : ""}
                            />

                            <text
                              x={coords.x + coords.width / 2}
                              y={coords.y + coords.height / 2 - 8}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-xs font-bold fill-foreground pointer-events-none"
                            >
                              {room.name}
                            </text>

                            <text
                              x={coords.x + coords.width / 2}
                              y={coords.y + coords.height / 2 + 10}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-[10px] fill-muted-foreground pointer-events-none"
                            >
                              {room.capacity} pessoas
                            </text>
                          </g>
                        </TooltipTrigger>
                        <TooltipContent className="p-3 max-w-xs space-y-2">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-bold text-sm text-foreground">{room.name}</p>
                              <Badge
                                variant={isAvailable ? "default" : "destructive"}
                                className="text-[10px] py-0 font-medium"
                              >
                                {isAvailable ? "Disponível Agora" : "Ocupada"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Capacidade para até {room.capacity} pessoas • {room.floor}º Andar
                            </p>
                          </div>

                          {room.description && (
                            <p className="text-xs text-muted-foreground bg-muted p-1.5 rounded">
                              {room.description}
                            </p>
                          )}

                          {!isAvailable && activeBooking && (
                            <div className="text-xs text-rose-500 bg-rose-500/10 p-1.5 rounded">
                              Em reunião: <strong>{activeBooking.title}</strong>
                            </div>
                          )}

                          <div className="pt-1 border-t flex items-center justify-between text-xs text-primary font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Clique para agendar
                            </span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })
                )}

                {/* LEGENDA */}
                <g transform="translate(65, 380)">
                  <rect
                    x="0"
                    y="-12"
                    width="260"
                    height="24"
                    rx="6"
                    className="fill-background/90 stroke-border"
                  />
                  <circle cx="14" cy="0" r="4" fill="#10b981" />
                  <text x="24" y="3" className="text-[11px] fill-foreground font-medium">
                    Disponível Agora
                  </text>

                  <circle cx="140" cy="0" r="4" fill="#f43f5e" />
                  <text x="150" y="3" className="text-[11px] fill-foreground font-medium">
                    Em Reunião
                  </text>
                </g>
              </svg>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
      
      <RoomDialog
        room={selectedRoom}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}
