# 🏠 Dashboard Principal

## 📋 Visão Geral

O **Dashboard Principal** é a página inicial do Sistema de Intranet ELO, fornecendo uma visão centralizada e personalizada das informações mais importantes para cada usuário. Ele serve como ponto de entrada principal, oferecendo acesso rápido às funcionalidades mais utilizadas e métricas relevantes.

## 🎯 Objetivos

### **Para Colaboradores**
- ✅ **Visão Personalizada** - Informações relevantes por perfil
- ✅ **Acesso Rápido** - Atalhos para funcionalidades principais
- ✅ **Informações Atualizadas** - Dados em tempo real
- ✅ **Navegação Intuitiva** - Interface limpa e organizada
- ✅ **Engajamento** - Conteúdo corporativo relevante

### **Para Gestores**
- ✅ **Métricas de Equipe** - KPIs e indicadores importantes
- ✅ **Aprovações Pendentes** - Itens aguardando decisão
- ✅ **Relatórios Rápidos** - Visão executiva dos dados
- ✅ **Comunicação** - Avisos e comunicados importantes
- ✅ **Performance** - Indicadores de produtividade

### **Para Administradores**
- ✅ **Visão Global** - Status geral do sistema
- ✅ **Alertas do Sistema** - Notificações importantes
- ✅ **Métricas de Uso** - Analytics de engajamento
- ✅ **Controle Operacional** - Status dos módulos
- ✅ **Ferramentas Administrativas** - Acesso rápido às configurações

## 🏗️ Arquitetura do Dashboard

### **Componentes Principais**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Widgets        │    │   Data          │
│   Layout        │◄──►│   Components     │◄──►│   Providers     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Personalization│    │   Real-time      │    │   Caching       │
│   Engine        │    │   Updates        │    │   Strategy      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📊 Componentes do Dashboard

### **Widgets Principais**

