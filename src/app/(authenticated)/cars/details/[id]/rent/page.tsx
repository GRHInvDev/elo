import { notFound, redirect } from "next/navigation"
import { api } from "@/trpc/server"
import { RentForm } from "@/components/rent-form"
import { currentUser } from "@clerk/nextjs/server"


export default async function RentVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const {id} = await params;
  const user = await currentUser()

  if (!user) {
    redirect(`/sign-in?redirect_url=/vehicles/${id}/rent`)
  }

  const vehicle = await api.vehicle.getById({ id }).catch(() => null)

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
    <div className="container max-w-2xl py-8">
      <h1 className="mb-6 text-3xl font-bold">Alugar Veículo</h1>

      <RentForm vehicle={vehicle} />
    </div>
  )
}

