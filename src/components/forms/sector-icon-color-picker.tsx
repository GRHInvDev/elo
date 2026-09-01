"use client"

import * as React from "react"
import { FORM_ICONS, SECTOR_PRESET_COLORS, getLucideIconById } from "@/lib/form-icons"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Check, Search } from "lucide-react"

interface SectorIconPickerProps {
  value: string | null | undefined
  onChange: (iconId: string) => void
  disabled?: boolean
}

export function SectorIconPicker({ value, onChange, disabled }: SectorIconPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedIconId = value ?? "laptop"
  const IconComponent = getLucideIconById(selectedIconId)

  const filteredIcons = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return FORM_ICONS
    return FORM_ICONS.filter(
      (item) =>
        item.id.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q),
    )
  }, [search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title="Escolher Ícone do Setor"
          className={cn(
            "h-10 w-10 shrink-0 rounded-xl border border-border/80 bg-card flex items-center justify-center text-foreground transition-all cursor-pointer shadow-xs",
            "hover:border-primary hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/20",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <IconComponent className="h-5 w-5 text-primary" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3 rounded-2xl border-border/80 bg-card shadow-xl" align="start">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar ícone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-6 gap-1.5 max-h-56 overflow-y-auto p-1 scrollbar-thin">
            {filteredIcons.map((item) => {
              const ItemIcon = item.icon
              const isSelected = item.id === selectedIconId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.id)
                    setOpen(false)
                  }}
                  title={item.label}
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                      : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-primary/15 hover:text-primary hover:border-primary/30",
                  )}
                >
                  <ItemIcon className="h-5 w-5" />
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface SectorColorPickerProps {
  value: string | null | undefined
  onChange: (colorHex: string) => void
  disabled?: boolean
}

export function SectorColorPicker({ value, onChange, disabled }: SectorColorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const selectedColor = value ?? "#3B82F6"
  const [customHex, setCustomHex] = React.useState(selectedColor)

  React.useEffect(() => {
    setCustomHex(selectedColor)
  }, [selectedColor])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title="Escolher Cor do Setor"
          className={cn(
            "h-10 w-10 shrink-0 rounded-xl border border-border/80 bg-card flex items-center justify-center transition-all cursor-pointer shadow-xs overflow-hidden",
            "hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <span
            className="h-6 w-6 rounded-lg border border-black/10 dark:border-white/10 shadow-xs"
            style={{ backgroundColor: selectedColor }}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3.5 rounded-2xl border-border/80 bg-card shadow-xl space-y-3" align="start">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Paleta de Cores
          </span>
          <div className="grid grid-cols-7 gap-2">
            {SECTOR_PRESET_COLORS.map((color) => {
              const isSelected = selectedColor.toLowerCase() === color.toLowerCase()
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onChange(color)
                    setCustomHex(color)
                    setOpen(false)
                  }}
                  className={cn(
                    "h-7 w-7 rounded-lg border transition-transform cursor-pointer flex items-center justify-center shadow-2xs",
                    isSelected ? "scale-115 border-foreground ring-2 ring-primary/40" : "border-black/10 dark:border-white/10 hover:scale-110",
                  )}
                  style={{ backgroundColor: color }}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 text-white drop-shadow-sm" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center gap-2">
          <Input
            value={customHex}
            onChange={(e) => {
              const val = e.target.value
              setCustomHex(val)
              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                onChange(val)
              }
            }}
            placeholder="#3B82F6"
            className="h-8 text-xs font-mono rounded-lg"
          />
          <div
            className="h-8 w-8 rounded-lg shrink-0 border border-border/60 shadow-2xs"
            style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : selectedColor }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
