"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Trophy, Car, Calendar } from "lucide-react"
import { api } from "@/trpc/react"
import { useMemo } from "react"

// Tipos para melhor tipagem
interface User {
  id: string
  firstName?: string | null
  lastName?: string | null
  email: string
  imageUrl?: string | null
}



interface UserStats {
  user: User
  totalRents: number
  activeRents: number
  completedRents: number
  totalKm: number
  lastRent: string | null
  enterprises: Set<string>
}

// Componente de loading skeleton
function UserRankingSkeleton() {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

// Componente para item do ranking
const UserRankingItem = ({ userStat, index, topUser }: {
  userStat: UserStats
  index: number
  topUser?: UserStats
}) => {
  const percentage = topUser ? ((userStat.totalRents / topUser.totalRents) * 100) : 0
  const userName = `${userStat.user.firstName ?? ''} ${userStat.user.lastName ?? ''}`.trim()
  const userInitials = `${userStat.user.firstName?.[0] ?? ''}${userStat.user.lastName?.[0] ?? ''}`

  return (
    <article
      className="flex items-center space-x-4 p-4 border rounded-lg"
      aria-label={`Posição ${index + 1}: ${userName}`}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10"
        aria-label={`Posição ${index + 1}`}
      >
        <span className="text-sm font-bold text-primary">#{index + 1}</span>
      </div>

      <Avatar className="h-10 w-10">
        <AvatarImage
          src={userStat.user.imageUrl ?? undefined}
          alt={`Foto de perfil de ${userName}`}
        />
        <AvatarFallback aria-label={`Iniciais de ${userName}`}>
          {userInitials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium truncate" title={userName}>
              {userName}
            </p>
            <p className="text-xs text-muted-foreground truncate" title={userStat.user.email}>
              {userStat.user.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium" aria-label={`${userStat.totalRents} reservas totais`}>
              {userStat.totalRents} reservas
            </p>
            <p className="text-xs text-muted-foreground" aria-label={`${userStat.completedRents} reservas concluídas`}>
              {userStat.completedRents} concluídas
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso relativo ao top 1</span>
            <span aria-label={`${percentage.toFixed(1)}% de progresso`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={percentage}
            className="h-1"
            aria-label={`Barra de progresso mostrando ${percentage.toFixed(1)}%`}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-wrap gap-1" role="list" aria-label="Empresas utilizadas">
            {Array.from(userStat.enterprises).slice(0, 3).map((enterprise) => (
              <Badge key={enterprise} variant="outline" className="text-xs" role="listitem">
                {enterprise}
              </Badge>
            ))}
            {userStat.enterprises.size > 3 && (
              <Badge variant="outline" className="text-xs" role="listitem">
                +{userStat.enterprises.size - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
            <span aria-label={
              userStat.lastRent
                ? `Última reserva em ${new Date(userStat.lastRent).toLocaleDateString('pt-BR')}`
                : "Nunca fez reserva"
            }>
              {userStat.lastRent ? (
                new Date(userStat.lastRent).toLocaleDateString('pt-BR')
              ) : (
                "Nunca"
              )}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

// Componente para distribuição por empresa
const CompanyDistributionChart = ({ userRanking }: { userRanking: UserStats[] }) => {
  const companyStats = useMemo(() => {
    // Coletar todas as empresas únicas
    const allEnterprises = new Set<string>()
    userRanking.forEach(user => {
      user.enterprises.forEach(enterprise => allEnterprises.add(enterprise))
    })

    // Calcular estatísticas por empresa
    return Array.from(allEnterprises)
      .map(enterprise => ({
        enterprise,
        count: userRanking.filter(user => user.enterprises.has(enterprise)).length
      }))
      .sort((a, b) => b.count - a.count)
  }, [userRanking])

  return (
    <div className="space-y-4" role="list" aria-label="Distribuição de usuários por empresa">
      {companyStats.map(({ enterprise, count }) => {
        const percentage = (count / userRanking.length) * 100
        return (
          <div key={enterprise} className="space-y-2" role="listitem">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{enterprise}</span>
              <span className="text-muted-foreground">
                {count} usuário{count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <Progress
              value={percentage}
              className="h-2"
              aria-label={`${enterprise}: ${count} usuários (${percentage.toFixed(1)}%)`}
            />
          </div>
        )
      })}
    </div>
  )
}

export function UserRanking() {
  const { data: rents, isLoading } = api.vehicleRent.getAll.useQuery({
    limit: 100,
  })

  // Calcular estatísticas de uso por usuário com memoização
  const userStats = useMemo(() => {
    if (!rents?.items) return {}

    const statsMap = new Map<string, UserStats>()

    rents.items.forEach(rent => {
      const userId = rent.userId

      // Obter ou criar estatísticas do usuário
      let userStat = statsMap.get(userId)
      if (!userStat) {
        userStat = {
          user: {
            ...rent.user,
            firstName: rent.user.firstName ?? undefined,
            lastName: rent.user.lastName ?? undefined,
            imageUrl: rent.user.imageUrl ?? undefined,
          },
          totalRents: 0,
          activeRents: 0,
          completedRents: 0,
          totalKm: 0,
          lastRent: null,
          enterprises: new Set<string>(),
        }
        statsMap.set(userId, userStat)
      }

      // Atualizar estatísticas
      userStat.totalRents += 1

      if (rent.finished) {
        userStat.completedRents += 1
        if (rent.finalKm && rent.initialKm) {
          const finalKm = Number(rent.finalKm)
          const initialKm = Number(rent.initialKm)
          if (!isNaN(finalKm) && !isNaN(initialKm)) {
            userStat.totalKm += finalKm - initialKm
          }
        }
      } else {
        userStat.activeRents += 1
      }

      // Adicionar empresa do veículo
      userStat.enterprises.add(rent.vehicle.enterprise)

      // Atualizar última reserva
      if (!userStat.lastRent || new Date(rent.startDate) > new Date(userStat.lastRent)) {
        userStat.lastRent = rent.startDate.toISOString()
      }
    })

    // Converter Map para Record
    const result: Record<string, UserStats> = {}
    statsMap.forEach((stats, userId) => {
      result[userId] = stats
    })

    return result
  }, [rents?.items])

  // Estatísticas calculadas com memoização
  const stats = useMemo(() => {
    const userStatsArray = Object.values(userStats)
    const userRanking = userStatsArray
      .sort((a, b) => b.totalRents - a.totalRents)
      .slice(0, 10)

      return {
      userRanking,
      totalUsers: userStatsArray.length,
      totalRents: rents?.items?.length ?? 0,
      activeRents: rents?.items?.filter(r => !r.finished).length ?? 0,
      topUser: userRanking[0],
    }
  }, [userStats, rents?.items])

  if (isLoading) {
    return <UserRankingSkeleton />
  }

  // Componente para cards de estatísticas
  const StatCard = ({ title, value, description, icon: Icon }: {
    title: string
    value: string | number
    description: string
    icon: React.ComponentType<{ className?: string }>
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Usuários"
          value={stats.totalUsers}
          description="usuários que já reservaram veículos"
          icon={Users}
        />

        <StatCard
          title="Reservas Ativas"
          value={stats.activeRents}
          description="reservas em andamento"
          icon={Car}
        />

        <StatCard
          title="Média por Usuário"
          value={stats.totalUsers > 0 ? (stats.totalRents / stats.totalUsers).toFixed(1) : "0"}
          description="reservas por usuário"
          icon={Trophy}
        />

      </div>


      {/* Ranking de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Usuários</CardTitle>
          <CardDescription>
            Usuários que mais utilizam os da frota
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.userRanking.length > 0 ? (
            <div className="space-y-4" role="list" aria-label="Ranking dos usuários">
              {stats.userRanking.map((userStat, index) => (
                <UserRankingItem
                  key={userStat.user.id}
                  userStat={userStat}
                  index={index}
                  topUser={stats.topUser}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12" role="status" aria-live="polite">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                Ainda não há dados de uso dos pelos usuários.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribuição por Empresa */}
      {stats.userRanking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Empresa</CardTitle>
            <CardDescription>
              Empresas mais utilizadas pelos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyDistributionChart userRanking={stats.userRanking} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
