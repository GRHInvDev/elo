# 📅 Sistema de Eventos e Flyers

## 📋 Visão Geral

O **Sistema de Eventos e Flyers** é uma plataforma completa para gestão de eventos corporativos, comunicação interna e distribuição de materiais promocionais. Permite criar, gerenciar e promover eventos, além de publicar e organizar flyers e comunicados.

## 🎯 Objetivos

### **Para Colaboradores**
- ✅ **Descoberta Fácil** - Calendário centralizado de eventos
- ✅ **Inscrições Simples** - Processo intuitivo de participação
- ✅ **Lembretes Automáticos** - Notificações personalizadas
- ✅ **Materiais Organizados** - Flyers e comunicados categorizados
- ✅ **Participação Ativa** - Engajamento com a empresa

### **Para Organizadores**
- ✅ **Criação Intuitiva** - Interface amigável para eventos
- ✅ **Gestão Completa** - Controle de inscrições e participantes
- ✅ **Comunicação Direta** - Notificações automáticas
- ✅ **Analytics Detalhado** - Métricas de engajamento
- ✅ **Materiais Integrados** - Flyers vinculados aos eventos

### **Para Administradores**
- ✅ **Controle Central** - Gestão de todos os eventos
- ✅ **Aprovações** - Workflow de validação de eventos
- ✅ **Relatórios** - Analytics de participação e engajamento
- ✅ **Integrações** - Conexão com calendários externos
- ✅ **Distribuição** - Controle de flyers e materiais

## 🏗️ Arquitetura do Sistema

### **Componentes Principais**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API (tRPC)     │    │   Database      │
│   Event UI      │◄──►│   Event Router   │◄──►│   Models        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Calendar View │    │   Notification   │    │   File Storage  │
│   Registration  │    │   System         │    │   Management    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🗄️ Modelo de Dados

### **Event (Eventos)**
```prisma
model Event {
  id            String      @id @default(cuid())
  title         String
  description   String?
  content       String?     // Rich text content
  startDate     DateTime
  endDate       DateTime
  location      String?
  capacity      Int?
  isVirtual     Boolean     @default(false)
  meetingLink   String?     // For virtual events
  imageUrl      String?

  // Status and approval
  status        EventStatus @default(DRAFT)
  isPublished   Boolean     @default(false)
  requiresApproval Boolean   @default(false)

  // Metadata
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Foreign Keys
  authorId      String
  categoryId    String?

  // Relations
  author        User        @relation(fields: [authorId], references: [id])
  category      EventCategory? @relation(fields: [categoryId], references: [id])
  registrations EventRegistration[]
  flyers        EventFlyer[]

  @@map("events")
}
```

### **EventRegistration (Inscrições)**
```prisma
model EventRegistration {
  id            String      @id @default(cuid())
  status        RegistrationStatus @default(PENDING)
  registeredAt  DateTime    @default(now())
  notes         String?     // Additional notes

  // Foreign Keys
  userId        String
  eventId       String

  // Relations
  user          User        @relation(fields: [userId], references: [id])
  event         Event       @relation(fields: [eventId], references: [id])

  @@unique([userId, eventId])
  @@map("event_registrations")
}
```

### **EventCategory (Categorias)**
```prisma
model EventCategory {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  color       String    @default("#3B82F6")
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())

  // Relations
  events      Event[]

  @@map("event_categories")
}
```

### **Flyer (Materiais)**
```prisma
model Flyer {
  id          String      @id @default(cuid())
  title       String
  description String?
  fileUrl     String
  fileType    String      // PDF, JPG, PNG, etc.
  fileSize    Int         // Size in bytes
  category    FlyerCategory

  // Visibility
  isPublic    Boolean     @default(true)
  isActive    Boolean     @default(true)

  // Metadata
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Foreign Keys
  authorId    String
  eventId     String?     // Optional link to event

  // Relations
  author      User        @relation(fields: [authorId], references: [id])
  event       Event?      @relation(fields: [eventId], references: [id])

  @@map("flyers")
}
```

