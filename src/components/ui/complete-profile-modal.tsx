"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/trpc/react"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CompleteProfileModalProps {
  isOpen: boolean
  user: {
    id: string
    matricula: string | null
    enterprise: string | null
    setor: string | null
    filialId: string | null
  } | null
  onSuccess: () => void
  onClose?: () => void
}

type FilialOption = {
  id: string
  name: string
  code: string
}

const enterprises = [
  { value: "Box", label: "Box" },
  { value: "Box_Filial", label: "Box Filial" },
  { value: "Cristallux", label: "Cristallux" },
  { value: "Cristallux_Filial", label: "Cristallux Filial" },
]

const setores = [
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "RECURSOS_HUMANOS", label: "Recursos Humanos" },
  { value: "TI", label: "Tecnologia da Informação" },
  { value: "MARKETING", label: "Marketing" },
  { value: "VENDAS", label: "Vendas" },
  { value: "LOGISTICA", label: "Logística" },
  { value: "INOVACAO", label: "Inovação" },
]

export function CompleteProfileModal({ isOpen, user, onSuccess, onClose }: CompleteProfileModalProps) {
  const [matricula, setMatricula] = useState("")
  const [enterprise, setEnterprise] = useState("")
  const [setor, setSetor] = useState("")
  const [filialId, setFilialId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()
  const { data: filiaisData = [] } = api.filiais.list.useQuery()
  const filiais = filiaisData as FilialOption[]
  const shouldRequireFilial = enterprise === "Box_Filial" || enterprise === "Cristallux_Filial"

  // Atualizar os valores quando o modal abrir
  useEffect(() => {
    if (isOpen && user) {
      setMatricula(user.matricula ?? "")
      setEnterprise(user.enterprise ?? "")
      setSetor(user.setor ?? "")
      setFilialId(user.filialId ?? "")
    }
  }, [isOpen, user])

  useEffect(() => {
    if (!shouldRequireFilial && filialId) {
      setFilialId("")
    }
  }, [shouldRequireFilial, filialId])

  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Perfil completado!",
        description: "Seus dados foram salvos com sucesso.",
      })
      onSuccess()
      onClose?.()
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message ?? "Ocorreu um erro ao salvar seus dados.",
        variant: "destructive",
      })
    },
    onSettled: () => {
      setIsLoading(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!matricula.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe seu número de matrícula.",
        variant: "destructive",
      })
      return
    }

    if (!enterprise.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione sua empresa.",
        variant: "destructive",
      })
      return
    }

    if (!setor.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe seu setor.",
        variant: "destructive",
      })
      return
    }
    if (shouldRequireFilial && !filialId.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione sua filial.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    updateProfileMutation.mutate({
      matricula: matricula.trim(),
      enterprise: enterprise.trim(),
      setor: setor.trim(),
      filialId: shouldRequireFilial ? filialId.trim() : null,
    })
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Perfil Obrigatório</DialogTitle>
          <DialogDescription>
            Para continuar usando a plataforma, informe seu número de matrícula, empresa e setor.
            <br />
            Se a empresa selecionada for Box Filial ou Cristallux Filial, você também precisa escolher a filial.
            <br />
            {`Se você trabalhar na modalidade PJ, pode anotar "Número da matrícula" como 0!`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="matricula">Número de matrícula (utilizada no seu ponto)*</Label>
            <Input
              id="matricula"
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Digite sua matrícula"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enterprise">Empresa *</Label>
            <Select value={enterprise} onValueChange={setEnterprise}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua empresa" />
              </SelectTrigger>
              <SelectContent>
                {enterprises.map((ent) => (
                  <SelectItem key={ent.value} value={ent.value}>
                    {ent.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="setor">Setor *</Label>
            <Select value={setor} onValueChange={setSetor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu setor" />
              </SelectTrigger>
              <SelectContent>
                {setores.map((setor) => (
                  <SelectItem key={setor.value} value={setor.value}>
                    {setor.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {shouldRequireFilial ? (
            <div className="space-y-2">
              <Label htmlFor="filial">Filial *</Label>
              <Select value={filialId} onValueChange={setFilialId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua filial" />
                </SelectTrigger>
                <SelectContent>
                  {filiais.map((filial) => (
                    <SelectItem key={filial.id} value={filial.id}>
                      {filial.name} ({filial.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="min-w-[120px]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Salvando..." : "Completar Perfil"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
