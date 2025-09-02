"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/trpc/react"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CompleteProfileModalProps {
  isOpen: boolean
  user: {
    id: string
    enterprise: string | null
    setor: string | null
  } | null
  onSuccess: () => void
}

const enterprises = [
  { value: "Box", label: "Box" },
  { value: "Box_Filial", label: "Box Filial" },
  { value: "Cristallux", label: "Cristallux" },
]

const setores = [
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "INOVACAO", label: "Inovação" },
  { value: "LOGISTICA", label: "Logística" },
  { value: "MARKETING", label: "Marketing" },
  { value: "PROMOTORES", label: "Promotores" },
  { value: "RECURSOS HUMANOS", label: "Recursos Humanos" },
]

export function CompleteProfileModal({ isOpen, user, onSuccess }: CompleteProfileModalProps) {
  const [enterprise, setEnterprise] = useState("")
  const [setor, setSetor] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  // Atualizar os valores quando o modal abrir
  useEffect(() => {
    if (isOpen && user) {
      setEnterprise(user.enterprise ?? "")
      setSetor(user.setor ?? "")
    }
  }, [isOpen, user])

  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Perfil completado!",
        description: "Seus dados foram salvos com sucesso.",
      })
      onSuccess()
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

    setIsLoading(true)

    updateProfileMutation.mutate({
      enterprise: enterprise.trim(),
      setor: setor.trim(),
    })
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Perfil Obrigatório</DialogTitle>
          <DialogDescription>
            Para continuar usando a plataforma, é necessário completar seu perfil com informações de empresa e setor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
