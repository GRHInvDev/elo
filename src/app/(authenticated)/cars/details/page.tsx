import type { Metadata } from "next"
import { api } from "@/trpc/server"
import { VehicleCard } from "@/components/vehicle-card"
import { EnterpriseFilter } from "@/components/enterprise-filter"
import { Suspense } from "react"
import { VehicleCardSkeleton } from "@/components/vehicle-card-skeleton"

export const metadata: Metadata = {
  title: "Veículos Disponíveis | Intranet",
  description: "Lista de veículos disponíveis para reserva",
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams:  Promise<{ enterprise?: "NA" | "Box" | "RHenz" | "Cristallux" }>
}) {
  const { enterprise } = await searchParams;

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Veículos Disponíveis</h1>
        <p className="text-muted-foreground">Selecione um veículo para alugar</p>
      </div>

      <EnterpriseFilter selectedEnterprise={enterprise} />

      <Suspense
        fallback={
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <VehiclesList enterprise={enterprise} />
      </Suspense>
    </div>
  )
}

async function VehiclesList({
  enterprise,
}: {
  enterprise?: "NA" | "Box" | "RHenz" | "Cristallux"
}) {
  const vehicles = await api.vehicle.getAll({
    enterprise,
  })

  if (vehicles.items.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
        <h2 className="text-xl font-semibold">Nenhum veículo disponível</h2>
        <p className="mt-2 text-muted-foreground">Não há veículos disponíveis para reserva no momento.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
      {vehicles.items.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  )
}

