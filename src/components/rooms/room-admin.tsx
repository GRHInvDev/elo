"use client"

import React, { useState, useMemo, useCallback } from "react"
import {
  Building2,
  DoorClosed,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
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
import { FILIAIS, type Coordinates, type Room } from "@/types/room"
import { RoomFloorPlan } from "./room-floor-plan"
import { RoomFormDialog } from "./room-form-dialog"
import { RoomDeleteDialog } from "./room-delete-dialog"

export function RoomAdmin() {
  const { toast } = useToast()
  const utils = api.useUtils()

  // Queries
  const { data: rawRooms, isLoading: isLoadingRooms } = api.room.list.useQuery()

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
        filial: (r as { filial?: string }).filial ?? "SCS",
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

  const [mapViewerFilial, setMapViewerFilial] = useState<string>("SCS")
  const [mapViewerFloor, setMapViewerFloor] = useState<number>(1)

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
        selectedFilialFilter === "ALL" || (room.filial ?? "SCS") === selectedFilialFilter

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Salas</h1>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Nova Sala
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Lista de Salas
            </TabsTrigger>
            <TabsTrigger value="floorplan" className="gap-2">
              <Building2 className="h-4 w-4" />
              Planta Baixa Interativa
            </TabsTrigger>
          </TabsList>

          {activeTab === "list" && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome ou recurso..."
                  className="pl-8 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={selectedFilialFilter} onValueChange={setSelectedFilialFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Filial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Filiais</SelectItem>
                  {FILIAIS.map((f) => (
                    <SelectItem key={f} value={f}>
                      Filial {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFloorFilter} onValueChange={setSelectedFloorFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Andar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos Andares</SelectItem>
                  {availableFloors.map((floor) => (
                    <SelectItem key={floor} value={floor.toString()}>
                      {floor}º Andar
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Salas Cadastradas</CardTitle>
                  <CardDescription>
                    {filteredRooms.length} {filteredRooms.length === 1 ? "sala encontrada" : "salas encontradas"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingRooms ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <span>Carregando salas...</span>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <DoorClosed className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <h3 className="text-lg font-medium">Nenhuma sala encontrada</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    {searchTerm || selectedFilialFilter !== "ALL" || selectedFloorFilter !== "ALL"
                      ? "Nenhum resultado corresponde aos filtros aplicados."
                      : "Ainda não há salas cadastradas. Clique em 'Nova Sala' para adicionar."}
                  </p>
                  <Button onClick={handleOpenCreate} variant="outline" className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Cadastrar Primeira Sala
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sala</TableHead>
                        <TableHead>Filial</TableHead>
                        <TableHead>Andar</TableHead>
                        <TableHead>Capacidade</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-foreground">{room.name}</p>
                              {room.description ? (
                                <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                                  {room.description}
                                </p>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  Sem descrição
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono">
                              {room.filial ?? "SCS"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{room.floor}º Andar</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{room.capacity} pessoas</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setMapViewerFilial(room.filial ?? "SCS")
                                        setMapViewerFloor(room.floor)
                                        setActiveTab("floorplan")
                                      }}
                                    >
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver na planta baixa</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEdit(room)}
                                className="gap-1"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRoomToDelete(room)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="floorplan" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Visualização da Planta Baixa</CardTitle>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Filial:</span>
                    <Select value={mapViewerFilial} onValueChange={setMapViewerFilial}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
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

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Andar:</span>
                    <Select
                      value={mapViewerFloor.toString()}
                      onValueChange={(val) => setMapViewerFloor(Number(val))}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFloors.map((fl) => (
                          <SelectItem key={fl} value={fl.toString()}>
                            {fl}º Andar
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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

      <RoomFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        roomToEdit={roomToEdit}
        allRooms={rooms}
        defaultFilial={selectedFilialFilter !== "ALL" ? selectedFilialFilter : "SCS"}
        defaultFloor={selectedFloorFilter !== "ALL" ? Number(selectedFloorFilter) : 1}
      />

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
