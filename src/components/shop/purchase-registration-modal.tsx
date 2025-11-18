"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import type { Enterprise } from "@prisma/client"

interface PurchaseRegistrationModalProps {
  enterprise: Enterprise
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PurchaseRegistrationModal({
  enterprise,
  open,
  onOpenChange,
  onSuccess
}: PurchaseRegistrationModalProps) {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [whatsapp, setWhatsapp] = useState("")

  // Buscar dados do usuário do sistema
  const { data: systemUser } = api.user.me.useQuery()

  // Preencher campos com dados do usuário quando modal abrir
  useEffect(() => {
    if (open && systemUser) {
      const firstName = systemUser.firstName ?? ""
      const lastName = systemUser.lastName ?? ""
      const trimmedName = `${firstName} ${lastName}`.trim()
      const fullNameFromSystem = trimmedName || (systemUser.email ?? "")
      
      if (!fullName) {
        setFullName(fullNameFromSystem)
      }
      if (!email) {
        setEmail(systemUser.email ?? "")
      }
    }
  }, [open, systemUser, fullName, email])

  const createRegistration = api.purchaseRegistration.createOrUpdate.useMutation({
    onSuccess: () => {
      toast.success("Cadastro realizado com sucesso!")
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(`Erro ao realizar cadastro: ${error.message}`)
    },
  })

  const handleSubmit = () => {
    if (!fullName || !phone || !email || !address) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    createRegistration.mutate({
      enterprise,
      fullName,
      phone,
      email,
      address,
      whatsapp: whatsapp || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastro para Compras</DialogTitle>
          <DialogDescription>
            Preencha seus dados para realizar compras na empresa {enterprise}.
            Estes dados serão utilizados para processamento do pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> O nome completo DEVE SER O NOME COMPLETO DO USUÁRIO.
              Você pode alterar manualmente se necessário.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="fullName">
              Nome Completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome completo do usuário"
              disabled={createRegistration.isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Este deve ser o nome completo do usuário do sistema
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Telefone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              disabled={createRegistration.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={createRegistration.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Endereço <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade - UF"
              disabled={createRegistration.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp para contato (opcional)</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(00) 00000-0000"
              disabled={createRegistration.isPending}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={createRegistration.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
              disabled={createRegistration.isPending || !fullName || !phone || !email || !address}
            >
              {createRegistration.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Cadastro"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

