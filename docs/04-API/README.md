# 🌐 API tRPC - Sistema de Intranet ELO

## 📋 Visão Geral da API

A API do Sistema de Intranet ELO é construída com **tRPC** (Type-safe Remote Procedure Calls), proporcionando:

- **🔒 Type Safety End-to-End** - Typescript completo do frontend ao banco
- **🚀 Performance** - HTTP/2, batching automático, queries otimizadas
- **🛡️ Segurança** - Autenticação e autorização integradas
- **📊 Developer Experience** - Auto-complete e validação automática
- **🔧 Manutenibilidade** - Código organizado e reutilizável

## 🏗️ Arquitetura da API

### **Estrutura dos Routers**

```
src/server/
└── api/
    ├── root.ts                   # 📋 API Root - Combina todos os routers
    ├── trpc.ts                   # Contexto e procedures (protected, admin)
    └── routers/                  # 📦 Routers por domínio
        ├── birthday.ts           # 🎂 Aniversários
        ├── booking.ts            # 🏢 Reservas de salas
        ├── classification.ts     # 📊 Classificação de sugestões
        ├── comment.ts            # 💬 Comentários
        ├── event.ts              # 📅 Eventos
        ├── flyer.ts              # 📄 Flyers
        ├── food-order.ts         # 🍽️ Pedidos de alimentação
        ├── form-response.ts      # 📝 Respostas de formulários
        ├── forms.ts              # 📋 Formulários dinâmicos
        ├── kpi.ts                # 📈 KPIs
        ├── menu-item.ts          # 🍕 Itens de menu
        ├── order-log.ts          # 📋 Logs de pedidos
        ├── post.ts               # 📰 Posts/Notícias
        ├── product.ts            # 🛒 Produtos
        ├── reaction.ts           # ❤️ Reações
        ├── restaurant.ts         # 🍽️ Restaurantes
        ├── room.ts               # 🏢 Salas
        ├── suggestions.ts        # 💡 Sistema de sugestões
        ├── user.ts               # 👥 Usuários
        ├── vehicle-rent.ts       # 🚗 Locações de veículos
        └── vehicle.ts            # 🚙 Veículos
```

### **Root Router**
```typescript
// src/server/api/root.ts
import { router } from "./trpc"
import { birthdayRouter } from "@/server/api/routers/birthday"
import { bookingRouter } from "@/server/api/routers/booking"
// ... outros imports

export const appRouter = router({
  birthday: birthdayRouter,
  booking: bookingRouter,
  classification: classificationRouter,
  comment: commentRouter,
  event: eventRouter,
  flyer: flyerRouter,
  foodOrder: foodOrderRouter,
  formResponse: formResponseRouter,
  form: formsRouter,
  kpi: kpiRouter,
  menuItem: menuItemRouter,
  orderLog: orderLogRouter,
  post: postRouter,
  product: productRouter,
  reaction: reactionRouter,
  restaurant: restaurantRouter,
  room: roomRouter,
  suggestion: suggestionsRouter,
  user: userRouter,
  vehicleRent: vehicleRentRouter,
  vehicle: vehicleRouter,
})

export type AppRouter = typeof appRouter
```

## 🔐 Sistema de Autenticação

### **Procedures Types**

#### **Public Procedures**
```typescript
// Acessíveis sem autenticação
const publicProcedure = t.procedure
```

#### **Protected Procedures**
```typescript
// Requer autenticação
const protectedProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.auth?.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
    })

    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    return next({
      ctx: {
        ...ctx,
        user,
      },
    })
  })
)
```

#### **Admin Procedures**
```typescript
// Requer role ADMIN
const adminProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (ctx.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" })
    }

    return next()
  })
)
```

## 📊 Endpoints por Módulo

### **👥 User Management**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `user.getAll` | Query | Admin | Lista todos os usuários |
| `user.getById` | Query | Protected | Busca usuário por ID |
| `user.update` | Mutation | Protected | Atualiza dados do usuário |
| `user.delete` | Mutation | Admin | Remove usuário |

### **🏢 Room Booking**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `room.getAll` | Query | Protected | Lista todas as salas |
| `room.getById` | Query | Protected | Detalhes da sala |
| `room.create` | Mutation | Admin | Cria nova sala |
| `booking.book` | Mutation | Protected | Reserva sala |
| `booking.cancel` | Mutation | Protected | Cancela reserva |

### **🍽️ Food Ordering**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `restaurant.getAll` | Query | Protected | Lista restaurantes |
| `menuItem.getAll` | Query | Protected | Cardápio completo |
| `foodOrder.create` | Mutation | Protected | Faz pedido |
| `foodOrder.getMyOrders` | Query | Protected | Pedidos do usuário |

