"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

import { api } from "@/trpc/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { EmpresaFilialFilter, type EmpresaFilialValue } from "@/components/ui/empresa-filial-filter"

interface ManualRentFormProps {
  /** Chamado após criar o agendamento com sucesso (ex.: fechar o modal). */
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Agendamento manual feito por um admin em nome de outro usuário.
 * Reaproveita o filtro empresa→filial e os componentes do Design System.
 */
export function ManualRentForm({ onSuccess, onCancel }: ManualRentFormProps) {
  // Usuário alvo do agendamento
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<{ id: string; firstName: string | null; lastName: string | null; email: string } | null>(null)

  // Filtro de frota (padrão novo) + veículo escolhido
  const [empresaFilial, setEmpresaFilial] = useState<EmpresaFilialValue>({ empresaId: "", filialId: "" })
  const [vehicleId, setVehicleId] = useState("")

  // Datas e dados da viagem
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [driver, setDriver] = useState("")
  const [passangers, setPassangers] = useState("")
  const [destiny, setDestiny] = useState("")

  const { data: users, isLoading: isLoadingUsers } = api.user.listForChat.useQuery(
    { search: searchQuery },
    { enabled: searchQuery.length > 2 },
  )

  const { data: vehiclesData } = api.vehicle.getAll.useQuery({ limit: 100, availble: true })

  // Veículos disponíveis filtrados por empresa/filial (padrão novo).
  const vehicles = useMemo(() => {
    return (vehiclesData?.items ?? []).filter((vehicle) => {
      if (empresaFilial.filialId) return vehicle.filialId === empresaFilial.filialId
      if (empresaFilial.empresaId) return vehicle.filial?.empresa.id === empresaFilial.empresaId
      return true
    })
  }, [vehiclesData, empresaFilial])

  const createForUser = api.vehicleRent.createForUser.useMutation({
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso!")
      onSuccess()
    },
    onError: (error) => {
      toast.error("Erro ao criar agendamento: " + error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) {
      toast.error("Selecione o usuário do agendamento.")
      return
    }
    if (!vehicleId) {
      toast.error("Selecione o veículo.")
      return
    }
    if (isScheduled && (!scheduledDate || scheduledDate <= new Date())) {
      toast.error("A data de agendamento deve ser posterior à data atual.")
      return
    }
    if (!endDate || endDate <= new Date() || (scheduledDate && endDate <= scheduledDate)) {
      toast.error("A data de devolução deve ser posterior à data atual ou à data de agendamento.")
      return
    }
    if (driver.trim().length <= 2) {
      toast.error("Informe o motorista (mínimo 3 caracteres).")
      return
    }
    if (destiny.trim().length <= 2) {
      toast.error("Informe o destino (mínimo 3 caracteres).")
      return
    }

    createForUser.mutate({
      userId: selectedUser.id,
      vehicleId,
      possibleEnd: endDate,
      startDate: isScheduled ? scheduledDate : undefined,
      driver,
      destiny,
      passangers: passangers || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Usuário alvo */}
      <div className="space-y-2">
        <Label>Usuário *</Label>
        {selectedUser ? (
          <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-3">
            <div>
              <div className="font-medium">
                {selectedUser.firstName} {selectedUser.lastName}
              </div>
              <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUser(null)
                setSearchQuery("")
              }}
            >
              Limpar
            </Button>
          </div>
        ) : (
          <>
            <Input
              placeholder="Digite o nome ou email do usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isLoadingUsers && (
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            )}
            {users && users.length > 0 && (
              <div className="mt-1 max-h-40 space-y-1 overflow-y-auto rounded-md border p-1">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(user)
                      setSearchQuery("")
                    }}
                    className="w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Veículo */}
      <div className="space-y-2">
        <Label>Veículo *</Label>
        <EmpresaFilialFilter value={empresaFilial} onChange={setEmpresaFilial} />
        <Select value={vehicleId} onValueChange={setVehicleId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o veículo" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.model} — {vehicle.plate}
                {vehicle.filial ? ` (${vehicle.filial.name})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {vehicles.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum veículo disponível para o filtro selecionado.</p>
        )}
      </div>

      {/* Datas */}
      <div className="flex items-center space-x-2">
        <Switch id="manual-scheduled" checked={isScheduled} onCheckedChange={setIsScheduled} />
        <Label htmlFor="manual-scheduled">Agendar para data futura</Label>
      </div>

      {isScheduled && (
        <div className="space-y-2">
          <Label>Data e hora de início</Label>
          <DateTimePicker date={scheduledDate} setDate={setScheduledDate} />
        </div>
      )}

      <div className="space-y-2">
        <Label>Data e hora prevista para devolução *</Label>
        <DateTimePicker date={endDate} setDate={setEndDate} />
      </div>

      {/* Dados da viagem */}
      <div className="space-y-2">
        <Label>Quem vai dirigir? *</Label>
        <Input value={driver} onChange={(e) => setDriver(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Passageiros (opcional)</Label>
        <Input value={passangers} onChange={(e) => setPassangers(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Destino previsto *</Label>
        <Input value={destiny} onChange={(e) => setDestiny(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createForUser.isPending}>
          {createForUser.isPending ? "Salvando..." : "Criar Agendamento"}
        </Button>
      </div>
    </form>
  )
}
