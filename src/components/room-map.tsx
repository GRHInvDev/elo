"use client"

import type React from "react"

import { useState } from "react"
import { useTheme } from "next-themes"

import { RoomDialog } from "@/components/room-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RoomMapProps extends React.HTMLAttributes<HTMLDivElement> {}

// Dados atualizados com coordenadas dentro do viewBox
const rooms = [
  {
    id: "1",
    name: "Sala de Reunião 1",
    capacity: 8,
    floor: 1,
    available: true,
    coordinates: { x: 100, y: 100, width: 150, height: 100 },
  },
  {
    id: "2",
    name: "Sala de Reunião 2",
    capacity: 12,
    floor: 1,
    available: false,
    coordinates: { x: 500, y: 100, width: 150, height: 100 },
  },
  {
    id: "3",
    name: "Sala de Conferência",
    capacity: 20,
    floor: 1,
    available: true,
    coordinates: { x: 300, y: 250, width: 200, height: 120 },
  },
]

export function RoomMap({ className, ...props }: RoomMapProps) {
  const [selectedRoom, setSelectedRoom] = useState<(typeof rooms)[0] | null>(null)
  const { theme } = useTheme()

  return (
    <div className={className} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Salas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full aspect-[16/9] border rounded-lg overflow-hidden">
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

                {/* Salas */}
                {rooms.map((room) => (
                  <Tooltip key={room.id}>
                    <TooltipTrigger asChild>
                      <g
                        onClick={() => setSelectedRoom(room)}
                        className={`cursor-pointer transition-colors ${
                          room.available ? "hover:fill-primary/20" : "hover:fill-muted/30"
                        }`}
                        style={{
                          fill: room.available ? "hsl(var(--background))" : "hsl(var(--muted))",
                        }}
                      >
                        <rect
                          x={room.coordinates.x}
                          y={room.coordinates.y}
                          width={room.coordinates.width}
                          height={room.coordinates.height}
                          stroke={theme === "dark" ? "#ffffff" : "#000000"}
                          strokeWidth="1"
                        />
                        <text
                          x={room.coordinates.x + room.coordinates.width / 2}
                          y={room.coordinates.y + room.coordinates.height / 2}
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
                        <p className={room.available ? "text-green-500" : "text-red-500"}>
                          {room.available ? "Disponível" : "Ocupada"}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}

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
                        fill: "hsl(var(--muted))",
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
            onOpenChange={(open) => !open && setSelectedRoom(null)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

