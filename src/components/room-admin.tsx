"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { type Room } from "./room-dialog"
import { Card } from "./ui/card"

interface DrawingState {
  isDrawing: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export function RoomAdmin() {
  const { toast } = useToast()
  const { data: rooms, isLoading } = api.room.list.useQuery()
  const utils = api.useUtils()
  const [open, setOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined)
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  })
  const svgRef = useRef<SVGSVGElement>(null)

  const createRoom = api.room.create.useMutation({
    onSuccess: async () => {
      toast({
        title: "Sala criada",
        description: "A sala foi criada com sucesso.",
      })
      setOpen(false)
      await utils.room.list.invalidate()
    },
  })

  const updateRoom = api.room.update.useMutation({
    onSuccess: async () => {
      toast({
        title: "Sala atualizada",
        description: "A sala foi atualizada com sucesso.",
      })
      setOpen(false)
      setEditingRoom(undefined)
      await utils.room.list.invalidate()
    },
  })

  const deleteRoom = api.room.delete.useMutation({
    onSuccess: async () => {
      toast({
        title: "Sala removida",
        description: "A sala foi removida com sucesso.",
      })
      await utils.room.list.invalidate()
    },
  })

  // Converte coordenadas do mouse para coordenadas SVG
  const getCoordinates = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }

    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY

    // Obtém a matriz de transformação do SVG
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }

    // Converte as coordenadas do cliente para coordenadas SVG
    const svgPoint = point.matrixTransform(ctm.inverse())
    return { x: svgPoint.x, y: svgPoint.y }
  }

  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    const coords = getCoordinates(event)
    setDrawingState({
      isDrawing: true,
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
    })
  }

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!drawingState.isDrawing) return

    const coords = getCoordinates(event)
    setDrawingState((prev) => ({
      ...prev,
      currentX: coords.x,
      currentY: coords.y,
    }))
  }

  const handleMouseUp = () => {
    setDrawingState((prev) => ({ ...prev, isDrawing: false }))
  }

  const calculateRectDimensions = () => {
    const width = Math.abs(drawingState.currentX - drawingState.startX)
    const height = Math.abs(drawingState.currentY - drawingState.startY)
    const x = Math.min(drawingState.startX, drawingState.currentX)
    const y = Math.min(drawingState.startY, drawingState.currentY)
    return { x, y, width, height }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const { x, y, width, height } = calculateRectDimensions()

    const roomData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      capacity: Number.parseInt(formData.get("capacity") as string),
      floor: Number.parseInt(formData.get("floor") as string),
      coordinates: { x, y, width, height },
    }

    if (editingRoom) {
      await updateRoom.mutateAsync({
        id: editingRoom.id,
        ...roomData,
      })
    } else {
      await createRoom.mutateAsync(roomData)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Gerenciar Salas</h2>
          <p className="text-sm text-muted-foreground">Adicione, edite ou remova salas da intranet</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(newOpen) => {
            setOpen(newOpen)
            if (!newOpen) {
              setEditingRoom(undefined)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Sala
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <form onSubmit={onSubmit}>
              <DialogHeader>
                <DialogTitle>{editingRoom ? "Editar Sala" : "Nova Sala"}</DialogTitle>
                <DialogDescription>
                  {editingRoom ? "Edite os dados da sala" : "Desenhe a sala no mapa e preencha seus dados"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" placeholder="Nome da sala" defaultValue={editingRoom?.name} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descrição da sala"
                    defaultValue={editingRoom?.description ?? undefined}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Capacidade</Label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      min="1"
                      defaultValue={editingRoom?.capacity}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="floor">Andar</Label>
                    <Input id="floor" name="floor" type="number" min="1" defaultValue={editingRoom?.floor} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Posição no Mapa</Label>
                  <div className="relative aspect-[16/9] border rounded-lg overflow-hidden">
                    <svg
                      ref={svgRef}
                      width="100%"
                      height="100%"
                      viewBox="0 0 800 450"
                      preserveAspectRatio="xMidYMid meet"
                      className="bg-background"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      {/* Paredes externas */}
                      <rect x="50" y="50" width="700" height="350" fill="none" stroke="currentColor" strokeWidth="2" />

                      {/* Corredores */}
                      <path
                        d="M 400 50 L 400 400"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4"
                        strokeOpacity="0.3"
                      />
                      <path
                        d="M 50 200 L 750 200"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4"
                        strokeOpacity="0.3"
                      />

                      {/* Salas existentes */}
                      {rooms?.map((room) => {
                        const coords = room.coordinates as {
                          x: number
                          y: number
                          width: number
                          height: number
                        }
                        return (
                          <g
                            key={room.id}
                            className="opacity-30"
                            onClick={() => {
                              setEditingRoom({...room, description: room.description ?? undefined})
                              setOpen(true)
                            }}
                          >
                            <rect
                              x={coords.x}
                              y={coords.y}
                              width={coords.width}
                              height={coords.height}
                              className="fill-muted stroke-foreground"
                            />
                            <text
                              x={coords.x + coords.width / 2}
                              y={coords.y + coords.height / 2}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-xs fill-foreground pointer-events-none"
                            >
                              {room.name}
                            </text>
                          </g>
                        )
                      })}

                      {/* Sala sendo desenhada */}
                      {drawingState.isDrawing && (
                        <rect
                          {...calculateRectDimensions()}
                          className="fill-primary/20 stroke-primary"
                          strokeWidth="2"
                        />
                      )}
                    </svg>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createRoom.isPending || updateRoom.isPending}>
                  {(createRoom.isPending || updateRoom.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRoom ? "Salvar Alterações" : "Criar Sala"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-md border">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="divide-y">
            {rooms?.map((room) => (
              <div key={room.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{room.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Capacidade: {room.capacity} pessoas • Andar: {room.floor}
                  </p>
                  {room.description && <p className="text-sm text-muted-foreground">{room.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRoom({...room, description: room.description ?? undefined})
                      setOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Tem certeza que deseja remover esta sala?")) {
                        deleteRoom.mutate({ id: room.id })
                      }
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
