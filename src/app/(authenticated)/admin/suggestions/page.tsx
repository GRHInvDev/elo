"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DragDropContext, Droppable, Draggable, type OnDragEndResponder } from "@hello-pangea/dnd"
import { toast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import type { RouterOutputs } from "@/trpc/react"
import { Plus, Edit, Trash2, Check, ChevronsUpDown, Settings, X } from "lucide-react"
import { KpiManagementModal } from "@/components/admin/suggestion/kpi-management-modal"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Usar tipos derivados do tRPC para garantir type safety
type DBSuggestion = RouterOutputs["suggestion"]["list"][number]

type SuggestionLocal = {
  id: string
  ideaNumber: number
  submittedName: string | null
  submittedSector: string | null
  isNameVisible: boolean
  description: string // Solução proposta (do banco)
  problem: string | null // Problema identificado (do banco)
  contribution: { type: string; other?: string }
  dateRef: Date | null
  impact: { label: string; score: number } | null
  capacity: { label: string; score: number } | null
  effort: { label: string; score: number } | null
  kpis: { id: string; name: string; description?: string | null }[]
  kpiIds: string[] // IDs dos KPIs para compatibilidade com o modal
  finalScore: number | null
  finalClassification: { label: string; range: string } | null
  status: "NEW" | "IN_REVIEW" | "APPROVED" | "IN_PROGRESS" | "DONE" | "NOT_IMPLEMENTED"
  rejectionReason: string | null
  analystId: string | null
  user: {
    firstName: string | null
    lastName: string | null
    email: string
    setor: string | null
  }
  analyst: {
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  createdAt: Date
}

type ClassItem = { id?: string; label: string; score: number }

type ClassificationModal = {
  isOpen: boolean
  suggestionId: string | null
  type: 'impact' | 'capacity' | 'effort' | null
}

const STATUS_MAPPING = {
  "NEW": "Novo",
  "IN_REVIEW": "Em avaliação", 
  "APPROVED": "Em orçamento",
  "IN_PROGRESS": "Em execução",
  "DONE": "Concluído",
  "NOT_IMPLEMENTED": "Não implantado"
} as const

const STATUS = Object.values(STATUS_MAPPING)

function getStatusColor(status: string): string {
  switch (status) {
    case "Novo":
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/40 dark:text-gray-100"
    case "Em avaliação":
      return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200"
    case "Em orçamento":
      return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-800/40 dark:text-yellow-100"
    case "Em execução":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-300/50 dark:text-yellow-100"
    case "Concluído":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-300/50 dark:text-green-100"
    case "Não implantado":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-300/50 dark:text-red-100"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/40 dark:text-gray-100"
  }
}

// Função para formatar números com zeros à esquerda
function formatIdeaNumber(ideaNumber: number): string {
  return ideaNumber.toString().padStart(3, '0')
}





/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
function convertDBToLocal(dbSuggestion: DBSuggestion): SuggestionLocal {
  const user = (dbSuggestion as any).user ?? { firstName: null, lastName: null, email: "", setor: null };
  const analyst = (dbSuggestion as any).analyst;

  return {
    id: dbSuggestion.id,
    ideaNumber: dbSuggestion.ideaNumber,
    submittedName: dbSuggestion.submittedName,
    submittedSector: user.setor,
    isNameVisible: dbSuggestion.isNameVisible,
    description: dbSuggestion.description || "", // Solução proposta
    problem: (dbSuggestion as any).problem ?? null, // Problema identificado
    contribution: (dbSuggestion as any).contribution ? (dbSuggestion as any).contribution as { type: string; other?: string } : { type: "", other: undefined },
    dateRef: dbSuggestion.dateRef,
    impact: (dbSuggestion as any).impact ? {
      label: (dbSuggestion as any).impact.text ?? (dbSuggestion as any).impact.label ?? "",
      score: (dbSuggestion as any).impact.score ?? 1
    } : null,
    capacity: (dbSuggestion as any).capacity ? {
      label: (dbSuggestion as any).capacity.text ?? (dbSuggestion as any).capacity.label ?? "",
      score: (dbSuggestion as any).capacity.score ?? 1
    } : null,
    effort: (dbSuggestion as any).effort ? {
      label: (dbSuggestion as any).effort.text ?? (dbSuggestion as any).effort.label ?? "",
      score: (dbSuggestion as any).effort.score ?? 1
    } : null,
    kpis: [], // Será carregado via query separada
    kpiIds: [],
    finalScore: dbSuggestion.finalScore,
    finalClassification: (dbSuggestion as any).finalClassification ? (dbSuggestion as any).finalClassification as { label: string; range: string } : null,
    status: dbSuggestion.status as "NEW" | "IN_REVIEW" | "APPROVED" | "IN_PROGRESS" | "DONE" | "NOT_IMPLEMENTED",
    rejectionReason: dbSuggestion.rejectionReason,
    analystId: dbSuggestion.analystId,
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      setor: user.setor,
    },
    analyst: analyst ? {
      firstName: analyst.firstName,
      lastName: analyst.lastName,
      email: analyst.email,
    } : null,
    createdAt: dbSuggestion.createdAt,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

// Componente para seleção de usuário responsável
function UserSelector({
  value,
  onValueChange,
  disabled = false
}: {
  value: string | null
  onValueChange: (value: string | null) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  // Buscar usuários para seleção de responsável
  const { data: allUsers = [] } = api.user.listAll.useQuery()

  const selectedUser = allUsers.find(user => user.id === value)

  const getUserDisplayName = (user: typeof allUsers[0]) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.email
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedUser ? getUserDisplayName(selectedUser) : "Selecionar responsável..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar usuário..." />
          <CommandList>
            <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onValueChange(null)
                  setOpen(false)
                }}
                className="text-muted-foreground"
              >
                <Check className="mr-2 h-4 w-4 opacity-0" />
                Não atribuído
              </CommandItem>
              {allUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.firstName ?? ''} ${user.lastName ?? ''} ${user.email}`.toLowerCase()}
                  onSelect={() => {
                    onValueChange(user.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === user.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {getUserDisplayName(user)}
                    </span>
                    {user.setor && (
                      <span className="text-xs text-muted-foreground">
                        {user.setor}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Componente para edição inline de classificações
function ClassificationInlineField({
  label,
  score,
  value,
  type,
  pool,
  onSave,
  createClassification,
  getSimilarClassifications
}: {
  label: string
  score: number
  value: { label: string; score: number } | null
  type: 'impact' | 'capacity' | 'effort'
  pool: ClassItem[]
  onSave: (classification: { label: string; score: number }) => void
  createClassification: ReturnType<typeof api.classification.create.useMutation>
  getSimilarClassifications: (searchTerm: string, type: 'impact' | 'capacity' | 'effort') => ClassItem[]
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [selectedScore, setSelectedScore] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  // Atualizar valores quando o componente recebe um novo valor
  useEffect(() => {
    if (!isEditing && value) {
      setInputValue(value.label)
      setSelectedScore(value.score)
    }
  }, [value, isEditing])

  // Função para iniciar edição com valores atuais
  const startEditing = () => {
    if (value) {
      setInputValue(value.label)
      setSelectedScore(value.score)
    }
    setIsEditing(true)
  }

  const getDBType = () => {
    switch (type) {
      case 'impact': return "IMPACT" as const
      case 'capacity': return "CAPACITY" as const
      case 'effort': return "EFFORT" as const
      default: return "IMPACT" as const
    }
  }

  // Filtrar classificações similares baseado no input usando busca dinâmica
  const filteredClassifications = inputValue.length > 0
    ? getSimilarClassifications(inputValue, type).filter(item =>
        item.label.toLowerCase() !== inputValue.toLowerCase().trim()
      ).slice(0, 5) // Limitar a 5 sugestões
    : []

  const handleInputChange = (value: string) => {
    setInputValue(value)
    setShowSuggestions(value.length > 0) // Mostrar sugestões assim que começar a digitar
    setSelectedSuggestionIndex(-1) // Resetar seleção quando digitar
  }

  const selectExistingClassification = (classification: ClassItem) => {
    onSave({ label: classification.label, score: classification.score })
    setIsEditing(false)
    setInputValue("")
    setSelectedScore(0)
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
  }

  const handleSave = () => {
    if (!inputValue.trim()) {
      setIsEditing(false)
      return
    }

    // Verificar se já existe uma classificação com esse nome (tanto no pool local quanto no banco)
    const existingClassification = pool.find(item =>
      item.label.toLowerCase() === inputValue.trim().toLowerCase()
    )

    if (existingClassification) {
      // Usar classificação existente
      onSave({ label: existingClassification.label, score: existingClassification.score })
      setIsEditing(false)
      setInputValue("")
      setSelectedScore(0)
    } else {
      // Criar nova classificação com verificação adicional no banco
      createClassification.mutate({
        label: inputValue.trim(),
        score: selectedScore,
        type: getDBType()
      }, {
        onSuccess: (newClassification) => {
          onSave({ label: newClassification.label, score: newClassification.score })
          setIsEditing(false)
          setInputValue("")
          setSelectedScore(0)
          setSelectedSuggestionIndex(-1)
        },
        onError: (error) => {
          // Se já existe uma classificação com mesmo nome e tipo, buscar e usar a existente
          if (error.message.includes('Unique constraint failed')) {
            toast({ title: "Classificação já existe", description: "Usando classificação existente com mesmo nome." })
            // Como fallback, informar o usuário para tentar novamente
            toast({ title: "Erro ao criar classificação", description: "Já existe uma classificação com este nome. Tente recarregar a página." })
          }
          setIsEditing(false)
          setInputValue("")
          setSelectedScore(0)
          setSelectedSuggestionIndex(-1)
        }
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < filteredClassifications.length) {
        // Selecionar sugestão com Enter
        const selectedClassification = filteredClassifications[selectedSuggestionIndex]
        if (selectedClassification) {
          selectExistingClassification(selectedClassification)
        }
      } else {
        handleSave()
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setInputValue("")
      setSelectedScore(0)
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
    } else if (e.key === 'ArrowDown' && filteredClassifications.length > 0) {
      e.preventDefault()
      setSelectedSuggestionIndex(prev =>
        prev < filteredClassifications.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp' && filteredClassifications.length > 0) {
      e.preventDefault()
      setSelectedSuggestionIndex(prev =>
        prev > 0 ? prev - 1 : filteredClassifications.length - 1
      )
    }
  }



  if (isEditing) {
    return (
      <div className="space-y-2">
        <Label className="text-sm">{label} ({score})</Label>
        <div className="space-y-2">
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Digite ${label.toLowerCase()}...`}
              autoFocus
            />
            {showSuggestions && filteredClassifications.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-b-md shadow-lg max-h-40 overflow-y-auto">
                {filteredClassifications.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full px-3 py-2 text-left hover:bg-muted text-sm ${
                      index === selectedSuggestionIndex ? 'bg-muted' : ''
                    }`}
                    onClick={() => selectExistingClassification(item)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.score} pontos
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Select value={selectedScore.toString()} onValueChange={(v) => setSelectedScore(parseInt(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Pontuação" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => i).map((score) => (
                <SelectItem key={score} value={score.toString()}>
                  {score} ponto{score !== 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={createClassification.isPending}>
              {createClassification.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setInputValue("")
                setSelectedScore(0)
                setShowSuggestions(false)
                setSelectedSuggestionIndex(-1)
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Label className="text-sm">{label} ({score})</Label>
      <div
        className="p-2 border rounded text-sm bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
        onClick={startEditing}
      >
        {value ? (
          <div className="flex justify-between items-center">
            <span className="font-medium">{value.label}</span>
            <Badge variant="secondary" className="text-xs">
              {value.score} pontos
            </Badge>
          </div>
        ) : (
          "Clique para classificar"
        )}
      </div>
    </div>
  )
}

// Componente para gerenciamento inline de KPIs
function KpiInlineField({
  suggestionId,
  currentKpis,
  onKpisChange
}: {
  suggestionId: string
  currentKpis: { id: string; name: string; description?: string | null }[]
  onKpisChange: (kpis: { id: string; name: string; description?: string | null }[]) => void
}) {
  const [isAddingKpi, setIsAddingKpi] = useState(false)
  const [inputValue, setInputValue] = useState("")

  // Buscar KPIs existentes para autocomplete
  const { data: allKpis = [] } = api.kpi.listActive.useQuery()

  // Mutations
  const createKpi = api.kpi.create.useMutation({
    onSuccess: (newKpi) => {
      // Vincular o novo KPI à sugestão
      api.kpi.linkToSuggestion.useMutation({
        onSuccess: () => {
          // Atualizar a lista de KPIs da sugestão
          const updatedKpis = [...currentKpis, { id: newKpi.id, name: newKpi.name, description: newKpi.description }]
          onKpisChange(updatedKpis)
          setIsAddingKpi(false)
          setInputValue("")
          toast({ title: "KPI criado e vinculado", description: "Novo KPI adicionado com sucesso." })
        }
      }).mutate({
        suggestionId,
        kpiIds: [newKpi.id]
      })
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  const linkToSuggestion = api.kpi.linkToSuggestion.useMutation({
    onSuccess: () => {
      toast({ title: "KPI vinculado", description: "KPI adicionado à sugestão com sucesso." })
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  const handleSave = () => {
    if (!inputValue.trim()) {
      setIsAddingKpi(false)
      setInputValue("")
      return
    }

    // Verificar se já existe um KPI com esse nome
    const existingKpi = allKpis.find(kpi =>
      kpi.name.toLowerCase() === inputValue.trim().toLowerCase()
    )

    if (existingKpi) {
      // Verificar se já está vinculado
      if (currentKpis.some(kpi => kpi.id === existingKpi.id)) {
        toast({ title: "KPI já vinculado", description: "Este KPI já está associado à sugestão." })
        setIsAddingKpi(false)
        setInputValue("")
        return
      }

      // Vincular KPI existente
      linkToSuggestion.mutate({
        suggestionId,
        kpiIds: [...currentKpis.map(k => k.id), existingKpi.id]
      }, {
        onSuccess: () => {
          const updatedKpis = [...currentKpis, {
            id: existingKpi.id,
            name: existingKpi.name,
            description: existingKpi.description
          }]
          onKpisChange(updatedKpis)
          setIsAddingKpi(false)
          setInputValue("")
        }
      })
    } else {
      // Criar novo KPI
      createKpi.mutate({
        name: inputValue.trim(),
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsAddingKpi(false)
      setInputValue("")
    }
  }

  const handleRemoveKpi = (kpiId: string) => {
    const updatedKpis = currentKpis.filter(kpi => kpi.id !== kpiId)
    onKpisChange(updatedKpis)

    // Remover do banco também
    api.kpi.unlinkFromSuggestion.useMutation({
      onSuccess: () => {
        toast({ title: "KPI removido", description: "KPI desvinculado da sugestão." })
      }
    }).mutate({
      suggestionId,
      kpiIds: [kpiId]
    })
  }

  const filteredKpis = allKpis.filter(kpi =>
    kpi.name.toLowerCase().includes(inputValue.toLowerCase()) &&
    !currentKpis.some(current => current.id === kpi.id)
  )

  return (
    <div className="space-y-3">
      {currentKpis.length > 0 ? (
        <div className="space-y-2">
          {currentKpis.map((kpi) => (
            <div key={kpi.id} className="flex items-start justify-between p-3 bg-muted/50 rounded border">
              <div className="flex-1">
                <div className="font-medium text-sm">{kpi.name}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveKpi(kpi.id)}
                className="ml-2 h-6 w-6 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded text-center">
          Nenhum KPI definido.
        </div>
      )}

      {isAddingKpi ? (
        <div className="space-y-3 border-t pt-3">
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite o nome do KPI..."
              className="pr-8"
              autoFocus
            />
            {inputValue && filteredKpis.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-b-md shadow-lg max-h-40 overflow-y-auto">
                {filteredKpis.map((kpi) => (
                  <button
                    key={kpi.id}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                    onClick={() => {
                      setInputValue(kpi.name)
                    }}
                  >
                    <div>
                      <span className="font-medium">{kpi.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={createKpi.isPending || linkToSuggestion.isPending}>
              {(createKpi.isPending || linkToSuggestion.isPending) ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAddingKpi(false)
                setInputValue("")
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingKpi(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar KPI
        </Button>
      )}
    </div>
  )
}

// Componente para gerenciar KPIs da sugestão
function KpiSection({ suggestionId }: { suggestionId: string }) {
  const [isAdding, setIsAdding] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Query para buscar KPIs da sugestão
  const { data: suggestionKpis = [], refetch: refetchKpis } = api.kpi.getBySuggestionId.useQuery(
    { suggestionId },
    { enabled: !!suggestionId }
  )

  // Query para buscar KPIs similares
  const { data: similarKpis = [] } = api.kpi.search.useQuery(
    { query: inputValue },
    { enabled: inputValue.length > 0 }
  )

  // Mutations
  const createKpi = api.kpi.create.useMutation({
    onSuccess: (newKpi) => {
      // Vincular automaticamente o KPI recém-criado
      linkKpi.mutate({
        suggestionId,
        kpiIds: [...suggestionKpis.map(k => k.id), newKpi.id]
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar KPI",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const linkKpi = api.kpi.linkToSuggestion.useMutation({
    onSuccess: () => {
      toast({ title: "KPI adicionado", description: "KPI vinculado com sucesso à sugestão." })
      void refetchKpis()
      setInputValue("")
      setIsAdding(false)
      setShowSuggestions(false)
    },
    onError: (error) => {
      toast({
        title: "Erro ao vincular KPI",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const unlinkKpi = api.kpi.unlinkFromSuggestion.useMutation({
    onSuccess: () => {
      toast({ title: "KPI removido", description: "KPI removido da sugestão." })
      void refetchKpis()
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover KPI",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const handleInputChange = (value: string) => {
    setInputValue(value)
    setShowSuggestions(value.length > 0)
  }

  const handleSelectExisting = (kpi: { id: string; name: string }) => {
    // Verificar se já está vinculado
    const isAlreadyLinked = suggestionKpis.some(k => k.id === kpi.id)
    if (isAlreadyLinked) {
      toast({
        title: "KPI já vinculado",
        description: "Este KPI já está vinculado a esta sugestão.",
        variant: "destructive"
      })
      return
    }

    // Vincular KPI existente
    linkKpi.mutate({
      suggestionId,
      kpiIds: [...suggestionKpis.map(k => k.id), kpi.id]
    })
  }

  const handleCreateNew = () => {
    if (!inputValue.trim()) return

    // Verificar se já existe um KPI com este nome exato
    const existingKpi = similarKpis.find(k => 
      k.name.toLowerCase() === inputValue.toLowerCase().trim()
    )

    if (existingKpi) {
      handleSelectExisting(existingKpi)
    } else {
      // Criar novo KPI
      createKpi.mutate({
        name: inputValue.trim(),
        description: undefined
      })
    }
  }

  const handleRemoveKpi = (kpiId: string) => {
    unlinkKpi.mutate({
      suggestionId,
      kpiIds: [kpiId]
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateNew()
    } else if (e.key === 'Escape') {
      setInputValue("")
      setIsAdding(false)
      setShowSuggestions(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">KPIs de Sucesso</h3>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar KPI
          </Button>
        )}
      </div>

      {/* KPIs Atuais */}
      {suggestionKpis.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestionKpis.map((kpi) => (
            <Badge key={kpi.id} variant="secondary" className="text-sm group relative">
              {kpi.name}
              <button
                onClick={() => handleRemoveKpi(kpi.id)}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                disabled={unlinkKpi.isPending}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Interface de Adição */}
      {isAdding && (
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Digite o nome do KPI..."
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="pr-20"
              />
              {inputValue && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setInputValue("")
                      setShowSuggestions(false)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleCreateNew}
              disabled={!inputValue.trim() || createKpi.isPending || linkKpi.isPending}
            >
              {createKpi.isPending || linkKpi.isPending ? "..." : "Adicionar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false)
                setInputValue("")
                setShowSuggestions(false)
              }}
            >
              Cancelar
            </Button>
          </div>

          {/* Sugestões */}
          {showSuggestions && similarKpis.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  KPIs similares:
                </div>
                {similarKpis.slice(0, 5).map((kpi) => {
                  const isAlreadyLinked = suggestionKpis.some(k => k.id === kpi.id)
                  return (
                    <div
                      key={kpi.id}
                      className={`p-2 rounded cursor-pointer text-sm transition-colors ${
                        isAlreadyLinked 
                          ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => !isAlreadyLinked && handleSelectExisting(kpi)}
                    >
                      <div className="font-medium">{kpi.name}</div>
                      {kpi.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {kpi.description}
                        </div>
                      )}
                      {isAlreadyLinked && (
                        <div className="text-xs text-muted-foreground italic">
                          Já vinculado
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {suggestionKpis.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">
          Nenhum KPI vinculado a esta sugestão.
        </p>
      )}
    </div>
  )
}

// Componente para modal de detalhes da sugestão
function SuggestionDetailsModal({
  suggestion,
  onUpdate,
  onClose
}: {
  suggestion: SuggestionLocal
  onUpdate: (id: string, updates: Partial<SuggestionLocal>) => void
  onClose: () => void
}) {
  const [impactText, setImpactText] = useState("")
  const [impactScore, setImpactScore] = useState(1)
  const [capacityText, setCapacityText] = useState("")
  const [capacityScore, setCapacityScore] = useState(1)
  const [effortText, setEffortText] = useState("")
  const [effortScore, setEffortScore] = useState(1)
  const [responsibleUser, setResponsibleUser] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [showReasonField, setShowReasonField] = useState(false)

  // Carregar valores existentes
  useEffect(() => {
    if (suggestion.impact) {
      const impact = suggestion.impact as { text?: string; label?: string; score?: number }
      setImpactText(impact.text ?? impact.label ?? "")
      setImpactScore(impact.score ?? 1)
    }
    if (suggestion.capacity) {
      const capacity = suggestion.capacity as { text?: string; label?: string; score?: number }
      setCapacityText(capacity.text ?? capacity.label ?? "")
      setCapacityScore(capacity.score ?? 1)
    }
    if (suggestion.effort) {
      const effort = suggestion.effort as { text?: string; label?: string; score?: number }
      setEffortText(effort.text ?? effort.label ?? "")
      setEffortScore(effort.score ?? 1)
    }
    
    // Carregar responsável e status atual
    setResponsibleUser(suggestion.analystId ?? null)
    setNewStatus(STATUS_MAPPING[suggestion.status] ?? suggestion.status)
    setRejectionReason(suggestion.rejectionReason ?? "")
  }, [suggestion])

  const utils = api.useUtils()
  
  const updateMutation = api.suggestion.updateAdmin.useMutation({
    onSuccess: () => {
      toast({ title: "Sugestão atualizada", description: "Classificações salvas com sucesso." })
      // Atualizar os dados localmente
      const statusEnum = Object.entries(STATUS_MAPPING).find(([, value]) => value === newStatus)?.[0] as keyof typeof STATUS_MAPPING | undefined
      onUpdate(suggestion.id, {
        impact: { label: impactText, score: impactScore },
        capacity: { label: capacityText, score: capacityScore },
        effort: { label: effortText, score: effortScore },
        analystId: responsibleUser,
        status: statusEnum,
        rejectionReason: newStatus === "Não implantado" ? rejectionReason : null
      })
      // Invalidar queries para recarregar dados
      void utils.suggestion.list.invalidate()
      onClose()
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const handleSave = () => {
    // Validar se motivo é necessário para "Não implantado"
    if (newStatus === "Não implantado" && !rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "É necessário informar o motivo para 'Não implantado'.",
        variant: "destructive"
      })
      return
    }

    // Converter status de volta para enum
    const statusEnum = Object.entries(STATUS_MAPPING).find(([, value]) => value === newStatus)?.[0] as keyof typeof STATUS_MAPPING | undefined

    updateMutation.mutate({
      id: suggestion.id,
      impact: { text: impactText, score: impactScore },
      capacity: { text: capacityText, score: capacityScore },
      effort: { text: effortText, score: effortScore },
      analystId: responsibleUser ?? undefined,
      status: statusEnum,
      rejectionReason: newStatus === "Não implantado" ? rejectionReason : undefined
    })
  }

  const pontuacao = impactScore + capacityScore - effortScore
  const nomeExibicao = suggestion.isNameVisible ? (suggestion.submittedName ?? "Não informado") : "Nome oculto"
  const setorExibido = suggestion.submittedSector ?? suggestion.user.setor ?? "Setor não informado"
  const contribType = suggestion.contribution?.type ?? ""
  const contribOther = suggestion.contribution?.other

  // Função para determinar resultado final
  const getFinalResult = (score: number) => {
    if (score >= 0 && score <= 9) return { text: "Descartar com justificativa clara", color: "bg-red-100 text-red-800 border border-red-200" }
    if (score >= 10 && score <= 14) return { text: "Ajustar e incubar", color: "bg-yellow-100 text-yellow-800 border border-yellow-200" }
    if (score >= 15 && score <= 20) return { text: "Aprovar para gestores", color: "bg-green-100 text-green-800 border border-green-200" }
    return { text: "Revisar pontuação", color: "bg-gray-100 text-gray-800 border border-gray-200" }
  }

  const finalResult = getFinalResult(pontuacao)

  // Função para lidar com mudança de status
  const handleStatusChange = (status: string) => {
    setNewStatus(status)
    if (status === "Não implantado") {
      setShowReasonField(true)
    } else {
      setShowReasonField(false)
      setRejectionReason("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Informações da Sugestão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
        <div>
          <div className="text-sm font-medium">Autor</div>
          <div className="text-sm text-muted-foreground">
            {nomeExibicao}
            {setorExibido && setorExibido !== "Setor não informado" && (
              <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                {setorExibido}
              </span>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm font-medium">Tipo de contribuição</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {contribType === "IDEIA_INOVADORA" ? "Ideia inovadora" :
               contribType === "SUGESTAO_MELHORIA" ? "Sugestão de melhoria" :
               contribType === "SOLUCAO_PROBLEMA" ? "Solução de problema" :
               contribType === "OUTRO" ? `Outro: ${contribOther ?? ""}` : "-"}
            </Badge>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm font-medium">Problema</div>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {suggestion.problem ?? "Não informado"}
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm font-medium">Solução</div>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {suggestion.description}
          </div>
        </div>
      </div>

      {/* Classificações Simplificadas */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Classificações</h3>
        
        {/* Impacto */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Impacto</Label>
          <Textarea
            placeholder="Descreva o impacto desta sugestão (máximo 2000 caracteres)"
            value={impactText}
            onChange={(e) => setImpactText(e.target.value)}
            maxLength={2000}
            className="min-h-[100px]"
          />
          <div className="flex items-center gap-4">
            <Label className="text-sm">Pontuação:</Label>
            <Select value={impactScore.toString()} onValueChange={(value) => setImpactScore(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {impactText.length}/2000 caracteres
            </span>
          </div>
        </div>

        {/* Capacidade */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Capacidade</Label>
          <Textarea
            placeholder="Descreva a capacidade de implementação desta sugestão (máximo 2000 caracteres)"
            value={capacityText}
            onChange={(e) => setCapacityText(e.target.value)}
            maxLength={2000}
            className="min-h-[100px]"
          />
          <div className="flex items-center gap-4">
            <Label className="text-sm">Pontuação:</Label>
            <Select value={capacityScore.toString()} onValueChange={(value) => setCapacityScore(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {capacityText.length}/2000 caracteres
            </span>
          </div>
        </div>

        {/* Esforço */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Esforço</Label>
          <Textarea
            placeholder="Descreva o esforço necessário para implementar esta sugestão (máximo 2000 caracteres)"
            value={effortText}
            onChange={(e) => setEffortText(e.target.value)}
            maxLength={2000}
            className="min-h-[100px]"
          />
          <div className="flex items-center gap-4">
            <Label className="text-sm">Pontuação:</Label>
            <Select value={effortScore.toString()} onValueChange={(value) => setEffortScore(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {effortText.length}/2000 caracteres
            </span>
          </div>
        </div>

        {/* Pontuação Total */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">Pontuação Total:</span>
            <span className="text-lg font-bold">{pontuacao}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Impacto ({impactScore}) + Capacidade ({capacityScore}) - Esforço ({effortScore})
          </div>
        </div>

        {/* Resultado Final */}
        <div className={`p-4 rounded-lg ${finalResult.color}`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">Resultado Final:</span>
            <span className="font-bold">{finalResult.text}</span>
          </div>
          <div className="text-sm mt-1 opacity-80">
            Baseado na pontuação: {pontuacao}
          </div>
        </div>
      </div>

      {/* Seção de Gestão */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Gestão da Sugestão</h3>
        
        {/* Responsável pela Devolutiva */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Responsável pela Devolutiva</Label>
          <UserSelector
            value={responsibleUser}
            onValueChange={setResponsibleUser}
          />
        </div>

        {/* Mudança de Status */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Status da Sugestão</Label>
          <Select value={newStatus} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(STATUS_MAPPING).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Campo de Motivo (aparece apenas para "Não implantado") */}
        {(showReasonField || newStatus === "Não implantado") && (
          <div className="space-y-3">
            <Label className="text-base font-medium text-destructive">
              Motivo da Não Implementação *
            </Label>
            <Textarea
              placeholder="Explique o motivo pelo qual esta sugestão não será implementada..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              Este campo é obrigatório para sugestões não implementadas.
            </p>
          </div>
        )}
      </div>

      {/* Seção de KPIs */}
      <KpiSection suggestionId={suggestion.id} />

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "Salvando..." : "Salvar Classificações"}
        </Button>
      </div>
    </div>
  )
}

export default function AdminSuggestionsPage() {
  const { data: dbSuggestions = [], refetch } = api.suggestion.list.useQuery({
    status: ["NEW", "IN_REVIEW", "APPROVED", "IN_PROGRESS", "DONE", "NOT_IMPLEMENTED"],
    take: 1000, // Buscar até 1000 sugestões (valor alto para pegar todas)
  })



  const suggestions = useMemo(() =>
    dbSuggestions.map((s) => convertDBToLocal(s)),
    [dbSuggestions]
  )

  const updateMutation = api.suggestion.updateAdmin.useMutation({
    onSuccess: () => {
      toast({ title: "Avaliação salva", description: "Sugestão atualizada com sucesso." })
      void refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showManageModal, setShowManageModal] = useState(false)
  const [classificationModal, setClassificationModal] = useState<ClassificationModal>({
    isOpen: false,
    suggestionId: null,
    type: null
  })

  // Estado para filtros
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Estados para o modal de KPIs
  const [kpiModalOpen, setKpiModalOpen] = useState(false)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [selectedKpiIds, setSelectedKpiIds] = useState<string[]>([])

  // Estado para controlar se o campo de motivo está expandido
  const [expandedReasonFields, setExpandedReasonFields] = useState<Set<string>>(new Set())

  // Estado para modal de gerenciamento de classificações
  const [isClassificationModalOpen, setIsClassificationModalOpen] = useState<boolean>(false)

  // Estado para modal de detalhes da sugestão
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionLocal | null>(null)
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Função para abrir modal de detalhes da sugestão
  const openSuggestionModal = (suggestion: SuggestionLocal) => {
    setSelectedSuggestion(suggestion)
    setIsSuggestionModalOpen(true)
  }

  const closeSuggestionModal = () => {
    setSelectedSuggestion(null)
    setIsSuggestionModalOpen(false)
  }



  // Query para carregar KPIs da sugestão selecionada
  const kpiQuery = api.kpi.getBySuggestionId.useQuery(
    { suggestionId: selectedSuggestionId ?? "" },
    {
      enabled: !!selectedSuggestionId,
    }
  )
  const kpiData = kpiQuery.data as unknown
  const kpiError = kpiQuery.error
  const isLoadingKpis = kpiQuery.isLoading

  // Memoizar os dados dos KPIs para evitar re-renders desnecessários
  const currentSuggestionKpis = useMemo((): { id: string; name: string; description?: string | null }[] => {
    if (kpiError) {
      console.error('Error loading KPIs:', kpiError)
      return []
    }
    if (Array.isArray(kpiData)) {
      return kpiData as { id: string; name: string; description?: string | null }[]
    }
    return []
  }, [kpiData, kpiError])

  // Atualizar selectedKpiIds quando os dados dos KPIs forem carregados
  useEffect(() => {
    if (currentSuggestionKpis.length > 0) {
      console.log('Frontend: KPIs loaded for suggestion:', selectedSuggestionId, currentSuggestionKpis)
      const kpiIds = currentSuggestionKpis.map(kpi => kpi.id)
      console.log('Frontend: Setting selected KPI IDs:', kpiIds)
      setSelectedKpiIds(kpiIds)
    } else {
      console.log('Frontend: No KPIs data or invalid format')
      setSelectedKpiIds([])
    }
  }, [currentSuggestionKpis, selectedSuggestionId])



  // Buscar classificações do banco dinamicamente
  const { data: impactClassifications, refetch: refetchImpact } = api.classification.listByType.useQuery({ type: "IMPACT" })
  const { data: capacityClassifications, refetch: refetchCapacity } = api.classification.listByType.useQuery({ type: "CAPACITY" })
  const { data: effortClassifications, refetch: refetchEffort } = api.classification.listByType.useQuery({ type: "EFFORT" })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unusedKpiLoading = isLoadingKpis // Silenciar warning do linter

  // Função para recarregar todas as classificações
  const refetchAllClassifications = () => {
    void refetchImpact()
    void refetchCapacity()
    void refetchEffort()
  }

  // Converter para o formato esperado pelo componente
  const impactPool: ClassItem[] = impactClassifications?.map(c => ({
    id: c.id,
    label: c.label,
    score: c.score
  })) ?? []

  const capacityPool: ClassItem[] = capacityClassifications?.map(c => ({
    id: c.id,
    label: c.label,
    score: c.score
  })) ?? []

  const effortPool: ClassItem[] = effortClassifications?.map(c => ({
    id: c.id,
    label: c.label,
    score: c.score
  })) ?? []

  // Função para buscar classificações similares por tipo
  const getSimilarClassifications = (searchTerm: string, type: 'impact' | 'capacity' | 'effort'): ClassItem[] => {
    const getPoolByType = (t: 'impact' | 'capacity' | 'effort') => {
      switch (t) {
        case 'impact': return impactPool
        case 'capacity': return capacityPool
        case 'effort': return effortPool
        default: return []
      }
    }

    const pool = getPoolByType(type)
    return pool.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const kpiPool: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openClassificationModal = (suggestionId: string, type: 'impact' | 'capacity' | 'effort') => {
    setClassificationModal({
      isOpen: true,
      suggestionId,
      type: 'impact' // Sempre abre com impacto como padrão, mas o modal gerencia todas
    })
  }

  const closeClassificationModal = () => {
    setClassificationModal({
      isOpen: false,
      suggestionId: null,
      type: null
    })
  }

  // Função para lidar com mudança de status
  const handleStatusChange = (suggestionId: string, newStatusLabel: string) => {
    const statusKey = Object.entries(STATUS_MAPPING).find(([_, label]) => label === newStatusLabel)?.[0] as keyof typeof STATUS_MAPPING

    if (statusKey === "NOT_IMPLEMENTED") {
      // Para "Não implementado", expandir campo de motivo dentro do card
      setExpandedReasonFields(prev => new Set([...prev, suggestionId]))
    } else {
      // Para outros status, aplicar diretamente e fechar campo de motivo se estiver aberto
      void update(suggestionId, { status: statusKey })
      setExpandedReasonFields(prev => {
        const newSet = new Set(prev)
        newSet.delete(suggestionId)
        return newSet
      })
    }
  }

  // Função para salvar o motivo e alterar o status
  const saveReasonAndChangeStatus = (suggestionId: string, reason: string) => {
    if (reason.trim().length >= 10) {
      void update(suggestionId, {
        status: "NOT_IMPLEMENTED",
        rejectionReason: reason.trim()
      })
      setExpandedReasonFields(prev => {
        const newSet = new Set(prev)
        newSet.delete(suggestionId)
        return newSet
      })
      toast({
        title: "Status atualizado",
        description: "Sugestão movida para 'Não implantado' com motivo registrado."
      })
    } else {
      toast({
        title: "Motivo insuficiente",
        description: "Por favor, informe um motivo detalhado (mínimo 10 caracteres).",
        variant: "destructive"
      })
    }
  }

  // Função para cancelar e fechar o campo de motivo
  const cancelReasonField = (suggestionId: string) => {
    setExpandedReasonFields(prev => {
      const newSet = new Set(prev)
      newSet.delete(suggestionId)
      return newSet
    })
  }

  const update = async (id: string, updates: Partial<SuggestionLocal>): Promise<void> => {
    const updateData: {
      id: string
      impact?: { text: string; score: number }
      capacity?: { text: string; score: number }
      effort?: { text: string; score: number }
      kpiIds?: string[]
      status?: "NEW" | "IN_REVIEW" | "APPROVED" | "IN_PROGRESS" | "DONE" | "NOT_IMPLEMENTED"
      rejectionReason?: string
      analystId?: string
    } = { id }

    if (updates.impact) updateData.impact = { text: updates.impact.label, score: updates.impact.score }
    if (updates.capacity) updateData.capacity = { text: updates.capacity.label, score: updates.capacity.score }
    if (updates.effort) updateData.effort = { text: updates.effort.label, score: updates.effort.score }
    if (updates.kpiIds) updateData.kpiIds = updates.kpiIds
    if (updates.status) {
      updateData.status = updates.status
    }
    if (updates.rejectionReason !== undefined) {
      updateData.rejectionReason = updates.rejectionReason ?? undefined
    }
    if (updates.analystId !== undefined) {
      updateData.analystId = updates.analystId ?? undefined
    }

    if (Object.keys(updateData).length > 1) {
      await updateMutation.mutateAsync(updateData)
    }
  }

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, draggableId } = result
    if (!destination) return
    const newStatusLabel = destination.droppableId
    const newStatus = Object.entries(STATUS_MAPPING).find(([_, label]) => label === newStatusLabel)?.[0] as keyof typeof STATUS_MAPPING
    if (newStatus) {
      // Para "Não implementado", o campo de motivo será expandido no card
      // A validação acontece quando o usuário confirma
      update(draggableId, { status: newStatus }).catch(console.error)
    }
  }

  // Função para determinar status baseado na pontuação
  const getStatusFromScore: (suggestion: SuggestionLocal) => string = (suggestion) => {
    const impactScore = suggestion.impact?.score ?? 1
    const capacityScore = suggestion.capacity?.score ?? 1
    const effortScore = suggestion.effort?.score ?? 1
    const pontuacao = impactScore + capacityScore - effortScore

    if (pontuacao >= 10 && pontuacao <= 14) return "Ajustar"
    if (pontuacao >= 15 && pontuacao <= 20) return "Aprovar"
    if (pontuacao > 20) return "Prioritário"
    return "Revisar"
  }

  // Ordenação inteligente das sugestões com filtro
  const sortedSuggestions = useMemo(() => {
    const priorityOrder = {
      "Novo": 1,
      "Em avaliação": 2,
      "Em orçamento": 3,
      "Em execução": 4,
      "Ajustes e incubar": 5,
      "Não implantado": 6,
      "Concluído": 7
    }

    let filteredSuggestions = suggestions

    // Aplicar filtro de status se não for "all"
    if (statusFilter !== "all") {
      filteredSuggestions = suggestions.filter(s => {
        if (statusFilter === "score-based") {
          // Filtrar por recomendação baseada na pontuação
          const scoreStatus = getStatusFromScore(s)
          return scoreStatus === "Ajustar" || scoreStatus === "Aprovar"
        }
        return (STATUS_MAPPING[s.status] ?? s.status) === statusFilter
      })
    }

    return [...filteredSuggestions].sort((a, b) => {
      // Primeiro por prioridade de status
      const statusA = STATUS_MAPPING[a.status] ?? a.status
      const statusB = STATUS_MAPPING[b.status] ?? b.status
      const priorityA = priorityOrder[statusA as keyof typeof priorityOrder] ?? 999
      const priorityB = priorityOrder[statusB as keyof typeof priorityOrder] ?? 999

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      // Depois por numeração de ideias (conforme sortOrder)
      if (sortOrder === "asc") {
        return (a.ideaNumber ?? 0) - (b.ideaNumber ?? 0)
      } else {
        return (b.ideaNumber ?? 0) - (a.ideaNumber ?? 0)
      }
    })
  }, [suggestions, statusFilter, sortOrder])

  const listColumns = useMemo(() => {
    const cols: [SuggestionLocal[], SuggestionLocal[], SuggestionLocal[]] = [[], [], []]
    for (let i = 0; i < sortedSuggestions.length; i++) {
      const bucket = (i % 3) as 0 | 1 | 2
      cols[bucket].push(sortedSuggestions[i]!)
    }
    return cols
  }, [sortedSuggestions])

  const kanbanColumns = useMemo(() => {
    const map: Record<string, SuggestionLocal[]> = {}
    STATUS.forEach((s) => (map[s] = []))
    for (const s of sortedSuggestions) {
      const statusLabel = STATUS_MAPPING[s.status] ?? s.status
      ;(map[statusLabel] ?? (map[statusLabel] = [])).push(s)
    }
    return map
  }, [sortedSuggestions])

  return (
    <DashboardShell>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sugestões (Avançado)</h1>
            <p className="text-muted-foreground mt-2">Avalie, classifique e acompanhe o status das sugestões.</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Visão Kanban</h2>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Ordenar por numeração:</Label>
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Maior → Menor</SelectItem>
                <SelectItem value="asc">Menor → Maior</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {STATUS.map((st) => (
              <Droppable droppableId={st} key={st}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-lg border p-3 ${getStatusColor(st)}`}
                  >
                    <div className="font-medium mb-1">
                      {st} ({kanbanColumns[st]?.length ?? 0})
                    </div>
                    <div className="max-h-[800px] overflow-y-auto space-y-1 scrollbar-hide">
                      {kanbanColumns[st]?.map((s, index) => {
                        const impactData = s.impact as { score?: number; text?: string } | null
                        const capacityData = s.capacity as { score?: number; text?: string } | null
                        const effortData = s.effort as { score?: number; text?: string } | null
                        
                        const impactScore = impactData?.score ?? 1
                        const capacityScore = capacityData?.score ?? 1
                        const effortScore = effortData?.score ?? 1
                        const pontuacao = impactScore + capacityScore - effortScore



                        return (
                          <Draggable draggableId={s.id} index={index} key={s.id}>
                            {(prov) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                <Card 
                                  className="bg-background/80 cursor-pointer hover:bg-background/90 transition-colors"
                                  onClick={() => openSuggestionModal(s)}
                                >
                                  <CardContent className="p-2">
                                    <div className="text-sm font-medium truncate">#{formatIdeaNumber(s.ideaNumber)} — {(s.problem ?? "Sem problema definido").substring(0, 30)}...</div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      {s.isNameVisible ? s.submittedName ?? "Não informado" : "Nome oculto"}
                                      {s.isNameVisible && (s.submittedSector ?? s.user.setor) && (
                                        <span className="ml-1 text-[10px] bg-muted px-1 py-0.5 rounded">
                                          {s.submittedSector ?? s.user.setor}
                                        </span>
                                      )}
                                    </div>
                                    {/* Pontuação no Kanban */}
                                    <div className="flex items-center justify-between">
                                      <div className="text-xs font-medium">
                                        Pontuação: {pontuacao}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                     </div>
                     {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>



      {/* Modal de Classificações */}
      <ClassificationManagementModal
        isOpen={classificationModal.isOpen}
        onClose={closeClassificationModal}
        suggestionId={classificationModal.suggestionId}
        type={classificationModal.type}
        impactPool={impactPool}
        capacityPool={capacityPool}
        effortPool={effortPool}
        currentSuggestion={suggestions.find(s => s.id === classificationModal.suggestionId)}
        update={update}
        onClassificationsChange={refetchAllClassifications}
      />

      {/* Modal de Gerenciamento de KPIs */}
      <KpiManagementModal
        isOpen={kpiModalOpen}
        onOpenChange={(open) => {
          setKpiModalOpen(open)
          if (!open) {
            // Recarregar dados da sugestão quando o modal for fechado
            if (selectedSuggestionId) {
              console.log('Modal closed, reloading suggestion data...')
              void refetch()
              // Invalidar também as queries de KPIs para garantir que tudo esteja atualizado
              void api.useUtils().kpi.getBySuggestionId.invalidate({ suggestionId: selectedSuggestionId })
            }
            setSelectedSuggestionId(null)
            setSelectedKpiIds([])
          }
        }}
        selectedKpiIds={selectedKpiIds}
        onKpiSelectionChange={setSelectedKpiIds}
        suggestionId={selectedSuggestionId ?? undefined}
      />

      {/* Modal de Detalhes da Sugestão */}
      <Dialog open={isSuggestionModalOpen} onOpenChange={setIsSuggestionModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Sugestão #{selectedSuggestion ? formatIdeaNumber(selectedSuggestion.ideaNumber) : ''}
            </DialogTitle>
            <DialogDescription>
              Avalie e classifique a sugestão com impacto, capacidade e esforço.
            </DialogDescription>
          </DialogHeader>

          {selectedSuggestion && (
            <SuggestionDetailsModal
              suggestion={selectedSuggestion}
              onUpdate={update}
              onClose={closeSuggestionModal}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento de Classificações */}
      <Dialog open={isClassificationModalOpen} onOpenChange={setIsClassificationModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gerenciar Classificações
            </DialogTitle>
            <DialogDescription>
              Gerencie todas as classificações do sistema: crie novas, edite existentes ou remova as que não são mais necessárias.
            </DialogDescription>
          </DialogHeader>

          <ClassificationManagement
            onClose={() => setIsClassificationModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

    </DashboardShell>
  )
}

function IdeasAccordion({
  sugestoes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  impactPool,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  capacityPool,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  effortPool,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  kpiPool,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentSuggestionKpis,
  update,
  _currentUser,
  onStatusChange,
  getStatusFromScore,
  expandedReasonFields,
  saveReasonAndChangeStatus,
  cancelReasonField,
  getSimilarClassifications,
}: {
  sugestoes: SuggestionLocal[]
  impactPool: ClassItem[]
  capacityPool: ClassItem[]
  effortPool: ClassItem[]
  kpiPool: string[]
  currentSuggestionKpis: { id: string; name: string; description?: string | null }[]
  update: (id: string, updates: Partial<SuggestionLocal>) => void
  _currentUser: RouterOutputs["user"]["me"] | undefined
  onStatusChange: (suggestionId: string, newStatusLabel: string) => void
  getStatusFromScore: (suggestion: SuggestionLocal) => string
  expandedReasonFields: Set<string>
  saveReasonAndChangeStatus: (suggestionId: string, reason: string) => void
  cancelReasonField: (suggestionId: string) => void
  getSimilarClassifications: (searchTerm: string, type: 'impact' | 'capacity' | 'effort') => ClassItem[]
}) {
  // Estado local para as justificativas
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  
  const handleRejectionReasonChange = (suggestionId: string, value: string) => {
    setRejectionReasons(prev => ({ ...prev, [suggestionId]: value }))
  }
  
  // Mutation para enviar notificação de rejeição
  const sendRejectionNotification = api.suggestion.sendRejectionNotification.useMutation({
    onSuccess: () => {
      toast({
        title: "Notificação enviada",
        description: "Email de notificação foi enviado para o colaborador."
      })
    },
    onError: (error) => {
      toast({
        title: "Erro na notificação",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const saveRejectionReason = async (suggestionId: string) => {
    const reason = rejectionReasons[suggestionId]

    if (reason?.trim()) {
      try {

        update(suggestionId, {
          status: "NOT_IMPLEMENTED",
          rejectionReason: reason.trim()
        })

        await new Promise(resolve => setTimeout(resolve, 500))

        await sendRejectionNotification.mutateAsync({
          suggestionId,
          rejectionReason: reason.trim()
        })


        toast({
          title: "Sugestão rejeitada e notificação enviada",
          description: "Status alterado para 'Não implementado', motivo salvo e colaborador notificado!"
        })
      } catch {
        toast({
          title: "Erro",
          description: "Erro ao processar rejeição. Tente novamente.",
          variant: "destructive"
        })
      }
    } else {
      toast({
        title: "Erro",
        description: "Digite uma justificativa antes de salvar.",
        variant: "destructive"
      })
    }
  }
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {sugestoes.map((s) => (
        <SuggestionItem
          key={s.id}
          suggestion={s}
          rejectionReasons={rejectionReasons}
          handleRejectionReasonChange={handleRejectionReasonChange}
          saveRejectionReason={saveRejectionReason}
          sendRejectionNotification={sendRejectionNotification}
          update={update}
          _currentUser={_currentUser}
          onStatusChange={onStatusChange}
          getStatusFromScore={getStatusFromScore}
          isReasonFieldExpanded={expandedReasonFields.has(s.id)}
          onSaveReasonAndChangeStatus={saveReasonAndChangeStatus}
          onCancelReasonField={cancelReasonField}
          getSimilarClassifications={getSimilarClassifications}
        />
      ))}
    </Accordion>
  )
}

function SuggestionItem({
  suggestion: s,
  rejectionReasons,
  handleRejectionReasonChange,
  saveRejectionReason,
  sendRejectionNotification,
  update,
  _currentUser,
  onStatusChange,
  getStatusFromScore,
  isReasonFieldExpanded,
  onSaveReasonAndChangeStatus,
  onCancelReasonField,
  getSimilarClassifications,
}: {
  suggestion: SuggestionLocal
  rejectionReasons: Record<string, string>
  handleRejectionReasonChange: (suggestionId: string, value: string) => void
  saveRejectionReason: (suggestionId: string) => Promise<void>
  sendRejectionNotification: ReturnType<typeof api.suggestion.sendRejectionNotification.useMutation>
  update: (id: string, updates: Partial<SuggestionLocal>) => void
  _currentUser: RouterOutputs["user"]["me"] | undefined
  onStatusChange: (suggestionId: string, newStatusLabel: string) => void
  getStatusFromScore: (suggestion: SuggestionLocal) => string
  isReasonFieldExpanded: boolean
  onSaveReasonAndChangeStatus: (suggestionId: string, reason: string) => void
  onCancelReasonField: (suggestionId: string) => void
  getSimilarClassifications: (searchTerm: string, type: 'impact' | 'capacity' | 'effort') => ClassItem[]
}) {
  // Carregar KPIs específicos para esta sugestão
  const { data: suggestionKpis = [] } = api.kpi.getBySuggestionId.useQuery(
    { suggestionId: s.id },
    { enabled: true }
  )

  // Mutation para salvar classificações
  const updateMutation = api.suggestion.updateAdmin.useMutation({
    onSuccess: () => {
      // Success será tratado no onClick do botão
    },
    onError: () => {
      // Error será tratado no onClick do botão
    }
  })

  const impactScore = s.impact?.score ?? 1
  const capacityScore = s.capacity?.score ?? 1
  const effortScore = s.effort?.score ?? 1
  const pontuacao = impactScore + capacityScore - effortScore
  const nomeExibicao = s.isNameVisible ? (s.submittedName ?? "Não informado") : "Nome oculto"
  const setorExibido = s.submittedSector ?? s.user.setor ?? "Setor não informado"
  const contribType = s.contribution?.type ?? ""
  const contribOther = s.contribution?.other



  return (
          <AccordionItem key={s.id} value={s.id} className="border rounded-lg">
            <AccordionTrigger className="px-4">
              <div className="w-full">
                <div className="flex flex-col gap-2">
                  <div className="font-semibold">
                    #{formatIdeaNumber(s.ideaNumber)} — {(s.problem ?? "Sem problema definido").substring(0, 60)}...
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      Nome: {nomeExibicao}
                    {setorExibido && setorExibido !== "Setor não informado" && (
                      <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                        {setorExibido}
                      </span>
                    )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Tag de status baseada na pontuação */}
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          getStatusFromScore(s) === 'Ajustar' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                          getStatusFromScore(s) === 'Aprovar' ? 'border-green-300 text-green-700 bg-green-50' :
                          getStatusFromScore(s) === 'Prioritário' ? 'border-blue-300 text-blue-700 bg-blue-50' :
                          'border-gray-300 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {getStatusFromScore(s)}
                      </Badge>
                      {/* Tag de status atual */}
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(STATUS_MAPPING[s.status] ?? s.status)}`}
                      >
                        {STATUS_MAPPING[s.status] ?? s.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm font-medium">Data</div>
                      <div className="text-sm text-muted-foreground">
                        {s.dateRef ? new Date(s.dateRef).toLocaleDateString('pt-BR') : 
                         new Date(s.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Setor</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{setorExibido}</Badge>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium">Tipo de contribuição</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {contribType === "IDEIA_INOVADORA" ? "Ideia inovadora" :
                           contribType === "SUGESTAO_MELHORIA" ? "Sugestão de melhoria" :
                           contribType === "SOLUCAO_PROBLEMA" ? "Solução de problema" :
                           contribType === "OUTRO" ? `Outro: ${contribOther ?? ""}` : "-"}
                        </Badge>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium">Problema</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {s.problem ?? "Não informado"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium">Solução</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {s.description}
                      </div>
                    </div>
                  </div>

                  {/* Seção de Classificações */}
                  <div className="space-y-4">
                      <h4 className="text-sm font-medium">Classificações</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <ClassificationInlineField
                        label="Impacto"
                        score={impactScore}
                        value={s.impact}
                        type="impact"
                        pool={[]}
                        onSave={(classification) => update(s.id, { impact: classification })}
                        createClassification={api.classification.create.useMutation({
                          onSuccess: () => {
                            toast({ title: "Classificação criada", description: "Nova classificação adicionada com sucesso." })
                          },
                          onError: (error) => {
                            toast({ title: "Erro", description: error.message, variant: "destructive" })
                          }
                        })}
                        getSimilarClassifications={getSimilarClassifications}
                      />
                      <ClassificationInlineField
                        label="Capacidade"
                        score={capacityScore}
                        value={s.capacity}
                        type="capacity"
                        pool={[]}
                        onSave={(classification) => update(s.id, { capacity: classification })}
                        createClassification={api.classification.create.useMutation({
                          onSuccess: () => {
                            toast({ title: "Classificação criada", description: "Nova classificação adicionada com sucesso." })
                          },
                          onError: (error) => {
                            toast({ title: "Erro", description: error.message, variant: "destructive" })
                          }
                        })}
                        getSimilarClassifications={getSimilarClassifications}
                      />
                      <ClassificationInlineField
                        label="Esforço"
                        score={effortScore}
                        value={s.effort}
                        type="effort"
                        pool={[]}
                        onSave={(classification) => update(s.id, { effort: classification })}
                        createClassification={api.classification.create.useMutation({
                          onSuccess: () => {
                            toast({ title: "Classificação criada", description: "Nova classificação adicionada com sucesso." })
                          },
                          onError: (error) => {
                            toast({ title: "Erro", description: error.message, variant: "destructive" })
                          }
                        })}
                        getSimilarClassifications={getSimilarClassifications}
                      />
                    </div>

                    {/* KPIs de Sucesso */}
                    <div className="space-y-3 border-t pt-4">
                        <h4 className="text-sm font-medium">KPIs de Sucesso</h4>
                      <KpiInlineField
                        suggestionId={s.id}
                        currentKpis={suggestionKpis}
                        onKpisChange={(newKpis) => {
                          // Atualizar localmente a lista de KPIs
                          update(s.id, { kpiIds: newKpis.map(k => k.id) })
                        }}
                      />
                    </div>

                    {/* Pontuação Final e Recomendação */}
                    <div className="p-3 rounded-lg border">
                      <div className="text-sm font-medium mb-2">
                        Pontuação Final: {pontuacao} pontos
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Impacto ({impactScore}) + Capacidade ({capacityScore}) - Esforço ({effortScore}) = {pontuacao}
                      </div>

                      {/* Recomendação baseada na pontuação */}
                      <div className={`p-2 rounded-md text-xs font-medium ${
                        pontuacao >= 0 && pontuacao <= 9
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : pontuacao >= 10 && pontuacao <= 14
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : pontuacao >= 15 && pontuacao <= 20
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>

                        {pontuacao >= 10 && pontuacao <= 14 && "🟡 Ajustes e incubar"}
                        {pontuacao >= 15 && pontuacao <= 20 && "🟢 Aprovar para gestores"}
                        {pontuacao > 20 && "🚀 Aprovação imediata"}
                        {pontuacao < 0 && "❌ Revisar pontuação"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm">Status</label>
                      <Select
                        value={STATUS_MAPPING[s.status]}
                        onValueChange={(v) => {
                          if (v !== STATUS_MAPPING[s.status]) {
                            onStatusChange(s.id, v)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Campo de motivo expandível para "Não implementado" */}
                    {isReasonFieldExpanded && (
                      <div className="md:col-span-2 space-y-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div>
                          <label className="text-sm font-medium text-red-700 dark:text-red-300">
                            Motivo da não implementação <span className="text-red-500">*</span>
                          </label>
                          <Textarea
                            rows={3}
                            placeholder="Descreva o motivo detalhado da não implementação desta sugestão..."
                            className="mt-2 border-red-200 focus:border-red-300"
                            value={rejectionReasons[s.id] ?? s.rejectionReason ?? ""}
                            onChange={(e) => handleRejectionReasonChange(s.id, e.target.value)}
                            maxLength={1000}
                          />
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-red-600 dark:text-red-400">
                              Campo obrigatório para sugestões não implementadas (mínimo 10 caracteres).
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(rejectionReasons[s.id] ?? s.rejectionReason ?? "").length}/1000
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onCancelReasonField(s.id)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onSaveReasonAndChangeStatus(s.id, rejectionReasons[s.id] ?? s.rejectionReason ?? "")}
                            disabled={!rejectionReasons[s.id]?.trim() || (rejectionReasons[s.id]?.trim()?.length ?? 0) < 10}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Confirmar e Mover
                          </Button>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm">Responsável pela devolutiva</label>
                      <UserSelector
                        value={s.analystId}
                        onValueChange={(userId: string | null) => {
                          update(s.id, { analystId: userId })
                        }}
                      />
                    </div>

                    {/* Mostrar campo de motivo sempre que o status for "NOT_IMPLEMENTED" */}
                    {s.status === "NOT_IMPLEMENTED" && (
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-red-700">
                          Motivo da não implementação <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          rows={4}
                          value={rejectionReasons[s.id] ?? s.rejectionReason ?? ""}
                          onChange={(e) => handleRejectionReasonChange(s.id, e.target.value)}
                          placeholder="Digite o motivo detalhado da não implementação desta sugestão..."
                          className="border-red-200 focus:border-red-300"
                          required
                        />
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-red-600">
                            Campo obrigatório para sugestões não implementadas
                          </div>
                                                    <Button
                            size="sm"
                            onClick={() => saveRejectionReason(s.id)}
                            className="w-fit bg-red-600 hover:bg-red-700"
                            disabled={
                              s.status !== "NOT_IMPLEMENTED" ||
                              sendRejectionNotification.isPending ||
                              (!rejectionReasons[s.id]?.trim() && !s.rejectionReason?.trim())
                            }
                          >
                            {sendRejectionNotification.isPending ? "Enviando..." : "Salvar Motivo"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        // Validação: se status for "NOT_IMPLEMENTED", verificar justificativa
                        if (s.status === "NOT_IMPLEMENTED" && !s.rejectionReason && !rejectionReasons[s.id]?.trim()) {
                          toast({
                            title: "Justificativa obrigatória",
                            description: "Use o botão 'Salvar Motivo' para fornecer a justificativa e enviar a notificação.",
                            variant: "destructive"
                          })
                          return
                        }
                        
                        // Salvar as classificações
                        updateMutation.mutate({
                          id: s.id,
                          impact: s.impact ? { text: s.impact.label || "", score: s.impact.score || 1 } : undefined,
                          capacity: s.capacity ? { text: s.capacity.label || "", score: s.capacity.score || 1 } : undefined,
                          effort: s.effort ? { text: s.effort.label || "", score: s.effort.score || 1 } : undefined,
                          ...(s.analystId && { analystId: s.analystId }), // Preservar o responsável atual
                        }, {
                          onSuccess: () => {
                            toast({ title: "Avaliação salva", description: `Sugestão #${formatIdeaNumber(s.ideaNumber)} atualizada.` })
                          },
                          onError: (error) => {
                            toast({
                              title: "Erro ao salvar",
                              description: error.message,
                              variant: "destructive"
                            })
                          }
                        })
                      }}
                      disabled={
                        s.status === "NOT_IMPLEMENTED" &&
                        !s.rejectionReason &&
                        !rejectionReasons[s.id]?.trim()
                      }
                    >
                      Salvar avaliação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
  )
}

function ClassificationManagementModal({
  isOpen,
  onClose,
  suggestionId,
  type,
  impactPool,
  capacityPool,
  effortPool,
  currentSuggestion,
  update,
  onClassificationsChange,
}: {
  isOpen: boolean
  onClose: () => void
  suggestionId: string | null
  type: 'impact' | 'capacity' | 'effort' | null
  impactPool: ClassItem[]
  capacityPool: ClassItem[]
  effortPool: ClassItem[]
  currentSuggestion: SuggestionLocal | undefined
  update: (id: string, updates: Partial<SuggestionLocal>) => void
  onClassificationsChange: () => void
}) {
  const [newLabel, setNewLabel] = useState("")
  const [newScore, setNewScore] = useState<number>(0)
  const [editingItem, setEditingItem] = useState<ClassItem | null>(null)
  const [activeTab, setActiveTab] = useState<'impact' | 'capacity' | 'effort'>('impact')

  // Inicializar activeTab baseado no tipo passado
  useEffect(() => {
    if (type) {
      setActiveTab(type)
    }
  }, [type])

  // Mutations para CRUD das classificações
  const createClassification = api.classification.create.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação criada", description: "Nova classificação adicionada com sucesso." })
      // Recarregar classificações para atualizar a interface
      onClassificationsChange()
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  const updateClassification = api.classification.update.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação atualizada", description: "Alterações salvas com sucesso." })
      // Recarregar classificações para atualizar a interface
      onClassificationsChange()
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  const deleteClassification = api.classification.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação removida", description: "Item removido com sucesso." })
      // Recarregar classificações para atualizar a interface
      onClassificationsChange()
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  if (!suggestionId || !currentSuggestion) return null

  const getCurrentPool = () => {
    switch (activeTab) {
      case 'impact': return impactPool
      case 'capacity': return capacityPool
      case 'effort': return effortPool
      default: return []
    }
  }

  const getDBType = () => {
    switch (activeTab) {
      case 'impact': return "IMPACT" as const
      case 'capacity': return "CAPACITY" as const
      case 'effort': return "EFFORT" as const
      default: return "IMPACT" as const
    }
  }

  const getCurrentValue = () => {
    switch (activeTab) {
      case 'impact': return currentSuggestion.impact
      case 'capacity': return currentSuggestion.capacity
      case 'effort': return currentSuggestion.effort
      default: return null
    }
  }

  const getTypeName = () => {
    switch (activeTab) {
      case 'impact': return 'Impacto'
      case 'capacity': return 'Capacidade'
      case 'effort': return 'Esforço'
      default: return ''
    }
  }

  const addNewItem = () => {
    if (!newLabel.trim()) return
    
    void createClassification.mutate({
      label: newLabel.trim(),
      score: newScore,
      type: getDBType()
    })
    
    setNewLabel("")
    setNewScore(0)
  }

  const editItem = (item: ClassItem) => {
    setEditingItem(item)
    setNewLabel(item.label)
    setNewScore(item.score)
  }

  const saveEdit = () => {
    if (!editingItem || !newLabel.trim()) return
    
    if (editingItem?.id) {
      void updateClassification.mutate({
        id: editingItem.id,
        label: newLabel.trim(),
        score: newScore
      })
    }
    
    setEditingItem(null)
    setNewLabel("")
    setNewScore(0)
  }

  const deleteItem = (itemToDelete: ClassItem) => {
    if (itemToDelete.id) {
      void deleteClassification.mutate({
        id: itemToDelete.id
      })
    }
  }

  const selectItem = (item: ClassItem) => {
    const updateData = { [activeTab]: { label: item.label, score: item.score } }
    update(suggestionId, updateData as Partial<SuggestionLocal>)
    onClose()
    
    toast({ 
      title: "Classificação aplicada", 
      description: `${item.label} (${item.score} pontos) foi aplicado para ${getTypeName().toLowerCase()}.` 
    })
  }

  const currentPool = getCurrentPool()
  const currentValue = getCurrentValue()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Classificações</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Abas para os tipos de classificação */}
          <div className="flex space-x-1 border-b">
            {(['impact', 'capacity', 'effort'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab === 'impact' ? 'Impacto' : tab === 'capacity' ? 'Capacidade' : 'Esforço'}
              </button>
            ))}
          </div>

          {/* Seleção de classificação atual */}
          <div>
            <h4 className="text-sm font-medium mb-3">
              Selecionar classificação para {getTypeName().toLowerCase()} - {currentSuggestion.ideaNumber}
            </h4>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {currentPool.map((item) => (
                <div 
                  key={item.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                    currentValue?.label === item.label ? 'border-primary bg-primary/10' : ''
                  }`}
                  onClick={() => selectItem(item)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.score} pontos</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          editItem(item)
                        }}
                        disabled={editingItem?.id === item.id}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteItem(item)
                        }}
                        disabled={deleteClassification.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adicionar/Editar novo item */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">
              {editingItem ? 'Editar item' : `Adicionar novo item para ${getTypeName().toLowerCase()}`}
            </h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="label">Descrição</Label>
                <Input
                  id="label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={`Ex: ${activeTab === 'impact' ? 'Alto impacto' : activeTab === 'capacity' ? 'Alta capacidade' : 'Baixo esforço'}`}
                />
              </div>
                             <div>
                 <Label htmlFor="score">Pontuação</Label>
                 <Select value={newScore.toString()} onValueChange={(v) => setNewScore(parseInt(v))}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione a pontuação" />
                   </SelectTrigger>
                   <SelectContent>
                     {Array.from({ length: 11 }, (_, i) => i).map((score) => (
                       <SelectItem key={score} value={score.toString()}>
                         {score} ponto{score !== 1 ? 's' : ''}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
              <div className="flex gap-2">
                {editingItem ? (
                  <>
                    <Button 
                      onClick={saveEdit} 
                      disabled={!newLabel.trim() || updateClassification.isPending}
                    >
                      {updateClassification.isPending ? "Salvando..." : "Salvar alterações"}
                    </Button>
                    <Button 
                      variant="outline" 
                                             onClick={() => {
                         setEditingItem(null)
                         setNewLabel("")
                         setNewScore(0)
                       }}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={addNewItem} 
                    disabled={!newLabel.trim() || createClassification.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createClassification.isPending ? "Adicionando..." : "Adicionar item"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Tipo para classificação
type ClassificationItem = {
  id: string
  label: string
  score: number
  type: "IMPACT" | "CAPACITY" | "EFFORT"
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

// Componente para gerenciamento completo de classificações
function ClassificationManagement({ onClose: _onClose }: { onClose: () => void }) {
  const [filterType, setFilterType] = useState<"ALL" | "IMPACT" | "CAPACITY" | "EFFORT">("ALL")
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newClassification, setNewClassification] = useState({
    label: "",
    score: 1,
    type: "IMPACT" as "IMPACT" | "CAPACITY" | "EFFORT"
  })
  const [editClassification, setEditClassification] = useState({
    label: "",
    score: 1,
    type: "IMPACT" as "IMPACT" | "CAPACITY" | "EFFORT"
  })

  // Buscar todas as classificações
  const { data: allClassifications = [], refetch: refetchAllClassifications } = api.classification.listAll.useQuery({
    type: filterType === "ALL" ? undefined : filterType
  })

  // Mutations
  const createClassification = api.classification.create.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação criada", description: "Nova classificação adicionada com sucesso." })
      void refetchAllClassifications()
      setIsCreating(false)
      setNewClassification({ label: "", score: 0, type: "IMPACT" })
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  const updateClassification = api.classification.update.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação atualizada", description: "Classificação modificada com sucesso." })
      void refetchAllClassifications()
      setEditingId(null)
      setEditClassification({ label: "", score: 0, type: "IMPACT" })
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  const deleteClassification = api.classification.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação removida", description: "Classificação excluída com sucesso." })
      void refetchAllClassifications()
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  const handleCreate = () => {
    if (!newClassification.label.trim()) {
      toast({ title: "Erro", description: "Nome da classificação é obrigatório.", variant: "destructive" })
      return
    }

    void createClassification.mutate({
      label: newClassification.label.trim(),
      score: newClassification.score,
      type: newClassification.type
    })
  }

  const handleEdit = (classification: ClassificationItem) => {
    setEditingId(classification.id)
    setEditClassification({
      label: classification.label,
      score: classification.score,
      type: classification.type
    })
  }

  const handleUpdate = () => {
    if (!editClassification.label.trim()) {
      toast({ title: "Erro", description: "Nome da classificação é obrigatório.", variant: "destructive" })
      return
    }

    updateClassification.mutate({
      id: editingId!,
      label: editClassification.label.trim(),
      score: editClassification.score
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta classificação?")) {
      deleteClassification.mutate({ id })
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "IMPACT": return "Impacto"
      case "CAPACITY": return "Capacidade"
      case "EFFORT": return "Esforço"
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "IMPACT": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
      case "CAPACITY": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case "EFFORT": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6 overflow-y-auto max-h-[60vh]">
      {/* Filtros e Botão Criar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={filterType} onValueChange={(value: "ALL" | "IMPACT" | "CAPACITY" | "EFFORT") => setFilterType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="IMPACT">Impacto</SelectItem>
              <SelectItem value="CAPACITY">Capacidade</SelectItem>
              <SelectItem value="EFFORT">Esforço</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Classificação
        </Button>
      </div>

      {/* Formulário de Criação */}
      {isCreating && (
        <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
          <h3 className="font-medium mb-4">Criar Nova Classificação</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="new-label">Nome</Label>
              <Input
                id="new-label"
                value={newClassification.label}
                onChange={(e) => setNewClassification(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Nome da classificação"
              />
            </div>
            <div>
              <Label htmlFor="new-score">Pontuação</Label>
              <Select
                value={newClassification.score.toString()}
                onValueChange={(value) => setNewClassification(prev => ({ ...prev, score: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => i).map((score) => (
                    <SelectItem key={score} value={score.toString()}>
                      {score} ponto{score !== 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-type">Tipo</Label>
              <Select
                value={newClassification.type}
                onValueChange={(value: "IMPACT" | "CAPACITY" | "EFFORT") => setNewClassification(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMPACT">Impacto</SelectItem>
                  <SelectItem value="CAPACITY">Capacidade</SelectItem>
                  <SelectItem value="EFFORT">Esforço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={createClassification.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createClassification.isPending ? "Criando..." : "Criar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsCreating(false)
                setNewClassification({ label: "", score: 0, type: "IMPACT" })
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de Classificações */}
      <div className="space-y-2">
        {allClassifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma classificação encontrada.
          </div>
        ) : (
          allClassifications.map((classification) => (
            <div
              key={classification.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {editingId === classification.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 mr-4">
                  <Input
                    value={editClassification.label}
                    onChange={(e) => setEditClassification(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="Nome da classificação"
                  />
                  <Select
                    value={editClassification.score.toString()}
                    onValueChange={(value) => setEditClassification(prev => ({ ...prev, score: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => i).map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score} ponto{score !== 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdate} disabled={updateClassification.isPending}>
                      <Check className="w-3 h-3 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Badge className={getTypeColor(classification.type)}>
                      {getTypeLabel(classification.type)}
                    </Badge>
                    <span className="font-medium">{classification.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {classification.score} pts
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(classification)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(classification.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}


