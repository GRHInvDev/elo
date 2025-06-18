"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import type { Enterprise, Vehicle } from "@prisma/client"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { api } from "@/trpc/react"
import { VehicleCard } from "@/components/vehicle-card"
import { EnterpriseFilter } from "@/components/enterprise-filter"
import { VehicleCardSkeleton } from "@/components/vehicle-card-skeleton"
import { type DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"

const toLocalISO = (date: Date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}T00:00:00.000Z`
}

// O tipo Vehicle do Prisma tem 'kilometers' como bigint.
// Nossa API retorna como 'number'. Este tipo reflete a estrutura de dados da API.
type VehicleWithNumberKm = Omit<Vehicle, "kilometers"> & { kilometers: number }

export default function VehiclesPage() {
  const searchParams = useSearchParams()
  const enterprise = searchParams.get("enterprise") as Enterprise | null

  const [date, setDate] = useState<DateRange | undefined>(() => {
    const from = new Date()
    const to = addDays(from, 7)
    return { from, to }
  })

  const {
    data: vehicles,
    isLoading,
    isError,
  } = api.vehicle.getAvailable.useQuery(
    {
      startDate: date?.from ? new Date(toLocalISO(date.from)) : new Date(),
      endDate: date?.to ? new Date(toLocalISO(addDays(date.to, 1))) : addDays(new Date(), 7),
    },
    {
      enabled: !!date?.from && !!date?.to, // Só executa a query se as datas estiverem selecionadas
    },
  )

  const filteredVehicles = enterprise
    ? vehicles?.filter((vehicle) => vehicle.enterprise === enterprise)
    : vehicles

  return (
    <div className="container py-8 place-self-center">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Veículos Disponíveis</h1>
        <p className="text-muted-foreground">Selecione um veículo para alugar</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <EnterpriseFilter selectedEnterprise={enterprise ?? undefined} />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full md:w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd 'de' LLL, y", { locale: ptBR })} -{" "}
                    {format(date.to, "dd 'de' LLL, y", { locale: ptBR })}
                  </>
                ) : (
                  format(date.from, "dd 'de' LLL, y", { locale: ptBR })
                )
              ) : (
                <span>Selecione um período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
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
          <h2 className="text-xl font-semibold">Nenhum veículo disponível</h2>
          <p className="mt-2 text-muted-foreground">
            Não há veículos disponíveis para o período e filtros selecionados.
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
        {filteredVehicles?.map((vehicle: VehicleWithNumberKm) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  )
}

