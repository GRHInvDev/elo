"use client"

import { Cake, Loader2 } from 'lucide-react'

import { api } from "@/trpc/react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface MonthlyBirthdaysProps {
  className?: string
}

export function MonthlyBirthdays({ className }: MonthlyBirthdaysProps) {
  const { data: birthdays, isLoading } = api.birthday.listCurrentMonth.useQuery()
  const today = new Date()

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const isBirthdayToday = (date: Date) => {
    const birthdayDate = new Date(date)

    const todayMonth = today.getUTCMonth()
    const todayDay = today.getUTCDate()

    const birthdayMonth = birthdayDate.getUTCMonth()
    const birthdayDay = birthdayDate.getUTCDate()

    // SPE: Aniversário em 01/01 conta como 31/12 em dezembro
    const isJanuary1 = birthdayMonth === 0 && birthdayDay === 1
    const isDecember = todayMonth === 11 // dezembro é mês 11 (0-indexed)

    if (isJanuary1 && isDecember) {
      return todayDay === 31
    }

    return birthdayMonth === todayMonth && birthdayDay === todayDay
  }

  const formatBirthdayDate = (date: Date) => {
    const birthdayDate = new Date(date)

    // SPE: Se é 01/01 e estamos em dezembro, exibe como 31/12
    const isJanuary1 = birthdayDate.getUTCMonth() === 0 && birthdayDate.getUTCDate() === 1
    const isDecember = today.getUTCMonth() === 11

    if (isJanuary1 && isDecember) {
      return "31 de dezembro"
    }

    const day = birthdayDate.getUTCDate()
    const month = birthdayDate.getUTCMonth()

    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ]

    return `${day} de ${monthNames[month]}`
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !birthdays?.length ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum aniversariante neste mês
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {birthdays.map((birthday) => {
              const isToday = isBirthdayToday(birthday.data)
              const effectiveImage =
                birthday.imageUrl ?? birthday.user?.imageUrl ?? null

              return (
                <div
                  key={birthday.id}
                  className={cn(
                    "group relative flex flex-col items-center rounded-xl border p-3.5 text-center transition-all duration-200",
                    "hover:-translate-y-0.5 hover:shadow-sm",
                    isToday
                      ? "border-primary/50 bg-gradient-to-b from-primary/15 via-primary/5 to-background shadow-sm"
                      : "border-border/60 bg-card/60 hover:border-primary/30 hover:bg-card"
                  )}
                >
                  {isToday && (
                    <span className="absolute -top-2.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
                      Hoje!
                    </span>
                  )}

                  <Avatar
                    className={cn(
                      "h-auto w-auto border-2 transition-transform duration-200",
                      isToday ? "border-primary shadow-sm" : "border-background ring-1 ring-border/60"
                    )}
                  >
                    {effectiveImage ? (
                      <AvatarImage
                        src={effectiveImage}
                        alt={birthday.name}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="text-xs font-medium bg-muted">
                      {getInitials(birthday.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="mt-2.5 w-full min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {birthday.name}
                    </p>
                    {birthday.user?.setor ? (
                      <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                        {birthday.user.setor}
                      </p>
                    ) : null}
                    <span
                      className={cn(
                        "mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                        isToday
                          ? "bg-primary/20 text-primary font-semibold"
                          : "bg-muted/60 text-muted-foreground"
                      )}
                    >
                      <Cake className="h-3 w-3 opacity-70" />
                      {formatBirthdayDate(birthday.data)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}