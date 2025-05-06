import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Car, Calendar, LucideFileVideo, User2Icon, MapPin, PlusCircle } from "lucide-react"
import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { currentUser } from "@clerk/nextjs/server"
import { FinishRentButton } from "@/components/finish-rent-button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VehicleCalendar } from "@/components/vehicles/vehicle-calendar"

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

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        {activeRent?.map((actvRent, i)=> (
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
          <CardFooter>
            <FinishRentButton rentId={actvRent.id} currentKilometers={parseInt(actvRent.vehicle.kilometers.toString())} />
          </CardFooter>
        </div>
      )) }
        </Card>
      </div>
      { activeRent.length > 0 && (
        <div className="flex items-center justify-center w-full mt-4">
          <Link href="/cars/details">
            <Button>
                Reservar um novo veículo
                <PlusCircle className="size-4 ml-2"/>
            </Button>
          </Link>
        </div>
      )}
      { activeRent.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="mb-2 text-xl font-semibold">Nenhum veículo reservado</h2>
            <p className="mb-6 text-center text-muted-foreground">Você não possui nenhum veículo reservado no momento.</p>
            <Button asChild>
              <Link href="/cars/details">Reservar um veículo</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      <Card className="container place-self-center p-8 mt-4">
        <VehicleCalendar/>
      </Card>
    </div>
  )
}

