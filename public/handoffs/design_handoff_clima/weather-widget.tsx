"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { MapPin } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Enterprise } from "@/types/enterprise"

/* ============================================================
   Weather Widget — Redesign "Céu dinâmico" (Variação A)
   - Open-Meteo (sem chave): atual + por hora + diário + UV
   - Mapa WMO completo (mais condições detectáveis)
   - Cor do card segue a condição × período (dia/noite)
   - Ícones SVG ilustrados, animações sutis em CSS
   - Layout cheio no desktop (md+) e compacto no mobile (carrossel)
   ============================================================ */

/* ---------------- Tipos ---------------- */
interface WeatherData {
  temp: number
  feels: number
  code: number
  windSpeed: number
  humidity: number
  precip: number
  uv: number
  isNight: boolean
  max: number
  min: number
  sunrise: string
  sunset: string
  time: string
  hourly: { time: string; temp: number; code: number; isNight: boolean }[]
}

interface WeatherWidgetProps {
  className?: string
  enterprise?: Enterprise | null
}

/* ---------------- Localização por empresa (mantida) ---------------- */
const getDefaultLocationByEnterprise = (
  enterprise: Enterprise | null | undefined,
): { lat: number; lon: number } => {
  if (!enterprise) return { lat: -29.7175, lon: -52.4258 }
  if (enterprise === "Box" || enterprise === "RHenz" || enterprise === "Cristallux")
    return { lat: -29.7175, lon: -52.4258 } // Santa Cruz do Sul
  if (enterprise === "Box_Filial") return { lat: -29.6064, lon: -52.1931 } // Venâncio Aires
  if (enterprise === "Cristallux_Filial") return { lat: -29.9508, lon: -51.0939 } // Cachoeirinha
  return { lat: -29.7175, lon: -52.4258 }
}

/* ---------------- Mapa WMO (pt-BR) ---------------- */
type CondKey =
  | "clear" | "partly" | "overcast" | "fog"
  | "drizzle" | "rain" | "snow" | "storm"

function wmo(code: number): { key: CondKey; label: string } {
  const m: Record<number, { key: CondKey; label: string }> = {
    0: { key: "clear", label: "Céu limpo" },
    1: { key: "clear", label: "Predominante limpo" },
    2: { key: "partly", label: "Parcialmente nublado" },
    3: { key: "overcast", label: "Nublado" },
    45: { key: "fog", label: "Névoa" },
    48: { key: "fog", label: "Névoa congelante" },
    51: { key: "drizzle", label: "Garoa leve" },
    53: { key: "drizzle", label: "Garoa" },
    55: { key: "drizzle", label: "Garoa intensa" },
    56: { key: "drizzle", label: "Garoa congelante" },
    57: { key: "drizzle", label: "Garoa congelante" },
    61: { key: "rain", label: "Chuva fraca" },
    63: { key: "rain", label: "Chuva" },
    65: { key: "rain", label: "Chuva forte" },
    66: { key: "rain", label: "Chuva congelante" },
    67: { key: "rain", label: "Chuva congelante" },
    71: { key: "snow", label: "Neve fraca" },
    73: { key: "snow", label: "Neve" },
    75: { key: "snow", label: "Neve forte" },
    77: { key: "snow", label: "Grãos de neve" },
    80: { key: "rain", label: "Pancadas de chuva" },
    81: { key: "rain", label: "Pancadas de chuva" },
    82: { key: "rain", label: "Pancadas fortes" },
    85: { key: "snow", label: "Pancadas de neve" },
    86: { key: "snow", label: "Pancadas de neve" },
    95: { key: "storm", label: "Tempestade" },
    96: { key: "storm", label: "Tempestade c/ granizo" },
    99: { key: "storm", label: "Tempestade c/ granizo" },
  }
  return m[code] ?? { key: "overcast", label: "Condições variáveis" }
}

/* ---------------- Paletas (cor segue a condição × período) ---------------- */
type Palette = { grad: [string, string, string]; accent: string; text: "light" | "dark"; atmo: string }

