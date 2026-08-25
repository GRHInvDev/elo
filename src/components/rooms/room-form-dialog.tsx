"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { Loader2, Maximize2, RotateCcw, Sparkles, RefreshCw, Trash2, Image as CheckCircle2, Info, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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

import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { type Coordinates, type Room } from "@/types/room"
import { MultipleImageUpload } from "@/components/ui/multiple-image-upload"
import { IsometricRoomCanvas } from "./isometric-room-canvas"
import type { IsometricRoomModel } from "@/types/isometric-room"

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
  defaultFilial = "",
  defaultFloor = 1,
}: RoomFormDialogProps) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const svgRef = useRef<SVGSVGElement>(null)

  const { data: filiaisData = [] } = api.filiais.list.useQuery()

  const roomFiliais = useMemo(() => {
    const allowed = filiaisData.filter((f) => f.hasRoom)
    if (roomToEdit?.filial && !allowed.some((f) => f.code === roomToEdit.filial)) {
      const current = filiaisData.find((f) => f.code === roomToEdit.filial)
      if (current) return [...allowed, current]
    }
    return allowed
  }, [filiaisData, roomToEdit?.filial])

  const [activeTab, setActiveTab] = useState<"general" | "visual3d">("general")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: 8,
    floor: defaultFloor,
    filial: defaultFilial,
    coordinates: DEFAULT_COORDINATES,
  })

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [visualModel, setVisualModel] = useState<IsometricRoomModel | null>(null)
  const [isGeneratingModel, setIsGeneratingModel] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    if (open) {
      setActiveTab("general")
      setIsRegenerating(false)
      if (roomToEdit) {
        setFormData({
          name: roomToEdit.name,
          description: roomToEdit.description ?? "",
          capacity: roomToEdit.capacity,
          floor: roomToEdit.floor,
          filial: roomToEdit.filial ?? "",
          coordinates: {
            x: roomToEdit.coordinates?.x ?? 80,
            y: roomToEdit.coordinates?.y ?? 80,
            width: Math.max(roomToEdit.coordinates?.width ?? 160, 40),
            height: Math.max(roomToEdit.coordinates?.height ?? 100, 40),
          },
        })
        setUploadedPhotos(roomToEdit.photos ?? [])
        setVisualModel(roomToEdit.visualModel ?? null)
      } else {
        const initialFilial =
          roomFiliais.some((f) => f.code === defaultFilial)
            ? defaultFilial
            : roomFiliais[0]?.code ?? ""

        setFormData({
          name: "",
          description: "",
          capacity: 8,
          floor: defaultFloor,
          filial: initialFilial,
          coordinates: {
            x: 80 + (allRooms.length % 4) * 40,
            y: 80 + (allRooms.length % 3) * 30,
            width: 160,
            height: 100,
          },
        })
        setUploadedPhotos([])
        setVisualModel(null)
      }
    }
  }, [open, roomToEdit, defaultFilial, defaultFloor, allRooms.length, roomFiliais])

  const generateModelMutation = api.room.generateVisualModel.useMutation()

  const handleGenerateModel = async (photosToUse?: string[]) => {
    const photos = photosToUse ?? uploadedPhotos
    if (photos.length === 0) {
      toast({
        title: "Fotos necessárias",
        description: "Faça upload de ao menos 1 foto real da sala para a IA sintetizar a maquete 3D.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingModel(true)
    try {
      const generated = await generateModelMutation.mutateAsync({
        imageUrls: photos,
        roomName: formData.name || "Sala de Reunião",
        capacity: Number(formData.capacity) || 6,
        floor: Number(formData.floor) || 1,
        filial: formData.filial,
        additionalContext: formData.description,
      })
      setVisualModel(generated)
      setIsRegenerating(false)
      toast({
        title: "Maquete 3D Gerada com Sucesso!",
        description: "A IA renderizou o diorama isométrico com base nas fotos enviadas.",
      })
    } catch (error) {
      console.error("Erro ao gerar modelo:", error)
      toast({
        title: "Erro ao gerar maquete",
        description: "Não foi possível gerar a imagem via IA. Verifique as fotos e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingModel(false)
    }
  }

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

    if (!formData.filial) {
      toast({
        title: "Filial obrigatória",
        description: "Por favor selecione uma filial para a sala.",
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
      photos: uploadedPhotos,
      visualModel: visualModel ?? undefined,
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
        (r.filial ?? "") === formData.filial &&
        r.floor === formData.floor &&
        r.id !== roomToEdit?.id,
    )
  }, [allRooms, formData.filial, formData.floor, roomToEdit?.id])

  const isPending = createRoom.isPending || updateRoom.isPending
  const hasExistingModel = Boolean(visualModel?.imageUrl)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl border border-border/60">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-4 sm:p-6 pb-3 border-b bg-card/60">
            <DialogHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  {roomToEdit ? `Editar ${roomToEdit.name}` : "Cadastrar Nova Sala"}
                </DialogTitle>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "general" | "visual3d")} className="mt-4">
              <TabsList className="grid grid-cols-2 w-full h-9 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="general" className="text-xs font-medium rounded-lg gap-1.5">
                  <Building2 className="size-3.5" />
                  Geral & Planta (Mapa)
                </TabsTrigger>
                <TabsTrigger value="visual3d" className="text-xs font-medium rounded-lg gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  Maquete
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "general" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="room-name" className="text-xs font-semibold">
                      Nome da Sala *
                    </Label>
                    <Input
                      id="room-name"
                      placeholder="Ex: Sala de Reunião Diretoria, Aquário 01"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-9 text-base sm:text-xs rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="room-filial" className="text-xs font-semibold">
                        Unidade / Filial
                      </Label>
                      <Select
                        value={formData.filial}
                        onValueChange={(val) => setFormData({ ...formData, filial: val })}
                      >
                        <SelectTrigger id="room-filial" className="h-9 text-xs rounded-xl">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomFiliais.length === 0 ? (
                            <SelectItem value="none" disabled className="text-xs text-muted-foreground">
                              Nenhuma filial com salas habilitadas
                            </SelectItem>
                          ) : (
                            roomFiliais.map((f) => (
                              <SelectItem key={f.id} value={f.code} className="text-xs">
                                Filial {f.name} ({f.code})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="room-floor" className="text-xs font-semibold">
                        Andar
                      </Label>
                      <Input
                        id="room-floor"
                        type="number"
                        min={1}
                        max={50}
                        value={formData.floor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            floor: Number.parseInt(e.target.value) || 1,
                          })
                        }
                        className="h-9 text-base sm:text-xs rounded-xl font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="room-capacity" className="text-xs font-semibold flex items-center justify-between">
                      <span>Capacidade de Pessoas</span>
                      <span className="text-muted-foreground font-mono font-normal">
                        {formData.capacity} pessoas
                      </span>
                    </Label>
                    <Input
                      id="room-capacity"
                      type="number"
                      min={1}
                      max={100}
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacity: Number.parseInt(e.target.value) || 1,
                        })
                      }
                      className="h-9 text-base sm:text-xs rounded-xl font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="room-desc" className="text-xs font-semibold">
                      Descrição & Comodidades
                    </Label>
                    <Textarea
                      id="room-desc"
                      placeholder="Ex: Equipada com Smart TV 55', mesa redonda de vidro e divisórias panorâmicas..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="text-sm rounded-xl resize-none"
                    />
                  </div>

                  <div className="pt-2 space-y-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <Maximize2 className="h-3 w-3" />
                      Tamanho Rápido no Mapa:
                    </Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SIZE_PRESETS.map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] rounded-lg justify-start truncate"
                          onClick={() => handleApplyPreset(preset.width, preset.height)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold">Posicionamento na Planta do Andar</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Clique e arraste sobre a planta para delimitar a posição da sala.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCenterRoom}
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Centralizar
                    </Button>
                  </div>

                  <div className="relative border rounded-xl overflow-hidden bg-muted/20 shadow-inner">
                    <svg
                      ref={svgRef}
                      viewBox="0 0 800 450"
                      className="w-full aspect-video bg-background select-none cursor-crosshair"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                    >
                      <defs>
                        <pattern id="form-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path
                            d="M 20 0 L 0 0 0 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            className="text-muted-foreground/15"
                          />
                        </pattern>
                      </defs>

                      <rect width="800" height="450" fill="url(#form-grid)" />

                      {siblingRooms.map((sibling) => {
                        const coords = sibling.coordinates || { x: 50, y: 50, width: 100, height: 80 }
                        return (
                          <g key={sibling.id} className="opacity-40">
                            <rect
                              x={coords.x}
                              y={coords.y}
                              width={coords.width}
                              height={coords.height}
                              rx="6"
                              className="fill-muted stroke-border"
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                            />
                            <text
                              x={coords.x + coords.width / 2}
                              y={coords.y + coords.height / 2}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-[10px] font-semibold fill-muted-foreground pointer-events-none"
                            >
                              {sibling.name}
                            </text>
                          </g>
                        )
                      })}

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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 bg-muted/40 p-2.5 rounded-xl border text-xs">
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase font-mono truncate block">Posição X</Label>
                      <Input
                        type="number"
                        min={0}
                        max={800}
                        className="h-7 text-base sm:text-xs font-mono rounded-lg"
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
                      <Label className="text-[10px] text-muted-foreground uppercase font-mono truncate block">Posição Y</Label>
                      <Input
                        type="number"
                        min={0}
                        max={450}
                        className="h-7 text-base sm:text-xs font-mono rounded-lg"
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
                      <Label className="text-[10px] text-muted-foreground uppercase font-mono truncate block">Largura (W)</Label>
                      <Input
                        type="number"
                        min={30}
                        max={800}
                        className="h-7 text-base sm:text-xs font-mono rounded-lg"
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
                      <Label className="text-[10px] text-muted-foreground uppercase font-mono truncate block">Altura (H)</Label>
                      <Input
                        type="number"
                        min={30}
                        max={450}
                        className="h-7 text-base sm:text-xs font-mono rounded-lg"
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
            )}

            {activeTab === "visual3d" && (
              <div className="space-y-6">
                {hasExistingModel && !isRegenerating ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <CheckCircle2 className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            Maquete 3D Ativa e Renderizada
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Esta sala possui um modelo diorama isométrico 3D gerado por IA vinculado.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs rounded-xl gap-1.5"
                          onClick={() => setIsRegenerating(true)}
                        >
                          <RefreshCw className="size-3 text-primary" />
                          Regenerar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                          onClick={() => {
                            setVisualModel(null)
                            toast({
                              title: "Maquete removida",
                              description: "A maquete 3D foi desvinculada desta sala. Salve as alterações para confirmar.",
                            })
                          }}
                        >
                          <Trash2 className="size-3" />
                          Excluir Maquete
                        </Button>
                      </div>
                    </div>

                    <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full border border-border/40 rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-md">
                      <IsometricRoomCanvas model={visualModel} interactive={true} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Card className="rounded-2xl border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <Info className="size-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground">
                            Como obter o melhor resultado:
                          </p>
                          <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                            <li>Faça upload de fotos amplas mostrando o piso, as paredes e a mesa central.</li>
                            <li>Garanta boa iluminação e fotos com os ângulos principais da sala.</li>
                            <li>A IA detectará automaticamente a disposição espacial e acabamentos da sala.</li>
                          </ul>
                        </div>
                      </div>
                    </Card>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          Fotos Reais da Sala
                        </Label>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {uploadedPhotos.length} foto(s) anexada(s)
                        </span>
                      </div>

                      <MultipleImageUpload
                        initialImages={uploadedPhotos}
                        onImagesChange={(imgs) => setUploadedPhotos(imgs)}
                        maxImages={6}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/60">
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Pronto para gerar?
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          O modelo de IA sintetizará a arquitetura e renderizará o diorama 3D em alta resolução.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isRegenerating && hasExistingModel && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 text-xs rounded-xl"
                            onClick={() => setIsRegenerating(false)}
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={() => void handleGenerateModel()}
                          disabled={isGeneratingModel || uploadedPhotos.length === 0}
                          className="h-9 rounded-xl gap-2 font-semibold text-xs shadow-sm"
                        >
                          {isGeneratingModel ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Renderizando Maquete 3D...
                            </>
                          ) : (
                            <>
                              <Sparkles className="size-4" />
                              Gerar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {visualModel && (
                      <div className="space-y-3 pt-2">
                        <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          Pré-visualização:
                        </Label>
                        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full border border-border/40 rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-md">
                          <IsometricRoomCanvas model={visualModel} interactive={true} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer do Modal */}
          <DialogFooter className="gap-2 sm:gap-0 p-6 pt-3 border-t bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending || isGeneratingModel}
              className="rounded-xl text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || isGeneratingModel}
              className="rounded-xl text-xs h-9 gap-2 font-semibold"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {roomToEdit ? "Salvar Alterações" : "Criar Sala"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
