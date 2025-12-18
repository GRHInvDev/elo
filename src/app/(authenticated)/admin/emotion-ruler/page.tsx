"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { Plus, Loader2, Settings, BarChart3 } from "lucide-react"
import { EmotionRulerForm } from "@/components/admin/emotion-ruler/emotion-ruler-form"
import { EmotionRulerList } from "@/components/admin/emotion-ruler/emotion-ruler-list"
import { EmotionRulerStats } from "@/components/admin/emotion-ruler/emotion-ruler-stats"
import { useAccessControl } from "@/hooks/use-access-control"

export default function AdminEmotionRulerPage() {
  const [selectedRulerId, setSelectedRulerId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState("list")

  const { hasAdminAccess, isLoading: isLoadingAccess } = useAccessControl()

  const { data: rulers, isLoading, refetch } = api.emotionRuler.getAll.useQuery(
    undefined,
    {
      enabled: hasAdminAccess("/admin/emotion-ruler"),
    }
  )

  if (isLoadingAccess) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    )
  }

  if (!hasAdminAccess("/admin/emotion-ruler")) {
    return (
      <DashboardShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </DashboardShell>
    )
  }

  const handleCreateNew = () => {
    setSelectedRulerId(null)
    setIsCreating(true)
    setActiveTab("form")
  }

  const handleEdit = (rulerId: string) => {
    setSelectedRulerId(rulerId)
    setIsCreating(false)
    setActiveTab("form")
  }

  const handleFormSuccess = () => {
    toast.success("Régua salva com sucesso!")
    setSelectedRulerId(null)
    setIsCreating(false)
    setActiveTab("list")
    void refetch()
  }

  const handleFormCancel = () => {
    setSelectedRulerId(null)
    setIsCreating(false)
    setActiveTab("list")
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Régua de Emoções
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie as réguas de emoções, configure emoções, datas e acompanhe as respostas dos colaboradores
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Régua
          </Button>
        </div>

        {/* Formulário de criação/edição */}
        {(isCreating || selectedRulerId) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isCreating ? "Criar Nova Régua" : "Editar Régua"}
              </CardTitle>
              <CardDescription>
                Configure a pergunta, emoções, datas de ativação e cor de fundo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmotionRulerForm
                rulerId={selectedRulerId}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </CardContent>
          </Card>
        )}

        {/* Tabs apenas quando não está criando/editando */}
        {!isCreating && !selectedRulerId && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">
                <Settings className="mr-2 h-4 w-4" />
                Gerenciar Réguas
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 className="mr-2 h-4 w-4" />
                Estatísticas e KPIs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <EmotionRulerList
                rulers={rulers ?? []}
                isLoading={isLoading}
                onEdit={handleEdit}
                onRefresh={refetch}
              />
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <EmotionRulerStats rulers={rulers ?? []} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardShell>
  )
}
