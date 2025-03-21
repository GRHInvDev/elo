import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Car, Calendar } from "lucide-react"
import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { currentUser } from "@clerk/nextjs/server"
import { FinishRentButton } from "@/components/finish-rent-button"

export const metadata: Metadata = {
  title: "Dashboard | Intranet",
  description: "Gerencie suas reservas de veículos",
}

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in?redirect_url=/dashboard")
  }

  const activeRent = await api.vehicleRent.getMyActiveRent()

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Reserva de Veículos</h1>
        <p className="text-muted-foreground">Gerencie suas reservas de veículos</p>
      </div>

      {activeRent ? (
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Veículo Reservado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative aspect-video h-48 w-full overflow-hidden rounded-lg md:w-64">
                  <Image
                    src={activeRent.vehicle.imageUrl || "/placeholder.svg"}
                    alt={activeRent.vehicle.model}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 256px"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{activeRent.vehicle.model}</h2>
                      <p className="text-muted-foreground">{activeRent.vehicle.plate}</p>
                    </div>
                    <Badge>{activeRent.vehicle.enterprise}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span>{Number(activeRent.vehicle.kilometers).toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Alugado em: {new Date(activeRent.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <FinishRentButton rentId={activeRent.id} currentKilometers={parseInt(activeRent.vehicle.kilometers.toString())} />
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="mb-2 text-xl font-semibold">Nenhum veículo reservado</h2>
            <p className="mb-6 text-center text-muted-foreground">Você não possui nenhum veículo reservado no momento.</p>
            <Button asChild>
              <Link href="/cars/details">Ver veículos disponíveis</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

