"use client"

import { useMemo, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/trpc/react"
import { useAccessControl } from "@/hooks/use-access-control"
import { useToast } from "@/hooks/use-toast"
import { Plus, ArrowUp, ArrowDown, X, Filter, Edit, Trash2, Users, Download } from "lucide-react"
import * as XLSX from "xlsx"
import type { custom_extension } from "@prisma/client"

type CustomExtensionWithCreator = custom_extension & {
  createdBy: {
    firstName: string | null
    lastName: string | null
  }
}

export default function ExtensionListPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para filtros da tabela
  const [tableFilters, setTableFilters] = useState({
    sortBy: 'name' as 'name' | 'email' | 'extension' | 'setor',
    sortOrder: 'asc' as 'asc' | 'desc',
    nameFilter: '',
    emailFilter: '',
    extensionFilter: '',
    setorFilter: '',
  })

  // Estado para o modal de adicionar contato
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    extension: "",
    description: "",
    setor: "",
  })

  // Estados para editar contato
  const [isEditContactOpen, setIsEditContactOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<CustomExtensionWithCreator | null>(null)
  const [editingUser, setEditingUser] = useState<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    extension: bigint | null;
    emailExtension: string | null;
    setor: string;
  } | null>(null)
  const [editContactForm, setEditContactForm] = useState({
    name: "",
    email: "",
    extension: "",
    description: "",
    setor: "",
  })
  const [editUserForm, setEditUserForm] = useState({
    extension: "",
    emailExtension: "",
    nameExtension: "",
    setorExtension: "",
  })

  // Estados para excluir contato
  const [isDeleteContactOpen, setIsDeleteContactOpen] = useState(false)
  const [deletingContact, setDeletingContact] = useState<{
    id: string
    name: string
    extension: bigint
    email?: string | null
    setor: string
    type: 'Colaborador' | 'Manual'
  } | null>(null)

  // Verificar permissões
  const { canManageExtensions } = useAccessControl()

