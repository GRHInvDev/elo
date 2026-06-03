"use client"

import { useState, useEffect, useMemo } from "react"
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

const setores = [
  { value: "ADMINISTRATIVO", label: "Administrativo" },
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
  const [empresaId, setEmpresaId] = useState("")
  const [setor, setSetor] = useState("")
  const [filialId, setFilialId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  const { data: empresas = [] } = api.empresas.list.useQuery(undefined, { enabled: isOpen })
  const { data: filiaisData = [] } = api.filiais.list.useQuery(undefined, { enabled: isOpen })

  // Filiais da empresa selecionada
  const filiais = useMemo(
    () => filiaisData.filter((f) => f.empresa.id === empresaId),
    [filiaisData, empresaId],
  )

  // Atualizar os valores quando o modal abrir (pré-preenche empresa pela filial atual, se houver)
  useEffect(() => {
    if (isOpen && user) {
      setMatricula(user.matricula ?? "")
      setSetor(user.setor ?? "")
      setFilialId(user.filialId ?? "")
      const currentFilial = user.filialId
        ? filiaisData.find((f) => f.id === user.filialId)
        : undefined
      setEmpresaId(currentFilial?.empresa.id ?? "")
    }
  }, [isOpen, user, filiaisData])

  // Ao trocar de empresa, limpar a filial que não pertence mais à empresa selecionada
  useEffect(() => {
    if (!filialId) return
    const allowed = new Set(filiais.map((f) => f.id))
    if (!allowed.has(filialId)) {
      setFilialId("")
    }
  }, [filiais, filialId])

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

    if (!empresaId) {
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

    if (!filialId.trim()) {
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
      setor: setor.trim(),
      filialId: filialId.trim(),
    })
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Perfil Obrigatório</DialogTitle>
          <DialogDescription>
            Para continuar usando a plataforma, informe seu número de matrícula, empresa, filial e setor.
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
            <Label htmlFor="empresa">Empresa *</Label>
            <Select
              value={empresaId}
              onValueChange={(v) => {
                setEmpresaId(v)
                setFilialId("")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filial">Filial *</Label>
            <Select value={filialId} onValueChange={setFilialId} disabled={!empresaId}>
              <SelectTrigger>
                <SelectValue placeholder={empresaId ? "Selecione sua filial" : "Selecione a empresa primeiro"} />
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

          <div className="space-y-2">
            <Label htmlFor="setor">Setor *</Label>
            <Select value={setor} onValueChange={setSetor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu setor" />
              </SelectTrigger>
              <SelectContent>
                {setores.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
