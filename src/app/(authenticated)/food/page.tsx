"use client"

import { useState, useEffect } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, MapPin, Phone, CheckCircle, ChevronDown, ChevronUp, Loader2, Trash2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { addDays, startOfDay } from "date-fns"

const FOOD_ORDER_DEADLINE_HOUR = Number(process.env.NEXT_PUBLIC_FOOD_ORDER_DEADLINE_HOUR ?? 9)

type MenuItemOptionsSelectorProps = {
  menuItemId: string;
  value: Record<string, string[]>;
  onChange: (choices: Record<string, string[]>) => void;
  onValidationChange?: (isValid: boolean) => void;
};

function MenuItemOptionsSelector({ menuItemId, value, onChange, onValidationChange }: MenuItemOptionsSelectorProps) {
  const options = api.menuItemOption.byMenuItem.useQuery({ menuItemId }, { enabled: !!menuItemId })
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string[]>>(value ?? {})

  useEffect(() => {
    onChange(selectedChoices)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChoices])

  useEffect(() => {
    setSelectedChoices(value ?? {})
  }, [value, menuItemId])
  
  // Validação: verificar obrigatórias e exigir ao menos uma se só houver opcionais
  useEffect(() => {
    if (options.data) {
      // Se não há opcionais para o prato, considera válido automaticamente
      if (options.data.length === 0) {
        onValidationChange?.(true)
        return
      }

      const hasRequired = options.data.some(option => option.required)

      const isValid = hasRequired
        ? options.data.every(option => {
            if (!option.required) return true
            const selected = selectedChoices[option.id]
            return !!selected && selected.length > 0
          })
        : Object.values(selectedChoices).flat().length > 0

      onValidationChange?.(isValid)
    }
  }, [options.data, selectedChoices, onValidationChange])

  if (options.isLoading) return <div className="text-sm text-muted-foreground">Carregando opcionais...</div>

  // Se não há opcionais, mostra mensagem mas validação já foi feita no useEffect
  if (!options.data || options.data.length === 0) {
    return <div className="text-sm text-muted-foreground">Nenhum opcional disponível para este prato.</div>
  }

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-border">
      <h4 className="font-semibold text-foreground tracking-tight">Opcionais</h4>
      {options.data.map(option => (
        <div key={option.id} className="space-y-2 bg-muted/40 rounded-lg p-3 border border-border transition-all hover:border-input dark:hover:border-input">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm md:text-base text-foreground">{option.name}</span>
            {option.required && <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">Obrigatória</Badge>}
            {!option.required && <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">Opcional</Badge>}
            {option.multiple && <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Múltipla</Badge>}
          </div>
          {option.description && <div className="text-xs text-muted-foreground italic">{option.description}</div>}
          <div className="flex flex-col gap-2.5 mt-2 ml-1">
            {option.choices.map(choice => (
              <label key={choice.id} className="flex items-center gap-2.5 cursor-pointer hover:text-primary transition-colors">
                {option.multiple ? (
                  <input
                    type="checkbox"
                    checked={selectedChoices[option.id]?.includes(choice.id) ?? false}
                    onChange={e => {
                      setSelectedChoices(prev => {
                        const prevArr = prev[option.id] ?? []
                        return {
                          ...prev,
                          [option.id]: e.target.checked
                            ? [...prevArr, choice.id]
                            : prevArr.filter((id: string) => id !== choice.id)
                        }
                      })
                    }}
                    className="w-4 h-4 rounded transition-all accent-primary"
                  />
                ) : (
                  <input
                    type="radio"
                    name={option.id}
                    checked={selectedChoices[option.id]?.[0] === choice.id}
                    onChange={() => {
                      setSelectedChoices(prev => ({ ...prev, [option.id]: [choice.id] }))
                    }}
                    className="w-4 h-4 transition-all accent-primary"
                  />
                )}
                <span className="text-sm md:text-base text-foreground">{choice.name}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FoodPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("")
  const [step, setStep] = useState<number>(1)
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [optionChoices, setOptionChoices] = useState<Record<string, string[]>>({})
  const [optionsValid, setOptionsValid] = useState<boolean>(true)

  // Resetar validação quando o prato muda
  useEffect(() => {
    setOptionsValid(true)
    setOptionChoices({})
  }, [selectedMenuItem])

  const utils = api.useUtils()

  // Buscar restaurantes ativos
  const restaurants = api.restaurant.listActive.useQuery()

  // Buscar itens do menu do restaurante selecionado
  // Definir a data do pedido conforme a regra de horário (UTC-3)
  const now = new Date()
  const brasiliaTime = new Date(now.getTime() - 3 * 60 * 60 * 1000) // UTC-3
  const today = startOfDay(brasiliaTime)
  const tomorrow = startOfDay(addDays(brasiliaTime, 1))
  const menuDate = now.getHours() < FOOD_ORDER_DEADLINE_HOUR ? today : tomorrow;
  const menuItems = api.menuItem.byRestaurant.useQuery(
    { restaurantId: selectedRestaurant, date: menuDate },
    { enabled: !!selectedRestaurant }
  )

  // Buscar pedido do usuário para hoje e para amanhã
  const todayOrder = api.foodOrder.checkOrderByDate.useQuery({ date: today })
  // Buscar pedido de amanhã
  const tomorrowOrder = api.foodOrder.checkOrderByDate.useQuery({ date: tomorrow })

  // Criar pedido
  const createOrder = api.foodOrder.create.useMutation({
    onSuccess: async () => {
      toast.success("Pedido realizado com sucesso!")
      setSelectedRestaurant("")
      setSelectedMenuItem("")
      setStep(1)
      void todayOrder.refetch()
      await utils.foodOrder.checkOrderByDate.invalidate()
      await utils.foodOrder.myOrders.invalidate()
      await utils.foodOrder.checkOrderByDate.invalidate()
      await utils.foodOrder.myOrders.invalidate()
    },
    onError: (error) => {
      toast.error(`Erro ao fazer pedido: ${error.message}`)
    },
  })

  // Deletar pedido
  const deleteOrder = api.foodOrder.delete.useMutation({
    onSuccess: async () => {
      toast.success("Pedido cancelado com sucesso!")
      void todayOrder.refetch()
      void myOrders.refetch()
      await utils.foodOrder.checkOrderByDate.invalidate()
      await utils.foodOrder.myOrders.invalidate()
    },
    onError: (error) => {
      toast.error(`Erro ao cancelar pedido: ${error.message}`)
    },
  })

  // Buscar pedidos do usuário
  const myOrders = api.foodOrder.myOrders.useQuery({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  })
  
  

  const handleCreateOrder = () => {
    if (!selectedRestaurant || !selectedMenuItem) {
      toast.error("Selecione um restaurante e um prato")
      return
    }

    const now = new Date()
    const orderDate = now.getHours() < FOOD_ORDER_DEADLINE_HOUR ? startOfDay(now) : startOfDay(addDays(now, 1))

    // Flatten as escolhas para um array de IDs (pode estar vazio se não há opcionais)
    const selectedChoicesIds = Object.values(optionChoices).flat()

    createOrder.mutate({
      restaurantId: selectedRestaurant,
      menuItemId: selectedMenuItem,
      orderDate: orderDate,
      optionChoices: selectedChoicesIds.length > 0 ? selectedChoicesIds : undefined,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
      case "CONFIRMED":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
      case "DELIVERED":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
      case "CANCELLED":
        return "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800"
      default:
        return "bg-muted text-muted-foreground border border-border"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pendente"
      case "CONFIRMED":
        return "Confirmado"
      case "DELIVERED":
        return "Entregue"
      case "CANCELLED":
        return "Cancelado"
      default:
        return status
    }
  }

  const filteredRestaurants = restaurants.data

  const selectedRestaurantData = restaurants.data?.find(
    (restaurant) => restaurant.id === selectedRestaurant
  )

  const selectedMenuItemData = menuItems.data?.find(
    (item) => item.id === selectedMenuItem
  )

  // NOVA LÓGICA: bloquear se já houver pedido para hoje (antes das 10h) ou para amanhã (após as 10h)
  const isAfterDeadline = now.getHours() >= FOOD_ORDER_DEADLINE_HOUR
  const hasOrderForToday = !!todayOrder.data
  const hasOrderForTomorrow = !!tomorrowOrder.data
  const blockOrder = (!isAfterDeadline && hasOrderForToday) || (isAfterDeadline && hasOrderForTomorrow)

  // Passos do fluxo
  const steps = [
    { label: "Restaurante", done: !!selectedRestaurant },
    { label: "Prato", done: !!selectedMenuItem },
    { label: "Confirmação", done: false },
  ]

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-2">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">Almoços</h1>
          <p className="text-muted-foreground mt-1">
            Faça seu pedido de almoço com restaurantes parceiros
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/40 px-4 py-3 rounded-lg border border-border shadow-sm">
          <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
          <span className="text-xs md:text-sm text-foreground font-medium">
            Pedidos até às {FOOD_ORDER_DEADLINE_HOUR}h para hoje
          </span>
        </div>
      </div>

      {/* Alerta de horário */}
      {isAfterDeadline && (
        <Alert className="border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-900/20 dark:to-amber-900/10 shadow-sm hover:shadow-md transition-all">
          <AlertDescription className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 p-0">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs md:text-sm text-amber-900 dark:text-amber-200 font-medium">O horário limite para pedidos de hoje ({FOOD_ORDER_DEADLINE_HOUR}h) já passou, são {format(now, "HH:mm", { locale: ptBR })}. Seu pedido será para amanhã.</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Pedido de hoje */}
      {todayOrder.data && (
        <Card className="shadow-sm hover:shadow-md transition-all border border-border bg-card">
          <CardHeader className="p-3 md:p-6 bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-t-lg border-b border-emerald-200 dark:border-emerald-800">
            <CardTitle className="flex items-center gap-3 text-lg md:text-xl text-emerald-900 dark:text-emerald-100 tracking-tight">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Seu Pedido de Almoço de Hoje</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayOrder.data?.restaurant && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Restaurante</p>
                  <p className="font-semibold text-foreground">{todayOrder.data.restaurant.name}</p>
                </div>
              )}
              {todayOrder.data?.menuItem && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prato</p>
                  <p className="font-semibold text-foreground">{todayOrder.data.menuItem.name}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
              <Badge className={`${getStatusColor(todayOrder.data.status)} font-medium transition-all`}>
                {getStatusText(todayOrder.data.status)}
              </Badge>
            </div>
            {todayOrder.data.observations && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase tracking-wider mb-1">Observações</p>
                <p className="text-sm text-blue-900 dark:text-blue-100">{todayOrder.data.observations}</p>
              </div>
            )}
            {/* Botão de cancelar pedido */}
            <div className="flex justify-end w-full pt-2">
              {
                !isAfterDeadline && (
                  <Button
                    variant="destructive"
                    className="w-full md:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:scale-105 transition-all duration-200 focus-visible:ring-2 ring-offset-2"
                    disabled={deleteOrder.isPending}
                    onClick={() => deleteOrder.mutate({ id: todayOrder.data?.id ?? "" })}
                  >
                    {deleteOrder.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> : <Trash2 className="h-4 w-4 mr-2 inline" />}
                    {deleteOrder.isPending ? "Cancelando..." : "Cancelar Pedido"}
                  </Button>
                )
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pedido de amanhã */}
      {tomorrowOrder.data && (
        <Card className="shadow-sm hover:shadow-md transition-all border border-border bg-card">
          <CardHeader className="p-3 md:p-6 bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-t-lg border-b border-blue-200 dark:border-blue-800">
            <CardTitle className="flex items-center gap-3 text-lg md:text-xl text-blue-900 dark:text-blue-100 tracking-tight">
              <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>Seu Pedido de Almoço de Amanhã</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tomorrowOrder.data?.restaurant && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Restaurante</p>
                  <p className="font-semibold text-foreground">{tomorrowOrder.data.restaurant.name}</p>
                </div>
              )}
              {tomorrowOrder.data?.menuItem && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prato</p>
                  <p className="font-semibold text-foreground">{tomorrowOrder.data.menuItem.name}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
              <Badge className={`${getStatusColor(tomorrowOrder.data.status)} font-medium transition-all`}>
                {getStatusText(tomorrowOrder.data.status)}
              </Badge>
            </div>
            {tomorrowOrder.data.observations && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase tracking-wider mb-1">Observações</p>
                <p className="text-sm text-blue-900 dark:text-blue-100">{tomorrowOrder.data.observations}</p>
              </div>
            )}
            {/* Botão de cancelar pedido de amanhã */}
            <div className="flex justify-end w-full pt-2">
              <Button
                variant="destructive"
                className="w-full md:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:scale-105 transition-all duration-200 focus-visible:ring-2 ring-offset-2"
                disabled={deleteOrder.isPending}
                onClick={() => deleteOrder.mutate({ id: tomorrowOrder.data?.id ?? "" })}
              >
                {deleteOrder.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> : <Trash2 className="h-4 w-4 mr-2 inline" />}
                {deleteOrder.isPending ? "Cancelando..." : "Cancelar Pedido de Amanhã"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de pedido - fluxo passo a passo */}
      {!blockOrder && (
        <Card className="shadow-sm hover:shadow-md transition-all border border-border bg-card">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-foreground tracking-tight">Fazer Novo Pedido</CardTitle>
            <CardDescription className="text-muted-foreground">
              Siga as etapas para fazer seu pedido
            </CardDescription>
            <div className="flex flex-wrap gap-3 md:gap-4 mt-6">
              {steps.map((s, idx) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`rounded-full w-10 h-10 md:w-9 md:h-9 flex items-center justify-center border-2 font-semibold text-sm transition-all duration-300 shadow-sm ${step === idx + 1 ? "bg-gradient-to-br from-primary to-primary/80 text-white border-primary shadow-md scale-110" : s.done ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-muted border-border text-muted-foreground"}`}>
                    {idx + 1}
                  </div>
                  <span className={`text-xs md:text-sm font-medium transition-colors ${step === idx + 1 ? "text-primary font-semibold" : s.done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{s.label}</span>
                  {idx < steps.length - 1 && (
                    <div className="hidden md:flex items-center gap-2 mx-1">
                      <div className="h-0.5 w-8 bg-gradient-to-r from-primary/20 to-primary/5"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Passo 1: Restaurante */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-foreground">Restaurante</label>
                  <Select value={selectedRestaurant} onValueChange={(v) => { setSelectedRestaurant(v); setStep(2); }} disabled={restaurants.isLoading}>
                    <SelectTrigger className="bg-background border-2 border-border rounded-lg transition-colors hover:border-input h-11 md:h-10 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder={restaurants.isLoading ? "Carregando restaurantes..." : "Selecione um restaurante"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRestaurants?.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id} className="cursor-pointer">
                          <div className="flex flex-col">
                            <span className="font-medium">{restaurant.name}</span>
                            <span className="text-xs text-muted-foreground">{restaurant.city}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {restaurants.isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /> Carregando restaurantes...</div>}
                {selectedRestaurantData && (
                  <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all mt-4">
                    <CardContent className="p-3 md:p-6 pt-4 md:pt-6 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-foreground tracking-tight">{selectedRestaurantData.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{selectedRestaurantData.description}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{selectedRestaurantData.address}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{selectedRestaurantData.phone}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <div className="flex justify-end mt-6 pt-4 border-t border-border">
                  <Button disabled={!selectedRestaurant} onClick={() => setStep(2)} className="bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-200 focus-visible:ring-2 ring-offset-2">Próximo</Button>
                </div>
              </div>
            )}

            {/* Passo 2: Prato */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-foreground">Prato</label>
                  <Select value={selectedMenuItem} onValueChange={(v) => setSelectedMenuItem(v)} disabled={!selectedRestaurant || menuItems.isLoading}>
                    <SelectTrigger className="bg-background border-2 border-border rounded-lg transition-colors hover:border-input min-h-11 md:min-h-10 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder={menuItems.isLoading ? "Carregando prato do dia..." : "Selecione o prato do dia"} />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.data && menuItems.data.length > 0 ? (
                        menuItems.data.map((item) => (
                          <SelectItem key={item.id} value={item.id} className="cursor-pointer">
                            {item.name}{item.category ? ` — ${item.category}` : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-muted-foreground text-sm">Nenhum prato disponível para {format(menuDate, "EEEE", { locale: ptBR })}.</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {menuItems.isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /> Carregando pratos...</div>}
                {/* Seleção de opcionais do prato */}
                {selectedMenuItem && (
                  <MenuItemOptionsSelector
                    menuItemId={selectedMenuItem}
                    value={optionChoices}
                    onChange={setOptionChoices}
                    onValidationChange={setOptionsValid}
                  />
                )}
                {!optionsValid && selectedMenuItem && (
                  <Alert className="border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-900/20 dark:to-red-900/10 shadow-sm">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <AlertDescription className="text-xs md:text-sm text-red-900 dark:text-red-200 font-medium">
                      Você deve selecionar as opções obrigatórias antes de continuar.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col-reverse md:flex-row justify-between gap-3 md:gap-2 mt-6 pt-4 border-t border-border">
                  <Button variant="outline" className="w-full md:w-auto border-2 hover:bg-muted/50 transition-colors" onClick={() => { setSelectedMenuItem(""); setStep(1); }}>Voltar</Button>
                  <Button
                    disabled={!selectedMenuItem || !optionsValid}
                    onClick={() => setStep(3)}
                    className="w-full md:w-auto bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-200 focus-visible:ring-2 ring-offset-2"
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}

            {/* Passo 3: Confirmação */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="bg-muted/40 rounded-xl p-4 md:p-6 border border-border shadow-sm">
                  <h3 className="font-bold text-base md:text-lg text-foreground tracking-tight mb-4">Resumo do Pedido</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 p-3 bg-muted/40 rounded-lg border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Restaurante</p>
                        <p className="font-semibold text-foreground">{selectedRestaurantData?.name}</p>
                      </div>
                      <div className="space-y-2 p-3 bg-muted/40 rounded-lg border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prato</p>
                        <p className="font-semibold text-foreground">{selectedMenuItemData?.name}</p>
                      </div>
                    </div>
                    {/* Opcionais selecionados */}
                    <SelectedOptionsSummary menuItemId={selectedMenuItem} optionChoices={optionChoices} />
                  </div>
                </div>
                <div className="flex flex-col-reverse md:flex-row justify-between gap-3 md:gap-2 mt-6 pt-4 border-t border-border">
                  <Button variant="outline" className="w-full md:w-auto border-2 hover:bg-muted/50 transition-colors" onClick={() => setStep(2)}>Voltar</Button>
                  <Button
                    onClick={handleCreateOrder}
                    disabled={createOrder.isPending}
                    className="w-full md:w-auto bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-200 focus-visible:ring-2 ring-offset-2 h-11 text-base font-semibold"
                  >
                    {createOrder.isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2 inline" /> : null}
                    {createOrder.isPending ? "Fazendo pedido..." : "Confirmar Pedido"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem de bloqueio se já houver pedido */}
      {blockOrder && (
        <Alert className="border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-900/20 dark:to-emerald-900/10 shadow-sm hover:shadow-md transition-all">
          <AlertDescription className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 p-0">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs md:text-sm text-emerald-900 dark:text-emerald-200 font-medium">
              {isAfterDeadline && hasOrderForTomorrow
                ? "Seu pedido para amanhã já foi registrado com sucesso! Caso precise alterar, cancele o pedido atual antes de fazer um novo."
                : "Seu pedido para hoje já foi registrado com sucesso! Caso precise alterar, cancele o pedido atual antes de fazer um novo."}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Histórico de pedidos colapsável */}
      <Card className="shadow-sm hover:shadow-md transition-all border border-border bg-card">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 cursor-pointer select-none p-3 md:p-6 hover:bg-muted/50 transition-colors rounded-t-lg" onClick={() => setShowHistory((v) => !v)}>
          <div>
            <CardTitle className="text-lg md:text-xl text-foreground tracking-tight">Histórico de Pedidos</CardTitle>
            <CardDescription className="text-xs md:text-sm text-muted-foreground">Seus pedidos dos últimos 30 dias</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 transition-transform" aria-label="Mostrar/Ocultar histórico">
            {showHistory ? <ChevronUp className="h-5 w-5 md:h-6 md:w-6 text-primary" /> : <ChevronDown className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />}
          </Button>
        </CardHeader>
        {showHistory && (
          <CardContent className="p-3 md:p-6 border-t border-border max-h-[600px] overflow-y-auto">
            {myOrders.isLoading ? (
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /> Carregando histórico...</div>
            ) : myOrders.data && myOrders.data.length > 0 ? (
              <div className="space-y-3">
                {myOrders.data.map((order) => (
                  <Card key={order.id} className="bg-muted/40 border border-border shadow-xs hover:shadow-md hover:border-primary/30 transition-all">
                    <CardContent className="p-3 md:p-4 pt-4 md:pt-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                        <div className="space-y-2 w-full md:w-auto flex-1">
                          <p className="font-semibold text-sm md:text-base text-foreground">{order.restaurant?.name}</p>
                          <p className="text-xs md:text-sm text-foreground">{order.menuItem.name}</p>
                          <p className="text-xs text-muted-foreground font-medium">
                            {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          {order.observations && (
                            <p className="text-xs text-muted-foreground italic">Obs: {order.observations}</p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className={`${getStatusColor(order.status)} font-medium transition-all`}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-xs md:text-sm">Nenhum pedido encontrado</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

function SelectedOptionsSummary({ menuItemId, optionChoices }: { menuItemId: string, optionChoices: Record<string, string[]> }) {
  const options = api.menuItemOption.byMenuItem.useQuery({ menuItemId }, { enabled: !!menuItemId })

  if (!options.data || Object.keys(optionChoices).length === 0) return null

  return (
    <div className="space-y-3 p-3 bg-muted/40 rounded-lg border border-border">
      <h4 className="font-semibold text-sm text-foreground tracking-tight">Opcionais Selecionados</h4>
      <ul className="text-xs space-y-2">
        {options.data.map(option => {
          const selected = optionChoices[option.id]
          if (!selected || selected.length === 0) return null
          return (
            <li key={option.id} className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">{option.name}</span>
              <div className="ml-2 flex flex-wrap gap-2">
                {option.choices.filter(c => selected.includes(c.id)).map(c => (
                  <Badge key={c.id} variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800 text-xs">
                    {c.name}
                  </Badge>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}