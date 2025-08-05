"use client"

import { useState, useEffect } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, MapPin, Phone, CheckCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { addDays, startOfDay } from "date-fns"

const FOOD_ORDER_DEADLINE_HOUR = Number(process.env.NEXT_PUBLIC_FOOD_ORDER_DEADLINE_HOUR ?? 9)

type MenuItemOptionsSelectorProps = {
  menuItemId: string;
  value: Record<string, string[]>;
  onChange: (choices: Record<string, string[]>) => void;
};

function MenuItemOptionsSelector({ menuItemId, value, onChange }: MenuItemOptionsSelectorProps) {
  const options = api.menuItemOption.byMenuItem.useQuery({ menuItemId }, { enabled: !!menuItemId })
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string[]>>(value ?? {})

  useEffect(() => {
    onChange(selectedChoices)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChoices])

  useEffect(() => {
    setSelectedChoices(value ?? {})
  }, [value, menuItemId])

  if (options.isLoading) return <div className="text-sm text-muted-foreground">Carregando opcionais...</div>
  if (!options.data || options.data.length === 0) return <div className="text-sm text-muted-foreground">Nenhum opcional disponível para este prato.</div>

  return (
    <div className="space-y-4 mt-4">
      <h4 className="font-semibold">Opcionais</h4>
      {options.data.map(option => (
        <div key={option.id} className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{option.name}</span>
            <Badge variant="outline" className="text-xs">{option.required ? "Obrigatória" : "Opcional"}</Badge>
            {option.multiple && <Badge variant="secondary" className="text-xs">Múltipla</Badge>}
          </div>
          {option.description && <div className="text-xs text-muted-foreground">{option.description}</div>}
          <div className="flex flex-col ml-4 gap-2 mt-2">
            {option.choices.map(choice => (
              <label key={choice.id} className="flex items-center gap-1 cursor-pointer">
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
                  />
                ) : (
                  <input
                    type="radio"
                    name={option.id}
                    checked={selectedChoices[option.id]?.[0] === choice.id}
                    onChange={() => {
                      setSelectedChoices(prev => ({ ...prev, [option.id]: [choice.id] }))
                    }}
                  />
                )}
                <span>{choice.name}</span>
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
    const brasiliaTime = new Date(now.getTime() - 3 * 60 * 60 * 1000) // UTC-3
    const orderDate = brasiliaTime.getHours() < FOOD_ORDER_DEADLINE_HOUR ? startOfDay(brasiliaTime) : startOfDay(addDays(brasiliaTime, 1))

    // Flatten as escolhas para um array de IDs
    const selectedChoicesIds = Object.values(optionChoices).flat()

    createOrder.mutate({
      restaurantId: selectedRestaurant,
      menuItemId: selectedMenuItem,
      orderDate: orderDate,
      optionChoices: selectedChoicesIds,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800"
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos de Comida</h1>
          <p className="text-muted-foreground">
            Faça seu pedido com restaurantes parceiros
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Pedidos até às {FOOD_ORDER_DEADLINE_HOUR}h para hoje
          </span>
        </div>
      </div>

      {/* Alerta de horário */}
      {isAfterDeadline && (
        <Alert className="border-yellow-400 bg-yellow-50/30">
          <AlertDescription className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            O horário limite para pedidos de hoje ({FOOD_ORDER_DEADLINE_HOUR}h) já passou, são {format(now, "HH:mm", { locale: ptBR })}. Seu pedido será para amanhã.
          </AlertDescription>
        </Alert>
      )}

      {/* Pedido de hoje */}
      {todayOrder.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Seu Pedido de Hoje</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayOrder.data?.restaurant && (
                <p><strong>Restaurante:</strong> {todayOrder.data.restaurant.name}</p>
              )}
              {todayOrder.data?.menuItem && (
                <>
                  <p><strong>Prato:</strong> {todayOrder.data.menuItem.name}</p>
                </>
              )}
              <p><strong>Status:</strong> 
                <Badge className={`ml-2 ${getStatusColor(todayOrder.data.status)}`}>
                  {getStatusText(todayOrder.data.status)}
                </Badge>
              </p>
              {todayOrder.data.observations && (
                <p><strong>Observações:</strong> {todayOrder.data.observations}</p>
              )}
              {/* Botão de cancelar pedido */}
              {
                !isAfterDeadline && ( 
                  <Button
                    variant="destructive"
                    className="mt-4 w-full"
                    disabled={deleteOrder.isPending}
                    onClick={() => deleteOrder.mutate({ id: todayOrder.data?.id ?? "" })}
                  >
                    {deleteOrder.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> : null}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span>Seu Pedido de Amanhã</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tomorrowOrder.data?.restaurant && (
                <p><strong>Restaurante:</strong> {tomorrowOrder.data.restaurant.name}</p>
              )}
              {tomorrowOrder.data?.menuItem && (
                <>
                  <p><strong>Prato:</strong> {tomorrowOrder.data.menuItem.name}</p>
                </>
              )}
              <p><strong>Status:</strong> 
                <Badge className={`ml-2 ${getStatusColor(tomorrowOrder.data.status)}`}>
                  {getStatusText(tomorrowOrder.data.status)}
                </Badge>
              </p>
              {tomorrowOrder.data.observations && (
                <p><strong>Observações:</strong> {tomorrowOrder.data.observations}</p>
              )}
              {/* Botão de cancelar pedido de amanhã */}
              <Button
                variant="destructive"
                className="mt-4 w-full"
                disabled={deleteOrder.isPending}
                onClick={() => deleteOrder.mutate({ id: tomorrowOrder.data?.id ?? "" })}
              >
                {deleteOrder.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> : null}
                {deleteOrder.isPending ? "Cancelando..." : "Cancelar Pedido de Amanhã"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de pedido - fluxo passo a passo */}
      {!blockOrder && (
        <Card>
          <CardHeader>
            <CardTitle>Fazer Novo Pedido</CardTitle>
            <CardDescription>
              Siga as etapas para fazer seu pedido
            </CardDescription>
            <div className="flex gap-2 mt-2">
              {steps.map((s, idx) => (
                <div key={s.label} className={`flex items-center gap-1 ${step === idx + 1 ? "font-bold text-primary" : "text-muted-foreground"}`}>
                  <span className={`rounded-full w-6 h-6 flex items-center justify-center border ${step === idx + 1 ? "bg-primary text-background border-primary" : s.done ? "bg-green-100 border-green-400 text-green-700" : "bg-gray-100 border-gray-300"}`}>{idx + 1}</span>
                  <span className="text-xs">{s.label}</span>
                  {idx < steps.length - 1 && <span className="mx-1">→</span>}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Passo 1: Restaurante */}
            {step === 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Restaurante</label>
                <Select value={selectedRestaurant} onValueChange={(v) => { setSelectedRestaurant(v); setStep(2); }} disabled={restaurants.isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={restaurants.isLoading ? "Carregando restaurantes..." : "Selecione um restaurante"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRestaurants?.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        <div className="flex flex-col">
                          <span>{restaurant.name}</span>
                          <span className="text-xs text-muted-foreground">{restaurant.city}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {restaurants.isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /> Carregando restaurantes...</div>}
                {selectedRestaurantData && (
                  <Card className="bg-muted/50 mt-2">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <p className="font-medium">{selectedRestaurantData.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedRestaurantData.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedRestaurantData.address}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{selectedRestaurantData.phone}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <div className="flex justify-end mt-4">
                  <Button disabled={!selectedRestaurant} onClick={() => setStep(2)}>Próximo</Button>
                </div>
              </div>
            )}

            {/* Passo 2: Prato */}
            {step === 2 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Prato</label>
                <Select value={selectedMenuItem} onValueChange={(v) => setSelectedMenuItem(v)} disabled={!selectedRestaurant || menuItems.isLoading}>
                  <SelectTrigger className="h-24">
                    <SelectValue placeholder={menuItems.isLoading ? "Carregando prato do dia..." : "Selecione o prato do dia"} />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.data && menuItems.data.length > 0 ? (
                      menuItems.data.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-start gap-3 py-2">
                            <span className="text-xl">🍽️</span>
                            <div className="flex flex-col w-full">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-base">{item.name}</span>
                                <Badge variant="outline" className="text-xs">{item.category}</Badge>
                              </div>
                              {item.description && <span className="text-xs text-muted-foreground mt-1">{item.description}</span>}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-muted-foreground">Nenhum prato disponível para {format(menuDate, "EEEE", { locale: ptBR })}.</div>
                    )}
                  </SelectContent>
                </Select>
                {menuItems.isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /> Carregando pratos...</div>}
                {/* Seleção de opcionais do prato */}
                {selectedMenuItem && (
                  <MenuItemOptionsSelector
                    menuItemId={selectedMenuItem}
                    value={optionChoices}
                    onChange={setOptionChoices}
                  />
                )}
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => { setSelectedMenuItem(""); setStep(1); }}>Voltar</Button>
                  <Button disabled={!selectedMenuItem} onClick={() => setStep(3)}>Próximo</Button>
                </div>
              </div>
            )}

            {/* Passo 3: Confirmação */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded p-4">
                  <h3 className="font-semibold mb-2">Resumo do Pedido</h3>
                  <ul className="text-sm space-y-1">
                    <li><strong>Restaurante:</strong> {selectedRestaurantData?.name}</li>
                    <li><strong>Prato:</strong> {selectedMenuItemData?.name}</li>
                  </ul>
                  {/* Opcionais selecionados */}
                  <SelectedOptionsSummary menuItemId={selectedMenuItem} optionChoices={optionChoices} />
                </div>
                <div className="flex justify-between mt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
                  <Button 
                    onClick={handleCreateOrder}
                    disabled={createOrder.isPending}
                    className="w-48 text-lg h-12"
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
        <Alert className="border-green-400 bg-green-50/30">
          <AlertDescription className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            {isAfterDeadline && hasOrderForTomorrow
              ? "Seu pedido para amanhã já foi registrado com sucesso! Caso precise alterar, cancele o pedido atual antes de fazer um novo."
              : "Seu pedido para hoje já foi registrado com sucesso! Caso precise alterar, cancele o pedido atual antes de fazer um novo."}
          </AlertDescription>
        </Alert>
      )}

      {/* Histórico de pedidos colapsável */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer select-none" onClick={() => setShowHistory((v) => !v)}>
          <div>
            <CardTitle>Histórico de Pedidos</CardTitle>
            <CardDescription>Seus pedidos dos últimos 30 dias</CardDescription>
          </div>
          <Button variant="ghost" size="icon" aria-label="Mostrar/Ocultar histórico">
            {showHistory ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {myOrders.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /> Carregando histórico...</div>
            ) : myOrders.data && myOrders.data.length > 0 ? (
              <div className="space-y-4">
                {myOrders.data.map((order) => (
                  <Card key={order.id} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium">{order.restaurant.name}</p>
                          <p className="text-sm">{order.menuItem.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          {order.observations && (
                            <p className="text-xs text-muted-foreground">Obs: {order.observations}</p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado</p>
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
    <div className="mt-4">
      <h4 className="font-medium mb-1">Opcionais Selecionados:</h4>
      <ul className="text-xs space-y-1">
        {options.data.map(option => {
          const selected = optionChoices[option.id]
          if (!selected || selected.length === 0) return null
          return (
            <li key={option.id}>
              <span className="font-semibold">{option.name}:</span> {option.choices.filter(c => selected.includes(c.id)).map(c => c.name).join(", ")}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