#### **1. Welcome Widget**
```tsx
function WelcomeWidget({ user }: { user: User }) {
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <Card className="col-span-full">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {greeting}, {user.firstName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo ao Sistema de Intranet ELO
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {user.enterprise} • {user.setor}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### **2. Quick Access Widget**
```tsx
function QuickAccessWidget() {
  const quickActions = [
    {
      title: 'Reservar Sala',
      description: 'Agende uma sala de reunião',
      icon: Calendar,
      href: '/rooms',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      title: 'Fazer Pedido',
      description: 'Peça seu almoço',
      icon: ChefHat,
      href: '/food',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      title: 'Nova Sugestão',
      description: 'Compartilhe suas ideias',
      icon: Lightbulb,
      href: '/suggestions/new',
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
    },
    {
      title: 'Locar Veículo',
      description: 'Solicite um carro',
      icon: Car,
      href: '/cars',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Acesso Rápido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className={`p-3 rounded-lg border transition-colors ${action.color}`}>
                <action.icon className="w-6 h-6 mb-2" />
                <h4 className="font-medium text-sm">{action.title}</h4>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### **3. Birthdays Widget**
```tsx
function BirthdaysWidget() {
  const { data: birthdays } = trpc.birthday.getThisMonth.useQuery()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="w-5 h-5" />
          Aniversários do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        {birthdays?.length ? (
          <div className="space-y-3">
            {birthdays.slice(0, 5).map((birthday) => (
              <div key={birthday.id} className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={birthday.imageUrl} />
                  <AvatarFallback>
                    {birthday.firstName[0]}{birthday.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {birthday.firstName} {birthday.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {birthday.setor} • {format(birthday.birthDate, 'dd/MM')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum aniversário este mês
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

#### **4. Recent News Widget**
```tsx
function RecentNewsWidget() {
  const { data: news } = trpc.news.getRecent.useQuery({ limit: 3 })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          Últimas Notícias
        </CardTitle>
      </CardHeader>
      <CardContent>
        {news?.length ? (
          <div className="space-y-3">
            {news.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {format(item.createdAt, 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma notícia recente
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

#### **5. Upcoming Events Widget**
```tsx
function UpcomingEventsWidget() {
  const { data: events } = trpc.event.getUpcoming.useQuery({ limit: 3 })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Próximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events?.length ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {format(event.startDate, 'dd/MM/yyyy HH:mm')} • {event.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum evento próximo
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

#### **6. Tasks & Approvals Widget**
```tsx
function TasksWidget() {
  const { data: pendingItems } = trpc.dashboard.getPendingItems.useQuery()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          Tarefas Pendentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingItems?.length ? (
          <div className="space-y-3">
            {pendingItems.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded border">
                <div className={`w-2 h-2 rounded-full ${
                  item.priority === 'HIGH' ? 'bg-red-500' :
                  item.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
                <Button variant="outline" size="sm">
                  Ver
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma tarefa pendente
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

#### **7. System Status Widget**
```tsx
function SystemStatusWidget() {
  const { data: status } = trpc.admin.getSystemStatus.useQuery()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Status do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">API Status</span>
            <Badge variant={status?.api ? "default" : "destructive"}>
              {status?.api ? "Online" : "Offline"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Database</span>
            <Badge variant={status?.database ? "default" : "destructive"}>
              {status?.database ? "Online" : "Offline"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Active Users</span>
            <span className="text-sm font-medium">{status?.activeUsers || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🎨 Layout e Estrutura

### **Dashboard Layout Principal**
```tsx
// src/app/(authenticated)/dashboard/page.tsx
export default function DashboardPage() {
  const { data: user } = trpc.user.getCurrent.useQuery()

  if (!user) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <WelcomeWidget user={user} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Access - Takes 2 columns on large screens */}
        <div className="md:col-span-2 lg:col-span-2">
          <QuickAccessWidget />
        </div>

        {/* Birthdays */}
        <div className="md:col-span-1">
          <BirthdaysWidget />
        </div>

        {/* Recent News */}
        <div className="md:col-span-1">
          <RecentNewsWidget />
        </div>

        {/* Upcoming Events - Takes 2 columns */}
        <div className="md:col-span-2 lg:col-span-2">
          <UpcomingEventsWidget />
        </div>

        {/* Tasks & Approvals */}
        <div className="md:col-span-1">
          <TasksWidget />
        </div>

        {/* System Status - Only for admins */}
        {user.role === 'ADMIN' && (
          <div className="md:col-span-1">
            <SystemStatusWidget />
          </div>
        )}
      </div>

      {/* Personalized Content Based on Role */}
      {user.role === 'ADMIN' && <AdminDashboard user={user} />}
      {user.role === 'MANAGER' && <ManagerDashboard user={user} />}
      {user.role === 'USER' && <UserDashboard user={user} />}
    </div>
  )
}
```

### **Dashboard Personalizado por Perfil**

#### **Dashboard para Administradores**
```tsx
function AdminDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-xl font-bold">Visão Administrativa</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Metrics */}
        <div className="lg:col-span-2">
          <SystemMetrics />
        </div>

        {/* Quick Admin Actions */}
        <div>
          <QuickAdminActions />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  )
}
```

#### **Dashboard para Gestores**
```tsx
function ManagerDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-xl font-bold">Visão Gerencial</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Metrics */}
        <TeamMetrics userId={user.id} />

        {/* Pending Approvals */}
        <PendingApprovals userId={user.id} />
      </div>

      {/* Team Activity */}
      <TeamActivity userId={user.id} />
    </div>
  )
}
```

#### **Dashboard para Usuários**
```tsx
function UserDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-xl font-bold">Minhas Atividades</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Bookings */}
        <MyBookings userId={user.id} />

        {/* My Orders */}
        <MyOrders userId={user.id} />

        {/* My Suggestions */}
        <MySuggestions userId={user.id} />
      </div>
    </div>
  )
}
```

## ⚙️ Backend API

### **Dashboard Router**
```typescript
export const dashboardRouter = createTRPCRouter({
  // Get personalized dashboard data
  getPersonalizedData: protectedProcedure.query(async ({ ctx }) => {
    const [recentBookings, recentOrders, pendingTasks, upcomingEvents] = await Promise.all([
      ctx.db.booking.findMany({
        where: {
          userId: ctx.user.id,
          startDate: { gte: new Date() }
        },
        take: 3,
        include: { room: true },
        orderBy: { startDate: 'asc' }
      }),

      ctx.db.foodOrder.findMany({
        where: { userId: ctx.user.id },
        take: 3,
        include: { menuItem: true },
        orderBy: { createdAt: 'desc' }
      }),

      getPendingTasks(ctx.user.id, ctx.user.role),

      ctx.db.event.findMany({
        where: {
          startDate: { gte: new Date() },
          registrations: {
            some: { userId: ctx.user.id }
          }
        },
        take: 3,
        orderBy: { startDate: 'asc' }
      })
    ])

    return {
      recentBookings,
      recentOrders,
      pendingTasks,
      upcomingEvents,
    }
  }),

  // Get pending items for user
  getPendingItems: protectedProcedure.query(async ({ ctx }) => {
    const pendingItems = []

    // Get pending approvals if manager/admin
    if (ctx.user.role === 'ADMIN' || ctx.user.role === 'MANAGER') {
      const [pendingEvents, pendingBookings, pendingRentals] = await Promise.all([
        ctx.db.event.findMany({
          where: { status: 'PENDING' },
          select: { id: true, title: true, createdAt: true }
        }),

        ctx.db.booking.findMany({
          where: { status: 'PENDING' },
          select: { id: true, title: true, createdAt: true }
        }),

        ctx.db.vehicleRent.findMany({
          where: { status: 'PENDING' },
          select: { id: true, purpose: true, createdAt: true }
        })
      ])

      pendingItems.push(
        ...pendingEvents.map(e => ({ ...e, type: 'Evento Pendente', priority: 'MEDIUM' })),
        ...pendingBookings.map(b => ({ ...b, type: 'Reserva Pendente', priority: 'MEDIUM' })),
        ...pendingRentals.map(r => ({ ...r, type: 'Locação Pendente', priority: 'HIGH' }))
      )
    }

    // Get user's pending items
    const userPendingItems = await getUserPendingItems(ctx.user.id)

    return [...pendingItems, ...userPendingItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }),

  // Get system status (Admin only)
  getSystemStatus: adminProcedure.query(async ({ ctx }) => {
    const [activeUsers, apiStatus, dbStatus] = await Promise.all([
      // Count users active in last hour
      ctx.db.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000)
          }
        }
      }),

      // API status check
      checkAPIStatus(),

      // Database status check
      checkDatabaseStatus()
    ])

    return {
      activeUsers,
      api: apiStatus,
      database: dbStatus,
      timestamp: new Date().toISOString()
    }
  }),

  // Get dashboard analytics
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    if (user.role === 'ADMIN') {
      const [totalUsers, totalBookings, totalOrders, totalSuggestions] = await Promise.all([
        ctx.db.user.count(),
        ctx.db.booking.count({ where: { createdAt: { gte: monthStart } } }),
        ctx.db.foodOrder.count({ where: { createdAt: { gte: monthStart } } }),
        ctx.db.suggestion.count({ where: { createdAt: { gte: monthStart } } })
      ])

      return {
        totalUsers,
        monthlyBookings: totalBookings,
        monthlyOrders: totalOrders,
        monthlySuggestions: totalSuggestions,
        systemHealth: 'GOOD'
      }
    }

    // User-specific analytics
    const [userBookings, userOrders, userSuggestions] = await Promise.all([
      ctx.db.booking.count({
        where: {
          userId: user.id,
          createdAt: { gte: monthStart }
        }
      }),

      ctx.db.foodOrder.count({
        where: {
          userId: user.id,
          createdAt: { gte: monthStart }
        }
      }),

      ctx.db.suggestion.count({
        where: {
          authorId: user.id,
          createdAt: { gte: monthStart }
        }
      })
    ])

    return {
      userBookings,
      userOrders,
      userSuggestions,
      engagement: 'ACTIVE'
    }
  })
})
```

## 📊 Analytics Integrados

### **Métricas do Dashboard**
```typescript
// src/server/api/routers/analytics.ts
export const analyticsRouter = createTRPCRouter({
  getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user
    const today = new Date()
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // User engagement metrics
    const [weeklyActivity, monthlyActivity, pendingActions] = await Promise.all([
      // Weekly activity
      ctx.db.userActivity.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: weekStart }
        },
        select: { action: true, createdAt: true }
      }),

      // Monthly activity
      ctx.db.userActivity.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: monthStart }
        },
        select: { action: true, createdAt: true }
      }),

      // Pending actions
      getPendingActions(user.id, user.role)
    ])

    return {
      weeklyActivity: weeklyActivity.length,
      monthlyActivity: monthlyActivity.length,
      pendingActions: pendingActions.length,
      engagement: calculateEngagement(weeklyActivity, monthlyActivity),
      trends: calculateTrends(weeklyActivity)
    }
  }),

  getSystemHealth: adminProcedure.query(async ({ ctx }) => {
    const [
      activeUsers,
      systemLoad,
      errorRate,
      responseTime
    ] = await Promise.all([
      getActiveUsers(),
      getSystemLoad(),
      getErrorRate(),
      getAverageResponseTime()
    ])

    return {
      status: determineSystemStatus(activeUsers, systemLoad, errorRate, responseTime),
      metrics: {
        activeUsers,
        systemLoad,
        errorRate,
        responseTime
      },
      alerts: generateAlerts(errorRate, responseTime, systemLoad)
    }
  })
})
```

## 🎯 Funcionalidades Avançadas

### **Personalização do Dashboard**
```typescript
// src/lib/dashboard/personalization.ts
export class DashboardPersonalizer {
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Get user dashboard preferences from database
    const preferences = await prisma.userDashboardPreference.findUnique({
      where: { userId },
      include: {
        visibleWidgets: true,
        widgetOrder: true
      }
    })

    return preferences || this.getDefaultPreferences()
  }

  static async updatePreferences(userId: string, preferences: Partial<UserPreferences>) {
    await prisma.userDashboardPreference.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences,
        ...this.getDefaultPreferences()
      }
    })
  }

  static getDefaultPreferences(): UserPreferences {
    return {
      theme: 'light',
      language: 'pt-BR',
      visibleWidgets: [
        'welcome',
        'quick-access',
        'birthdays',
        'recent-news',
        'upcoming-events',
        'tasks'
      ],
      widgetOrder: [
        'welcome',
        'quick-access',
        'birthdays',
        'recent-news',
        'upcoming-events',
        'tasks'
      ],
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    }
  }

  static getRoleBasedWidgets(userRole: string): string[] {
    const baseWidgets = ['welcome', 'quick-access', 'birthdays', 'recent-news']

    switch (userRole) {
      case 'ADMIN':
        return [...baseWidgets, 'system-status', 'pending-approvals', 'analytics']
      case 'MANAGER':
        return [...baseWidgets, 'team-metrics', 'pending-approvals', 'team-activity']
      default:
        return [...baseWidgets, 'my-bookings', 'my-orders', 'my-suggestions']
    }
  }
}
```

### **Sistema de Notificações**
```typescript
// src/lib/dashboard/notifications.ts
export class DashboardNotificationService {
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        read: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      priority: n.priority,
      createdAt: n.createdAt,
      actionUrl: n.actionUrl
    }))
  }

  static async createNotification(data: CreateNotificationData) {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority,
        actionUrl: data.actionUrl,
        expiresAt: data.expiresAt
      }
    })

    // Send push notification if enabled
    if (data.sendPush) {
      await this.sendPushNotification(data)
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: { read: true }
    })
  }

  static async getNotificationStats(userId: string) {
    const [unread, today, thisWeek] = await Promise.all([
      prisma.notification.count({
        where: { userId, read: false }
      }),

      prisma.notification.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      prisma.notification.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return { unread, today, thisWeek }
  }
}
```

### **Cache e Performance**
```typescript
// src/lib/dashboard/cache.ts
export class DashboardCacheManager {
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  static async getCachedDashboardData(userId: string) {
    const cacheKey = `dashboard:${userId}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    // Generate fresh data
    const data = await this.generateDashboardData(userId)

    // Cache the data
    await redis.setex(cacheKey, this.CACHE_TTL / 1000, JSON.stringify(data))

    return data
  }

  static async invalidateUserCache(userId: string) {
    const cacheKey = `dashboard:${userId}`
    await redis.del(cacheKey)
  }

  static async invalidateAllCache() {
    const keys = await redis.keys('dashboard:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  private static async generateDashboardData(userId: string) {
    // Generate comprehensive dashboard data
    const [
      user,
      recentActivity,
      pendingItems,
      metrics,
      notifications
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      getRecentActivity(userId),
      getPendingItems(userId),
      getUserMetrics(userId),
      getUserNotifications(userId)
    ])

    return {
      user,
      recentActivity,
      pendingItems,
      metrics,
      notifications,
      generatedAt: new Date().toISOString()
    }
  }
}
```

## 📱 Responsividade e UX

### **Design System**
```tsx
// src/components/dashboard/responsive-layout.tsx
function ResponsiveDashboard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <MobileDashboardLayout>{children}</MobileDashboardLayout>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:block lg:hidden">
        <TabletDashboardLayout>{children}</TabletDashboardLayout>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <DesktopDashboardLayout>{children}</DesktopDashboardLayout>
      </div>
    </div>
  )
}

function MobileDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 p-4">
      {/* Single column layout for mobile */}
      <div className="grid grid-cols-1 gap-4">
        {children}
      </div>
    </div>
  )
}

function TabletDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 p-6">
      {/* Two column layout for tablet */}
      <div className="grid grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  )
}

function DesktopDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      {/* Four column layout for desktop */}
      <div className="grid grid-cols-4 gap-6">
        {children}
      </div>
    </div>
  )
}
```

## 📋 Checklist do Dashboard

### **Funcionalidades Core**
- ✅ **Visão Personalizada** - Conteúdo por perfil de usuário
- ✅ **Acesso Rápido** - Atalhos para funcionalidades principais
- ✅ **Informações em Tempo Real** - Dados atualizados automaticamente
- ✅ **Notificações Integradas** - Alertas e lembretes no dashboard
- ✅ **Analytics Integrados** - Métricas e KPIs relevantes
- ✅ **Responsividade** - Funciona em mobile, tablet e desktop

### **Backend e API**
- ✅ **tRPC Procedures** - Endpoints type-safe
- ✅ **Personalização** - Preferências por usuário
- ✅ **Cache Strategy** - Performance otimizada
- ✅ **Real-time Updates** - Sincronização automática
- ✅ **Role-based Content** - Conteúdo específico por perfil
- ✅ **Analytics** - Métricas de uso e engajamento

### **Interface do Usuário**
- ✅ **Design System** - Componentes consistentes
- ✅ **Loading States** - Estados de carregamento
- ✅ **Error Handling** - Tratamento de erros
- ✅ **Empty States** - Estados vazios informativos
- ✅ **Progressive Enhancement** - Funciona sem JavaScript
- ✅ **Accessibility** - WCAG 2.1 compliance

### **Performance e Escalabilidade**
- ✅ **Lazy Loading** - Componentes carregados sob demanda
- ✅ **Virtual Scrolling** - Para listas grandes
- ✅ **Image Optimization** - Imagens otimizadas
- ✅ **Bundle Splitting** - JavaScript dividido
- ✅ **CDN Integration** - Assets servidos via CDN
- ✅ **Monitoring** - Métricas de performance

---

**📅 Última atualização**: Fevereiro 2025
**👥 Mantido por**: Equipe de Produto
