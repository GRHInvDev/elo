"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import type { Enterprise, Vehicle } from "@prisma/client"

import { api } from "@/trpc/react"
import { VehicleCard } from "@/components/vehicle-card"
import { EnterpriseFilter } from "@/components/enterprise-filter"
import { VehicleCardSkeleton } from "@/components/vehicle-card-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Filter } from "lucide-react"


// O tipo Vehicle do Prisma tem 'kilometers' como bigint.
// Nossa API retorna como 'number'. Este tipo reflete a estrutura de dados da API.
type VehicleWithNumberKm = Omit<Vehicle, "kilometers"> & { kilometers: number }

function VehiclesPageContent() {
  const searchParams = useSearchParams()
  const enterprise = searchParams.get("enterprise") as Enterprise | null

  // Estados para filtros de data e horário específicos
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [filterApplied, setFilterApplied] = useState(false)

  // Query para filtro específico (data + hora)
  const {
    data: specificFilterData,
    isLoading,
    isError,
  } = api.vehicle.getAll.useQuery(
    {
      limit: 100,
      availble: true,
      checkDate: selectedDate,
      checkTime: selectedTime,
    },
    {
      enabled: filterApplied && !!selectedDate && !!selectedTime,
    },
  )

  const vehicles = specificFilterData?.items?.map(vehicle => ({
    ...vehicle,
    kilometers: Number(vehicle.kilometers)
  }) as VehicleWithNumberKm) ?? []

  const filteredVehicles = enterprise
    ? vehicles?.filter((vehicle) => vehicle.enterprise === enterprise)
    : vehicles

  // Funções para controlar os filtros
  const applyFilters = () => {
    if (selectedDate && selectedTime) {
      setFilterApplied(true)
    }
  }

  const clearFilters = () => {
    setSelectedDate("")
    setSelectedTime("")
    setFilterApplied(false)
  }

  return (
    <div className="container py-8 place-self-center">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Veículos Disponíveis</h1>
        <p className="text-muted-foreground">Selecione um veículo para alugar</p>
      </div>

      {/* Filtros por Data e Horário Específicos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrar por Data e Horário Específicos
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
                <Clock className="h-4 w-4" />
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

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <EnterpriseFilter selectedEnterprise={enterprise ?? undefined} />
      </div>

      {isLoading && (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && (isError || !filteredVehicles || filteredVehicles.length === 0) && (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold">
            {filterApplied ? "Nenhum veículo disponível" : "Aplique um filtro para ver os veículos"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {filterApplied
              ? `Não há veículos disponíveis para ${new Date(selectedDate).toLocaleDateString('pt-BR')} às ${selectedTime}.`
              : "Selecione uma data e horário para ver os veículos disponíveis."
            }
          </p>
          {filterApplied && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-4"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
        {filteredVehicles?.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={
      <div className="container py-8 place-self-center">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Veículos Disponíveis</h1>
          <p className="text-muted-foreground">Carregando veículos...</p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <VehiclesPageContent />
    </Suspense>
  )
}

