# 🚗 Sistema de Frota de Veículos

## 📋 Visão Geral

O **Sistema de Frota de Veículos** é uma plataforma completa para gestão de locação de veículos corporativos, com controle de disponibilidade, manutenção e custos.

## 🎯 Objetivos

- ✅ **Solicitação Fácil** - Interface intuitiva de locação
- ✅ **Controle de Custos** - Transparência nos gastos
- ✅ **Gestão de Frota** - CRUD completo de veículos
- ✅ **Manutenção** - Controle de revisões
- ✅ **Analytics** - Relatórios de utilização

## 🗄️ Modelo de Dados

```prisma
model Vehicle {
  id          String @id @default(cuid())
  name        String @unique
  model       String?
  plate       String? @unique
  year        Int?
  color       String?
  capacity    Int @default(5)
  fuelType    FuelType @default(GASOLINE)
  category    VehicleCategory @default(SEDAN)
  status      VehicleStatus @default(ACTIVE)
  mileage     Int @default(0)
  lastService DateTime?
  nextService DateTime?
  imageUrl    String?
  rents       VehicleRent[]
}

model VehicleRent {
  id            String @id @default(cuid())
  purpose       String
  startDate     DateTime
  endDate       DateTime
  status        VehicleRentStatus @default(PENDING)
  pickupLocation String?
  returnLocation String?
  estimatedCost Decimal @db.Decimal(10, 2)
  actualCost    Decimal? @db.Decimal(10, 2)
  odometerStart Int?
  odometerEnd   Int?
  fuelLevelStart FuelLevel?
  fuelLevelEnd   FuelLevel?
  userId        String
  vehicleId     String
  user          User @relation(fields: [userId], references: [id])
  vehicle       Vehicle @relation(fields: [vehicleId], references: [id])
}
```

## 🎨 Interface do Usuário

### **Página Principal**
```tsx
export default function CarsPage() {
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
  })

  const { data: vehicles } = trpc.vehicle.getAll.useQuery()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Frota de Veículos</h1>
        <Button>Solicitar Locação</Button>
      </div>

      <DateRangePicker
        value={selectedDateRange}
        onChange={setSelectedDateRange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles?.map(vehicle => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            dateRange={selectedDateRange}
          />
        ))}
      </div>
    </div>
  )
}
```

### **Card de Veículo**
```tsx
function VehicleCard({ vehicle, dateRange }) {
  const { data: availability } = trpc.vehicle.checkAvailability.useQuery({
    vehicleId: vehicle.id,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{vehicle.name}</h3>
            <p className="text-sm text-muted-foreground">{vehicle.model}</p>
            <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
          </div>
          <Badge variant={vehicle.status === 'ACTIVE' ? "default" : "secondary"}>
            {vehicle.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            <span>Capacidade: {vehicle.capacity} pessoas</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Fuel className="w-4 h-4" />
            <span>{vehicle.fuelType}</span>
          </div>
        </div>

        {availability?.available ? (
          <div className="space-y-2">
            <p className="text-sm">Custo estimado: R$ {availability.estimatedCost}</p>
            <Button className="w-full">Solicitar Locação</Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Indisponível</p>
        )}
      </CardContent>
    </Card>
  )
}
```

## ⚙️ Backend API

### **Vehicle Router**
```typescript
export const vehicleRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.vehicle.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: { rents: { where: { status: { in: ['APPROVED', 'IN_USE'] } } } }
        }
      }
    })
  }),

  checkAvailability: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ ctx, input }) => {
      const conflicts = await ctx.db.vehicleRent.findMany({
        where: {
          vehicleId: input.vehicleId,
          OR: [
            { startDate: { lte: input.endDate }, endDate: { gte: input.startDate } }
          ],
          status: { in: ['APPROVED', 'IN_USE'] }
        }
      })

      const estimatedCost = calculateRentalCost(input.vehicleId, input.startDate, input.endDate)

      return {
        available: conflicts.length === 0,
        estimatedCost,
        conflicts: conflicts.length
      }
    }),

  create: adminProcedure
    .input(createVehicleSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.vehicle.create({ data: input })
    })
})
```

### **Vehicle Rent Router**
```typescript
export const vehicleRentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createRentalSchema)
    .mutation(async ({ ctx, input }) => {
      const validation = await validateVehicleRental(input, ctx.user)
      if (!validation.isValid) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid rental' })
      }

      return ctx.db.vehicleRent.create({
        data: {
          ...input,
          userId: ctx.user.id,
          estimatedCost: validation.estimatedCost
        }
      })
    }),

  getMyRentals: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.vehicleRent.findMany({
      where: { userId: ctx.user.id },
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' }
    })
  }),

  startRental: protectedProcedure
    .input(z.object({
      id: z.string(),
      odometerStart: z.number(),
      fuelLevelStart: z.enum(['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL'])
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.vehicleRent.update({
        where: { id: input.id },
        data: {
          status: 'IN_USE',
          odometerStart: input.odometerStart,
          fuelLevelStart: input.fuelLevelStart
        }
      })
    }),

  returnVehicle: protectedProcedure
    .input(z.object({
      id: z.string(),
      odometerEnd: z.number(),
      fuelLevelEnd: z.enum(['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL'])
    }))
    .mutation(async ({ ctx, input }) => {
      const rental = await ctx.db.vehicleRent.findUnique({
        where: { id: input.id },
        include: { vehicle: true }
      })

      const actualCost = await calculateActualCost(rental, input)

      return ctx.db.vehicleRent.update({
        where: { id: input.id },
        data: {
          status: 'RETURNED',
          odometerEnd: input.odometerEnd,
          fuelLevelEnd: input.fuelLevelEnd,
          actualCost
        }
      })
    })
})
```

## 📊 Funcionalidades

### **Políticas de Locação**
- Duração mínima: 2 horas
- Duração máxima: 7 dias
- Antecedência máxima: 30 dias
- Limite mensal: 3 locações
- Aprovação para locações > 3 dias

### **Status das Locações**
- PENDING → APPROVED → IN_USE → RETURNED
- CANCELLED

### **Cálculo de Custos**
- Taxas por categoria (Compact: R$15/h, Sedan: R$20/h, SUV: R$35/h)
- Descontos para admins (10%) e empresa Box (5%)
- Penalidades por atraso e falta de combustível

### **Manutenção**
- Controle de quilometragem
- Alertas de manutenção preventiva
- Histórico de serviços
- Agendamento automático

## 📋 Checklist

- ✅ Gestão completa de frota
- ✅ Sistema de locações
- ✅ Controle de custos
- ✅ Manutenção preventiva
- ✅ Analytics de utilização
- ✅ Notificações automáticas
- ✅ Relatórios financeiros

---

**📅 Última atualização**: Dezembro 2024
**👥 Mantido por**: Equipe de Produto
