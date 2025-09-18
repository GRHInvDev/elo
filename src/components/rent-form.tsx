"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Car, Calendar, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/trpc/react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { type Vehicle, type VehicleRent } from "@prisma/client"
import { Input } from "./ui/input"

interface RentFormProps {
  vehicle: Vehicle
  isModal?: boolean
  editMode?: boolean
  existingRent?: VehicleRent & { vehicle: Vehicle }
  onCloseModal?: () => void
}

export function RentForm({ vehicle, isModal = false, editMode = false, existingRent, onCloseModal }: RentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScheduled, setIsScheduled] = useState(false)
  const [driver, setDriver] = useState<string>()
  const [passangers, setPassangers] = useState<string>()
  const [destiny, setDestiny] = useState<string>()
  const [endDate, setEndDate] = useState<Date>()
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)

  // Hook para criação
  const createRent = api.vehicleRent.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Veículo reservado com sucesso!",
        description: isScheduled
          ? "O veículo foi agendado para a data selecionada."
          : "Você pode visualizar suas reservas ativas no seu perfil.",
      })

      // Se estiver em modal, fechar o modal; senão, redirecionar
      if (isModal && onCloseModal) {
        onCloseModal()
      } else {
        router.push("/cars")
        router.refresh()
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao reservar veículo",
        description: error.message,
        variant: "destructive",
      })
      setIsSubmitting(false)
    },
  })

  // Hook para edição
  const editRent = api.vehicleRent.edit.useMutation({
    onSuccess: () => {
      toast({
        title: "Reserva atualizada com sucesso!",
        description: "As alterações foram salvas.",
      })

      // Se estiver em modal, fechar o modal; senão, redirecionar
      if (isModal && onCloseModal) {
        onCloseModal()
      } else {
        router.push("/cars")
        router.refresh()
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar reserva",
        description: error.message,
        variant: "destructive",
      })
      setIsSubmitting(false)
    },
  })

  // Carregar dados da reserva existente quando estiver no modo de edição
  useEffect(() => {
    if (editMode && existingRent) {
      // Verificar se a reserva tem data de início futura (agendada)
      const isFutureStart = existingRent.startDate > new Date()
      setIsScheduled(isFutureStart)

      if (isFutureStart) {
        setScheduledDate(existingRent.startDate)
      }

      setEndDate(existingRent.possibleEnd ?? undefined)
      setDriver(existingRent.driver)
      setPassangers(existingRent.passangers ?? "")
      setDestiny(existingRent.destiny)
    }
  }, [editMode, existingRent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validar a data agendada
    if (isScheduled && !scheduledDate) {
      toast({
        title: "Data inválida",
        description: "Por favor, selecione uma data e hora para o agendamento.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Verificar se a data é futura
    if (isScheduled && scheduledDate && scheduledDate <= new Date()) {
      toast({
        title: "Data inválida",
        description: "A data de agendamento deve ser posterior à data atual.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if(!endDate || endDate <= new Date() || (scheduledDate && endDate <= scheduledDate)){
      toast({
        title: "Data inválida",
        description: "A data de devolução deve ser posterior à data atual ou à data de agendamento.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }
    
    if(!driver || driver.trim().length <= 2){
      toast({
        title: "Nome do motorista inválido",
        description: "É necessário informar o motorista.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if(!destiny || destiny.trim().length <= 2){
      toast({
        title: "Destino inválido",
        description: "É necessário informar o destino.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (editMode && existingRent) {
      // Modo de edição
      editRent.mutate({
        id: existingRent.id,
        destiny: destiny,
        driver: driver,
        possibleEnd: endDate,
        passangers: passangers,
        startDate: isScheduled ? scheduledDate : undefined,
      })
    } else {
      // Modo de criação
      createRent.mutate({
        vehicleId: vehicle.id,
        destiny: destiny,
        driver: driver,
        possibleEnd: endDate,
        passangers: passangers,
        startDate: isScheduled ? scheduledDate : undefined,
      })
    }
  }

  const handleCancel = () => {
    if (isModal) {
      router.back()
    } else {
      router.push(`/cars/details/${vehicle.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 ">
      <div className="rounded-lg border p-4 bg-card/80">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={vehicle.imageUrl || "/placeholder.svg"}
              alt={vehicle.model}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{vehicle.model}</h3>
                <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
              </div>
              <Badge>{vehicle.enterprise}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              <span>{Number(vehicle.kilometers).toLocaleString()} km</span>
            </div>
          </div>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ao reservar este veículo, você assume a responsabilidade por ele até a devolução. Certifique-se de verificar as
          condições do veículo antes de sair.
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border p-4 bg-card/80">
        <h3 className="mb-4 font-semibold">Detalhes da reserva</h3>

        <div className="mb-4 flex items-center space-x-2">
          <Switch id="scheduled" checked={isScheduled} onCheckedChange={setIsScheduled} />
          <Label htmlFor="scheduled">Agendar para data futura</Label>
        </div>

        {isScheduled ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date-time">Data e hora de início</Label>
              <DateTimePicker date={scheduledDate} setDate={setScheduledDate} />
            </div>
            <p className="text-sm text-muted-foreground">O veículo será reservado para a data e hora selecionadas.</p>
          </div>
        ):(
          <>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Data de início: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mb-6">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Hora de início: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </>
        )}
        <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="date-time">Data e hora prevista para devolução</Label>
              <DateTimePicker date={endDate} setDate={setEndDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-time">Quem vai estar dirigindo?</Label>
              <Input required value={driver} onChange={(e)=>setDriver(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-time">Haverão passageiros na viagem? Se sim, colocar todos os nomes.</Label>
              <Input value={passangers} onChange={(e)=>setPassangers(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-time">Qual é o destino previsto?</Label>
              <Input required value={destiny} onChange={(e)=>setDestiny(e.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">
              Para devolver o veículo, acesse seu perfil e finalize a reserva.
            </p>
          </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Processando..." :
            editMode ?
              "Atualizar Reserva" :
              (isScheduled ? "Agendar Reserva" : "Confirmar Reserva")
          }
        </Button>
      </div>
    </form>
  )
}

