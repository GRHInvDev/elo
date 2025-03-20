import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Car, Calendar, ArrowLeft } from "lucide-react"
import { api } from "@/trpc/server"
import { Badge } from "@/components/ui/badge"
import { RentVehicleButton } from "@/components/rent-vehicle-button"

export default async function VehicleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const {id} = await params;
  const vehicle = await api.vehicle.getById({ id })

  if (!vehicle) {
    notFound()
  }

  return (
    <div className="container py-8">
      <Link
        href="/vehicles"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para lista de veículos
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-video overflow-hidden rounded-lg md:aspect-square">
          <Image
            src={vehicle.imageUrl || "/placeholder.svg"}
            alt={vehicle.model}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="flex flex-col">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{vehicle.model}</h1>
              <p className="text-xl text-muted-foreground">{vehicle.plate}</p>
            </div>
            <Badge className="text-sm">{vehicle.enterprise}</Badge>
          </div>

          <div className="mb-6 space-y-3 border-y py-6">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-muted-foreground" />
              <span>{Number(vehicle.kilometers).toLocaleString()} km rodados</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>
                {vehicle.rents.length > 0 ? `${vehicle.rents.length} reservas anteriores` : "Nenhum reserva anterior"}
              </span>
            </div>
          </div>

          <div className="mt-auto">
            <RentVehicleButton vehicleId={vehicle.id} />
          </div>
        </div>
      </div>

      {vehicle.rents.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">Histórico de reservas</h2>
          <div className="space-y-4">
            {vehicle.rents.map((rent) => (
              <div key={rent.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {rent.user.imageUrl && (
                      <Image
                        src={rent.user.imageUrl ?? "/placeholder.svg"}
                        alt={rent.user.firstName ?? ""}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{rent.user.firstName}</p>
                      <p className="text-sm text-muted-foreground">{rent.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{new Date(rent.startDate).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">{rent.finished ? "Finalizado" : "Em andamento"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

