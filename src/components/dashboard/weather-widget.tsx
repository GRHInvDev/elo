"use client"

import { useEffect, useState, useMemo } from "react"
import { Cloud, CloudRain, Sun, CloudSun, Droplets, Wind, MapPin } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Enterprise } from "@prisma/client"

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
  enterprise?: Enterprise | null
}

// Função para obter coordenadas padrão baseadas na empresa
const getDefaultLocationByEnterprise = (enterprise: Enterprise | null | undefined): { lat: number; lon: number } => {
  // Tratar null/undefined primeiro
  if (!enterprise) {
    return { lat: -29.7175, lon: -52.4258 } // Fallback padrão (Santa Cruz do Sul)
  }

  // Comparar o valor do enum (Prisma enum é um tipo union de strings literais)
  // Usar comparação direta com strings, pois o enum Enterprise é equivalente a: "NA" | "Box" | "RHenz" | "Cristallux" | "Box_Filial" | "Cristallux_Filial"
  if (enterprise === Enterprise.Box || enterprise === Enterprise.RHenz || enterprise === Enterprise.Cristallux) {
    // Santa Cruz do Sul
    return { lat: -29.7175, lon: -52.4258 }
  }
  
  if (enterprise === Enterprise.Box_Filial) {
    // Venâncio Aires
    return { lat: -29.6064, lon: -52.1931 }
  }
  
  if (enterprise === Enterprise.Cristallux_Filial) {
    // Cachoeirinha
    return { lat: -29.9508, lon: -51.0939 }
  }

  // Fallback padrão (Santa Cruz do Sul)
  return { lat: -29.7175, lon: -52.4258 }
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

export function WeatherWidget({ className, enterprise }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [cityName, setCityName] = useState<string>("")

  useEffect(() => {
    // Definir fallback imediatamente baseado na empresa
    const defaultLocation = getDefaultLocationByEnterprise(enterprise)
    setLocation(defaultLocation)

    // Tentar obter localização do usuário (opcional)
    if (typeof window !== 'undefined' && navigator.geolocation) {
      // Timeout de 3 segundos para não ficar esperando muito
      const timeoutId = setTimeout(() => {
        // Se demorar muito, manter o fallback
        console.log("Timeout ao obter localização, usando fallback baseado na empresa")
      }, 3000)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId)
          // Só atualizar se conseguir obter a localização
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (err) => {
          clearTimeout(timeoutId)
          console.error("Erro ao obter localização:", err)
          // Manter o fallback que já foi definido
        },
        {
          timeout: 3000, // Timeout de 3 segundos
          maximumAge: 60000, // Aceitar cache de até 1 minuto
          enableHighAccuracy: false // Não precisa de alta precisão
        }
      )
    }
  }, [enterprise])

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

  // Valores aleatórios para animações (calculados uma vez) - DEVE VIR ANTES DOS EARLY RETURNS
  const sunParticles = useMemo(() => 
    Array.from({ length: 15 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2
    })), [])
  
  const windParticles = useMemo(() =>
    Array.from({ length: 20 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 2,
      translateX: Math.random() * 50 - 25
    })), [])
  
  const windLines = useMemo(() =>
    Array.from({ length: 8 }).map((_, i) => ({
      duration: 3 + Math.random() * 2,
      delay: i * 0.3
    })), [])
  
  const cloudPositions = useMemo(() =>
    Array.from({ length: 3 }).map((_, i) => ({
      top: 10 + i * 15 + Math.random() * 10,
      delay: i * 2 + Math.random() * 2
    })), [])
  
  const rainDrops = useMemo(() =>
    Array.from({ length: 30 }).map(() => ({
      duration: 0.4 + Math.random() * 0.3
    })), [])

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

  // Determinar tipo de clima para animações
  const isSunny = weather.weatherCode === 0
  const isMostlyClear = weather.weatherCode === 1
  const isPartlyCloudy = weather.weatherCode === 2
  const isCloudy = weather.weatherCode === 3
  const isRainy = weather.weatherCode >= 51 && weather.weatherCode <= 99

  // Gradiente baseado no clima
  const getGradientClass = () => {
    if (isSunny) return "bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 dark:from-yellow-950 dark:via-orange-950 dark:to-yellow-900"
    if (isMostlyClear || isPartlyCloudy) return "bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 dark:from-blue-950 dark:via-sky-950 dark:to-blue-900"
    if (isCloudy) return "bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-800 dark:via-gray-700 dark:to-gray-900"
    if (isRainy) return "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
    return "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
  }

  return (
    <div className={cn("w-full h-full rounded-2xl overflow-hidden relative", getGradientClass(), className)}>
      {/* Animação de chuva */}
      {isRainy && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {rainDrops.map((drop, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-6 bg-blue-400/40 animate-rain"
              style={{
                left: `${(i * 3.33) % 100}%`,
                animationDelay: `${(i * 0.05) % 2}s`,
                animationDuration: `${drop.duration}s`,
                top: '-10%'
              }}
            />
          ))}
        </div>
      )}

      {/* Animação de raios de sol para dias ensolarados */}
      {isSunny && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180)
            const radius = 60
            const x = 50 + Math.cos(angle) * radius
            const y = 50 + Math.sin(angle) * radius
            return (
              <div
                key={i}
                className="absolute w-1 h-8 bg-yellow-400/30 rounded-full animate-pulse"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `rotate(${i * 30}deg) translateY(-20px)`,
                  transformOrigin: 'center',
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '2s'
                }}
              />
            )
          })}
          {/* Partículas de luz flutuantes */}
          {sunParticles.map((particle, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-yellow-300/40 rounded-full animate-float"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Animação de nuvens e vento para dias nublados */}
      {(isCloudy || isPartlyCloudy) && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Nuvens se movendo */}
          {cloudPositions.map((cloud, i) => (
            <div
              key={`cloud-${i}`}
              className="absolute opacity-20"
              style={{
                left: `${-20 + i * 40}%`,
                top: `${cloud.top}%`,
                animation: `cloudMove ${15 + i * 5}s linear infinite`,
                animationDelay: `${cloud.delay}s`
              }}
            >
              <Cloud className="size-16 text-gray-400" />
            </div>
          ))}
          {/* Partículas de vento */}
          {windParticles.map((particle, i) => (
            <div
              key={`wind-${i}`}
              className="absolute w-2 h-2 bg-gray-300/30 rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animation: `windParticle ${particle.duration}s linear infinite`,
                animationDelay: `${particle.delay}s`,
                transform: `translateX(${particle.translateX}px)`
              }}
            />
          ))}
          {/* Linhas de vento */}
          {windLines.map((line, i) => (
            <div
              key={`wind-line-${i}`}
              className="absolute h-0.5 bg-gray-300/20 rounded-full"
              style={{
                left: `${-10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                width: '30%',
                animation: `windLine ${line.duration}s ease-in-out infinite`,
                animationDelay: `${line.delay}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Animação sutil de sol para dias parcialmente nublados */}
      {(isMostlyClear || isPartlyCloudy) && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`sun-ray-${i}`}
              className="absolute w-0.5 h-6 bg-yellow-300/20 rounded-full animate-pulse"
              style={{
                left: '50%',
                top: '30%',
                transform: `rotate(${i * 45}deg) translateY(-30px)`,
                transformOrigin: 'center',
                animationDelay: `${i * 0.15}s`,
                animationDuration: '3s'
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

