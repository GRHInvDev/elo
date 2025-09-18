"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Car, Users, TrendingUp } from "lucide-react"
import { api } from "@/trpc/react"

export function VehicleMetrics() {
  const { data: vehicles, isLoading } = api.vehicle.getAll.useQuery({
    limit: 1000,
    availble: undefined,
  })

  const { data: rents } = api.vehicleRent.getAll.useQuery({
    limit: 1000,
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  const totalVehicles = vehicles?.items?.length ?? 0
  const availableVehicles = vehicles?.items?.filter(v => v.availble).length ?? 0
  const unavailableVehicles = totalVehicles - availableVehicles

  const totalRents = rents?.items?.length ?? 0
  const activeRents = rents?.items?.filter(r => r.finished === false).length ?? 0
  const completedRents = totalRents - activeRents

  // Calcular estatísticas por empresa
  const vehiclesByEnterprise = vehicles?.items?.reduce((acc, vehicle) => {
    acc[vehicle.enterprise] = (acc[vehicle.enterprise] ?? 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  // Calcular quilometragem total
  const totalKilometers = vehicles?.items?.reduce((acc, vehicle) =>
    acc + Number(vehicle.kilometers ?? 0), 0
  ) ?? 0

  // Calcular média de reservas por veículo
  const avgRentsPerVehicle = totalVehicles > 0 ? (totalRents / totalVehicles).toFixed(1) : "0"

  // Veículos mais utilizados (baseado em número de reservas)
  const vehicleUsage = rents?.items?.reduce((acc, rent) => {
    acc[rent.vehicleId] = (acc[rent.vehicleId] ?? 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  const mostUsedVehicles = Object.entries(vehicleUsage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([vehicleId, count]) => {
      const vehicle = vehicles?.items?.find(v => v.id === vehicleId)
      return { vehicle, count }
    })
    .filter(item => item.vehicle)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              {availableVehicles} disponíveis, {unavailableVehicles} indisponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRents}</div>
            <p className="text-xs text-muted-foreground">
              {activeRents} ativas, {completedRents} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quilometragem Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKilometers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              km registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Uso</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRentsPerVehicle}</div>
            <p className="text-xs text-muted-foreground">
              reservas por veículo
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribuição por Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Empresa</CardTitle>
            <CardDescription>
              Número de veículos por empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(vehiclesByEnterprise).map(([enterprise, count]) => {
              const percentage = totalVehicles > 0 ? ((count / totalVehicles) * 100).toFixed(1) : "0"
              return (
                <div key={enterprise} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{enterprise}</span>
                    <span>{count} veículos ({percentage}%)</span>
                  </div>
                  <Progress value={Number(percentage)} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Status de Disponibilidade */}
        <Card>
          <CardHeader>
            <CardTitle>Status de Disponibilidade</CardTitle>
            <CardDescription>
              Veículos disponíveis vs indisponíveis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Disponíveis</span>
                <span>{availableVehicles} veículos ({totalVehicles > 0 ? ((availableVehicles / totalVehicles) * 100).toFixed(1) : "0"}%)</span>
              </div>
              <Progress value={totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Indisponíveis</span>
                <span>{unavailableVehicles} veículos ({totalVehicles > 0 ? ((unavailableVehicles / totalVehicles) * 100).toFixed(1) : "0"}%)</span>
              </div>
              <Progress value={totalVehicles > 0 ? (unavailableVehicles / totalVehicles) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Veículos Mais Utilizados */}
      <Card>
        <CardHeader>
          <CardTitle>Veículos Mais Utilizados</CardTitle>
          <CardDescription>
            Top 5 veículos com mais reservas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mostUsedVehicles.length > 0 ? (
              mostUsedVehicles.map(({ vehicle, count }, index) => (
                <div key={vehicle!.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      <span className="text-sm font-medium text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{vehicle!.model}</p>
                      <p className="text-sm text-muted-foreground">{vehicle!.plate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{count} reservas</p>
                    <Badge variant="outline">{vehicle!.enterprise}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma reserva encontrada</h3>
                <p className="text-muted-foreground">
                  Ainda não há dados de uso dos veículos.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
