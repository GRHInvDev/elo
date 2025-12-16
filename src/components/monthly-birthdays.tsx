"use client"

import { format, isSameDay } from "date-fns"
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

  // Check if birthday is today
  const isBirthdayToday = (date: Date) => {
    const birthdayDate = new Date(date)
    const todayUTC = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    ))
    
    // SPE (SOLUÇÃO PALEATIVA EMERGENCIAL): o maldito aniversário que cai no dia 31 não é exibido. Assim ele é.
    const isJanuary1 = birthdayDate.getUTCMonth() === 0 && birthdayDate.getUTCDate() === 1
    const isDecember = today.getUTCMonth() === 11 // dezembro é mês 11 (0-indexed)
    
    let birthdayUTC: Date
    if (isJanuary1 && isDecember) {
      birthdayUTC = new Date(Date.UTC(
        today.getUTCFullYear(),
        11, // dezembro
        31
      ))
    } else {
      birthdayUTC = new Date(Date.UTC(
        today.getUTCFullYear(),
        birthdayDate.getUTCMonth(),
        birthdayDate.getUTCDate()
      ))
    }
    
    return isSameDay(birthdayUTC, todayUTC)
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
            {birthdays.map((birthday) => (
              <div
                key={birthday.id}
                className={`flex items-center space-x-3 rounded-md p-2 transition-colors ${
                  isBirthdayToday(birthday.data)
                    ? "bg-primary/10 dark:bg-primary/20"
                    : "hover:bg-muted/50"
                }`}
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
                    {isBirthdayToday(birthday.data) && (
                      <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
                        Hoje!
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      // CORREÇÃO: Se a data é 01/01 mas estamos em dezembro, exibe como 31/12
                      // Isso corrige aniversários que foram salvos incorretamente
                      const birthdayDate = new Date(birthday.data)
                      const isJanuary1 = birthdayDate.getUTCMonth() === 0 && birthdayDate.getUTCDate() === 1
                      const isDecember = today.getUTCMonth() === 11 // dezembro é mês 11 (0-indexed)
                      
                      if (isJanuary1 && isDecember) {
                        // Exibe diretamente como "31 de dezembro" para evitar problemas de timezone
                        return "31 de dezembro"
                      }
                      
                      return format(birthday.data, "dd 'de' MMMM", { locale: ptBR })
                    })()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
