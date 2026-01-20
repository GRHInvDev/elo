"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Cake, CalendarDays, Loader2 } from 'lucide-react'

import { api } from "@/trpc/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            <div className="flex items-center">
              <Cake className="mr-2 h-5 w-5 text-primary" />
              Aniversariantes do Mês
            </div>
          </CardTitle>
          <Badge variant="outline" className="font-normal">
            <CalendarDays className="mr-1 h-3 w-3" />
            {format(today, "MMMM", { locale: ptBR })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-2">
            {birthdays.map((birthday) => {
              const isToday = isBirthdayToday(birthday.data)
              
              return (
                <div
                  key={birthday.id}
                  className={cn(
                    "flex items-center space-x-3 rounded-md p-2 transition-colors",
                    isToday
                      ? "bg-primary/10 dark:bg-primary/20"
                      : "hover:bg-muted/50"
                  )}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    {birthday.user?.imageUrl ? (
                      <AvatarImage
                        src={birthday.user.imageUrl}
                        alt={birthday.name}
                        className="object-contain bg-white"
                      />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {getInitials(birthday.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">
                      {birthday.name}
                      {isToday && (
                        <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
                          Hoje!
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBirthdayDate(birthday.data)}
                    </p>
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