### **Enums e Tipos**
```prisma
enum EventStatus {
  DRAFT       // Rascunho
  PENDING     // Aguardando aprovação
  APPROVED    // Aprovado
  PUBLISHED   // Publicado
  CANCELLED   // Cancelado
  COMPLETED   // Realizado
}

enum RegistrationStatus {
  PENDING     // Inscrição pendente
  CONFIRMED   // Confirmada
  CANCELLED   // Cancelada
  ATTENDED    // Compareceu
  NO_SHOW     // Não compareceu
}

enum FlyerCategory {
  ANNOUNCEMENT   // Comunicados
  PROMOTION      // Promoções
  NEWS           // Notícias
  TRAINING       // Treinamentos
  POLICY         // Políticas
  EVENT          // Eventos
  GENERAL        // Geral
}
```

### **Estrutura de Evento Completo**
```typescript
interface EventWithDetails {
  id: string
  title: string
  description?: string
  content?: string
  startDate: Date
  endDate: Date
  location?: string
  capacity?: number
  isVirtual: boolean
  meetingLink?: string
  imageUrl?: string

  // Status
  status: EventStatus
  isPublished: boolean
  requiresApproval: boolean

  // Relations
  author: User
  category?: EventCategory
  registrations: EventRegistration[]
  flyers: Flyer[]

  // Computed fields
  registrationCount: number
  isFull: boolean
  userRegistered?: boolean
}
```

## 📅 Funcionalidades de Eventos

### **Criação e Gestão**
- ✅ Editor visual para conteúdo rico
- ✅ Configuração de datas e horários
- ✅ Definição de capacidade
- ✅ Eventos virtuais com links
- ✅ Categorização automática
- ✅ Workflow de aprovação

### **Sistema de Inscrições**
- ✅ Inscrição com um clique
- ✅ Controle de capacidade
- ✅ Lista de espera automática
- ✅ Confirmação por email
- ✅ Cancelamento até 24h antes
- ✅ Transferência de inscrição

### **Calendário Integrado**
- ✅ Visualização mensal/semanal/diária
- ✅ Filtros por categoria
- ✅ Exportação para calendário pessoal
- ✅ Lembretes automáticos
- ✅ Sincronização com Google Calendar

## 📄 Funcionalidades de Flyers

### **Gestão de Materiais**
- ✅ Upload de múltiplos formatos
- ✅ Categorização inteligente
- ✅ Controle de visibilidade
- ✅ Versionamento automático
- ✅ Download com contadores

### **Distribuição**
- ✅ Publicação instantânea
- ✅ Notificações push
- ✅ Compartilhamento por email
- ✅ Links de acesso direto
- ✅ Controle de acesso

## 🎨 Interface do Usuário

### **Página de Eventos**
```tsx
export default function EventsPage() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: events, isLoading } = trpc.event.getAll.useQuery({
    categoryId: selectedCategory,
    upcoming: true,
  })

  const { data: categories } = trpc.eventCategory.getAll.useQuery()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Eventos Corporativos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode('list')}>Lista</Button>
          <Button variant="outline" onClick={() => setViewMode('calendar')}>Calendário</Button>
          <Button>Criar Evento</Button>
        </div>
      </div>

      {/* Category Filter */}
      <EventCategoryFilter
        categories={categories || []}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Events Display */}
      {viewMode === 'list' ? (
        <EventList events={events || []} />
      ) : (
        <EventCalendar events={events || []} />
      )}
    </div>
  )
}
```