const PALETTES: Record<"day" | "night", Record<CondKey, Palette>> = {
  day: {
    clear: { grad: ["#3d7fd6", "#6cb6ef", "#bfe2fa"], accent: "#ffc24d", text: "light", atmo: "#fff2c9" },
    partly: { grad: ["#4f8fcf", "#86b8e0", "#c7dcec"], accent: "#ffce5e", text: "light", atmo: "#ffffff" },
    overcast: { grad: ["#8190a1", "#a6b1bf", "#cdd4dc"], accent: "#5b6b7d", text: "light", atmo: "#ffffff" },
    fog: { grad: ["#9aa2aa", "#bcc2c8", "#dde0e3"], accent: "#6b7783", text: "dark", atmo: "#ffffff" },
    drizzle: { grad: ["#5a7088", "#7e93a8", "#aebecd"], accent: "#7ecbe6", text: "light", atmo: "#cfe6f2" },
    rain: { grad: ["#3f5266", "#5d738b", "#8499af"], accent: "#6db6e0", text: "light", atmo: "#bcd9ec" },
    snow: { grad: ["#7a8ea8", "#a4b6cb", "#dde7f1"], accent: "#bcd6ea", text: "light", atmo: "#ffffff" },
    storm: { grad: ["#39354f", "#534c70", "#7b6f9c"], accent: "#ffd24d", text: "light", atmo: "#cdbef0" },
  },
  night: {
    clear: { grad: ["#0c1733", "#1a2a52", "#2f3f6b"], accent: "#9bb6ff", text: "light", atmo: "#dfe7ff" },
    partly: { grad: ["#101a38", "#21305a", "#3a4a76"], accent: "#9bb6ff", text: "light", atmo: "#dfe7ff" },
    overcast: { grad: ["#1c222e", "#323a4a", "#4d5667"], accent: "#8ea0b8", text: "light", atmo: "#cfd8e6" },
    fog: { grad: ["#262b32", "#3b424c", "#565d68"], accent: "#9aa6b3", text: "light", atmo: "#dde2e8" },
    drizzle: { grad: ["#161e2b", "#2a3850", "#44566f"], accent: "#7ecbe6", text: "light", atmo: "#bcd9ec" },
    rain: { grad: ["#131a26", "#26344a", "#3c4f68"], accent: "#6db6e0", text: "light", atmo: "#bcd9ec" },
    snow: { grad: ["#1a2230", "#303d51", "#536580"], accent: "#bcd6ea", text: "light", atmo: "#ffffff" },
    storm: { grad: ["#191430", "#2e2750", "#4a3f72"], accent: "#ffd24d", text: "light", atmo: "#cdbef0" },
  },
}
const palette = (key: CondKey, isNight: boolean): Palette =>
  (isNight ? PALETTES.night : PALETTES.day)[key]

const uvInfo = (uv: number) => {
  if (uv <= 2) return { label: "Baixo", color: "#4caf72" }
  if (uv <= 5) return { label: "Moderado", color: "#e0b13a" }
  if (uv <= 7) return { label: "Alto", color: "#e07d3a" }
  if (uv <= 10) return { label: "Muito alto", color: "#d8453f" }
  return { label: "Extremo", color: "#9b59b6" }
}

const fmtHour = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
const fmtHourShort = (iso: string) =>
  new Date(iso).getHours().toString().padStart(2, "0") + "h"

