"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import {
  DoorClosed,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  Layers,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { type Coordinates, type Room } from "@/types/room"
import { RoomFloorPlan } from "./room-floor-plan"
import { RoomFormDialog } from "./room-form-dialog"
import { RoomDeleteDialog } from "./room-delete-dialog"

export function RoomAdmin() {
  const { toast } = useToast()
  const utils = api.useUtils()

  // Queries
  const { data: rawRooms, isLoading: isLoadingRooms } = api.room.list.useQuery()
  const { data: filiaisData = [] } = api.filiais.list.useQuery()

  const filiaisWithRooms = useMemo(() => {
    return filiaisData.filter((f) => f.hasRoom)
  }, [filiaisData])

  // Normalização das salas
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
        filial: (r as { filial?: string }).filial ?? "",
        photos: r.photos ?? [],
        visualModel: r.visualModel ?? undefined,
        coordinates: {
          x: Number(coords?.x) || 50,
          y: Number(coords?.y) || 50,
          width: Number(coords?.width) || 100,
          height: Number(coords?.height) || 80,
        },
        bookings: r.bookings ?? [],
      }
    })
  }, [rawRooms])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilialFilter, setSelectedFilialFilter] = useState<string>("ALL")
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>("ALL")
  const [activeTab, setActiveTab] = useState<string>("list")

  const [mapViewerFilial, setMapViewerFilial] = useState<string>("")
  const [mapViewerFloor, setMapViewerFloor] = useState<number>(1)

  useEffect(() => {
    if (filiaisWithRooms.length > 0 && (!mapViewerFilial || !filiaisWithRooms.some((f) => f.code === mapViewerFilial))) {
      setMapViewerFilial(filiaisWithRooms[0]?.code ?? "")
    }
  }, [filiaisWithRooms, mapViewerFilial])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)

  const availableFloors = useMemo(() => {
    const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b)
    return floors.length ? floors : [1]
  }, [rooms])

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchSearch =
        searchTerm === "" ||
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Boolean(room.description?.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchFilial =
        selectedFilialFilter === "ALL" || (room.filial ?? "") === selectedFilialFilter

      const matchFloor =
        selectedFloorFilter === "ALL" || room.floor.toString() === selectedFloorFilter

      return matchSearch && matchFilial && matchFloor
    })
  }, [rooms, searchTerm, selectedFilialFilter, selectedFloorFilter])

  const deleteRoom = api.room.delete.useMutation({
    onSuccess: async () => {
      toast({
        title: "Sala excluída com sucesso!",
        description: "A sala e suas reservas associadas foram removidas.",
      })
      setRoomToDelete(null)
      await utils.room.list.invalidate()
      await utils.room.listAvailable.invalidate()
      await utils.booking.list.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir sala",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleOpenCreate = () => {
    setRoomToEdit(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = useCallback((room: Room) => {
    setRoomToEdit(room)
    setIsFormOpen(true)
  }, [])

  const handleDeleteConfirm = async (roomId: string) => {
    await deleteRoom.mutateAsync({ id: roomId })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
            Gerenciamento de Salas
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cadastre salas, posicione-as na planta baixa e gere maquetes.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="shrink-0 size-9 sm:size-auto sm:h-9 sm:px-4 rounded-xl shadow-sm gap-2 p-0 cursor-pointer"
          title="Nova Sala"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline text-xs font-semibold">Nova Sala</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="list" className="gap-2 rounded-lg text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Lista de Salas ({rooms.length})
            </TabsTrigger>
            <TabsTrigger value="floorplan" className="gap-2 rounded-lg text-xs">
              <Layers className="h-3.5 w-3.5" />
              Planta Baixa Interativa
            </TabsTrigger>
          </TabsList>

          {activeTab === "list" && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[200px] sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome ou recurso..."
                  className="pl-8 h-9 text-base sm:text-xs rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={selectedFilialFilter} onValueChange={setSelectedFilialFilter}>
                  <SelectTrigger className="flex-1 sm:w-[140px] h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Todas as Filiais</SelectItem>
                    {filiaisData.map((f) => (
                      <SelectItem key={f.id} value={f.code} className="text-xs">
                        Filial {f.name} ({f.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedFloorFilter} onValueChange={setSelectedFloorFilter}>
                  <SelectTrigger className="flex-1 sm:w-[130px] h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Andar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Todos Andares</SelectItem>
                    {availableFloors.map((fl) => (
                      <SelectItem key={fl} value={fl.toString()} className="text-xs">
                        {fl}º Andar
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="list" className="space-y-4 min-w-0">
          <Card className="rounded-2xl border-border/60 overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Salas Cadastradas</CardTitle>
                  <CardDescription className="text-xs">
                    {filteredRooms.length} {filteredRooms.length === 1 ? "sala encontrada" : "salas encontradas"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingRooms ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Carregando salas...</span>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <DoorClosed className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <h3 className="text-base font-semibold">Nenhuma sala encontrada</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md">
                    {searchTerm || selectedFilialFilter !== "ALL" || selectedFloorFilter !== "ALL"
                      ? "Nenhum resultado corresponde aos filtros aplicados."
                      : "Ainda não há salas cadastradas. Clique em 'Nova Sala' para adicionar."}
                  </p>
                  <Button onClick={handleOpenCreate} variant="outline" size="sm" className="mt-4 gap-2 rounded-xl text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Cadastrar Primeira Sala
                  </Button>
                </div>
              ) : (
                <>
                  {/* tabela para mobile */}
                  <div className="block sm:hidden divide-y divide-border/40">
                    {filteredRooms.map((room) => {
                      const has3DModel = Boolean(room.visualModel?.imageUrl)
                      return (
                        <div key={room.id} className="p-3.5 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-foreground truncate">{room.name}</p>
                              {room.description ? (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {room.description}
                                </p>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Sem descrição</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setMapViewerFilial(room.filial ?? "")
                                  setMapViewerFloor(room.floor)
                                  setActiveTab("floorplan")
                                }}
                                title="Ver na planta"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(room)}
                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-600/10"
                                title="Editar"
                              >   
                                <Pencil className="h-3 w-3" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRoomToDelete(room)}
                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Excluir"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                            <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0.5">
                              {room.filial ?? "-"}
                            </Badge>
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {room.floor}º Andar
                            </span>
                            <span className="text-muted-foreground/40">•</span>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Users className="h-3.5 w-3.5 text-primary" />
                              <span>{room.capacity} pessoas</span>
                            </div>
                            <span className="text-muted-foreground/40">•</span>
                            {has3DModel ? (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                                Maquete 3D
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px]">
                                Pendente
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* tabela para desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-semibold">Sala</TableHead>
                          <TableHead className="text-xs font-semibold">Filial</TableHead>
                          <TableHead className="text-xs font-semibold">Andar</TableHead>
                          <TableHead className="text-xs font-semibold">Capacidade</TableHead>
                          <TableHead className="text-xs font-semibold text-center">Maquete</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRooms.map((room) => {
                          const has3DModel = Boolean(room.visualModel?.imageUrl)
                          return (
                            <TableRow key={room.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell>
                                <div>
                                  <p className="font-semibold text-xs text-foreground">{room.name}</p>
                                  {room.description ? (
                                    <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
                                      {room.description}
                                    </p>
                                  ) : (
                                    <span className="text-[11px] text-muted-foreground italic">
                                      Sem descrição
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="font-mono text-[11px] px-2 py-0.5">
                                  {room.filial ?? "-"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs font-medium">{room.floor}º Andar</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Users className="h-3.5 w-3.5 text-primary" />
                                  <span>{room.capacity} pessoas</span>
                                </div>
                              </TableCell>
                              <TableCell className="flex items-center justify-center">
                                {has3DModel ? (
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[11px] font-semibold gap-1">
                                    Ativa
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground text-[11px]">
                                    Pendente
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                          onClick={() => {
                                            setMapViewerFilial(room.filial ?? "")
                                            setMapViewerFloor(room.floor)
                                            setActiveTab("floorplan")
                                          }}
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs">Ver na planta baixa</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEdit(room)}
                                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-600/10"
                                  >   
                                    <Pencil className="h-3 w-3" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRoomToDelete(room)}
                                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="floorplan" className="space-y-4 min-w-0">
          <Card className="rounded-2xl border-border/60 overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-semibold">Visualização da Planta Baixa</CardTitle>
                  <CardDescription className="text-xs">
                    Clique em qualquer sala para abrir o editor e ajustar suas dimensões e maquete 3D.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Filial:</span>
                    <Select value={mapViewerFilial} onValueChange={setMapViewerFilial}>
                      <SelectTrigger className="w-[110px] h-8 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filiaisWithRooms.map((f) => (
                          <SelectItem key={f.id} value={f.code} className="text-xs">
                            Filial {f.name} ({f.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Andar:</span>
                    <Select
                      value={mapViewerFloor.toString()}
                      onValueChange={(val) => setMapViewerFloor(Number(val))}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFloors.map((fl) => (
                          <SelectItem key={fl} value={fl.toString()} className="text-xs">
                            {fl}º Andar
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <RoomFloorPlan
                rooms={rooms}
                filial={mapViewerFilial}
                floor={mapViewerFloor}
                onRoomClick={handleOpenEdit}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Criação / Edição */}
      <RoomFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        roomToEdit={roomToEdit}
        allRooms={rooms}
        defaultFilial={selectedFilialFilter !== "ALL" ? selectedFilialFilter : (filiaisWithRooms[0]?.code ?? "")}
        defaultFloor={selectedFloorFilter !== "ALL" ? Number(selectedFloorFilter) : 1}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <RoomDeleteDialog
        room={roomToDelete}
        open={!!roomToDelete}
        onOpenChange={(open) => !open && setRoomToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteRoom.isPending}
      />
    </div>
  )
}