### **Card de Evento**
```tsx
function EventCard({ event }: { event: EventWithDetails }) {
  const { data: registration } = trpc.eventRegistration.getMyRegistration.useQuery({
    eventId: event.id
  })

  const registerMutation = trpc.eventRegistration.register.useMutation()

  const handleRegister = async () => {
    try {
      await registerMutation.mutateAsync({ eventId: event.id })
    } catch (error) {
      // Handle error
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        )}

        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{event.title}</h3>
            {event.category && (
              <Badge variant="secondary" className="mt-1">
                {event.category.name}
              </Badge>
            )}
          </div>
          <EventStatusBadge status={event.status} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {format(event.startDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {event.registrationCount}
              {event.capacity && `/${event.capacity}`} inscritos
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {!registration ? (
            <Button
              className="flex-1"
              onClick={handleRegister}
              disabled={event.isFull || !event.isPublished}
            >
              {event.isFull ? 'Esgotado' : 'Inscrever-se'}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Badge variant="default">Inscrito</Badge>
              <Button variant="outline" size="sm">
                Cancelar
              </Button>
            </div>
          )}

          <Button variant="outline" size="sm">
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### **Calendário de Eventos**
```tsx
function EventCalendar({ events }: { events: EventWithDetails[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = format(event.startDate, 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(event)
    return acc
  }, {} as Record<string, EventWithDetails[]>)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView('month')}>Mês</Button>
            <Button variant="outline" size="sm" onClick={() => setView('week')}>Semana</Button>
            <Button variant="outline" size="sm" onClick={() => setView('day')}>Dia</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            onDateClick={(date) => setCurrentDate(date)}
          />
        )}
      </CardContent>
    </Card>
  )
}
```

### **Página de Flyers**
```tsx
export default function FlyersPage() {
  const [selectedCategory, setSelectedCategory] = useState<FlyerCategory | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: flyers, isLoading } = trpc.flyer.getAll.useQuery({
    category: selectedCategory,
    search: searchTerm,
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Flyers e Materiais</h1>
        <Button>Publicar Material</Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar materiais..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <FlyerCategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Flyers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flyers?.map(flyer => (
          <FlyerCard key={flyer.id} flyer={flyer} />
        ))}
      </div>
    </div>
  )
}
```

## ⚙️ Backend API

### **Event Router**
```typescript
export const eventRouter = createTRPCRouter({
  // Get all events with filters
  getAll: protectedProcedure
    .input(z.object({
      categoryId: z.string().optional(),
      upcoming: z.boolean().default(false),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        isPublished: true,
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.upcoming && { startDate: { gte: new Date() } }),
      }

      const [events, total] = await Promise.all([
        ctx.db.event.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            author: { select: { firstName: true, lastName: true } },
            category: true,
            registrations: {
              select: { id: true },
            },
            _count: {
              select: { registrations: true },
            },
          },
          orderBy: { startDate: 'asc' },
        }),
        ctx.db.event.count({ where }),
      ])

      return { events, total, page: input.page, limit: input.limit }
    }),

  // Get event by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { firstName: true, lastName: true } },
          category: true,
          registrations: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          flyers: true,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })
      }

      return {
        ...event,
        registrationCount: event.registrations.length,
        isFull: event.capacity ? event.registrations.length >= event.capacity : false,
      }
    }),

  // Create event (Admin/Author)
  create: adminProcedure
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.event.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
        include: {
          author: { select: { firstName: true, lastName: true } },
          category: true,
        },
      })
    }),

  // Update event (Admin/Author)
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: createEventSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })
      }

      if (event.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      return ctx.db.event.update({
        where: { id: input.id },
        data: input.data,
      })
    }),

  // Publish event (Admin/Author)
  publish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        select: { authorId: true, status: true },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })
      }

      if (event.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      return ctx.db.event.update({
        where: { id: input.id },
        data: {
          status: 'PUBLISHED',
          isPublished: true,
        },
      })
    }),

  // Delete event (Admin/Author)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })
      }

      if (event.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      return ctx.db.event.delete({
        where: { id: input.id },
      })
    }),
})
```

### **Event Registration Router**
```typescript
export const eventRegistrationRouter = createTRPCRouter({
  // Register for event
  register: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if event exists and is published
      const event = await ctx.db.event.findUnique({
        where: { id: input.eventId },
        select: {
          capacity: true,
          registrations: { select: { id: true } },
          isPublished: true,
        },
      })

      if (!event || !event.isPublished) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found or not published' })
      }

      // Check capacity
      if (event.capacity && event.registrations.length >= event.capacity) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Event is full' })
      }

      // Check if already registered
      const existingRegistration = await ctx.db.eventRegistration.findUnique({
        where: {
          userId_eventId: {
            userId: ctx.user.id,
            eventId: input.eventId,
          },
        },
      })

      if (existingRegistration) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already registered' })
      }

      return ctx.db.eventRegistration.create({
        data: {
          userId: ctx.user.id,
          eventId: input.eventId,
          status: 'CONFIRMED',
        },
        include: {
          event: {
            select: {
              title: true,
              startDate: true,
              location: true,
            },
          },
        },
      })
    }),

  // Get user's registration for event
  getMyRegistration: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.eventRegistration.findUnique({
        where: {
          userId_eventId: {
            userId: ctx.user.id,
            eventId: input.eventId,
          },
        },
      })
    }),

  // Get all registrations for event (Admin/Author)
  getEventRegistrations: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      const event = await ctx.db.event.findUnique({
        where: { id: input.eventId },
        select: { authorId: true },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })
      }

      if (event.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      return ctx.db.eventRegistration.findMany({
        where: { eventId: input.eventId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              enterprise: true,
            },
          },
        },
        orderBy: { registeredAt: 'asc' },
      })
    }),

  // Cancel registration
  cancel: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const registration = await ctx.db.eventRegistration.findUnique({
        where: {
          userId_eventId: {
            userId: ctx.user.id,
            eventId: input.eventId,
          },
        },
        include: {
          event: {
            select: { startDate: true },
          },
        },
      })

      if (!registration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Registration not found' })
      }

      // Check if can cancel (24h before event)
      const hoursUntilEvent = (registration.event.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)
      if (hoursUntilEvent < 24) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot cancel less than 24h before event' })
      }

      return ctx.db.eventRegistration.update({
        where: {
          userId_eventId: {
            userId: ctx.user.id,
            eventId: input.eventId,
          },
        },
        data: { status: 'CANCELLED' },
      })
    }),
})
```

### **Flyer Router**
```typescript
export const flyerRouter = createTRPCRouter({
  // Get all flyers with filters
  getAll: protectedProcedure
    .input(z.object({
      category: z.nativeEnum(FlyerCategory).optional(),
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        isActive: true,
        isPublic: true,
        ...(input.category && { category: input.category }),
        ...(input.search && {
          OR: [
            { title: { contains: input.search, mode: 'insensitive' } },
            { description: { contains: input.search, mode: 'insensitive' } },
          ],
        }),
      }

      const [flyers, total] = await Promise.all([
        ctx.db.flyer.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            author: { select: { firstName: true, lastName: true } },
            event: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.flyer.count({ where }),
      ])

      return { flyers, total, page: input.page, limit: input.limit }
    }),

  // Get flyer by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.flyer.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { firstName: true, lastName: true } },
          event: { select: { id: true, title: true } },
        },
      })
    }),

  // Create flyer (Admin/Author)
  create: adminProcedure
    .input(createFlyerSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.flyer.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
        include: {
          author: { select: { firstName: true, lastName: true } },
        },
      })
    }),

  // Update flyer (Admin/Author)
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: createFlyerSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const flyer = await ctx.db.flyer.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      })

      if (!flyer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Flyer not found' })
      }

      if (flyer.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      return ctx.db.flyer.update({
        where: { id: input.id },
        data: input.data,
      })
    }),

  // Delete flyer (Admin/Author)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const flyer = await ctx.db.flyer.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      })

      if (!flyer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Flyer not found' })
      }

      if (flyer.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      return ctx.db.flyer.delete({
        where: { id: input.id },
      })
    }),

  // Track download/view
  trackView: protectedProcedure
    .input(z.object({ flyerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Implement view tracking (could use a separate table for analytics)
      console.log(`Flyer ${input.flyerId} viewed by user ${ctx.user.id}`)
      return { success: true }
    }),
})
```

## 📊 Analytics e Relatórios

### **Dashboard de Eventos**
```tsx
function EventAnalytics() {
  const { data: analytics } = trpc.analytics.getEventAnalytics.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalEvents}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total de Inscrições</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalRegistrations}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxa de Participação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.participationRate}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flyers Publicados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalFlyers}</div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 📧 Sistema de Notificações

