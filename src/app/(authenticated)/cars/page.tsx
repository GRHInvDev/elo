"use client"

import Image from "next/image"
import Link from "next/link"
import { Car, Calendar, LucideFileVideo, User2Icon, MapPin, Edit } from "lucide-react"
import { api } from "@/trpc/react"
import type { VehicleRent, Vehicle } from "@prisma/client"
import { canLocateCars } from "@/lib/access-control"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FinishRentButton } from "@/components/vehicles/finish-rent-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { VehicleCalendar } from "@/components/vehicles/vehicle-calendar"
import { RentForm } from "@/components/vehicles/rent-form"
import { EmpresaFilialFilter, type EmpresaFilialValue } from "@/components/ui/empresa-filial-filter"
import { useState } from "react"

export default function DashboardPage() {
  const utils = api.useUtils()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRent, setSelectedRent] = useState<(VehicleRent & { vehicle: Vehicle }) | null>(null)
  // Veículo escolhido para reservar (abre o modal de intervalo + disponibilidade)
  const [reserveVehicle, setReserveVehicle] = useState<Vehicle | null>(null)
  // Filtro no padrão novo (empresa → filial)
  const [empresaFilial, setEmpresaFilial] = useState<EmpresaFilialValue>({ empresaId: "", filialId: "" })

  // Dados do usuário e reservas ativas
  const { data: userData } = api.user.me.useQuery()
  const { data: activeRent } = api.vehicleRent.getMyActiveRent.useQuery()

  // Catálogo: todos os veículos disponíveis (sem exigir filtro de data antes)
  const { data: vehiclesData, isLoading: isLoadingVehicles } = api.vehicle.getAll.useQuery({
    limit: 100,
    availble: true,
  })

  // Verificar se o usuário tem permissão para fazer reservas
  const canReserve = userData ? canLocateCars(userData.role_config) : false

  // Filtro de empresa/filial (padrão novo) sobre o catálogo
  const filteredVehicles = (vehiclesData?.items ?? []).filter((vehicle) => {
    if (empresaFilial.filialId) return vehicle.filialId === empresaFilial.filialId
    if (empresaFilial.empresaId) return vehicle.filial?.empresa.id === empresaFilial.empresaId
    return true
  })

  // Funções dos modais
  const openEditModal = (rent: VehicleRent & { vehicle: Vehicle }) => {
    setSelectedRent(rent)
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedRent(null)
  }

  // Fecha o modal de reserva e atualiza catálogo/reservas ativas
  const closeReserveModal = () => {
    setReserveVehicle(null)
    void utils.vehicleRent.getMyActiveRent.invalidate()
    void utils.vehicle.getAll.invalidate()
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
              Tutorial <LucideFileVideo className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tutorial: Reserva de carros</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <iframe className="w-full aspect-video" src="https://www.youtube.com/embed/oNtTySjnJSw?si=M8ZcgXk1ox0vpYMd" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reservas ativas do usuário */}
      {activeRent && activeRent.length > 0 && (
        <Card className="mb-6">
          {activeRent.map((actvRent: VehicleRent & { vehicle: Vehicle }, i: number) => (
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
                <Button variant="outline" size="sm" onClick={() => openEditModal(actvRent)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Reserva
                </Button>
                <FinishRentButton rentId={actvRent.id} currentKilometers={parseInt(actvRent.vehicle.kilometers.toString())} />
              </CardFooter>
            </div>
          ))}
        </Card>
      )}

      {/* Catálogo de veículos disponíveis para reserva */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Veículos disponíveis para reserva ({filteredVehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <EmpresaFilialFilter value={empresaFilial} onChange={setEmpresaFilial} />
          </div>

          {isLoadingVehicles ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando veículos...</p>
            </div>
          ) : filteredVehicles.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVehicles.map((vehicle) => (
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
                      onClick={() => canReserve && setReserveVehicle(vehicle)}
                    >
                      {canReserve ? "Reservar" : "Sem permissão para reservar"}
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
                Não há veículos disponíveis para o filtro selecionado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!canReserve && (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <h2 className="mb-2 text-xl font-semibold">Visualização de Veículos</h2>
            <p className="text-center text-muted-foreground">
              Você pode visualizar os veículos disponíveis, mas não possui permissão para fazer reservas.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="container place-self-center p-8 mt-4">
        <VehicleCalendar />
      </Card>

      {/* Modal de reserva: pede o intervalo e aponta disponibilidade */}
      <Dialog open={!!reserveVehicle} onOpenChange={(open) => !open && closeReserveModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reservar Veículo</DialogTitle>
          </DialogHeader>
          {reserveVehicle && (
            <RentForm vehicle={reserveVehicle} isModal onCloseModal={closeReserveModal} />
          )}
        </DialogContent>
      </Dialog>

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

      {/* Link auxiliar para a visão de catálogo dedicada (filtro por data/horário) */}
      {canReserve && (
        <div className="mt-6 flex items-center justify-center">
          <Link href="/cars/details" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Ver catálogo com filtro por data e horário específicos
          </Link>
        </div>
      )}
    </div>
  )
}
