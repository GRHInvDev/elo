"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Car, LucideInfo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type Vehicle } from "@prisma/client"
import { cn } from "@/lib/utils"


export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter()

  const handleRentClick = () => {
    router.push(`/cars/details/${vehicle.id}/rent`)
  }

  return (
    <Card className="overflow-hidden flex flex-col">
      <div>
        <div className="relative h-48 w-full">
          <Image
            src={vehicle.imageUrl || "/placeholder.svg"}
            alt={vehicle.model}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="absolute -translate-y-16 w-full bg-gradient-to-t from-card to-transparent h-16"/>
        <div className={cn("absolute size-20 -translate-y-16 translate-x-2", vehicle.enterprise.toLowerCase() == "rhenz" && "-translate-y-10")}>
          <Image
              src={vehicle.enterprise.toLowerCase() == "box" ?"/LOGO BOX.png": vehicle.enterprise.toLowerCase() == "cristallux" ? "/icon_cristal.svg" : "/Logo R Henz.png"}
              alt={vehicle.model}
              fill
              className={cn("object-cover drop-shadow-md", vehicle.enterprise.toLowerCase() == "rhenz" && "filter invert dark:invert-0")}
              sizes="(max-width: 100px) 100vw, (max-width: 200px) 50vw, 33vw"
            />
        </div>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{vehicle.model}</CardTitle>
            <CardDescription>{vehicle.plate}</CardDescription>
          </div>
          <Badge>{vehicle.enterprise}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Car className="h-4 w-4" />
          <span>{Number(vehicle.kilometers).toLocaleString()} km rodados</span>
        </div>
        <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", vehicle.availble ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400")}>
          <LucideInfo className="h-4 w-4" />
          <span>{vehicle.availble? "Disponível agora" : "Em viagem"}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/cars/details/${vehicle.id}`}>Ver detalhes</Link>
        </Button>
        <Button size="sm" onClick={handleRentClick}>
          Reservar
        </Button>
      </CardFooter>
    </Card>
  )
}