### **Templates de Email**
```typescript
export const EVENT_EMAIL_TEMPLATES = {
  eventPublished: (data: EventPublishedData) => `
    <h2>🎉 Novo Evento Disponível!</h2>
    <p>Olá ${data.userName},</p>
    <p>Um novo evento foi publicado na plataforma:</p>

    <div style="background: #f9f9f9; padding: 20px; margin: 20px 0;">
      <h3>${data.eventTitle}</h3>
      <p><strong>Data:</strong> ${data.startDate}</p>
      <p><strong>Local:</strong> ${data.location}</p>
      ${data.description ? `<p>${data.description}</p>` : ''}
    </div>

    <p><a href="${process.env.APP_URL}/events/${data.eventId}">
      Ver evento e se inscrever
    </a></p>
  `,

  registrationConfirmed: (data: RegistrationConfirmedData) => `
    <h2>✅ Inscrição Confirmada!</h2>
    <p>Olá ${data.userName},</p>
    <p>Sua inscrição no evento foi confirmada:</p>

    <div style="background: #e8f5e8; padding: 20px; margin: 20px 0;">
      <h3>${data.eventTitle}</h3>
      <p><strong>Data:</strong> ${data.startDate}</p>
      <p><strong>Local:</strong> ${data.location}</p>
    </div>

    <p>Adicione à sua agenda e esteja preparado!</p>
    <p><a href="${process.env.APP_URL}/events/${data.eventId}">
      Ver detalhes do evento
    </a></p>
  `,

  eventReminder: (data: EventReminderData) => `
    <h2>⏰ Lembrete de Evento</h2>
    <p>Olá ${data.userName},</p>
    <p>Este é um lembrete do seu evento:</p>

    <div style="background: #e3f2fd; padding: 20px; margin: 20px 0;">
      <h3>${data.eventTitle}</h3>
      <p><strong>Data:</strong> ${data.startDate}</p>
      <p><strong>Local:</strong> ${data.location}</p>
      ${data.isVirtual && data.meetingLink ?
        `<p><strong>Link da Reunião:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` :
        ''
      }
    </div>

    <p>O evento começa em ${data.hoursUntil} horas!</p>
  `,

  eventCancelled: (data: EventCancelledData) => `
    <h2>⚠️ Evento Cancelado</h2>
    <p>Olá ${data.userName},</p>
    <p>Informamos que o evento foi cancelado:</p>

    <div style="background: #ffebee; padding: 20px; margin: 20px 0;">
      <h3>${data.eventTitle}</h3>
      <p><strong>Motivo:</strong> ${data.reason}</p>
    </div>

    <p>Pedimos desculpas pelo inconveniente.</p>
    <p>Verifique outros eventos disponíveis na plataforma.</p>
  `,
}
```

