import { notFound, redirect } from "next/navigation"
import { api } from "@/trpc/server"
import { RentForm } from "@/components/rent-form"
import { currentUser } from "@clerk/nextjs/server"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default async function RentVehicleModal({
  params,
}: {
  params:  Promise<{ id: string }>
}) {
  const user = await currentUser()
  const {id} = await params;

  if (!user) {
    redirect(`/sign-in?redirect_url=/vehicles/${id}/rent`)
  }

  const vehicle = await api.vehicle.getById({ id: id }).catch(() => null)

  if (!vehicle) {
    notFound()
  }

  // Verificar se o veículo está disponível
  if (!vehicle.availble) {
    redirect(`/vehicles/${id}?error=not_available`)
  }

  // Verificar se o usuário já tem um reserva ativo
  const activeRent = await api.vehicleRent.getMyActiveRent()

  if (activeRent) {
    redirect(`/vehicles/${id}?error=already_renting`)
  }

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reservar {vehicle.model}</DialogTitle>
        </DialogHeader>
        <RentForm vehicle={vehicle} isModal />
      </DialogContent>
    </Dialog>
  )
}

