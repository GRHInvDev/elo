"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type Vehicle } from "@prisma/client"


export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter()

  const handleRentClick = () => {
    router.push(`/cars/details/${vehicle.id}/rent`)
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-48 w-full">
        <Image
          src={vehicle.imageUrl || "/placeholder.svg"}
          alt={vehicle.model}
          className="object-cover"
          width={300}
          height={300}
        />
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
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Car className="h-4 w-4" />
          <span>{Number(vehicle.kilometers).toLocaleString()} km rodados</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/cars/details/${vehicle.id}`}>Ver detalhes</Link>
        </Button>
        <Button size="sm" onClick={handleRentClick}>
          Alugar
        </Button>
      </CardFooter>
    </Card>
  )
}