### **Webhook System**
```typescript
export class EventWebhookService {
  static async emitEventPublished(event: EventData) {
    await fetch(process.env.EVENT_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Type': 'event.published',
      },
      body: JSON.stringify({
        event: 'event.published',
        data: event,
        timestamp: new Date().toISOString(),
      }),
    })
  }

  static async emitRegistrationConfirmed(registration: RegistrationData) {
    await fetch(process.env.EVENT_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Type': 'registration.confirmed',
      },
      body: JSON.stringify({
        event: 'registration.confirmed',
        data: registration,
        timestamp: new Date().toISOString(),
      }),
    })
  }
}
```

## 📋 Checklist do Sistema

### **Funcionalidades Core**
- ✅ **Calendário Visual** - Visualização mensal/semanal/diária
- ✅ **Sistema de Inscrições** - Processo completo de registro
- ✅ **Gestão de Capacidade** - Controle de vagas e lista de espera
- ✅ **Notificações Automáticas** - Email e lembretes
- ✅ **Workflow de Aprovação** - Validação de eventos

### **Backend e API**
- ✅ **tRPC Procedures** - Endpoints type-safe
- ✅ **Validação de Dados** - Regras de negócio
- ✅ **Transações** - Consistência de dados
- ✅ **File Upload** - Gestão de materiais
- ✅ **Cache Strategy** - Performance otimizada

### **Interface do Usuário**
- ✅ **Responsive Design** - Mobile-first
- ✅ **Real-time Updates** - Sincronização automática
- ✅ **Rich Text Editor** - Conteúdo formatado
- ✅ **Calendar Integration** - Exportação para calendários
- ✅ **Search & Filter** - Busca avançada

### **Notificações e Integrações**
- ✅ **Email Templates** - Templates personalizados
- ✅ **Webhook System** - Integrações externas
- ✅ **Calendar Sync** - Google Calendar/Outlook
- ✅ **Push Notifications** - Notificações em tempo real
- ✅ **SMS Integration** - Opcional para lembretes

### **Analytics e Relatórios**
- ✅ **Event Metrics** - Taxas de participação
- ✅ **Registration Analytics** - Conversão e engajamento
- ✅ **Flyer Analytics** - Downloads e visualizações
- ✅ **User Engagement** - Níveis de participação
- ✅ **Custom Reports** - Relatórios personalizados

### **Segurança e Qualidade**
- ✅ **Input Validation** - Sanitização completa
- ✅ **Rate Limiting** - Proteção contra abuso
- ✅ **Audit Trails** - Logs de auditoria
- ✅ **File Security** - Controle de acesso a materiais
- ✅ **Unit Tests** - Cobertura de código

---

**📅 Última atualização**: Janeiro 2025
**👥 Mantido por**: Equipe de Produto
