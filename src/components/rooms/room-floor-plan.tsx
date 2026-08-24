"use client"

import React from "react"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Room } from "@/types/room"

interface RoomFloorPlanProps {
  rooms: Room[]
  filial: string
  floor: number
  onRoomClick?: (room: Room) => void
  highlightRoomId?: string
  className?: string
  showEditHint?: boolean
}

export function RoomFloorPlan({
  rooms,
  filial,
  floor,
  onRoomClick,
  highlightRoomId,
  className = "",
  showEditHint = true,
}: RoomFloorPlanProps) {
  const { theme } = useTheme()

  const floorRooms = rooms.filter(
    (r) => (r.filial ?? "SCS") === filial && r.floor === floor,
  )

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-muted/40">
          Filial {filial} • {floor}º Andar
        </Badge>
      </div>

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
              <pattern id="floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-muted-foreground/15"
                />
              </pattern>
            </defs>

            <rect width="800" height="450" fill="url(#floor-grid)" />

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

            {/* Corredores guia */}
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
              Nenhuma sala cadastrada no {floor}º andar da filial {filial}
            </text>
          ) : (
            floorRooms.map((room) => {
              const coords = room.coordinates
              const isHighlighted = highlightRoomId === room.id

              return (
                <Tooltip key={room.id}>
                  <TooltipTrigger asChild>
                    <g
                      onClick={() => onRoomClick?.(room)}
                      className={onRoomClick ? "cursor-pointer group" : ""}
                    >
                      <rect
                        x={coords.x}
                        y={coords.y}
                        width={coords.width}
                        height={coords.height}
                        rx="6"
                        className={`transition-all duration-200 ${
                          isHighlighted
                            ? "fill-primary/30 stroke-primary stroke-[3]"
                            : "fill-primary/10 stroke-primary/70 stroke-2 group-hover:fill-primary/25 group-hover:stroke-primary"
                        }`}
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
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold">{room.name}</p>
                      <p className="text-muted-foreground">Capacidade: {room.capacity} pessoas</p>
                      {room.description && (
                        <p className="text-muted-foreground max-w-xs">{room.description}</p>
                      )}
                      {showEditHint && onRoomClick && (
                        <p className="text-primary font-medium pt-1">Clique para editar</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })
          )}
        </svg>
      </TooltipProvider>
    </div>
  </div>
)
}
