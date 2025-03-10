"use client"

import { Moon, Sun, Play, Pause, LucideComputer, LucideSunMoon } from "lucide-react"
import { useTheme } from "next-themes"
import { useAnimation } from "@/contexts/animation-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function SettingsMenu() {
  const { setTheme, theme } = useTheme()
  const { isAnimationEnabled, toggleAnimation } = useAnimation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-10">
          <LucideSunMoon className="size-7" />
          <span className="sr-only">Configurações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Aparência</DropdownMenuLabel>

        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
          {theme === "light" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Escuro</span>
          {theme === "dark" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setTheme("system")}>
          <LucideComputer className="mr-2 h-4 w-4"/>
          <span>Sistema</span>
          {theme === "system" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Animação de fundo</DropdownMenuLabel>

        <DropdownMenuItem onClick={toggleAnimation}>
          {isAnimationEnabled ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              <span>Desativar</span>
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              <span>Ativar</span>
            </>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{isAnimationEnabled ? "Ativado" : "Desativado"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

