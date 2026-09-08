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
import { formatCpf, formatCnpj, getDigits, isValidCpf, isValidCnpj } from "@/lib/document-validators"

interface CompleteProfileModalProps {
  isOpen: boolean
  user: {
    id?: string | null
    matricula?: string | null
    enterprise?: string | null
    setor?: string | null
    filialId?: string | null
    accountType?: "INDIVIDUAL" | "CORPORATE" | null
    cpf?: string | null
    cnpj?: string | null
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
  const [accountType, setAccountType] = useState<"INDIVIDUAL" | "CORPORATE">("INDIVIDUAL")
  const [cpf, setCpf] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [matricula, setMatricula] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [setor, setSetor] = useState("")
  const [filialId, setFilialId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  const { data: empresas = [] } = api.empresas.list.useQuery(undefined, { enabled: isOpen })
  const { data: filiaisData } = api.filiais.list.useQuery(undefined, { enabled: isOpen })

  // Verifica se o usuário já completou os dados básicos (matrícula, empresa, filial, setor)
  // e falta unicamente o documento (CPF ou CNPJ)
  const isFilialEnterprise = user?.enterprise === "Box_Filial" || user?.enterprise === "Cristallux_Filial"
  const hasCompletedBasicInfo = Boolean(
    user?.matricula?.trim() &&
    user?.enterprise &&
    user?.setor &&
    (!isFilialEnterprise || user?.filialId)
  )

  // Filiais da empresa selecionada
  const filiais = useMemo(() => {
    if (!filiaisData || !empresaId) return []
    return filiaisData.filter((f) => f.empresa.id === empresaId)
  }, [filiaisData, empresaId])

  // Atualizar os valores quando o modal abrir (pré-preenche empresa pela filial atual, se houver)
  useEffect(() => {
    if (isOpen && user) {
      setAccountType(user.accountType === "CORPORATE" ? "CORPORATE" : "INDIVIDUAL")
      setCpf(user.cpf ? formatCpf(user.cpf) : "")
      setCnpj(user.cnpj ? formatCnpj(user.cnpj) : "")
      setMatricula(user.matricula ?? "")
      setSetor(user.setor ?? "")
      setFilialId(user.filialId ?? "")
      const currentFilial = user.filialId && filiaisData
        ? filiaisData.find((f) => f.id === user.filialId)
        : undefined
      setEmpresaId(currentFilial?.empresa.id ?? "")
    }
  }, [isOpen, user, filiaisData])

  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast({
        title: hasCompletedBasicInfo ? "Documento cadastrado!" : "Perfil atualizado!",
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

    if (accountType === "INDIVIDUAL") {
      const cleanCpf = getDigits(cpf)
      if (!cleanCpf) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, informe seu CPF.",
          variant: "destructive",
        })
        return
      }
      if (!isValidCpf(cleanCpf)) {
        toast({
          title: "CPF inválido",
          description: "Por favor, informe um CPF válido com 11 dígitos.",
          variant: "destructive",
        })
        return
      }
    } else {
      const cleanCnpj = getDigits(cnpj)
      if (!cleanCnpj) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, informe o CNPJ da empresa.",
          variant: "destructive",
        })
        return
      }
      if (!isValidCnpj(cleanCnpj)) {
        toast({
          title: "CNPJ inválido",
          description: "Por favor, informe um CNPJ válido com 14 dígitos.",
          variant: "destructive",
        })
        return
      }
    }

    if (!hasCompletedBasicInfo) {
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

      if (!filialId.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, selecione sua filial.",
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
    }

    setIsLoading(true)

    updateProfileMutation.mutate({
      accountType,
      cpf: accountType === "INDIVIDUAL" ? getDigits(cpf) : null,
      cnpj: accountType === "CORPORATE" ? getDigits(cnpj) : null,
      matricula: (hasCompletedBasicInfo ? (user?.matricula ?? matricula) : matricula).trim(),
      setor: (hasCompletedBasicInfo ? (user?.setor ?? setor) : setor).trim(),
      filialId: (hasCompletedBasicInfo ? (user?.filialId ?? filialId) : filialId).trim(),
    })
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {hasCompletedBasicInfo ? "Documento Obrigatório" : "Perfil Obrigatório"}
          </DialogTitle>
          <DialogDescription>
            {hasCompletedBasicInfo
              ? "Para continuar usando a plataforma, informe seu documento obrigatório (CPF ou CNPJ)."
              : "Para continuar usando a plataforma, confirme o tipo de conta e preencha seus dados cadastrais."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountType">Tipo de Perfil *</Label>
            <Select
              value={accountType}
              onValueChange={(value) => setAccountType(value as "INDIVIDUAL" | "CORPORATE")}
            >
              <SelectTrigger id="accountType">
                <SelectValue placeholder="Selecione o tipo de perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Colaborador</SelectItem>
                <SelectItem value="CORPORATE">Corporativo / Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {accountType === "INDIVIDUAL" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cpf">CPF do Colaborador *</Label>
                <span className="text-[11px] text-muted-foreground">Obrigatório e único</span>
              </div>
              <Input
                id="cpf"
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                autoComplete="off"
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cnpj">CNPJ da Empresa *</Label>
                <span className="text-[11px] text-muted-foreground">Uso institucional / Totem</span>
              </div>
              <Input
                id="cnpj"
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                autoComplete="off"
                autoFocus
              />
            </div>
          )}

          {!hasCompletedBasicInfo && (
            <>
              <div className="space-y-2">
                <Label htmlFor="matricula">Número de matrícula (utilizada no seu ponto)*</Label>
                <Input
                  id="matricula"
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder="Digite sua matrícula (ou 0 para PJ/Totem)"
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
            </>
          )}

          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Salvando..." : "Salvar e Continuar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
