# 🏢 Sistema de Reserva de Salas

## 📋 Visão Geral

O **Sistema de Reserva de Salas** permite aos colaboradores reservarem salas de reunião, auditórios e outros ambientes de forma organizada e eficiente.

## 🎯 Objetivos

- ✅ **Reserva Fácil** - Interface intuitiva de agendamento
- ✅ **Disponibilidade** - Visualização em tempo real
- ✅ **Calendário Integrado** - Visualização semanal
- ✅ **Detecção de Conflitos** - Validação automática
- ✅ **Reservas Recorrentes** - Sistema de recorrência

## 🗄️ Modelo de Dados

```prisma
model Room {
  id          String @id @default(cuid())
  name        String @unique
  description String?
  capacity    Int
  location    String?
  imageUrl    String?
  isActive    Boolean @default(true)
  bookings    Booking[]
}

model Booking {
  id          String @id @default(cuid())
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime
  recurrence  Recurrence?
  status      BookingStatus @default(CONFIRMED)
  userId      String
  roomId      String
  user        User @relation(fields: [userId], references: [id])
  room        Room @relation(fields: [roomId], references: [id])
  createdAt   DateTime @default(now())
}

model Recurrence {
  id          String @id @default(cuid())
  frequency   Frequency
  interval    Int @default(1)
  endDate     DateTime?
  daysOfWeek  Int[]?
  bookingId   String @unique
}
```

## 🎨 Interface do Usuário

### **Página Principal**
```tsx
export default function RoomsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const { data: rooms } = trpc.room.getAll.useQuery()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reserva de Salas</h1>
        <Button>Nova Reserva</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <CalendarPicker selectedDate={selectedDate} onDateSelect={setSelectedDate} />

        <div className="lg:col-span-3">
          {viewMode === 'list' ? (
            <RoomList rooms={rooms || []} selectedDate={selectedDate} />
          ) : (
            <RoomCalendar rooms={rooms || []} selectedDate={selectedDate} />
          )}
        </div>
      </div>
    </div>
  )
}
```

### **Calendário de Reservas**
```tsx
function RoomCalendar({ rooms, selectedDate }) {
  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário de Reservas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rooms.map(room => (
            <RoomCalendarRow key={room.id} room={room} weekDays={weekDays} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

## ⚙️ Backend API

### **Room Router**
```typescript
export const roomRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.room.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { bookings: { where: { startDate: { gte: new Date() } } } }
        }
      }
    })
  }),

  getAvailability: protectedProcedure
    .input(z.object({ roomId: z.string(), date: z.date() }))
    .query(async ({ ctx, input }) => {
      const conflicts = await ctx.db.booking.findMany({
        where: {
          roomId: input.roomId,
          OR: [
            { startDate: { lte: input.endDate }, endDate: { gte: input.startDate } }
          ],
          status: { in: ['CONFIRMED', 'PENDING'] }
        }
      })

      return { available: conflicts.length === 0, conflicts }
    })
})
```

### **Booking Router**
```typescript
export const bookingRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate conflicts
      const conflicts = await detectBookingConflicts(input.roomId, input.startDate, input.endDate)

      if (conflicts.hasConflicts) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Booking conflict detected' })
      }

      return ctx.db.booking.create({
        data: {
          ...input,
          userId: ctx.user.id
        }
      })
    }),

  getMyBookings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.booking.findMany({
      where: { userId: ctx.user.id },
      include: { room: true },
      orderBy: { startDate: 'desc' }
    })
  }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.id }
      })

      if (booking.userId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      return ctx.db.booking.update({
        where: { id: input.id },
        data: { status: 'CANCELLED' }
      })
    })
})
```

## 📊 Funcionalidades

### **Políticas de Reserva**
- Duração mínima: 30 minutos
- Duração máxima: 8 horas
- Antecedência máxima: 30 dias
- Limite diário: 3 reservas
- Limite semanal: 10 reservas

### **Status das Reservas**
- CONFIRMED → IN_USE → COMPLETED
- PENDING (aguardando aprovação)
- CANCELLED

### **Recorrência**
- Diária, semanal, mensal
- Intervalos customizáveis
- Dias específicos da semana
- Data de fim opcional

## 📋 Checklist

- ✅ Calendário visual
- ✅ Detecção de conflitos
- ✅ Reservas recorrentes
- ✅ Workflow de aprovação
- ✅ Notificações por email
- ✅ Analytics de utilização
- ✅ Integração com calendário

---

**📅 Última atualização**: Dezembro 2024
**👥 Mantido por**: Equipe de Produto
