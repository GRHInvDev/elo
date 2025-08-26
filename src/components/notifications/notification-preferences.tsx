"use client"

import { useState, useEffect } from "react"
import { Settings, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { api } from "@/trpc/react"
import { toast } from "@/hooks/use-toast"
import type { NotificationPreferences } from "@/types/notification-types"

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    suggestionUpdates: true,
    systemNotifications: true,
    postNotifications: true,
    bookingNotifications: true,
    foodOrderNotifications: true,
    birthdayNotifications: true,
    soundEnabled: true,
    popupEnabled: true,
    successNotifications: true,
    errorNotifications: true,
    warningNotifications: true,
    suggestionNotifications: true,
    kpiNotifications: true,
    maintenanceNotifications: true
  })

  // Query para buscar preferências atuais
  const preferencesQuery = api.notification.getPreferences.useQuery()
  const currentPreferences = preferencesQuery.data
  const isLoadingPreferences = preferencesQuery.isLoading || false
  const refetchPreferences = preferencesQuery.refetch

  // Mutation para atualizar preferências
  const updatePreferencesMutation = api.notification.updatePreferences.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Preferências atualizadas com sucesso!"
      })
      void refetchPreferences()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar preferências",
        variant: "destructive"
      })
      console.error("Erro ao atualizar preferências:", error)
    }
  })

  // Atualizar estado quando as preferências são carregadas
  useEffect(() => {
    if (currentPreferences) {
      const safeGetBoolean = (value: unknown): boolean => {
        return typeof value === 'boolean' ? value : true
      }

      setPreferences({
        emailNotifications: safeGetBoolean(currentPreferences.emailNotifications),
        pushNotifications: safeGetBoolean(currentPreferences.pushNotifications),
        suggestionUpdates: safeGetBoolean(currentPreferences.suggestionUpdates),
        systemNotifications: safeGetBoolean(currentPreferences.systemNotifications),
        postNotifications: safeGetBoolean((currentPreferences as Record<string, unknown>).postNotifications),
        bookingNotifications: safeGetBoolean((currentPreferences as Record<string, unknown>).bookingNotifications),
        foodOrderNotifications: safeGetBoolean((currentPreferences as Record<string, unknown>).foodOrderNotifications),
        birthdayNotifications: safeGetBoolean((currentPreferences as Record<string, unknown>).birthdayNotifications),
        soundEnabled: safeGetBoolean((currentPreferences as Record<string, unknown>).soundEnabled),
        popupEnabled: safeGetBoolean((currentPreferences as Record<string, unknown>).popupEnabled),
        successNotifications: safeGetBoolean((currentPreferences as Record<string, unknown>).successNotifications),
        errorNotifications: safeGetBoolean((currentPreferences as Record<string, unknown>).errorNotifications),
        warningNotifications: safeGetBoolean((currentPreferences as Record<string, unknown>).warningNotifications),
        suggestionNotifications: safeGetBoolean((currentPreferences as Record<string, unknown>).suggestionNotifications),
        kpiNotifications: safeGetBoolean((currentPreferences as Record<string, unknown>).kpiNotifications),
        maintenanceNotifications: safeGetBoolean((currentPreferences as Record<string, unknown>).maintenanceNotifications)
      })
    }
  }, [currentPreferences])

  const handleSave = () => {
    void updatePreferencesMutation.mutate(preferences)
  }

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (isLoadingPreferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Preferências de Notificação
        </CardTitle>
        <CardDescription>
          Configure como você deseja receber notificações do sistema
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Notificações por Email */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground dark:text-foreground">Notificações por Email</Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Receber notificações importantes por email
            </p>
          </div>
          <Switch
            checked={preferences.emailNotifications}
            onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
          />
        </div>

        <Separator />

        {/* Notificações Push */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground dark:text-foreground">Notificações Push</Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Receber notificações instantâneas no navegador
            </p>
          </div>
          <Switch
            checked={preferences.pushNotifications}
            onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
          />
        </div>

        <Separator />

        {/* Atualizações de Sugestões */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground dark:text-foreground">Atualizações de Sugestões</Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Notificar sobre mudanças nas suas sugestões
            </p>
          </div>
          <Switch
            checked={preferences.suggestionUpdates}
            onCheckedChange={(checked) => handlePreferenceChange('suggestionUpdates', checked)}
          />
        </div>

        <Separator />

        {/* Notificações do Sistema */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground dark:text-foreground">Notificações do Sistema</Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Manutenções, atualizações e avisos importantes
            </p>
          </div>
          <Switch
            checked={preferences.systemNotifications}
            onCheckedChange={(checked) => handlePreferenceChange('systemNotifications', checked)}
          />
        </div>

        <Separator />

        {/* Notificações de Posts */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground dark:text-foreground">Novos Posts</Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Notificar quando alguém publicar um novo post
            </p>
          </div>
          <Switch
            checked={preferences.postNotifications}
            onCheckedChange={(checked) => handlePreferenceChange('postNotifications', checked)}
          />
        </div>

        <Separator />

        {/* Notificações de Agendamentos */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground dark:text-foreground">Agendamentos Próximos</Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Lembretes para agendamentos e reuniões
            </p>
          </div>
          <Switch
            checked={preferences.bookingNotifications}
            onCheckedChange={(checked) => handlePreferenceChange('bookingNotifications', checked)}
          />
        </div>

        <Separator />

        {/* Notificações de Pedidos */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground dark:text-foreground">Pedidos de Comida</Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Lembretes sobre pedidos próximos ao fechamento
            </p>
          </div>
          <Switch
            checked={preferences.foodOrderNotifications}
            onCheckedChange={(checked) => handlePreferenceChange('foodOrderNotifications', checked)}
          />
        </div>

        <Separator />

        {/* Notificações de Aniversários */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground dark:text-foreground">Aniversários</Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Notificar sobre aniversários próximos
            </p>
          </div>
          <Switch
            checked={preferences.birthdayNotifications}
            onCheckedChange={(checked) => handlePreferenceChange('birthdayNotifications', checked)}
          />
        </div>

        <Separator />

        {/* Configurações por Tipo de Notificação */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground dark:text-foreground">Tipos de Notificação</h4>

          {/* Sucesso */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base text-foreground dark:text-foreground">Notificações de Sucesso</Label>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                ✅ Notificações sobre ações bem-sucedidas
              </p>
            </div>
            <Switch
              checked={preferences.successNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('successNotifications', checked)}
            />
          </div>

          {/* Erro */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base text-foreground dark:text-foreground">Notificações de Erro</Label>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                ❌ Alertas sobre problemas e erros
              </p>
            </div>
            <Switch
              checked={preferences.errorNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('errorNotifications', checked)}
            />
          </div>

          {/* Aviso */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base text-foreground dark:text-foreground">Notificações de Aviso</Label>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                ⚠️ Avisos importantes e lembretes
              </p>
            </div>
            <Switch
              checked={preferences.warningNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('warningNotifications', checked)}
            />
          </div>

          {/* Sugestões */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base text-foreground dark:text-foreground">Sugestões</Label>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                💡 Atualizações sobre suas sugestões
              </p>
            </div>
            <Switch
              checked={preferences.suggestionNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('suggestionNotifications', checked)}
            />
          </div>

          {/* KPI */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base text-foreground dark:text-foreground">KPIs e Métricas</Label>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                📊 Atualizações sobre indicadores e métricas
              </p>
            </div>
            <Switch
              checked={preferences.kpiNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('kpiNotifications', checked)}
            />
          </div>

          {/* Sistema */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base text-foreground dark:text-foreground">Sistema</Label>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                🔧 Manutenções e atualizações do sistema
              </p>
            </div>
            <Switch
              checked={preferences.maintenanceNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('maintenanceNotifications', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Configurações de Som e Popup */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground dark:text-foreground">Configurações de Exibição</h4>

          {/* Som */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base text-foreground dark:text-foreground">Som de Notificação</Label>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Tocar som quando receber notificações
              </p>
            </div>
            <Switch
              checked={preferences.soundEnabled}
              onCheckedChange={(checked) => handlePreferenceChange('soundEnabled', checked)}
            />
          </div>

          {/* Popup */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base text-foreground dark:text-foreground">Popups do Navegador</Label>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Mostrar popups no navegador para notificações
              </p>
            </div>
            <Switch
              checked={preferences.popupEnabled}
              onCheckedChange={(checked) => handlePreferenceChange('popupEnabled', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Botão de salvar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updatePreferencesMutation.isPending}
            className="min-w-[120px]"
          >
            {updatePreferencesMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
