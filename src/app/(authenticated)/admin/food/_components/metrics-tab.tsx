"use client"

import { useState, useEffect } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"

type MetricsItem = {
  restaurantId: string
  restaurantName: string
  restaurantCity: string
  totalOrders: number
  totalRevenue: number
}

type ChartItem = {
  restaurant: string
  orders: number
}

interface MetricsTabProps {
  selectedYear: number
  selectedDate: Date
  setSelectedDate: (date: Date) => void
}

export default function MetricsTab({ selectedYear, selectedDate, setSelectedDate }: MetricsTabProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'month' | 'year'>('month')


  // Buscar métricas de pedidos por restaurante
  const metricsQuery = api.foodOrder.getMetricsByRestaurant.useQuery(
    selectedPeriod === 'month'
      ? { year: selectedYear, month: selectedMonth, period: selectedPeriod }
      : selectedPeriod === 'day'
      ? {
          year: selectedYear, // Usar selectedYear em vez de selectedDate.getFullYear()
          month: selectedDate.getMonth() + 1,
          period: selectedPeriod,
          date: selectedDate
        }
      : { year: selectedYear, period: selectedPeriod }
  )

  // Buscar dados para gráficos
  const chartDataQuery = api.foodOrder.getChartDataByRestaurant.useQuery(
    selectedPeriod === 'month'
      ? { year: selectedYear, month: selectedMonth, period: selectedPeriod }
      : selectedPeriod === 'day'
      ? {
          year: selectedYear, // Usar selectedYear em vez de selectedDate.getFullYear()
          month: selectedDate.getMonth() + 1,
          period: selectedPeriod,
          date: selectedDate
        }
      : { year: selectedYear, period: selectedPeriod }
  )

  const metricsData: MetricsItem[] = metricsQuery.data ?? []
  const totalOrders = metricsData.reduce((sum: number, metric: MetricsItem) => sum + (metric.totalOrders ?? 0), 0)
  const totalRevenue = metricsData.reduce((sum: number, metric: MetricsItem) => sum + (metric.totalRevenue ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            {selectedPeriod === 'day' && 'Visualize métricas de um dia específico'}
            {selectedPeriod === 'month' && 'Visualize métricas mensais'}
            {selectedPeriod === 'year' && 'Visualize métricas anuais'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={selectedPeriod} onValueChange={(value: 'day' | 'month' | 'year') => setSelectedPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia Específico</SelectItem>
                  <SelectItem value="month">Mensal</SelectItem>
                  <SelectItem value="year">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedPeriod === 'month' && (
              <div className="space-y-2">
                <Label>Mês</Label>
                <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {new Date(0, i).toLocaleString("pt-BR", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedPeriod === 'day' && (
              <div className="flex items-center space-x-2">
                <Label>Data</Label>
                <DatePicker
                  date={selectedDate}
                  onDateChange={(date: Date | undefined) => {
                    if (date) {
                      setSelectedDate(date)
                    }
                  }}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={String(selectedYear)} onValueChange={(value) => {
                const newYear = parseInt(value)
                const newDate = new Date(selectedDate)
                newDate.setFullYear(newYear)
                setSelectedDate(newDate)
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i
                    return (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total de Pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Receita Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de métricas por restaurante */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos por Restaurante</CardTitle>
          <CardDescription>
            Métricas detalhadas de pedidos e receita por restaurante
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metricsQuery.isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando métricas...</p>
          ) : metricsData.length > 0 ? (
            <div className="space-y-4">
              {metricsData.map((metric: MetricsItem) => (
                <Card key={metric.restaurantId ?? metric.restaurantName} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{metric.restaurantName ?? 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{metric.restaurantCity ?? 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{metric.totalOrders ?? 0} pedidos</p>
                        <p className="text-sm text-muted-foreground">R$ {(metric.totalRevenue ?? 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum dado encontrado para o período selecionado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de pedidos por restaurante */}
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Pedidos por Restaurante</CardTitle>
          <CardDescription>
            {selectedPeriod === 'day' && 'Pedidos do dia selecionado por restaurante'}
            {selectedPeriod === 'month' && 'Pedidos do mês selecionado por restaurante'}
            {selectedPeriod === 'year' && 'Top 10 restaurantes por número de pedidos no ano'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartDataQuery.isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando gráfico...</p>
          ) : (() => {
              const data = chartDataQuery.data
              if (!data || data.length === 0) return (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado para exibir no gráfico
                </p>
              )

              const chartData: ChartItem[] = data
              const totalOrders = chartData.reduce((sum, d) => sum + (d.orders ?? 0), 0)

              return (
                <div className="space-y-4">
                  {chartData.map((item: ChartItem, index: number) => {
                    const percentage = totalOrders > 0 ? ((item.orders ?? 0) / totalOrders) * 100 : 0

                    return (
                      <div key={item.restaurant ?? `restaurant-${index}`} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <span className="font-medium text-sm">{item.restaurant ?? 'N/A'}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {item.orders ?? 0} pedidos ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()
          }
        </CardContent>
      </Card>
    </div>
  )
}
