import { notFound, redirect } from "next/navigation"
import { api } from "@/trpc/server"
import { RentForm } from "@/components/rent-form"
import { currentUser } from "@clerk/nextjs/server"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default async function RentVehicleModal({
  params,
}: {
  params: { id: string }
}) {
  const user = await currentUser()

  if (!user) {
    redirect(`/sign-in?redirect_url=/vehicles/${params.id}/rent`)
  }

  const vehicle = await api.vehicle.getById({ id: params.id }).catch(() => null)

  if (!vehicle) {
    notFound()
  }

  // Verificar se o veículo está disponível
  if (!vehicle.availble) {
    redirect(`/vehicles/${params.id}?error=not_available`)
  }

  // Verificar se o usuário já tem um reserva ativo
  const activeRent = await api.vehicleRent.getMyActiveRent()

  if (activeRent) {
    redirect(`/vehicles/${params.id}?error=already_renting`)
  }

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Alugar {vehicle.model}</DialogTitle>
        </DialogHeader>
        <RentForm vehicle={vehicle} isModal />
      </DialogContent>
    </Dialog>
  )
}

