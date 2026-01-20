"use client"

import { useState } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Car, Clock, MapPin, User, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RentForm } from "@/components/vehicles/rent-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { VehicleRent, Vehicle } from "@prisma/client"

type VehicleRentWithVehicle = VehicleRent & { vehicle: Vehicle }

export default function MyRentsPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRent, setSelectedRent] = useState<VehicleRentWithVehicle | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Buscar todas as reservas do usuário
  const { data: allRents, isLoading, error } = api.vehicleRent.getMyAllRents.useQuery({
    limit: 100,
    includeFinished: true,
  })

  // Função para abrir o modal de edição
  const openEditModal = (rent: VehicleRentWithVehicle) => {
    setSelectedRent(rent)
    setIsEditModalOpen(true)
  }

  // Função para fechar o modal
  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedRent(null)
  }

  // Filtrar reservas baseado no status e termo de busca
  const filteredRents = allRents?.items?.filter((rent) => {
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && !rent.finished) ||
      (filterStatus === "finished" && rent.finished)

    const matchesSearch =
      !searchTerm ||
      rent.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rent.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rent.destiny.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  }) ?? []

  const getStatusBadge = (rent: VehicleRentWithVehicle) => {
    if (rent.finished) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Finalizado</Badge>
    }

    const now = new Date()
    const endDate = rent.possibleEnd ? new Date(rent.possibleEnd) : null

    if (endDate && endDate < now) {
      return <Badge variant="destructive">Atrasado</Badge>
    }

    return <Badge variant="secondary">Em andamento</Badge>
  }

  const clearFilters = () => {
    setFilterStatus("all")
    setSearchTerm("")
  }

  if (isLoading) {
    return (
      <div className="place-self-center container py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="place-self-center container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Erro ao carregar reservas</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="place-self-center container py-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Minhas Reservas de Carros</h1>
        <p className="text-muted-foreground">Visualize e gerencie todas as suas reservas de veículos</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por veículo, motorista ou destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Em andamento</SelectItem>
                  <SelectItem value="finished">Finalizadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Reservas */}
      {filteredRents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {allRents?.items?.length === 0 ? "Nenhuma reserva encontrada" : "Nenhuma reserva corresponde aos filtros"}
            </h2>
            <p className="text-muted-foreground">
              {allRents?.items?.length === 0
                ? "Você ainda não fez nenhuma reserva de veículo."
                : "Tente ajustar os filtros para encontrar suas reservas."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRents.map((rent) => (
            <Card key={rent.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{rent.vehicle.model}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {rent.vehicle.plate} • {rent.vehicle.enterprise}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(rent)}
                    {!rent.finished && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(rent)}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(rent.startDate), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(rent.startDate), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {rent.possibleEnd ? format(new Date(rent.possibleEnd), "dd/MM/yyyy", { locale: ptBR }) : "Não definido"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rent.possibleEnd ? format(new Date(rent.possibleEnd), "HH:mm", { locale: ptBR }) : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{rent.driver}</p>
                      <p className="text-xs text-muted-foreground">Motorista</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{rent.destiny}</p>
                      <p className="text-xs text-muted-foreground">Destino</p>
                    </div>
                  </div>
                </div>

                {rent.passangers && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Passageiros:</strong> {rent.passangers}
                    </p>
                  </div>
                )}

                {rent.finished && rent.endDate && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Data de Devolução</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(rent.endDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {rent.finalKm && (
                        <div>
                          <p className="text-sm font-medium">Quilometragem Final</p>
                          <p className="text-sm text-muted-foreground">{rent.finalKm.toString()} km</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
          </DialogHeader>
          {selectedRent && (
            <RentForm
              vehicle={selectedRent.vehicle}
              editMode={true}
              existingRent={selectedRent}
              isModal={true}
              onCloseModal={closeEditModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
