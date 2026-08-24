"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { useTheme } from "next-themes"
import { DoorClosed, Loader2, Maximize2, Move, RotateCcw, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { FILIAIS, type Coordinates, type Room } from "@/types/room"

const DEFAULT_COORDINATES: Coordinates = {
  x: 80,
  y: 80,
  width: 160,
  height: 100,
}

const SIZE_PRESETS = [
  { label: "Pequena (4-6 p.)", width: 120, height: 80 },
  { label: "Média (8-12 p.)", width: 170, height: 110 },
  { label: "Grande (14-20 p.)", width: 230, height: 140 },
  { label: "Auditório / Diretoria", width: 300, height: 170 },
]

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomToEdit: Room | null
  allRooms: Room[]
  defaultFilial?: string
  defaultFloor?: number
}

export function RoomFormDialog({
  open,
  onOpenChange,
  roomToEdit,
  allRooms,
  defaultFilial = "SCS",
  defaultFloor = 1,
}: RoomFormDialogProps) {
  const { toast } = useToast()
  const { theme } = useTheme()
  const utils = api.useUtils()
  const svgRef = useRef<SVGSVGElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: 8,
    floor: defaultFloor,
    filial: defaultFilial,
    coordinates: DEFAULT_COORDINATES,
  })

  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    if (open) {
      if (roomToEdit) {
        setFormData({
          name: roomToEdit.name,
          description: roomToEdit.description ?? "",
          capacity: roomToEdit.capacity,
          floor: roomToEdit.floor,
          filial: roomToEdit.filial ?? "SCS",
          coordinates: {
            x: roomToEdit.coordinates.x,
            y: roomToEdit.coordinates.y,
            width: Math.max(roomToEdit.coordinates.width, 40),
            height: Math.max(roomToEdit.coordinates.height, 40),
          },
        })
      } else {
        setFormData({
          name: "",
          description: "",
          capacity: 8,
          floor: defaultFloor,
          filial: defaultFilial,
          coordinates: {
            x: 80 + (allRooms.length % 4) * 40,
            y: 80 + (allRooms.length % 3) * 30,
            width: 160,
            height: 100,
          },
        })
      }
    }
  }, [open, roomToEdit, defaultFilial, defaultFloor, allRooms.length])

  const createRoom = api.room.create.useMutation({
    onSuccess: async () => {
      toast({
        title: "Sala criada com sucesso!",
        description: `A sala ${formData.name} foi adicionada.`,
      })
      onOpenChange(false)
      await utils.room.list.invalidate()
      await utils.room.listAvailable.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar sala",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateRoom = api.room.update.useMutation({
    onSuccess: async () => {
      toast({
        title: "Sala atualizada com sucesso!",
        description: `As alterações na sala ${formData.name} foram salvas.`,
      })
      onOpenChange(false)
      await utils.room.list.invalidate()
      await utils.room.listAvailable.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar sala",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const getSvgCoordinates = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }

    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY

    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }

    const svgPoint = point.matrixTransform(ctm.inverse())
    let rawX = Math.round(svgPoint.x / 10) * 10
    let rawY = Math.round(svgPoint.y / 10) * 10

    rawX = Math.max(50, Math.min(750, rawX))
    rawY = Math.max(50, Math.min(400, rawY))

    return { x: rawX, y: rawY }
  }

  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (event.button !== 0) return
    const coords = getSvgCoordinates(event)
    setIsDrawing(true)
    setDrawStart(coords)
    setCurrentDraw(coords)
  }

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return
    const coords = getSvgCoordinates(event)
    setCurrentDraw(coords)
  }

  const handleMouseUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const width = Math.abs(currentDraw.x - drawStart.x)
    const height = Math.abs(currentDraw.y - drawStart.y)
    const x = Math.min(drawStart.x, currentDraw.x)
    const y = Math.min(drawStart.y, currentDraw.y)

    if (width < 25 || height < 25) {
      setFormData((prev) => ({
        ...prev,
        coordinates: {
          ...prev.coordinates,
          x: Math.min(x, 800 - prev.coordinates.width),
          y: Math.min(y, 450 - prev.coordinates.height),
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        coordinates: {
          x,
          y,
          width: Math.max(width, 40),
          height: Math.max(height, 40),
        },
      }))
    }
  }

  const handleApplyPreset = (width: number, height: number) => {
    setFormData((prev) => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        width,
        height,
        x: Math.min(prev.coordinates.x, 800 - width - 50),
        y: Math.min(prev.coordinates.y, 450 - height - 50),
      },
    }))
  }

  const handleCenterRoom = () => {
    setFormData((prev) => {
      const width = prev.coordinates.width || 160
      const height = prev.coordinates.height || 100
      return {
        ...prev,
        coordinates: {
          x: Math.round((800 - width) / 2 / 10) * 10,
          y: Math.round((450 - height) / 2 / 10) * 10,
          width,
          height,
        },
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor informe o nome da sala.",
        variant: "destructive",
      })
      return
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      capacity: Number(formData.capacity),
      floor: Number(formData.floor),
      filial: formData.filial,
      coordinates: {
        x: Math.max(0, Number(formData.coordinates.x) || 50),
        y: Math.max(0, Number(formData.coordinates.y) || 50),
        width: Math.max(30, Number(formData.coordinates.width) || 100),
        height: Math.max(30, Number(formData.coordinates.height) || 80),
      },
    }

    if (roomToEdit) {
      await updateRoom.mutateAsync({
        id: roomToEdit.id,
        ...payload,
      })
    } else {
      await createRoom.mutateAsync(payload)
    }
  }

  const siblingRooms = useMemo(() => {
    return allRooms.filter(
      (r) =>
        (r.filial ?? "SCS") === formData.filial &&
        r.floor === formData.floor &&
        r.id !== roomToEdit?.id,
    )
  }, [allRooms, formData.filial, formData.floor, roomToEdit?.id])

  const isPending = createRoom.isPending || updateRoom.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <DoorClosed className="h-5 w-5 text-primary" />
              {roomToEdit ? "Editar Sala" : "Nova Sala"}
            </DialogTitle>
            <DialogDescription>
              Configure as informações da sala e ajuste sua posição na planta do andar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulário (5 colunas) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="room-name">Nome da Sala *</Label>
                <Input
                  id="room-name"
                  placeholder="Ex: Sala de Inovação, Auditório"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="room-filial">Filial *</Label>
                  <Select
                    value={formData.filial}
                    onValueChange={(value) => setFormData({ ...formData, filial: value })}
                  >
                    <SelectTrigger id="room-filial">
                      <SelectValue placeholder="Filial" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILIAIS.map((f) => (
                        <SelectItem key={f} value={f}>
                          Filial {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="room-floor">Andar *</Label>
                  <Input
                    id="room-floor"
                    type="number"
                    min={1}
                    max={99}
                    value={formData.floor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        floor: Math.max(1, Number.parseInt(e.target.value) || 1),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="room-capacity">Capacidade (Pessoas) *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="room-capacity"
                    type="number"
                    min={1}
                    className="pl-9"
                    placeholder="Ex: 8"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: Math.max(1, Number.parseInt(e.target.value) || 1),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="room-description">Descrição & Recursos</Label>
                <Textarea
                  id="room-description"
                  placeholder="Ex: TV 65'', Videoconferência, Projetor, 8 Cadeiras"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Presets de Tamanho */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Tamanhos Rápidos:
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCenterRoom}
                    className="h-6 text-xs gap-1 px-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Centralizar
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SIZE_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start h-8"
                      onClick={() => handleApplyPreset(preset.width, preset.height)}
                    >
                      <Maximize2 className="h-3 w-3 mr-1 text-muted-foreground" />
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Editor Visual SVG (7 colunas) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 font-medium">
                  <Move className="h-4 w-4 text-primary" />
                  Posição na Planta ({formData.filial} - {formData.floor}º Andar)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Arraste no mapa ou digite as coordenadas abaixo
                </span>
              </div>

              <div className="relative aspect-video border rounded-xl overflow-hidden bg-muted/30 shadow-inner">
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox="0 0 800 450"
                  preserveAspectRatio="xMidYMid meet"
                  className="bg-background select-none cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <rect
                    x="50"
                    y="50"
                    width="700"
                    height="350"
                    fill="none"
                    stroke={theme === "dark" ? "#52525b" : "#cbd5e1"}
                    strokeWidth="2"
                    rx="6"
                  />
                  <path
                    d="M 400 50 L 400 400"
                    stroke={theme === "dark" ? "#3f3f46" : "#e2e8f0"}
                    strokeWidth="1.5"
                    strokeDasharray="4"
                  />
                  <path
                    d="M 50 200 L 750 200"
                    stroke={theme === "dark" ? "#3f3f46" : "#e2e8f0"}
                    strokeWidth="1.5"
                    strokeDasharray="4"
                  />

                  {/* Salas vizinhas */}
                  {siblingRooms.map((room) => (
                    <g key={room.id} className="opacity-40">
                      <rect
                        x={room.coordinates.x}
                        y={room.coordinates.y}
                        width={room.coordinates.width}
                        height={room.coordinates.height}
                        rx="4"
                        className="fill-muted stroke-muted-foreground"
                        strokeWidth="1"
                      />
                      <text
                        x={room.coordinates.x + room.coordinates.width / 2}
                        y={room.coordinates.y + room.coordinates.height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[11px] fill-foreground font-medium pointer-events-none"
                      >
                        {room.name}
                      </text>
                    </g>
                  ))}

                  {/* Sala atual */}
                  {!isDrawing && formData.coordinates.width > 0 && (
                    <g>
                      <rect
                        x={formData.coordinates.x}
                        y={formData.coordinates.y}
                        width={formData.coordinates.width}
                        height={formData.coordinates.height}
                        rx="6"
                        className="fill-primary/20 stroke-primary"
                        strokeWidth="2.5"
                      />
                      <text
                        x={formData.coordinates.x + formData.coordinates.width / 2}
                        y={formData.coordinates.y + formData.coordinates.height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold fill-primary pointer-events-none"
                      >
                        {formData.name || "Nova Sala"}
                      </text>
                    </g>
                  )}

                  {/* Desenho em andamento */}
                  {isDrawing && (
                    <rect
                      x={Math.min(drawStart.x, currentDraw.x)}
                      y={Math.min(drawStart.y, currentDraw.y)}
                      width={Math.abs(currentDraw.x - drawStart.x)}
                      height={Math.abs(currentDraw.y - drawStart.y)}
                      rx="6"
                      className="fill-primary/30 stroke-primary"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                  )}
                </svg>
              </div>

              {/* Ajuste Fino Numérico */}
              <div className="grid grid-cols-4 gap-2 pt-1 bg-muted/40 p-3 rounded-lg border">
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase font-mono">Posição X</Label>
                  <Input
                    type="number"
                    min={0}
                    max={800}
                    className="h-8 text-xs font-mono"
                    value={formData.coordinates.x}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coordinates: {
                          ...formData.coordinates,
                          x: Math.max(0, Number.parseInt(e.target.value) || 0),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase font-mono">Posição Y</Label>
                  <Input
                    type="number"
                    min={0}
                    max={450}
                    className="h-8 text-xs font-mono"
                    value={formData.coordinates.y}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coordinates: {
                          ...formData.coordinates,
                          y: Math.max(0, Number.parseInt(e.target.value) || 0),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase font-mono">Largura (W)</Label>
                  <Input
                    type="number"
                    min={30}
                    max={800}
                    className="h-8 text-xs font-mono"
                    value={formData.coordinates.width}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coordinates: {
                          ...formData.coordinates,
                          width: Math.max(30, Number.parseInt(e.target.value) || 30),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase font-mono">Altura (H)</Label>
                  <Input
                    type="number"
                    min={30}
                    max={450}
                    className="h-8 text-xs font-mono"
                    value={formData.coordinates.height}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coordinates: {
                          ...formData.coordinates,
                          height: Math.max(30, Number.parseInt(e.target.value) || 30),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {roomToEdit ? "Salvar Alterações" : "Criar Sala"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
