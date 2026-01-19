"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@clerk/nextjs"

export function RentVehicleButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

  const handleRentClick = () => {
    if (!isSignedIn) {
      // Redirecionar para login com callback para a página de reserva
      router.push(`/sign-in?redirect_url=/cars/details/${vehicleId}/rent`)
      return
    }

    router.push(`/cars/details/${vehicleId}/rent`)
  }

  return (
    <Button size="lg" className="w-full" onClick={handleRentClick} disabled={!isLoaded}>
      Reservar este veículo
    </Button>
  )
}