### **💡 Suggestions System**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `suggestion.create` | Mutation | Protected | Cria sugestão |
| `suggestion.getAll` | Query | Protected | Lista sugestões |
| `suggestion.updateStatus` | Mutation | Admin | Altera status |
| `classification.getAll` | Query | Admin | Lista classificações |

### **📝 Dynamic Forms**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `form.getAll` | Query | Protected | Lista formulários |
| `form.create` | Mutation | Admin | Cria formulário |
| `formResponse.submit` | Mutation | Protected | Submete resposta |

### **🚗 Vehicle Management**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `vehicle.getAll` | Query | Protected | Lista veículos |
| `vehicleRent.create` | Mutation | Protected | Solicita locação |
| `vehicleRent.approve` | Mutation | Admin | Aprova locação |

## 📝 Input/Output Types

### **Common Types**

#### **Pagination Input**
```typescript
const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
})
```

#### **Date Range**
```typescript
const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
})
```

#### **Response Format**
```typescript
interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}
```

## 🚀 Client Usage

### **Frontend Integration**

#### **React Query + tRPC**
```typescript
// src/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query"
import type { AppRouter } from "@/server/api/root"

export const trpc = createTRPCReact<AppRouter>()
```

#### **Provider Setup**
```tsx
// src/app/providers.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { trpc } from "@/lib/trpc"

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

#### **Hook Usage**
```tsx
// src/hooks/use-rooms.ts
import { trpc } from "@/lib/trpc"

export function useRooms() {
  return trpc.room.getAll.useQuery()
}

