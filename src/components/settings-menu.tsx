"use client"

import { Moon, Sun, LucideComputer, Cog } from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function SettingsMenu() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="justify-start text-muted-foreground">
          <Cog className="size-7" />
          <span>Configurações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center"  className="sm:max-w-sm w-[220px] sm:w-[280px]">
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

