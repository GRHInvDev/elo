"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/trpc/react"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Shield } from "lucide-react"
import type { LojinhaProfileFields } from "@/lib/lojinha-profile"

interface CompleteLojinhaProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: LojinhaProfileFields | null
  onSuccess: () => void
}

export function CompleteLojinhaProfileModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: CompleteLojinhaProfileModalProps) {
  const [lojinha_full_name, setLojinhaFullName] = useState("")
  const [lojinha_cpf, setLojinhaCpf] = useState("")
  const [lojinha_address, setLojinhaAddress] = useState("")
  const [lojinha_neighborhood, setLojinhaNeighborhood] = useState("")
  const [lojinha_cep, setLojinhaCep] = useState("")
  const [lojinha_rg, setLojinhaRg] = useState("")
  const [lojinha_email, setLojinhaEmail] = useState("")
  const [lojinha_phone, setLojinhaPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    if (open && user) {
      setLojinhaFullName(user.lojinha_full_name ?? "")
      setLojinhaCpf(user.lojinha_cpf ?? "")
      setLojinhaAddress(user.lojinha_address ?? "")
      setLojinhaNeighborhood(user.lojinha_neighborhood ?? "")
      setLojinhaCep(user.lojinha_cep ?? "")
      setLojinhaRg(user.lojinha_rg ?? "")
      setLojinhaEmail(user.lojinha_email ?? "")
      setLojinhaPhone(user.lojinha_phone ?? "")
    }
  }, [open, user])

  const updateLojinhaProfile = api.user.updateLojinhaProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Pré-cadastro concluído!",
        description: "Seus dados foram salvos. Você já pode finalizar seu pedido.",
      })
      onSuccess()
      onOpenChange(false)
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

  const getDigits = (value: string) => value.replace(/\D/g, "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const cpfDigits = getDigits(lojinha_cpf)
    const cepDigits = getDigits(lojinha_cep)
    const phoneDigits = getDigits(lojinha_phone)

    if (!lojinha_full_name.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o nome completo.", variant: "destructive" })
      return
    }
    if (cpfDigits.length !== 11) {
      toast({ title: "CPF inválido", description: "O CPF deve ter 11 dígitos.", variant: "destructive" })
      return
    }
    if (!lojinha_address.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o endereço completo.", variant: "destructive" })
      return
    }
    if (!lojinha_neighborhood.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o bairro.", variant: "destructive" })
      return
    }
    if (cepDigits.length !== 8) {
      toast({ title: "CEP inválido", description: "O CEP deve ter 8 dígitos.", variant: "destructive" })
      return
    }
    if (!lojinha_rg.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o RG.", variant: "destructive" })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lojinha_email.trim())) {
      toast({ title: "E-mail inválido", description: "Informe um e-mail válido.", variant: "destructive" })
      return
    }
    if (phoneDigits.length < 10) {
      toast({ title: "Telefone inválido", description: "O telefone deve ter pelo menos 10 dígitos.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    updateLojinhaProfile.mutate({
      lojinha_full_name: lojinha_full_name.trim(),
      lojinha_cpf: cpfDigits,
      lojinha_address: lojinha_address.trim(),
      lojinha_neighborhood: lojinha_neighborhood.trim(),
      lojinha_cep: cepDigits,
      lojinha_rg: lojinha_rg.trim(),
      lojinha_email: lojinha_email.trim(),
      lojinha_phone: phoneDigits,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Pré-cadastro para a Lojinha</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                Estes dados são para <strong>pré-cadastro no SIGIN</strong> e agilizam o processo de compra.
                Seus dados estão seguros e são tratados conforme nossa{" "}
                <Link href="/lgpd" className="text-primary underline hover:no-underline">
                  política de privacidade (LGPD)
                </Link>
                .
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 flex-shrink-0" />
                Preencha todos os campos para continuar com o pedido.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lojinha_full_name">Nome completo *</Label>
                <Input
                  id="lojinha_full_name"
                  value={lojinha_full_name}
                  onChange={(e) => setLojinhaFullName(e.target.value)}
                  placeholder="Nome completo"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lojinha_cpf">CPF *</Label>
                <Input
                  id="lojinha_cpf"
                  value={lojinha_cpf}
                  onChange={(e) => setLojinhaCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="Apenas números (11 dígitos)"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lojinha_address">Endereço completo *</Label>
                <Input
                  id="lojinha_address"
                  value={lojinha_address}
                  onChange={(e) => setLojinhaAddress(e.target.value)}
                  placeholder="Rua, número, complemento"
                  autoComplete="street-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lojinha_neighborhood">Bairro *</Label>
                <Input
                  id="lojinha_neighborhood"
                  value={lojinha_neighborhood}
                  onChange={(e) => setLojinhaNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  autoComplete="address-level2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lojinha_cep">CEP *</Label>
                <Input
                  id="lojinha_cep"
                  value={lojinha_cep}
                  onChange={(e) => setLojinhaCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="Apenas números (8 dígitos)"
                  autoComplete="postal-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lojinha_rg">RG *</Label>
                <Input
                  id="lojinha_rg"
                  value={lojinha_rg}
                  onChange={(e) => setLojinhaRg(e.target.value)}
                  placeholder="RG"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lojinha_email">E-mail *</Label>
                <Input
                  id="lojinha_email"
                  type="email"
                  value={lojinha_email}
                  onChange={(e) => setLojinhaEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lojinha_phone">Contato telefônico *</Label>
                <Input
                  id="lojinha_phone"
                  value={lojinha_phone}
                  onChange={(e) => setLojinhaPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="Apenas números (mín. 10 dígitos)"
                  autoComplete="tel"
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isLoading} size="lg" className="min-w-[140px]">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Salvando..." : "Salvar e continuar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