const withAlpha = (hex: string, a: number) => {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ============================================================
   Ícone de clima ilustrado (SVG)
   ============================================================ */
function WeatherIcon({ k, night, size }: { k: CondKey; night: boolean; size: number }) {
  const id = useId().replace(/:/g, "")
  const sunG = `sun-${id}`, moonG = `moon-${id}`, cloudG = `cloud-${id}`, cloudD = `cloudd-${id}`, moonM = `moonm-${id}`

  const Defs = (
    <defs>
      <radialGradient id={sunG} cx="40%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#fff0b8" /><stop offset="55%" stopColor="#ffcf57" /><stop offset="100%" stopColor="#ffb02e" />
      </radialGradient>
      <linearGradient id={moonG} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fdfbff" /><stop offset="100%" stopColor="#cdd6f5" />
      </linearGradient>
      <linearGradient id={cloudG} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#e3eaf2" />
      </linearGradient>
      <linearGradient id={cloudD} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c4ccd6" /><stop offset="100%" stopColor="#9aa6b4" />
      </linearGradient>
    </defs>
  )

  const Sun = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
    <>
      <g className="wx-rays">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30) * Math.PI / 180
          return <line key={i}
            x1={cx + Math.cos(a) * (r + 6)} y1={cy + Math.sin(a) * (r + 6)}
            x2={cx + Math.cos(a) * (r + 14)} y2={cy + Math.sin(a) * (r + 14)}
            stroke="#ffd36b" strokeWidth={3.4} strokeLinecap="round" />
        })}
      </g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${sunG})`} />
    </>
  )
  const Moon = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
    <>
      <mask id={moonM}>
        <rect width="100" height="100" fill="#000" />
        <circle cx={cx} cy={cy} r={r} fill="#fff" />
        <circle cx={cx + r * 0.55} cy={cy - r * 0.45} r={r * 0.92} fill="#000" />
      </mask>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${moonG})`} mask={`url(#${moonM})`} />
    </>
  )
  const Stars = () => (
    <g className="wx-stars">
      {[[20, 22, 1.6], [33, 14, 1.1], [78, 20, 1.7], [88, 34, 1.1], [16, 44, 1.2], [70, 12, 1]].map((p, i) =>
        <circle key={i} cx={p[0]} cy={p[1]} r={p[2]} fill="#eaf0ff" />)}
    </g>
  )
  const Cloud = ({ x, y, s, dark }: { x: number; y: number; s: number; dark?: boolean }) => (
    <g transform={`translate(${x},${y}) scale(${s})`} fill={dark ? `url(#${cloudD})` : `url(#${cloudG})`}>
      <circle cx="22" cy="20" r="13" /><circle cx="40" cy="13" r="17" /><circle cx="58" cy="20" r="13" />
      <rect x="9" y="20" width="62" height="20" rx="10" />
    </g>
  )
  const Drops = ({ n, color }: { n: number; color: string }) => (
    <g className="wx-rain">
      {(n === 3 ? [-16, 0, 16] : [-20, -7, 7, 20]).map((dx, i) =>
        <line key={i} className="wx-drop" style={{ ["--d" as string]: i }}
          x1={50 + dx} y1={66} x2={50 + dx - 3} y2={80} stroke={color} strokeWidth={3.4} strokeLinecap="round" />)}
    </g>
  )
  const Flakes = () => (
    <g className="wx-snow">
      {[-16, 2, 18].map((dx, i) =>
        <circle key={i} className="wx-flake" style={{ ["--d" as string]: i }} cx={50 + dx} cy={72} r={3.1} fill="#eaf3fb" />)}
    </g>
  )
  const Bolt = () => (
    <path className="wx-bolt" d="M54 58 L41 80 L49 80 L44 94 L61 70 L52 70 Z" fill="#ffd24d" stroke="#f6b800" strokeWidth={1} />
  )
  const Fog = () => (
    <g className="wx-fog" stroke="#eef2f6" strokeWidth={3.6} strokeLinecap="round">
      <line x1="28" y1="66" x2="72" y2="66" />
      <line className="wx-fog2" x1="32" y1="76" x2="76" y2="76" />
      <line x1="26" y1="86" x2="68" y2="86" />
    </g>
  )

  let inner: React.ReactNode = null
  switch (k) {
    case "clear":
      inner = night ? <><Stars /><Moon cx={52} cy={46} r={24} /></> : <Sun cx={50} cy={46} r={21} />
      break
    case "partly":
      inner = <>{night ? <Moon cx={34} cy={34} r={17} /> : <Sun cx={33} cy={34} r={16} />}<Cloud x={28} y={40} s={0.92} /></>
      break
    case "overcast":
      inner = <><Cloud x={14} y={26} s={0.78} dark /><Cloud x={22} y={34} s={1.02} /></>
      break
    case "fog":
      inner = <><Cloud x={22} y={18} s={0.92} /><Fog /></>
      break
    case "drizzle":
      inner = <><Cloud x={22} y={20} s={0.98} /><Drops n={3} color="#8fd0ec" /></>
      break
    case "rain":
      inner = <><Cloud x={20} y={16} s={1.04} /><Drops n={4} color="#6db6e0" /></>
      break
    case "snow":
      inner = <><Cloud x={22} y={18} s={0.98} /><Flakes /></>
      break
    case "storm":
      inner = <><Cloud x={20} y={14} s={1.04} dark /><Bolt /><Drops n={3} color="#6db6e0" /></>
      break
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden className="wx-ico">
      {Defs}{inner}
    </svg>
  )
}

