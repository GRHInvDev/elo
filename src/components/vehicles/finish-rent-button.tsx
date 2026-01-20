"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Car, LucideInfo, LucideGauge, LucideSparkles, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/trpc/react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface FinishRentButtonProps {
  rentId: string
  currentKilometers: number
}

export function FinishRentButton({ rentId, currentKilometers }: FinishRentButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const utils = api.useUtils()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isNoUsageDialogOpen, setIsNoUsageDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [location, setLocation] = useState<GeolocationPosition | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [finalKilometers, setFinalKilometers] = useState<number>(currentKilometers)
  const [kilometersError, setKilometersError] = useState<string | null>(null)
  const [gasLevel, setGasLevel] = useState<"Reserva" | "1/4" | "1/2" | "3/4" | "Cheio">()
  const [needCleaning, setNeedCleaning] = useState<boolean>()
  const [considerations, setConsiderations] = useState<string>()
  const [noUsageReason, setNoUsageReason] = useState<string>("")

  const locationRequested = useRef(false)

  const finishRent = api.vehicleRent.finish.useMutation({
    onSuccess: async () => {
      toast({
        title: "Reserva finalizada com sucesso!",
        description: "O veículo foi devolvido com sucesso.",
      })
      setIsDialogOpen(false)
      // Invalidar queries relacionadas para atualizar a UI
      await utils.vehicleRent.getMyActiveRent.invalidate()
      router.refresh()
    },
    onError: (error) => {
      toast({
        title: "Erro ao finalizar reserva",
        description: error.message,
        variant: "destructive",
      })
      setIsSubmitting(false)
    },
  })

  const finishWithoutUsage = api.vehicleRent.finishWithoutUsage.useMutation({
    onSuccess: async () => {
      toast({
        title: "Reserva finalizada sem uso!",
        description: "O veículo foi devolvido sem alterações de quilometragem.",
      })
      setIsNoUsageDialogOpen(false)
      setNoUsageReason("")
      // Invalidar queries relacionadas para atualizar a UI
      await utils.vehicleRent.getMyActiveRent.invalidate()
      router.refresh()
    },
    onError: (error) => {
      toast({
        title: "Erro ao finalizar reserva",
        description: error.message,
        variant: "destructive",
      })
      setIsSubmitting(false)
    },
  })


  // Função para solicitar a localização apenas uma vez quando o diálogo é aberto
  useEffect(() => {
    if (isDialogOpen && !locationRequested.current) {
      locationRequested.current = true

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation(position)
            setLocationError(null)
          },
          (error) => {
            console.error("Erro ao obter localização:", error)
            setLocationError("Não foi possível obter sua localização. Por favor, tente novamente.")
          },
          {
            enableHighAccuracy: true, // Solicitar alta precisão
            timeout: 10000, // Timeout de 10 segundos
            maximumAge: 0, // Sempre obter a localização mais recente
          },
        )
      } else {
        setLocationError("Seu navegador não suporta geolocalização.")
      }
    }

    // Reset quando o diálogo é fechado
    if (!isDialogOpen) {
      locationRequested.current = false
    }
  }, [isDialogOpen])

  const handleFinishRent = () => {
    setIsDialogOpen(true)
  }

  const handleRetryLocation = () => {
    locationRequested.current = false
    setLocationError(null)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position)
          setLocationError(null)
        },
        (error) => {
          console.error("Erro ao obter localização:", error)
          setLocationError("Não foi possível obter sua localização. Por favor, tente novamente.")
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    } else {
      setLocationError("Seu navegador não suporta geolocalização.")
    }
  }

  const handleFinalKilometersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    setFinalKilometers(value)

    if (isNaN(value)) {
      setKilometersError("Por favor, insira um número válido.")
    } else if (value <= currentKilometers) {
      setKilometersError(`A quilometragem final deve ser maior que ${currentKilometers.toLocaleString()}.`)
    } else {
      setKilometersError(null)
    }
  }

  const handleConfirmFinish = () => {
    // Validar quilometragem
    if (isNaN(finalKilometers)) {
      setKilometersError("Por favor, insira um número válido.")
      return
    }

    if (finalKilometers <= currentKilometers) {
      setKilometersError(`A quilometragem final deve ser maior que ${currentKilometers.toLocaleString()}.`)
      return
    }

    if (!gasLevel) {
      toast({
        title: "Nível de combustível inválido",
        variant: "destructive",
        description: "É obrigatório informar o nível de gasolina.",
      })
      return
    }


    setIsSubmitting(true)

    finishRent.mutate({
      id: rentId,
      endLocation: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : undefined,
      observations: {
        gasLevel,
        needCleaning: !!needCleaning,
        considerations,
      },
      finalKm: finalKilometers,
    })
  }

  const handleConfirmFinishWithoutUsage = () => {
    setIsSubmitting(true)
    finishWithoutUsage.mutate({
      id: rentId,
      reason: noUsageReason || undefined,
    })
  }

  return (
    <>
      <div className="flex gap-2 ml-auto">
        <Button variant="outline" onClick={() => setIsNoUsageDialogOpen(true)}>
          <Ban className="h-4 w-4 mr-2" />
          Sem uso
        </Button>
        <Button onClick={handleFinishRent}>
          Finalizar Reserva
        </Button>
      </div>

      {/* Diálogo de finalização com uso */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Reserva</DialogTitle>
            <DialogDescription>
              Confirme a devolução do veículo. Informe a quilometragem final e as observações necessárias.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Seção de localização (opcional) */}
            <div className="space-y-2">
              <Label>Localização atual (opcional)</Label>
              {locationError ? (
                <div className="rounded-lg border border-muted bg-muted/10 p-4 text-muted-foreground">
                  <p>{locationError}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleRetryLocation}>
                    Tentar novamente
                  </Button>
                </div>
              ) : location ? (
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>Localização obtida com sucesso</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Latitude: {location.coords.latitude.toFixed(6)}
                    <br />
                    Longitude: {location.coords.longitude.toFixed(6)}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border p-4">
                  <p className="text-center text-muted-foreground">Obtendo sua localização...</p>
                </div>
              )}
            </div>

            {/* Seção de quilometragem */}
            <div className="space-y-2">
              <Label htmlFor="finalKilometers">Quilometragem final</Label>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="finalKilometers"
                  type="number"
                  value={finalKilometers || ""}
                  onChange={handleFinalKilometersChange}
                  placeholder="Insira a quilometragem atual"
                  className="flex-1"
                />
              </div>
              {kilometersError && <p className="text-sm text-destructive">{kilometersError}</p>}
              <p className="text-sm text-muted-foreground">
                Quilometragem atual: {currentKilometers} km
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalKilometers">Nível de combustível</Label>
              <div className="flex items-center gap-2">
                <LucideGauge className="h-5 w-5 text-muted-foreground" />
                <Select name="userId" defaultValue={"Reserva"} value={gasLevel} onValueChange={(v: "Reserva" | "1/4" | "1/2" | "3/4" | "Cheio") => setGasLevel(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={"Reserva"}>
                      Na Reserva
                    </SelectItem>
                    <SelectItem value={"1/4"}>
                      Com 1/4 de tanque
                    </SelectItem>
                    <SelectItem value={"1/2"}>
                      Com 1/2 de tanque
                    </SelectItem>
                    <SelectItem value={"3/4"}>
                      Com 3/4 de tanque
                    </SelectItem>
                    <SelectItem value={"Cheio"}>
                      Cheio
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Necessita de limpeza?</Label>
              <div className="flex items-center gap-2">
                <LucideSparkles className="h-5 w-5 text-muted-foreground" />
                <Switch checked={needCleaning} onCheckedChange={(e) => setNeedCleaning(e)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalKilometers">Considerações</Label>
              <div className="flex items-center gap-2">
                <LucideInfo className="h-5 w-5 text-muted-foreground" />
                <Textarea value={considerations} onChange={(e) => setConsiderations(e.target.value)} />
              </div>
              <p className="text-muted-foreground text-wrap">Diga se há algum problema com o veículo ou é necessário fazer algum serviço</p>
            </div>
          </div>

          <DialogFooter className="flex gap-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmFinish}
              disabled={
                isSubmitting ||
                !!kilometersError ||
                finalKilometers <= currentKilometers
              }
            >
              {isSubmitting ? "Finalizando..." : "Confirmar Devolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de finalização sem uso */}
      <Dialog open={isNoUsageDialogOpen} onOpenChange={setIsNoUsageDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Finalizar sem uso</DialogTitle>
            <DialogDescription>
              Confirme que o veículo não foi utilizado. A quilometragem permanecerá inalterada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Atenção:</strong> Ao finalizar sem uso, a quilometragem do veículo ({currentKilometers.toLocaleString()} km)
                será mantida e nenhuma informação de combustível será registrada.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="noUsageReason">Motivo (opcional)</Label>
              <Textarea
                id="noUsageReason"
                value={noUsageReason}
                onChange={(e) => setNoUsageReason(e.target.value)}
                placeholder="Ex: Viagem cancelada, reunião remarcada..."
              />
            </div>
          </div>

          <DialogFooter className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsNoUsageDialogOpen(false)
                setNoUsageReason("")
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmFinishWithoutUsage}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

