"use client"

import type React from "react"

import { useState } from "react"
import { useTheme } from "next-themes"

import { type Room, RoomDialog } from "@/components/room-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/trpc/react"
import { Skeleton } from "@/components/ui/skeleton"

type RoomMapProps = React.HTMLAttributes<HTMLDivElement> & { filial?: string }

export function RoomMap({ className, filial, ...props }: RoomMapProps) {
  const [selectedFloor, setSelectedFloor] = useState<number>(1)
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>(undefined)
  const { theme } = useTheme()
  const { data: rooms, isLoading } = api.room.list.useQuery({ filial })
  const filteredRooms = rooms
  const floorRooms = filteredRooms?.filter((room) => room.floor === selectedFloor)
  const floors = filteredRooms ? Array.from(new Set(filteredRooms.map((room) => room.floor))).sort((a, b) => a - b) : []
  
  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle>Mapa de Salas</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[450px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className} {...props}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-md md:text-xl">Mapa de Salas</CardTitle>
          <Select value={selectedFloor.toString()} onValueChange={(value) => setSelectedFloor(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o andar" />
            </SelectTrigger>
            <SelectContent>
              {floors.map((floor) => (
                <SelectItem key={floor} value={floor.toString()}>
                  {floor}º Andar
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="relative w-full aspect-video border rounded-lg overflow-hidden">
            <TooltipProvider>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 450"
                preserveAspectRatio="xMidYMid meet"
                className="bg-background"
              >
                {/* Paredes externas */}
                <rect
                  x="50"
                  y="50"
                  width="700"
                  height="350"
                  fill="none"
                  stroke={theme === "dark" ? "#ffffff" : "#000000"}
                  strokeWidth="2"
                />

                {/* Corredores */}
                <path
                  d="M 400 50 L 400 400"
                  stroke={theme === "dark" ? "#666666" : "#cccccc"}
                  strokeWidth="2"
                  strokeDasharray="4"
                />
                <path
                  d="M 50 200 L 750 200"
                  stroke={theme === "dark" ? "#666666" : "#cccccc"}
                  strokeWidth="2"
                  strokeDasharray="4"
                />

                {/* Número do Andar */}
                <text x="60" y="80" className="text-lg font-semibold fill-foreground">
                  {selectedFloor}º Andar
                </text>

                {/* Salas do andar selecionado */}
                {floorRooms?.map((room) => {
                  const coordinates = room.coordinates as {
                    x: number
                    y: number
                    width: number
                    height: number
                  }
                  const isAvailable = !room.bookings?.filter(({start, end})=>{
                    const hoje = new Date();
                    return hoje >= start && hoje <= end;
                  })?.length

                  return (
                    <Tooltip key={room.id}>
                      <TooltipTrigger asChild>
                        <g
                          onClick={() => setSelectedRoom({
                          ...room,
                          description: room.description ?? undefined,
                          })}
                          className={`cursor-pointer transition-colors ${
                          isAvailable ? "hover:fill-primary/20" : "hover:fill-muted/30"
                          }`}
                          style={{
                          fill: isAvailable ? "hsl(var(--background))" : "hsl(var(--secondary))",
                          }}
                        >
                          <rect
                          x={coordinates.x}
                          y={coordinates.y}
                          width={coordinates.width}
                          height={coordinates.height}
                          stroke={theme === "dark" ? "#ffffff" : "#000000"}
                          strokeWidth="1"
                          />
                          <text
                          x={coordinates.x + coordinates.width / 2}
                          y={coordinates.y + coordinates.height / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-xs fill-foreground pointer-events-none"
                          >
                          {room.name}
                          </text>
                        </g>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium">{room.name}</p>
                          <p className="text-muted-foreground">Capacidade: {room.capacity} pessoas</p>
                          {room.description && <p className="text-muted-foreground">{room.description}</p>}
                          <p className={isAvailable ? "text-green-500" : "text-red-500"}>
                            {isAvailable ? "Disponível" : "Ocupada"}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}

                {/* Legenda */}
                <g transform="translate(60, 380)">
                  <rect
                    width="15"
                    height="15"
                    style={{
                      fill: "hsl(var(--background))",
                      stroke: "currentColor",
                    }}
                  />
                  <text x="25" y="12" className="text-xs fill-foreground">
                    Disponível
                  </text>

                  <g transform="translate(100, 0)">
                    <rect
                      width="15"
                      height="15"
                      style={{
                        fill: "hsl(var(--secondary))",
                        stroke: "currentColor",
                      }}
                    />
                    <text x="25" y="12" className="text-xs fill-foreground">
                      Ocupada
                    </text>
                  </g>
                </g>
              </svg>
            </TooltipProvider>
          </div>

          {/* Dialog de reserva */}
          <RoomDialog
            room={selectedRoom}
            open={!!selectedRoom}
            onOpenChange={(open) => !open && setSelectedRoom(undefined)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

