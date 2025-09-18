"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, User, Car, Clock, Fuel, ImageIcon } from "lucide-react"
import { api } from "@/trpc/react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"

export function VehicleUsageHistory() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const { data: vehicles } = api.vehicle.getAll.useQuery({
    limit: 100,
    availble: undefined,
  })

  const { data: vehicleHistory, isLoading } = api.vehicleRent.getAll.useQuery(
    {
      vehicleId: selectedVehicleId || undefined,
      limit: 50,
    },
    {
      enabled: !!selectedVehicleId,
    }
  )

  const selectedVehicle = vehicles?.items?.find(v => v.id === selectedVehicleId)

  // Limpar erros de imagem quando veículo muda
  useEffect(() => {
    if (selectedVehicleId) {
      setImageErrors(prev => {
        const newErrors = new Set(prev)
        // Remove erro do veículo atual se existir
        newErrors.delete(selectedVehicleId)
        return newErrors
      })
    }
  }, [selectedVehicleId])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Uso dos Veículos</CardTitle>
          <CardDescription>
            Visualize o histórico completo de reservas e uso dos veículos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um veículo para ver o histórico" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.items?.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} - {vehicle.plate} ({vehicle.enterprise})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedVehicleId && (
              <div className="border-t pt-4">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    {/* Imagem do Veículo */}
                    <div className="flex-shrink-0">
                      {selectedVehicle?.imageUrl && selectedVehicle.imageUrl.trim() !== '' && !imageErrors.has(selectedVehicle.id) ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-muted">
                          <Image
                            src={selectedVehicle.imageUrl}
                            alt={`Foto de ${selectedVehicle.model}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                            onError={() => {
                              setImageErrors(prev => new Set(prev).add(selectedVehicle.id))
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border-2 border-muted">
                          <Car className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mt-1">
                            {selectedVehicle?.imageUrl && selectedVehicle.imageUrl.trim() !== '' ? 'Erro na foto' : 'Sem foto'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Informações do Veículo */}
                    <div>
                        <h3 className="text-lg font-semibold mb-1">
                          Histórico de {selectedVehicle?.model} - {selectedVehicle?.plate}
                        </h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Empresa: <Badge variant="outline" className="ml-1">{selectedVehicle?.enterprise}</Badge></span>
                        <span>Quilometragem: {Number(selectedVehicle?.kilometers ?? 0).toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>

                  <Badge variant={selectedVehicle?.availble ? "default" : "secondary"} className="ml-4">
                    {selectedVehicle?.availble ? "Disponível" : "Indisponível"}
                  </Badge>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : vehicleHistory?.items?.length ? (
                  <div className="space-y-4">
                    {vehicleHistory.items.map((rent) => (
                      <Card key={rent.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {rent.user.firstName} {rent.user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {rent.user.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {format(new Date(rent.startDate), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {rent.endDate ? format(new Date(rent.endDate), "dd/MM/yyyy", { locale: ptBR }) : "Em andamento"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium truncate">
                                {rent.destiny || "Destino não informado"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Motorista: {rent.driver || "Não informado"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {rent.initialKm ? `${Number(rent.initialKm).toLocaleString()} km` : "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Final: {rent.finalKm ? `${Number(rent.finalKm).toLocaleString()} km` : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Reservado em {format(new Date(rent.startDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <Badge variant={rent.finished ? "default" : "secondary"}>
                              {rent.finished ? "Concluída" : "Ativa"}
                            </Badge>
                          </div>

                          {rent.observation && (
                            <div className="mt-2">
                              <p className="text-sm">
                                <strong>Observações:</strong> {rent.observation as string}
                              </p>
                            </div>
                          )}

                          {rent.passangers && (
                            <div className="mt-2">
                              <p className="text-sm">
                                <strong>Passageiros:</strong> {rent.passangers}
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Nenhum histórico encontrado</h3>
                    <p className="text-muted-foreground">
                      Este veículo ainda não possui reservas registradas.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!selectedVehicleId && (
              <div className="text-center py-12">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Selecione um veículo</h3>
                <p className="text-muted-foreground">
                  Escolha um veículo para visualizar seu histórico de uso.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Veículo Selecionado */}
      {selectedVehicleId && selectedVehicle && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vehicleHistory?.items?.length ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas Ativas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vehicleHistory?.items?.filter(r => !r.finished).length ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Km Rodados</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Number(selectedVehicle.kilometers).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Reserva</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {vehicleHistory?.items?.[0] ? (
                  format(new Date(vehicleHistory.items[0].startDate), "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  "Nunca usado"
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
