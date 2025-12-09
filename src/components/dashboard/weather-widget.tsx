"use client"

import { useEffect, useState } from "react"
import { Cloud, CloudRain, Sun, CloudSun, Droplets, Wind, MapPin } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface WeatherData {
  temperature: number
  precipitation: number
  weatherCode: number
  windSpeed: number
  humidity: number
  time: string
}

interface WeatherWidgetProps {
  className?: string
}

interface GeocodingResult {
  name?: string
  admin1?: string
  admin2?: string
}

interface GeocodingResponse {
  results?: GeocodingResult[]
}

interface WeatherApiResponse {
  hourly?: {
    time?: string[]
    temperature_2m?: number[]
    precipitation?: number[]
    weather_code?: number[]
    wind_speed_10m?: number[]
    relative_humidity_2m?: number[]
  }
}

// Códigos do tempo da Open-Meteo (WMO Weather interpretation codes)
const getWeatherIcon = (code: number) => {
  // Céu limpo
  if (code === 0) return <Sun className="size-8 text-yellow-500 animate-spin-slow" />
  // Principalmente limpo
  if (code === 1) return <CloudSun className="size-8 text-yellow-400 animate-pulse" />
  // Parcialmente nublado
  if (code === 2) return <CloudSun className="size-8 text-gray-400 animate-pulse" />
  // Nublado
  if (code === 3) return <Cloud className="size-8 text-gray-500 animate-float" />
  // Chuva leve
  if (code >= 51 && code <= 67) return <CloudRain className="size-8 text-blue-500 animate-bounce" />
  // Neve
  if (code >= 71 && code <= 77) return <CloudRain className="size-8 text-blue-600 animate-bounce" />
  // Chuva forte
  if (code >= 80 && code <= 99) return <CloudRain className="size-8 text-blue-700 animate-bounce" />
  
  return <Cloud className="size-8 text-gray-400 animate-float" />
}

const getWeatherDescription = (code: number): string => {
  if (code === 0) return "Céu limpo"
  if (code === 1) return "Principalmente limpo"
  if (code === 2) return "Parcialmente nublado"
  if (code === 3) return "Nublado"
  if (code >= 51 && code <= 67) return "Chuva leve"
  if (code >= 71 && code <= 77) return "Neve"
  if (code >= 80 && code <= 99) return "Chuva forte"
  return "Condições variáveis"
}

export function WeatherWidget({ className }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [cityName, setCityName] = useState<string>("")

  useEffect(() => {
    // Obter localização do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (err) => {
          console.error("Erro ao obter localização:", err)
          // Fallback para coordenadas padrão (São Paulo)
          setLocation({ lat: -23.5505, lon: -46.6333 })
        }
      )
    } else {
      // Fallback para coordenadas padrão (São Paulo)
      setLocation({ lat: -23.5505, lon: -46.6333 })
    }
  }, [])

  // Buscar nome da cidade
  useEffect(() => {
    if (!location) return

    const fetchCityName = async () => {
      try {
        // Usar geocoding reverso da Open-Meteo
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?latitude=${location.lat}&longitude=${location.lon}&language=pt&count=1`
        )
        
        if (geoResponse.ok) {
          const geoData = (await geoResponse.json()) as GeocodingResponse
          if (geoData.results && geoData.results.length > 0) {
            const city = geoData.results[0]
            if (city) {
              // Priorizar nome da cidade, depois admin1 (estado), depois admin2 (região)
              setCityName(city.name ?? city.admin1 ?? city.admin2 ?? "Localização")
            } else {
              setCityName("Localização")
            }
          } else {
            // Fallback: usar coordenadas aproximadas
            setCityName("Localização")
          }
        } else {
          setCityName("Localização")
        }
      } catch (err) {
        console.error("Erro ao buscar nome da cidade:", err)
        setCityName("Localização")
      }
    }

    void fetchCityName()
  }, [location])

  useEffect(() => {
    if (!location) return

    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&hourly=temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m&timezone=America/Sao_Paulo&forecast_days=1`
        )

        if (!response.ok) {
          throw new Error("Erro ao buscar dados do clima")
        }

        const data = (await response.json()) as WeatherApiResponse

        if (data.hourly?.time && data.hourly.time.length > 0) {
          // Pegar dados da hora atual ou próxima
          const now = new Date()
          const currentHour = now.getHours()
          
          // Encontrar índice mais próximo da hora atual
          let closestIndex = 0
          let minDiff = Infinity

          data.hourly.time.forEach((time: string, index: number) => {
            const timeDate = new Date(time)
            const diff = Math.abs(timeDate.getHours() - currentHour)
            if (diff < minDiff) {
              minDiff = diff
              closestIndex = index
            }
          })

          setWeather({
            temperature: data.hourly.temperature_2m?.[closestIndex] ?? 0,
            precipitation: data.hourly.precipitation?.[closestIndex] ?? 0,
            weatherCode: data.hourly.weather_code?.[closestIndex] ?? 0,
            windSpeed: data.hourly.wind_speed_10m?.[closestIndex] ?? 0,
            humidity: data.hourly.relative_humidity_2m?.[closestIndex] ?? 0,
            time: data.hourly.time[closestIndex] ?? new Date().toISOString()
          })
        }
      } catch (err) {
        console.error("Erro ao buscar clima:", err)
        setError("Não foi possível carregar o clima")
      } finally {
        setLoading(false)
      }
    }

    void fetchWeather()
  }, [location])

  if (loading) {
    return (
      <div className={cn("w-full h-full rounded-2xl overflow-hidden", className)}>
        <div className="p-4 h-full flex flex-col justify-center">
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return null // Não exibe nada em caso de erro
  }

  return (
    <div className={cn("w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 relative", className)}>
      {/* Animação de fundo baseada no clima */}
      {weather.weatherCode >= 51 && weather.weatherCode <= 99 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-6 bg-blue-400/40 animate-rain"
              style={{
                left: `${(i * 3.33) % 100}%`,
                animationDelay: `${(i * 0.05) % 2}s`,
                animationDuration: `${0.4 + (Math.random() * 0.3)}s`,
                top: '-10%'
              }}
            />
          ))}
        </div>
      )}
      
      <div className="p-4 relative z-10 h-full flex flex-col justify-center">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                {cityName || "Carregando..."}
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(weather.time).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {getWeatherIcon(weather.weatherCode)}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {Math.round(weather.temperature)}°
                </span>
                <span className="text-sm text-muted-foreground">C</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {getWeatherDescription(weather.weatherCode)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="flex items-center gap-1">
              <Droplets className="size-3 text-blue-500" />
              <span className="text-xs text-muted-foreground">
                {Math.round(weather.humidity)}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="size-3 text-gray-500" />
              <span className="text-xs text-muted-foreground">
                {Math.round(weather.windSpeed)} km/h
              </span>
            </div>
            {weather.precipitation > 0 && (
              <div className="flex items-center gap-1">
                <CloudRain className="size-3 text-blue-600" />
                <span className="text-xs text-muted-foreground">
                  {weather.precipitation.toFixed(1)}mm
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

