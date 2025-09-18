"use client"

import Image from "next/image"
import Link from "next/link"
import { Car, Calendar, LucideFileVideo, User2Icon, MapPin, PlusCircle, Clock } from "lucide-react"
import { api } from "@/trpc/react"
import type { VehicleRent, Vehicle } from "@prisma/client"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { canViewCars, canLocateCars } from "@/lib/access-control"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { RolesConfig } from "@/types/role-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FinishRentButton } from "@/components/finish-rent-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { VehicleCalendar } from "@/components/vehicles/vehicle-calendar"
import { RentForm } from "@/components/rent-form"
import { Edit } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DashboardPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRent, setSelectedRent] = useState<(VehicleRent & { vehicle: Vehicle }) | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [filterApplied, setFilterApplied] = useState(false)

  // Buscar dados do usuário e reservas ativas
  const { data: userData } = api.user.me.useQuery()
  const { data: activeRent } = api.vehicleRent.getMyActiveRent.useQuery()

  // Buscar veículos disponíveis quando filtro for aplicado
  const { data: availableVehicles, isLoading: isLoadingVehicles } = api.vehicle.getAll.useQuery(
    {
      limit: 100,
      availble: true,
      checkDate: filterApplied ? selectedDate : undefined,
      checkTime: filterApplied ? selectedTime : undefined,
    },
    {
      enabled: filterApplied,
    }
  )

  // Verificar se o usuário tem permissão para fazer reservas
  const canReserve = userData ? canLocateCars(userData.role_config) : false

  // Função para abrir o modal de edição
  const openEditModal = (rent: VehicleRent & { vehicle: Vehicle }) => {
    setSelectedRent(rent)
    setIsEditModalOpen(true)
  }

  // Função para fechar o modal
  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedRent(null)
  }

  // Função para aplicar filtros
  const applyFilters = () => {
    if (selectedDate && selectedTime) {
      setFilterApplied(true)
    }
  }

  // Função para limpar filtros
  const clearFilters = () => {
    setSelectedDate("")
    setSelectedTime("")
    setFilterApplied(false)
  }

  return (
    <div className="place-self-center container py-8">
      <div className="mb-8 flex justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Reserva de Veículos</h1>
          <p className="text-muted-foreground">Gerencie suas reservas de veículos</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              Tutorial <LucideFileVideo className="size-4"/>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Tutorial: Reserva de carros
              </DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <iframe className="w-full aspect-video" src="https://www.youtube.com/embed/oNtTySjnJSw?si=M8ZcgXk1ox0vpYMd" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros por Data e Horário */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtrar Veículos Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="filter-date">Data</Label>
              <Input
                id="filter-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="filter-time">Horário</Label>
              <Input
                id="filter-time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={applyFilters}
                disabled={!selectedDate || !selectedTime}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Aplicar Filtro
              </Button>
              {(selectedDate || selectedTime) && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados dos Filtros */}
      {filterApplied && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Veículos Disponíveis ({availableVehicles?.items?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingVehicles ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando veículos disponíveis...</p>
              </div>
            ) : availableVehicles?.items?.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableVehicles.items.map((vehicle) => (
                  <Card key={vehicle.id} className="p-4">
                    <div className="relative aspect-video h-32 w-full overflow-hidden rounded-lg mb-3">
                      <Image
                        src={vehicle.imageUrl || "/placeholder.svg"}
                        alt={vehicle.model}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 256px"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{vehicle.model}</h3>
                          <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                        </div>
                        <Badge variant="outline">{vehicle.enterprise}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Car className="h-4 w-4" />
                        <span>{Number(vehicle.kilometers).toLocaleString()} km</span>
                      </div>
                      <Button
                        className="w-full"
                        disabled={!canReserve}
                        asChild={canReserve}
                      >
                        {canReserve ? (
                          <Link href={`/cars/details/${vehicle.id}?date=${selectedDate}&time=${selectedTime}`}>
                            Reservar para {new Date(selectedDate).toLocaleDateString('pt-BR')}
                          </Link>
                        ) : (
                          <span>Sem permissão para reservar</span>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum veículo disponível</h3>
                <p className="text-muted-foreground">
                  Não há veículos disponíveis para a data e horário selecionados.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        {activeRent?.map((actvRent: VehicleRent & { vehicle: Vehicle }, i: number)=> (
        <div key={i} className="mb-4 border-b last:border-0">
          <CardHeader>
            <CardTitle>Veículo Reservado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative aspect-video h-48 w-full overflow-hidden rounded-lg md:w-64">
                <Image
                  src={actvRent.vehicle.imageUrl || "/placeholder.svg"}
                  alt={actvRent.vehicle.model}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 256px"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{actvRent.vehicle.model}</h2>
                    <p className="text-muted-foreground">{actvRent.vehicle.plate}</p>
                  </div>
                  <Badge>{actvRent.vehicle.enterprise}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{Number(actvRent.vehicle.kilometers).toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Reservado em: {new Date(actvRent.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User2Icon className="h-4 w-4 text-muted-foreground" />
                    <span>Motorista: {actvRent.driver}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Destino: {actvRent.destiny}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditModal(actvRent)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Reserva
            </Button>
            <FinishRentButton rentId={actvRent.id} currentKilometers={parseInt(actvRent.vehicle.kilometers.toString())} />
          </CardFooter>
        </div>
      )) }
        </Card>
      </div>
      { activeRent && activeRent.length > 0 && canReserve && (
        <div className="flex items-center justify-center w-full mt-4">
          <Link href="/cars/details">
            <Button>
                Reservar um novo veículo
                <PlusCircle className="size-4 ml-2"/>
            </Button>
          </Link>
        </div>
      )}
      { (!activeRent || activeRent.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="mb-2 text-xl font-semibold">
              {canReserve ? "Nenhum veículo reservado" : "Visualização de Veículos"}
            </h2>
            <p className="mb-6 text-center text-muted-foreground">
              {canReserve
                ? "Você não possui nenhum veículo reservado no momento."
                : "Você pode visualizar os veículos disponíveis, mas não possui permissão para fazer reservas."
              }
            </p>
            {canReserve && (
              <Button asChild>
                <Link href="/cars/details">Reservar um veículo</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      <Card className="container place-self-center p-8 mt-4">
        <VehicleCalendar/>
      </Card>

      {/* Modal de edição de reserva */}
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

