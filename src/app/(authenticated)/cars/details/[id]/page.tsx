import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Car, Calendar, ArrowLeft, MapPin, Users, Clock, Fuel, Sparkles, AlertTriangle, LucideUser } from "lucide-react"
import { api } from "@/trpc/server"
import { Badge } from "@/components/ui/badge"
import { RentVehicleButton } from "@/components/rent-vehicle-button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default async function VehicleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const vehicle = await api.vehicle.getById(id)

  if (!vehicle) {
    notFound()
  }

  return (
    <div className="container max-w-5xl py-8 mx-auto">
      <Link
        href="/cars/details"
        className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para lista de veículos
      </Link>

      <Card className="overflow-hidden border-none shadow-lg">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="relative aspect-video overflow-hidden md:aspect-square">
            <Image
              src={vehicle.imageUrl || "/placeholder.svg"}
              alt={vehicle.model}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute top-4 right-4">
              <Badge
                className={cn(
                  "text-sm font-medium px-3 py-1",
                  vehicle.availble ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600",
                )}
              >
                {vehicle.availble ? "Disponível" : "Indisponível"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col p-6">
            <div className="mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{vehicle.model}</h1>
                  <p className="text-xl text-muted-foreground">{vehicle.plate}</p>
                </div>
                <Badge variant="outline" className="text-sm font-medium border-2 px-3 py-1">
                  {vehicle.enterprise}
                </Badge>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Car className="h-4 w-4" />
                  <span>Quilometragem</span>
                </div>
                <p className="font-semibold text-lg">{Number(vehicle.kilometers).toLocaleString()} km</p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Reservas</span>
                </div>
                <p className="font-semibold text-lg">{vehicle.rents.length}</p>
              </div>
            </div>

            <div className="mt-auto">
              <RentVehicleButton vehicleId={vehicle.id} />
            </div>
          </div>
        </div>
      </Card>

      {vehicle.rents.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Histórico de reservas</h2>
          <div className="space-y-4">
            {vehicle.rents.map((rent) => {
              const observation = rent.observation ? JSON.parse(JSON.stringify(rent.observation)) as {
                gasLevel: "Reserva" | "1/4" |"1/2" | "3/4" | "Cheio",
                needCleaning: boolean,
                considerations?: string
              } : null

              return (
                <Card key={rent.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={rent.user.imageUrl ?? undefined} alt={rent.user.firstName ?? ""} />
                          <AvatarFallback>
                            {rent.user.firstName?.[0]}
                            {rent.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {rent.user.firstName} {rent.user.lastName}
                          </CardTitle>
                        </div>
                      </div>
                      <Badge variant={rent.finished ? "outline" : "secondary"} className="ml-auto">
                        {rent.finished ? "Finalizado" : "Em andamento"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      {rent.driver && (
                        <div className="flex items-start gap-2">
                          <LucideUser className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Motorista</p>
                            <p className="text-sm text-muted-foreground">{rent.driver}</p>
                          </div>
                        </div>
                      )}

                      {rent.passangers && (
                        <div className="flex items-start gap-2">
                          <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Passageiros</p>
                            <p className="text-sm text-muted-foreground">{rent.passangers}</p>
                          </div>
                        </div>
                      )}

                      {rent.possibleEnd && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Data de início</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(rent.startDate.setHours(rent.startDate.getHours() + 3)), "Pp", { locale: ptBR, })}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {rent.possibleEnd && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Retorno previsto</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(rent.possibleEnd.setHours(rent.possibleEnd.getHours() + 3)), "Pp", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      )}

                      {rent.destiny && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Destino</p>
                            <p className="text-sm text-muted-foreground">{rent.destiny}</p>
                          </div>
                        </div>
                      )}

                      {rent.initialKm && (
                        <div className="flex items-start gap-2">
                          <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Km inicial</p>
                            <p className="text-sm text-muted-foreground">
                              {Number(rent.initialKm).toLocaleString()} km
                            </p>
                          </div>
                        </div>
                      )}

                      {rent.finalKm && (
                        <div className="flex items-start gap-2">
                          <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Km final</p>
                            <p className="text-sm text-muted-foreground">
                              {Number(rent.finalKm).toLocaleString()} km
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {observation && (
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="font-semibold mb-4">Observações</h3>
                        <div className="grid gap-4 md:grid-cols-3">
                          {observation.gasLevel && (
                            <div className="flex items-start gap-2">
                              <Fuel className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium">Nível de combustível</p>
                                <p className="text-sm text-muted-foreground">{observation.gasLevel}</p>
                              </div>
                            </div>
                          )}

                          {observation.needCleaning !== undefined && (
                            <div className="flex items-start gap-2">
                              <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium">Necessita limpeza</p>
                                <p className="text-sm text-muted-foreground">
                                  {observation.needCleaning ? "Sim" : "Não"}
                                </p>
                              </div>
                            </div>
                          )}

                          {observation.considerations && (
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium">Considerações</p>
                                <p className="text-sm text-muted-foreground">{observation.considerations}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