/* ============================================================
   Atmosfera animada (sutil)
   ============================================================ */
function Atmosphere({ keyCond, night, atmo }: { keyCond: CondKey; night: boolean; atmo: string }) {
  const stars = useMemo(() => Array.from({ length: 18 }).map((_, i) => ({
    left: (i * 53) % 100, top: (i * 37) % 60, d: (i % 5) * 0.4, s: 1 + (i % 3) * 0.5,
  })), [])
  const drops = useMemo(() => Array.from({ length: keyCond === "drizzle" ? 14 : 22 }).map((_, i) => ({
    left: (i * 4.7) % 100, d: (i * 0.13) % 1.6, dur: 0.7 + (i % 4) * 0.12,
  })), [keyCond])
  const flakes = useMemo(() => Array.from({ length: 16 }).map((_, i) => ({
    left: (i * 6.1) % 100, d: (i * 0.2) % 3, dur: 3 + (i % 4),
  })), [])

  if ((keyCond === "clear" || keyCond === "partly") && !night)
    return (
      <div className="wx-atmo">
        <div className="wx-glow" style={{ background: `radial-gradient(circle, ${withAlpha(atmo, 0.55)}, transparent 70%)` }} />
      </div>
    )
  if (keyCond === "clear" && night)
    return (
      <div className="wx-atmo">
        {stars.map((s, i) => (
          <span key={i} className="wx-star"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
        ))}
      </div>
    )
  if (keyCond === "rain" || keyCond === "storm" || keyCond === "drizzle")
    return (
      <div className="wx-atmo">
        {drops.map((d, i) => (
          <span key={i} className="wx-line"
            style={{ left: `${d.left}%`, animationDelay: `${d.d}s`, animationDuration: `${d.dur}s`,
              background: `linear-gradient(${withAlpha(atmo, 0)}, ${withAlpha(atmo, 0.5)})` }} />
        ))}
        {keyCond === "storm" && <div className="wx-flash" />}
      </div>
    )
  if (keyCond === "snow")
    return (
      <div className="wx-atmo">
        {flakes.map((f, i) => (
          <span key={i} className="wx-snowf"
            style={{ left: `${f.left}%`, animationDelay: `${f.d}s`, animationDuration: `${f.dur}s` }} />
        ))}
      </div>
    )
  return (
    <div className="wx-atmo">
      {[0, 1, 2].map((i) => (
        <div key={i} className="wx-blob"
          style={{ top: `${8 + i * 22}%`, animationDelay: `${i * 4}s`, background: withAlpha(atmo, 0.14) }} />
      ))}
    </div>
  )
}

/* ---------------- Subcomponentes ---------------- */
function UvBar({ uv, tone }: { uv: number; tone: "light" | "dark" }) {
  const pct = Math.min(100, (uv / 11) * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-[5px] rounded-full" style={{ background: tone === "light" ? "rgba(255,255,255,.25)" : "rgba(0,0,0,.1)" }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#4caf72,#e0b13a,#e07d3a,#d8453f)" }} />
        <div className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_2px_rgba(0,0,0,.12)]" style={{ left: `calc(${pct}% - 5px)` }} />
      </div>
      <span className="text-[11.5px] font-bold">{uv} · {uvInfo(uv).label}</span>
    </div>
  )
}

function SunArc({ data, accent, tone }: { data: WeatherData; accent: string; tone: "light" | "dark" }) {
  const now = new Date(data.time).getTime()
  const sr = new Date(data.sunrise).getTime(), ss = new Date(data.sunset).getTime()
  const prog = Math.max(0, Math.min(1, (now - sr) / (ss - sr)))
  const W = 132, H = 46, pad = 8
  const cx = pad + prog * (W - pad * 2)
  const cy = H - Math.sin(prog * Math.PI) * (H - 10) - 4
  const stroke = tone === "light" ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.18)"
  const sub = tone === "light" ? "rgba(255,255,255,.72)" : "rgba(20,24,28,.55)"
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={W} height={H + 4} viewBox={`0 0 ${W} ${H + 4}`}>
        <path d={`M${pad} ${H} Q ${W / 2} ${-6} ${W - pad} ${H}`} fill="none" stroke={stroke} strokeWidth={1.6} strokeDasharray="3 4" />
        {!data.isNight && <circle cx={cx} cy={cy} r={5} fill={accent} />}
        {data.isNight && <circle cx={W - pad} cy={H - 2} r={4} fill={accent} />}
      </svg>
      <div className="flex gap-3 text-[11px] font-semibold" style={{ color: sub }}>
        <span>↑ {fmtHour(data.sunrise)}</span><span>↓ {fmtHour(data.sunset)}</span>
      </div>
    </div>
  )
}