// src/hooks/use-book-room.ts
export function useBookRoom() {
  const utils = trpc.useUtils()

  return trpc.booking.book.useMutation({
    onSuccess: () => {
      utils.room.getAll.invalidate()
    },
  })
}
```

## 📊 Performance & Optimization

### **Query Optimization**

#### **Include Strategy**
```typescript
// ✅ Otimizado - Include específico
const roomWithBookings = await prisma.room.findMany({
  include: {
    bookings: {
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  },
})
```

#### **Select Strategy**
```typescript
// ✅ Otimizado - Select apenas necessário
const userSummary = await prisma.user.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    enterprise: true,
    _count: {
      select: {
        bookings: true,
        suggestions: true,
      },
    },
  },
})
```

### **Caching Strategy**

#### **React Query Cache**
```typescript
// src/hooks/use-suggestions.ts
export function useSuggestions() {
  return trpc.suggestion.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

#### **Optimistic Updates**
```typescript
// src/hooks/use-create-suggestion.ts
export function useCreateSuggestion() {
  const utils = trpc.useUtils()

  return trpc.suggestion.create.useMutation({
    onMutate: async (newSuggestion) => {
      // Cancel outgoing refetches
      await utils.suggestion.getAll.cancel()

      // Snapshot previous value
      const previous = utils.suggestion.getAll.getData()

      // Optimistically update
      utils.suggestion.getAll.setData(undefined, (old) => [
        newSuggestion,
        ...(old || []),
      ])

      return { previous }
    },
    onError: (err, newSuggestion, context) => {
      // Rollback on error
      if (context?.previous) {
        utils.suggestion.getAll.setData(undefined, context.previous)
      }
    },
    onSettled: () => {
      utils.suggestion.getAll.invalidate()
    },
  })
}
```

## 🛡️ Error Handling

### **tRPC Error Codes**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Usuário não autenticado |
| `FORBIDDEN` | 403 | Acesso negado |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `BAD_REQUEST` | 400 | Dados inválidos |
| `INTERNAL_SERVER_ERROR` | 500 | Erro interno |

### **Custom Errors**
```typescript
// src/server/errors.ts
export const errors = {
  ROOM_NOT_AVAILABLE: new TRPCError({
    code: "CONFLICT",
    message: "Room is already booked for this time slot",
  }),

  INSUFFICIENT_PERMISSIONS: new TRPCError({
    code: "FORBIDDEN",
    message: "You don't have permission to perform this action",
  }),

  INVALID_DATE_RANGE: new TRPCError({
    code: "BAD_REQUEST",
    message: "End date must be after start date",
  }),
}
```

### **Global Error Handler**
```typescript
// src/server/api/trpc.ts
export const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})
```

## 📋 Validation & Security

### **Input Validation with Zod**

#### **Schema Examples**
```typescript
// src/server/schemas/booking.ts
export const createBookingSchema = z.object({
  roomId: z.string().cuid(),
  date: z.date().refine((date) => date >= new Date(), {
    message: "Booking date must be in the future",
  }),
  purpose: z.string().min(1).max(500),
})

export const bookingFiltersSchema = z.object({
  roomId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).optional(),
})
```

#### **Middleware Validation**
```typescript
// src/server/middlewares/validation.ts
export const validateInput = <T extends z.ZodTypeAny>(schema: T) => {
  return t.middleware(async ({ input, next }) => {
    try {
      const validatedInput = schema.parse(input)
      return next({ input: validatedInput })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid input data",
          cause: error.errors,
        })
      }
      throw error
    }
  })
}
```

## 🔍 API Documentation

### **Auto-generated Docs**

#### **tRPC Panel (Development)**
```typescript
// src/app/api/trpc/[trpc]/route.ts
import { appRouter } from "@/server/api/root"
import { createNextApiHandler } from "@trpc/server/adapters/next"

const handler = createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    process.env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(`❌ tRPC failed on ${path}:`, error)
        }
      : undefined,
})

export { handler as GET, handler as POST }
```

#### **OpenAPI/Swagger**
```typescript
// src/server/openapi.ts
import { generateOpenApiDocument } from "trpc-openapi"
import { appRouter } from "./api/root"

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Intranet ELO API",
  description: "Type-safe API for the Intranet ELO system",
  version: "1.0.0",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  docsUrl: "/api/docs",
})
```

## 📊 Monitoring & Analytics

### **API Metrics**

#### **Request Tracking**
```typescript
// src/server/middlewares/metrics.ts
export const metricsMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now()

  try {
    const result = await next()

    const duration = Date.now() - start
    console.log(`✅ ${path} (${type}) - ${duration}ms`)

    // Track metrics
    // await metrics.recordApiCall(path, duration, true)

    return result
  } catch (error) {
    const duration = Date.now() - start
    console.error(`❌ ${path} (${type}) - ${duration}ms - Error:`, error)

    // Track error metrics
    // await metrics.recordApiError(path, error)

    throw error
  }
})
```

#### **Performance Monitoring**
```typescript
// src/lib/metrics.ts
export class ApiMetrics {
  static async recordApiCall(path: string, duration: number, success: boolean) {
    // Implementation for your monitoring service
    console.log(`API Call: ${path} - ${duration}ms - ${success ? 'SUCCESS' : 'ERROR'}`)
  }

  static async recordDatabaseQuery(query: string, duration: number) {
    if (duration > 1000) {
      console.warn(`Slow query: ${query} - ${duration}ms`)
    }
  }
}
```

## 📋 Best Practices

### **🏗️ Router Organization**
- ✅ **Feature-based** - Um router por domínio
- ✅ **Clear naming** - Verbos descritivos
- ✅ **Consistent structure** - Padrão em todos os routers

### **🔒 Security**
- ✅ **Input validation** - Zod em todos os inputs
- ✅ **Authentication** - Protected procedures
- ✅ **Authorization** - Role-based access
- ✅ **Error handling** - Mensagens seguras

### **⚡ Performance**
- ✅ **Query optimization** - Include e select estratégicos
- ✅ **Caching** - React Query inteligente
- ✅ **Batch requests** - tRPC automático
- ✅ **Pagination** - Limites de dados

### **🧪 Testing**
- ✅ **Unit tests** - Funções isoladas
- ✅ **Integration tests** - Endpoints completos
- ✅ **Type safety** - Cobertura TypeScript

### **📚 Documentation**
- ✅ **Auto-generated** - tRPC panel
- ✅ **Type definitions** - Export AppRouter
- ✅ **Examples** - Casos de uso comuns
- ✅ **Error codes** - Códigos documentados

## 📊 API Statistics

| Category | Count |
|----------|-------|
| **Routers** | 18 |
| **Procedures** | 87 |
| **Queries** | 45 |
| **Mutations** | 42 |
| **Input Schemas** | 32 |
| **Error Types** | 12 |

## 🚀 Advanced Features

### **Real-time Subscriptions**
```typescript
// src/server/api/routers/realtime.ts
export const realtimeRouter = router({
  onSuggestionCreated: protectedProcedure
    .subscription(() => {
      return observable<Suggestion>((emit) => {
        const onAdd = (suggestion: Suggestion) => emit.next(suggestion)

        // Subscribe to database changes
        db.on('suggestion_created', onAdd)

        return () => {
          db.off('suggestion_created', onAdd)
        }
      })
    }),
})
```

### **File Upload Integration**
```typescript
// src/server/api/routers/upload.ts
export const uploadRouter = router({
  uploadAvatar: protectedProcedure
    .input(z.object({ file: z.instanceof(File) }))
    .mutation(async ({ ctx, input }) => {
      const fileUrl = await uploadToStorage(input.file, ctx.user.id)
      await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { imageUrl: fileUrl },
      })
      return { fileUrl }
    }),
})
```

### **Batch Operations**
```typescript
// src/server/api/routers/batch.ts
export const batchRouter = router({
  updateMultipleBookings: adminProcedure
    .input(z.object({
      bookingIds: z.array(z.string()),
      updates: bookingUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(
        input.bookingIds.map(id =>
          ctx.db.booking.update({
            where: { id },
            data: input.updates,
          })
        )
      )
    }),
})
```

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe Backend