interface ListaSetores {
    sector: string;
    users: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        setor: string;
        extension: bigint | null;
        emailExtension: string | null;
        nameExtension: string | null;
        setorExtension: string | null;
    }[];
    totalUsers: number;
}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: extensionsBySector, isLoading, refetch: refetchExtensions } = api.user.listExtensions.useQuery()
  const { data: customExtensions, refetch: refetchCustomExtensions } = api.user.listcustom_extensions.useQuery()
  const { toast } = useToast()

  // Função para refetch de todas as queries de ramais
  const refetchAllExtensions = async () => {
    await Promise.all([
      refetchExtensions(),
      refetchCustomExtensions()
    ])
  }

  // Mutations para gerenciar ramais
  const createCustomExtension = api.user.createcustom_extension.useMutation({
    onSuccess: (data) => {
      setIsAddContactOpen(false)
      setContactForm({ name: "", email: "", extension: "", description: "", setor: "" })
      void refetchAllExtensions()

      toast({
        title: "✅ Contato adicionado com sucesso!",
        description: `O contato "${data.name}" foi adicionado à lista de ramais.`,
      })
    },
    onError: (error) => {
      console.error("Erro ao criar contato:", error)

      // Mensagens específicas para diferentes tipos de erro
      let errorMessage = "Ocorreu um erro ao adicionar o contato."

      if (error.message?.includes("Este ramal já está sendo usado")) {
        errorMessage = "Este ramal já está sendo usado por outro contato."
      } else if (error.message?.includes("Você não tem permissão")) {
        errorMessage = "Você não tem permissão para adicionar contatos manuais."
      } else if (error.message?.includes("Nome é obrigatório")) {
        errorMessage = "O nome do contato é obrigatório."
      } else if (error.message?.includes("Ramal deve ser")) {
        errorMessage = "O ramal deve ser um número positivo."
      }

      toast({
        title: "❌ Erro ao adicionar contato",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  const updateCustomExtension = api.user.updatecustom_extension.useMutation({
    onSuccess: (data) => {
      setIsEditContactOpen(false)
      setEditingContact(null)
      setEditContactForm({ name: "", email: "", extension: "", description: "", setor: "" })
      void refetchAllExtensions()

      toast({
        title: "✅ Contato atualizado com sucesso!",
        description: `O contato "${data.name}" foi atualizado.`,
      })
    },
    onError: (error) => {
      console.error("Erro ao atualizar contato:", error)

      toast({
        title: "❌ Erro ao atualizar contato",
        description: "Ocorreu um erro ao atualizar o contato.",
        variant: "destructive",
      })
    },
  })

  const updateExtension = api.user.updateExtension.useMutation({
    onSuccess: (data) => {
      setIsEditContactOpen(false)
      setEditingUser(null)
      setEditUserForm({ extension: "", emailExtension: "", nameExtension: "", setorExtension: "" })
      void refetchAllExtensions()

      toast({
        title: "✅ Ramal atualizado com sucesso!",
        description: `O ramal de ${data.firstName} ${data.lastName} foi atualizado.`,
      })
    },
    onError: (error) => {
      console.error("Erro ao atualizar ramal:", error)

      toast({
        title: "❌ Erro ao atualizar ramal",
        description: "Ocorreu um erro ao atualizar o ramal.",
        variant: "destructive",
      })
      // indicar erro de email inválido
      if (error.message?.includes("Invalid email")) {
        toast({
          title: "❌ Erro ao atualizar ramal - Email inválido",
          description: "O email informado é inválido. Insira um email válido.",
          variant: "destructive",
        })
      }
    },
  })

  const deleteCustomExtension = api.user.deletecustom_extension.useMutation({
    onSuccess: () => {
      setIsDeleteContactOpen(false)
      setDeletingContact(null)
      void refetchAllExtensions()

      toast({
        title: "✅ Contato removido com sucesso!",
        description: "O contato foi removido da lista de ramais.",
      })
    },
    onError: (error) => {
      console.error("Erro ao excluir contato:", error)

      toast({
        title: "❌ Erro ao remover contato",
        description: "Ocorreu um erro ao remover o contato.",
        variant: "destructive",
      })
    },
  })


  // Transformar dados agrupados em array para renderização
  const sectorsList: ListaSetores[] = useMemo(() => {
    if (!extensionsBySector) return []

    return Object.entries(extensionsBySector).map(([sector, users]) => ({
      sector,
      users: (users as Array<{ 
        id: string; 
        email: string; 
        firstName: string | null; 
        lastName: string | null; 
        setor: string; 
        extension: bigint | null; 
        emailExtension: string | null;
        nameExtension: string | null;
        setorExtension: string | null;
    }>) ?? [],
      totalUsers: users?.length ?? 0,
    }))
  }, [extensionsBySector])

  // Lista de setores disponíveis
  const availableSectors = useMemo(() => {
    const sectors = new Set<string>()
    sectorsList.forEach(sector => sectors.add(sector.sector))
    if (customExtensions) {
      customExtensions
        .filter(extension => extension.setor)
        .forEach(extension => {
          sectors.add(String(extension.setor))
        })
    }
    return Array.from(sectors).sort()
  }, [sectorsList, customExtensions])

  // Dados combinados para a tabela (usuários + contatos manuais)
  const allContacts = useMemo(() => {
    const users: Array<{
      id: string
      name: string
      email: string | null
      extension: bigint
      setor: string
      type: 'Colaborador'
    }> = []

    const customContacts: Array<{
      id: string
      name: string
      email: string | null
      extension: bigint
      setor: string
      type: 'Manual'
    }> = []

    // Adicionar usuários
    sectorsList.forEach(sector => {
      sector.users.forEach(user => {
        users.push({
          id: user.id,
          name: user.nameExtension ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ?? 'Nome não informado',
          email: user.emailExtension ?? user.email,
          extension: user.extension ?? 0n,
          setor: user.setorExtension ?? user.setor,
          type: 'Colaborador' as const,
        })
      })
    })

    // Adicionar contatos manuais
    if (customExtensions) {
      customExtensions.forEach(contact => {
        customContacts.push({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          extension: contact.extension,
          setor: contact.setor ?? 'Sem setor',
          type: 'Manual' as const,
        })
      })
    }

    return [...users, ...customContacts]
  }, [sectorsList, customExtensions])

  // Função para exportar dados para Excel
  const handleExportToExcel = () => {
    try {
      // Preparar dados para exportação na ordem: SETOR | NOME | RAMAL | EMAIL
      const dataToExport = filteredAndSortedContacts.map(contact => ({
        "Setor": contact.setor,
        "Nome": contact.name,
        "Ramal": Number(contact.extension.toString()),
        "Email": contact.email ?? "",
      }))

      // Criar planilha
      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Lista de Ramais")

      // Gerar nome do arquivo com data atual
      const fileName = `lista_ramais_${new Date().toISOString().split('T')[0]}.xlsx`

      // Baixar arquivo
      XLSX.writeFile(wb, fileName)

      toast({
        title: "✅ Exportação concluída!",
        description: `Arquivo Excel "${fileName}" foi baixado com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      toast({
        title: "❌ Erro na exportação",
        description: "Ocorreu um erro ao gerar o arquivo Excel.",
        variant: "destructive",
      })
    }
  }

  // Dados filtrados e ordenados para a tabela
  const filteredAndSortedContacts = useMemo(() => {
    const filtered = allContacts.filter(contact => {
      const matchesName = tableFilters.nameFilter === '' ||
        contact.name.toLowerCase().includes(tableFilters.nameFilter.toLowerCase())

      const matchesEmail = tableFilters.emailFilter === '' ||
        (contact.email?.toLowerCase().includes(tableFilters.emailFilter.toLowerCase()) ?? false)

      const matchesExtension = tableFilters.extensionFilter === '' ||
        contact.extension.toString().includes(tableFilters.extensionFilter)

      const matchesSetor = tableFilters.setorFilter === '' ||
        contact.setor?.toLowerCase().includes(tableFilters.setorFilter.toLowerCase())

      return matchesName && matchesEmail && matchesExtension && matchesSetor
    })

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (tableFilters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'email':
          aValue = (a.email ?? '').toLowerCase()
          bValue = (b.email ?? '').toLowerCase()
          break
        case 'extension':
          aValue = a.extension.toString()
          bValue = b.extension.toString()
          break
        case 'setor':
          aValue = (a.setor || '').toLowerCase()
          bValue = (b.setor || '').toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return tableFilters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return tableFilters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [allContacts, tableFilters])

  // Função para adicionar contato
  const handleAddContact = () => {
    let extension: bigint
    try {
      extension = BigInt(contactForm.extension)
      if (extension < 1n) {
        console.error("Ramal deve ser um número positivo")
        return
      }
    } catch {
      console.error("Ramal deve ser um número válido")
      return
    }

    createCustomExtension.mutate({
      name: contactForm.name,
      email: contactForm.email || undefined,
      extension: extension.toString(),
      description: contactForm.description || undefined,
      setor: contactForm.setor || undefined,
    })
  }

  // Funções para editar contato/usuário
  const handleEditContact = (contact: CustomExtensionWithCreator) => {
    setEditingContact(contact)
    setEditingUser(null)
    setEditContactForm({
      name: contact.name,
      email: contact.email ?? "",
      extension: contact.extension.toString(),
      description: contact.description ?? "",
      setor: contact.setor ?? "",
    })
    setIsEditContactOpen(true)
  }

  const handleEditUser = (user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    extension: bigint | null;
    emailExtension: string | null;
    setor: string;
    nameExtension: string | null;
    setorExtension: string | null;
  }) => {
    setEditingUser(user)
    setEditingContact(null)
    setEditUserForm({
      extension: user.extension?.toString() ?? "",
      emailExtension: user.emailExtension ?? "",
      nameExtension: user.nameExtension ?? "",
      setorExtension: user.setorExtension ?? "",
    })
    setIsEditContactOpen(true)
  }

  const handleSaveEditContact = () => {
    if (editingContact) {
      // Editando contato manual
      let extension: bigint
      try {
        extension = BigInt(editContactForm.extension)
        if (extension < 1n) {
          console.error("Ramal deve ser um número positivo")
          return
        }
      } catch {
        console.error("Ramal deve ser um número válido")
        return
      }

      updateCustomExtension.mutate({
        id: editingContact.id,
        name: editContactForm.name,
        email: editContactForm.email || undefined,
        extension: extension.toString(),
        description: editContactForm.description || undefined,
      })
    } else if (editingUser) {
      // Editando usuário - atualizar ramal na tabela users
      let extension: bigint | undefined
      if (editUserForm.extension.trim()) {
        try {
          extension = BigInt(editUserForm.extension)
          if (extension < 0n) {
            console.error("Ramal deve ser um número positivo ou zero")
            return
          }
        } catch {
          console.error("Ramal deve ser um número válido")
          return
        }
      }

      updateExtension.mutate({
        userId: editingUser.id,
        extension: extension?.toString() ?? "0",
        emailExtension: editUserForm.emailExtension.trim() || undefined,
        nameExtension: editUserForm.nameExtension.trim() || undefined,
        setorExtension: editUserForm.setorExtension.trim() || undefined,
      })
    }
  }

  // Funções para excluir contato
  const handleDeleteContact = (contact: {
    id: string
    name: string
    extension: bigint
    email?: string | null
    setor: string
    type: 'Colaborador' | 'Manual'
  }) => {
    setDeletingContact(contact)
    setIsDeleteContactOpen(true)
  }

  const handleConfirmDeleteContact = () => {
    if (!deletingContact) return

    if (deletingContact.type === 'Manual') {
      // Excluir contato manual completamente
      deleteCustomExtension.mutate({
        id: deletingContact.id,
      })
    } else {
      // "Remover" usuário do canal do ramal (zerar extension e limpar personalizações)
      updateExtension.mutate({
        userId: deletingContact.id,
        extension: "0",
        emailExtension: undefined,
        nameExtension: undefined,
        setorExtension: undefined,
      })
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Lista de ramais</h2>
            <p className="text-muted-foreground">
              Lista de ramais telefônicos organizados por setor em ordem alfabética
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportToExcel}
              disabled={filteredAndSortedContacts.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            {canManageExtensions() && (
              <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Contato
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Contato Manual</DialogTitle>
                <DialogDescription>
                  Adicione um contato personalizado à lista de ramais.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contact-name">Nome *</Label>
                  <Input
                    id="contact-name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Nome do contato"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email">Email (opcional)</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-extension">Ramal/Telefone *</Label>
                  <Input
                    id="contact-extension"
                    type="number"
                    min="1"
                    max="99999999999"
                    value={contactForm.extension}
                    onChange={(e) => setContactForm({ ...contactForm, extension: e.target.value })}
                    placeholder="1234 ou 11987654321"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-setor">Setor (opcional)</Label>
                  <Select
                    value={contactForm.setor}
                    onValueChange={(value) => setContactForm({ ...contactForm, setor: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem setor</SelectItem>
                      {availableSectors.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contact-description">Descrição (opcional)</Label>
                  <Textarea
                    id="contact-description"
                    value={contactForm.description}
                    onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })}
                    placeholder="Descrição ou observações"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddContactOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddContact}
                  disabled={createCustomExtension.isPending || !contactForm.name.trim() || !contactForm.extension.trim()}
                >
                  {createCustomExtension.isPending ? "Adicionando..." : "Adicionar Contato"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
          </div>

          {/* Modal para editar contato */}
          {canManageExtensions() && (
            <Dialog open={isEditContactOpen} onOpenChange={setIsEditContactOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingContact ? "Editar Contato Manual" : "Editar Ramal do Usuário"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingContact
                      ? "Edite as informações do contato de ramal."
                      : "Edite o ramal e email personalizado do usuário."
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {editingContact ? (
                    // Formulário para contato manual
                    <>
                      <div>
                        <Label htmlFor="edit-contact-name">Nome *</Label>
                        <Input
                          id="edit-contact-name"
                          value={editContactForm.name}
                          onChange={(e) => setEditContactForm({ ...editContactForm, name: e.target.value })}
                          placeholder="Nome do contato"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-contact-email">Email (opcional)</Label>
                        <Input
                          id="edit-contact-email"
                          type="email"
                          value={editContactForm.email}
                          onChange={(e) => setEditContactForm({ ...editContactForm, email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-contact-extension">Ramal/Telefone *</Label>
                        <Input
                          id="edit-contact-extension"
                          type="number"
                          min="1"
                          max="99999999999"
                          value={editContactForm.extension}
                          onChange={(e) => setEditContactForm({ ...editContactForm, extension: e.target.value })}
                          placeholder="1234 ou 11987654321"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-contact-description">Descrição (opcional)</Label>
                        <Textarea
                          id="edit-contact-description"
                          value={editContactForm.description}
                          onChange={(e) => setEditContactForm({ ...editContactForm, description: e.target.value })}
                          placeholder="Descrição ou observações"
                          rows={3}
                        />
                      </div>
                    </>
                  ) : editingUser ? (
                    // Formulário para usuário
                    <>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="font-medium">
                          {editingUser.firstName} {editingUser.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {editingUser.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Setor: {editingUser.setor}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="edit-user-extension">Ramal/Telefone</Label>
                        <Input
                          id="edit-user-extension"
                          type="number"
                          min="0"
                          max="99999999999"
                          value={editUserForm.extension}
                          onChange={(e) => setEditUserForm({ ...editUserForm, extension: e.target.value })}
                          placeholder="Digite o ramal (deixe vazio para remover)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-user-email">Email personalizado para ramal (opcional)</Label>
                        <Input
                          id="edit-user-email"
                          type="email"
                          value={editUserForm.emailExtension}
                          onChange={(e) => setEditUserForm({ ...editUserForm, emailExtension: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-user-custom-name">Nome personalizado para ramal (opcional)</Label>
                        <Input
                          id="edit-user-custom-name"
                          value={editUserForm.nameExtension}
                          onChange={(e) => setEditUserForm({ ...editUserForm, nameExtension: e.target.value })}
                          placeholder="Nome que aparecerá na lista de ramais"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-user-custom-setor">Setor personalizado para ramal (opcional)</Label>
                        <Input
                          id="edit-user-custom-setor"
                          value={editUserForm.setorExtension}
                          onChange={(e) => setEditUserForm({ ...editUserForm, setorExtension: e.target.value })}
                          placeholder="Setor que aparecerá na lista de ramais"
                        />
                      </div>
                    </>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditContactOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveEditContact}
                    disabled={updateCustomExtension.isPending || updateExtension.isPending}
                  >
                    {(updateCustomExtension.isPending || updateExtension.isPending) ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Modal para confirmar exclusão */}
          {canManageExtensions() && (
            <Dialog open={isDeleteContactOpen} onOpenChange={setIsDeleteContactOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {deletingContact?.type === 'Manual' ? 'Confirmar Exclusão' : 'Confirmar Remoção'}
                  </DialogTitle>
                  <DialogDescription>
                    {deletingContact?.type === 'Manual'
                      ? 'Tem certeza que deseja remover este contato da lista de ramais? Esta ação não pode ser desfeita.'
                      : 'Tem certeza que deseja remover este usuário do canal de ramais? O ramal será zerado e as personalizações removidas.'
                    }
                  </DialogDescription>
                </DialogHeader>
                {deletingContact && (
                  <div className="py-4">
                    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <div className="font-medium">{deletingContact.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Ramal: {deletingContact.extension}
                        </div>
                        {deletingContact.email && (
                          <div className="text-sm text-muted-foreground">
                            Email: {deletingContact.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteContactOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDeleteContact}
                    disabled={deleteCustomExtension.isPending || updateExtension.isPending}
                  >
                    {(deleteCustomExtension.isPending || updateExtension.isPending)
                      ? (deletingContact?.type === 'Manual' ? "Removendo..." : "Removendo ramal...")
                      : (deletingContact?.type === 'Manual' ? "Confirmar Exclusão" : "Confirmar Remoção")
                    }
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Visualização da Tabela Completa */}
        <div className="space-y-6">
            {/* Controles de Filtro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros e Ordenação
                </CardTitle>
                <CardDescription>
                  Configure filtros e ordenação para a tabela de ramais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Filtro por Nome */}
                  <div>
                    <Label htmlFor="table-name-filter">Nome</Label>
                    <div className="relative">
                      <Input
                        id="table-name-filter"
                        placeholder="Filtrar por nome..."
                        value={tableFilters.nameFilter}
                        onChange={(e) => setTableFilters(prev => ({ ...prev, nameFilter: e.target.value }))}
                        className="pr-8"
                      />
                      {tableFilters.nameFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-6 w-6 p-0"
                          onClick={() => setTableFilters(prev => ({ ...prev, nameFilter: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filtro por Email */}
                  <div>
                    <Label htmlFor="table-email-filter">Email</Label>
                    <div className="relative">
                      <Input
                        id="table-email-filter"
                        placeholder="Filtrar por email..."
                        value={tableFilters.emailFilter}
                        onChange={(e) => setTableFilters(prev => ({ ...prev, emailFilter: e.target.value }))}
                        className="pr-8"
                      />
                      {tableFilters.emailFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-6 w-6 p-0"
                          onClick={() => setTableFilters(prev => ({ ...prev, emailFilter: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filtro por Ramal */}
                  <div>
                    <Label htmlFor="table-extension-filter">Ramal</Label>
                    <div className="relative">
                      <Input
                        id="table-extension-filter"
                        placeholder="Filtrar por ramal..."
                        value={tableFilters.extensionFilter}
                        onChange={(e) => setTableFilters(prev => ({ ...prev, extensionFilter: e.target.value }))}
                        className="pr-8"
                      />
                      {tableFilters.extensionFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-6 w-6 p-0"
                          onClick={() => setTableFilters(prev => ({ ...prev, extensionFilter: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filtro por Setor */}
                  <div>
                    <Label htmlFor="table-setor-filter">Setor</Label>
                    <div className="relative">
                      <Input
                        id="table-setor-filter"
                        placeholder="Filtrar por setor..."
                        value={tableFilters.setorFilter}
                        onChange={(e) => setTableFilters(prev => ({ ...prev, setorFilter: e.target.value }))}
                        className="pr-8"
                      />
                      {tableFilters.setorFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-6 w-6 p-0"
                          onClick={() => setTableFilters(prev => ({ ...prev, setorFilter: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controles de Ordenação */}
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Ordenar por:</Label>
                    <Select
                      value={tableFilters.sortBy}
                      onValueChange={(value: 'name' | 'email' | 'extension' | 'setor') =>
                        setTableFilters(prev => ({ ...prev, sortBy: value }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nome</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="extension">Ramal</SelectItem>
                        <SelectItem value="setor">Setor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTableFilters(prev => ({
                      ...prev,
                      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                    }))}
                    className="flex items-center gap-2"
                  >
                    {tableFilters.sortOrder === 'asc' ? (
                      <>
                        <ArrowUp className="h-4 w-4" />
                        Crescente
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-4 w-4" />
                        Decrescente
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTableFilters({
                      sortBy: 'name',
                      sortOrder: 'asc',
                      nameFilter: '',
                      emailFilter: '',
                      extensionFilter: '',
                      setorFilter: '',
                    })}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpar Filtros
                  </Button>

                  <div className="ml-auto text-sm text-muted-foreground">
                    {filteredAndSortedContacts.length} resultado{filteredAndSortedContacts.length !== 1 ? 's' : ''} encontrado{filteredAndSortedContacts.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Todos os Contatos de Ramal
                </CardTitle>
                <CardDescription>
                  Visualização completa de todos os ramais organizados em tabela
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setor</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Ramal</TableHead>
                      <TableHead>Email</TableHead>
                      {canManageExtensions() && <TableHead className="w-20">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedContacts.length > 0 ? (
                      filteredAndSortedContacts.map(contact => (
                        <TableRow key={`${contact.type}-${contact.id}`}>
                          <TableCell>{contact.setor}</TableCell>
                          <TableCell className="font-medium">
                            {contact.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="default"
                              className="font-mono"
                            >
                              {contact.extension}
                            </Badge>
                          </TableCell>
                          <TableCell>{contact.email ?? 'Sem email'}</TableCell>
                          {canManageExtensions() && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (contact.type === 'Colaborador') {
                                      // Para usuários, preciso encontrar o usuário completo
                                      const user = sectorsList
                                        .flatMap(sector => sector.users)
                                        .find(u => u.id === contact.id);
                                      if (user) {
                                        handleEditUser(user);
                                      }
                                    } else {
                                      // Para contatos manuais
                                      const customContact = customExtensions?.find(c => c.id === contact.id);
                                      if (customContact) {
                                        handleEditContact(customContact);
                                      }
                                    }
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    handleDeleteContact({
                                      id: contact.id,
                                      name: contact.name,
                                      extension: contact.extension,
                                      email: contact.email,
                                      setor: contact.setor,
                                      type: contact.type,
                                    });
                                  }}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={canManageExtensions() ? 5 : 4} className="text-center py-8 text-muted-foreground">
                          Nenhum contato encontrado com os filtros aplicados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