/* ============================================================
   Componente principal
   ============================================================ */
export function WeatherWidget({ className, enterprise }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [cityName, setCityName] = useState<string>("")

  // Localização (empresa → fallback; geolocalização opcional, 3s timeout)
  useEffect(() => {
    setLocation(getDefaultLocationByEnterprise(enterprise))
    if (typeof window !== "undefined" && navigator.geolocation) {
      const t = setTimeout(() => undefined, 3000)
      navigator.geolocation.getCurrentPosition(
        (pos) => { clearTimeout(t); setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }) },
        () => { clearTimeout(t) },
        { timeout: 3000, maximumAge: 60000, enableHighAccuracy: false },
      )
    }
  }, [enterprise])

  // Nome da cidade (geocoding reverso)
  useEffect(() => {
    if (!location) return
    void (async () => {
      try {
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${location.lat}&longitude=${location.lon}&language=pt&count=1`)
        if (!r.ok) { setCityName("Localização"); return }
        const d = (await r.json()) as { results?: { name?: string; admin1?: string; admin2?: string }[] }
        const c = d.results?.[0]
        setCityName(c?.name ?? c?.admin1 ?? c?.admin2 ?? "Localização")
      } catch { setCityName("Localização") }
    })()
  }, [location])

  // Clima: atual + por hora + diário + UV
  useEffect(() => {
    if (!location) return
    void (async () => {
      try {
        setLoading(true); setError(null)
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m` +
          `&hourly=temperature_2m,weather_code,is_day,uv_index` +
          `&daily=temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset` +
          `&timezone=America/Sao_Paulo&forecast_days=2`
        const res = await fetch(url)
        if (!res.ok) throw new Error("Erro ao buscar dados do clima")
        const data = (await res.json()) as WeatherApiResponse

        const cur = data.current
        const hk = data.hourly
        if (!cur || !hk?.time?.length) throw new Error("Sem dados")

        // índice da hora atual no array horário
        const nowTs = new Date(cur.time).getTime()
        let idx = 0, best = Infinity
        hk.time.forEach((t, i) => {
          const diff = Math.abs(new Date(t).getTime() - nowTs)
          if (diff < best) { best = diff; idx = i }
        })

        const strip = hk.time.slice(idx, idx + 8).map((t, i) => ({
          time: t,
          temp: Math.round(hk.temperature_2m?.[idx + i] ?? 0),
          code: hk.weather_code?.[idx + i] ?? 0,
          isNight: (hk.is_day?.[idx + i] ?? 1) === 0,
        }))

        setWeather({
          temp: cur.temperature_2m ?? 0,
          feels: cur.apparent_temperature ?? cur.temperature_2m ?? 0,
          code: cur.weather_code ?? 0,
          windSpeed: cur.wind_speed_10m ?? 0,
          humidity: cur.relative_humidity_2m ?? 0,
          precip: cur.precipitation ?? 0,
          uv: Math.round(hk.uv_index?.[idx] ?? data.daily?.uv_index_max?.[0] ?? 0),
          isNight: (cur.is_day ?? 1) === 0,
          max: Math.round(data.daily?.temperature_2m_max?.[0] ?? cur.temperature_2m ?? 0),
          min: Math.round(data.daily?.temperature_2m_min?.[0] ?? cur.temperature_2m ?? 0),
          sunrise: data.daily?.sunrise?.[0] ?? cur.time,
          sunset: data.daily?.sunset?.[0] ?? cur.time,
          time: cur.time,
          hourly: strip,
        })
      } catch (err) {
        console.error("Erro ao buscar clima:", err)
        setError("Não foi possível carregar o clima")
      } finally {
        setLoading(false)
      }
    })()
  }, [location])

  if (loading) {
    return (
      <div className={cn("h-full w-full overflow-hidden rounded-2xl", className)}>
        <div className="flex h-full flex-col justify-center p-4">
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <div className="flex items-center gap-4"><Skeleton className="size-12 rounded-full" /><Skeleton className="h-8 w-32" /></div>
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    )
  }
  if (error || !weather) return null

  const cond = wmo(weather.code)
  const p = palette(cond.key, weather.isNight)
  const tone = p.text
  const txt = tone === "light" ? "#fff" : "#13171b"
  const sub = tone === "light" ? "rgba(255,255,255,.78)" : "rgba(20,24,28,.6)"
  const bg = `linear-gradient(165deg, ${p.grad[0]}, ${p.grad[1]} 52%, ${p.grad[2]})`

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-2xl", className)} style={{ background: bg, color: txt }}>
      <Atmosphere keyCond={cond.key} night={weather.isNight} atmo={p.atmo} />

      <div className="relative z-[3] flex h-full flex-col p-4">
        {/* Topo: cidade + hora */}
        <div className="flex items-center justify-between text-[12.5px] font-semibold">
          <div className="flex items-center gap-1.5 text-[13px] font-bold">
            <MapPin className="size-3.5" />
            <span>{cityName || "Carregando..."}</span>
          </div>
          <span style={{ color: sub }}>{fmtHour(weather.time)}</span>
        </div>

        {/* Hero */}
        <div className="mt-1.5 flex items-center gap-3">
          <span className="wx-float shrink-0">
            <WeatherIcon k={cond.key} night={weather.isNight} size={72} />
          </span>
          <div>
            <div className="text-[58px] font-extrabold leading-[0.92] tracking-[-0.03em] md:text-[58px]">
              {Math.round(weather.temp)}<span className="font-medium opacity-70">°</span>
            </div>
            <div className="mt-0.5 text-[15px] font-semibold">{cond.label}</div>
            <div className="mt-0.5 text-xs" style={{ color: sub }}>
              Sensação {Math.round(weather.feels)}° · ↑{weather.max}° ↓{weather.min}°
            </div>
          </div>
        </div>

        {/* ----- DESKTOP (md+): faixa por hora + rodapé ----- */}
        <div className="hidden md:flex md:flex-1 md:flex-col">
          <div className="mt-auto flex justify-between gap-0.5 border-t pt-3" style={{ borderColor: tone === "light" ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.08)" }}>
            {weather.hourly.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10.5px] font-semibold" style={{ color: i === 0 ? txt : sub }}>
                  {i === 0 ? "Agora" : fmtHourShort(h.time)}
                </span>
                <WeatherIcon k={wmo(h.code).key} night={h.isNight} size={24} />
                <span className={cn("text-[12.5px]", i === 0 ? "font-extrabold" : "font-bold")} style={{ color: txt }}>{h.temp}°</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-3.5 border-t pt-3" style={{ borderColor: "rgba(255,255,255,.16)" }}>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: sub }}>Índice UV</div>
              <UvBar uv={weather.uv} tone={tone} />
              <div className="mt-2 flex gap-3 text-xs font-semibold" style={{ color: sub }}>
                <span>💧 {Math.round(weather.humidity)}%</span>
                <span>🌬 {Math.round(weather.windSpeed)} km/h</span>
              </div>
            </div>
            <div className="shrink-0"><SunArc data={weather} accent={p.accent} tone={tone} /></div>
          </div>
        </div>

        {/* ----- MOBILE (carrossel): linha compacta de stats ----- */}
        <div className="mt-auto flex gap-3.5 border-t pt-2.5 text-xs font-semibold md:hidden" style={{ color: sub, borderColor: tone === "light" ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.08)" }}>
          <span>UV {weather.uv}</span>
          <span>💧 {Math.round(weather.humidity)}%</span>
          <span>🌬 {Math.round(weather.windSpeed)}</span>
          <span>↑{weather.max}° ↓{weather.min}°</span>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Tipos da resposta Open-Meteo ---------------- */
interface WeatherApiResponse {
  current?: {
    time: string
    temperature_2m?: number
    relative_humidity_2m?: number
    apparent_temperature?: number
    is_day?: number
    precipitation?: number
    weather_code?: number
    wind_speed_10m?: number
  }
  hourly?: {
    time?: string[]
    temperature_2m?: number[]
    weather_code?: number[]
    is_day?: number[]
    uv_index?: number[]
  }
  daily?: {
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    uv_index_max?: number[]
    sunrise?: string[]
    sunset?: string[]
  }
}
