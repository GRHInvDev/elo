# ⚙️ Arquitetura Backend

## 📡 tRPC API Architecture

### 🏗️ **tRPC Router Structure**

```
src/server/
├── api/
│   └── root.ts                   # API root configuration
│
├── routers/
│   ├── birthday.ts               # Birthday management
│   ├── booking.ts                # Room/car bookings
│   ├── classification.ts         # Suggestion classification
│   ├── comment.ts                # Comments system
│   ├── event.ts                  # Events management
│   ├── flyer.ts                  # Flyers gallery
│   ├── food-order.ts             # Food ordering
│   ├── form-response.ts          # Form responses
│   ├── forms.ts                  # Dynamic forms
│   ├── kpi.ts                    # KPI management
│   ├── menu-item.ts              # Restaurant menus
│   ├── order-log.ts              # Order history
│   ├── post.ts                   # News posts
│   ├── product.ts                # Shop products
│   ├── reaction.ts               # Post reactions
│   ├── restaurant.ts             # Restaurant management
│   ├── room.ts                   # Room management
│   ├── suggestions.ts            # Suggestion system
│   ├── user.ts                   # User management
│   ├── vehicle-rent.ts           # Vehicle rentals
│   └── vehicle.ts                # Vehicle management
│
├── db.ts                        # Database connection
└── trpc.ts                      # tRPC configuration
```

### 🎯 **API Design Principles**

#### **1. Type Safety End-to-End**
```typescript
// src/server/routers/room.ts
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"

const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number(),
  description: z.string().optional(),
})

export const roomRouter = createTRPCRouter({
  // Query with input validation
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.room.findMany({
        orderBy: { name: 'asc' }
      })
    }),

  // Mutation with input/output validation
  create: protectedProcedure
    .input(roomSchema.omit({ id: true }))
    .output(roomSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.room.create({
        data: input
      })
    }),

  // Query with parameters
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.room.findUnique({
        where: { id: input.id }
      })
    })
})
```

#### **2. Middleware Architecture**
```typescript
// src/server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server"
import { type CreateNextContextOptions } from "@trpc/server/adapters/next"
import { getAuth } from "@clerk/nextjs/server"

export const createTRPCContext = async (opts?: CreateNextContextOptions) => {
  const { req, res } = opts || {}

  const auth = getAuth(req!)

  const userId = auth?.userId

  return {
    req,
    res,
    db: prisma,
    auth,
    userId,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create()

// Base procedures
export const router = t.router
export const publicProcedure = t.procedure

// Authenticated procedure
export const protectedProcedure = t.procedure.use(
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

// Admin procedure
export const adminProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (ctx.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" })
    }

    return next()
  })
)
```

#### **3. Error Handling Strategy**
```typescript
// src/server/routers/error-handling.ts
import { TRPCError } from "@trpc/server"

export const errorHandler = (error: unknown) => {
  if (error instanceof TRPCError) {
    return error
  }

  // Log unexpected errors
  console.error("Unexpected error:", error)

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong",
  })
}

// Usage in procedures
export const safeProcedure = publicProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    try {
      return await next()
    } catch (error) {
      throw errorHandler(error)
    }
  })
)
```

## 🗄️ Database Layer (Prisma)

### 📊 **Prisma Architecture**

#### **Schema Design**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String             @id
  email            String             @unique
  firstName        String?
  lastName         String?
  imageUrl         String?
  role             UserRole           @default(USER)
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  enterprise       Enterprise         @default(NA)
  setor            String?            @db.VarChar

  // Relations
  comments         Coment[]
  reactions        Reaction[]
  birthDay         Birthday?
  bookings         Booking[]
  events           Event[]
  flyers           Flyer[]
  foodOrders       FoodOrder[]
  forms            Form[]
  formResponses    FormResponse[]
  posts            Post[]
  vehicleRents     VehicleRent[]
  authoredSuggestions Suggestion[] @relation("SuggestionAuthor")
  analyzedSuggestions Suggestion[] @relation("SuggestionAnalyst")

  @@map("users")
}

model Room {
  id          String    @id @default(cuid())
  name        String
  description String?
  capacity    Int
  isActive    Boolean   @default(true)

  // Relations
  bookings    Booking[]

  @@map("rooms")
}

enum UserRole {
  USER
  ADMIN
  TOTEM
}

enum Enterprise {
  NA
  Box
  RHenz
  Cristallux
  Box_Distribuidor          @map("Box Distribuidor")
  Box_Distribuidor___Filial @map("Box Distribuidor - Filial")
}
```

#### **Database Connection**
```typescript
// src/server/db.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

#### **Repository Pattern**
```typescript
// src/server/repositories/room.repository.ts
import { Prisma, Room } from "@prisma/client"
import { prisma } from "@/server/db"

export class RoomRepository {
  async findAll(): Promise<Room[]> {
    return prisma.room.findMany({
      orderBy: { name: "asc" },
    })
  }

  async findById(id: string): Promise<Room | null> {
    return prisma.room.findUnique({
      where: { id },
    })
  }

  async findAvailable(date: Date): Promise<Room[]> {
    return prisma.room.findMany({
      where: {
        isActive: true,
        bookings: {
          none: {
            date: {
              equals: date,
            },
          },
        },
      },
    })
  }

  async create(data: Prisma.RoomCreateInput): Promise<Room> {
    return prisma.room.create({ data })
  }

  async update(id: string, data: Prisma.RoomUpdateInput): Promise<Room> {
    return prisma.room.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<Room> {
    return prisma.room.delete({
      where: { id },
    })
  }
}
```

## 🎯 Service Layer Architecture

### 💼 **Business Logic Organization**

#### **Service Classes**
```typescript
// src/server/services/room.service.ts
import { RoomRepository } from "@/server/repositories/room.repository"
import { TRPCError } from "@trpc/server"

export interface BookRoomData {
  roomId: string
  userId: string
  date: Date
  purpose: string
}

export class RoomService {
  constructor(private roomRepository: RoomRepository) {}

  async getAvailableRooms(date: Date) {
    return this.roomRepository.findAvailable(date)
  }

  async bookRoom(data: BookRoomData) {
    // Check if room exists
    const room = await this.roomRepository.findById(data.roomId)
    if (!room) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Room not found",
      })
    }

    // Check if room is available
    const availableRooms = await this.getAvailableRooms(data.date)
    const isAvailable = availableRooms.some((r) => r.id === data.roomId)

    if (!isAvailable) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Room is already booked for this date",
      })
    }

    // Create booking (assuming Booking model exists)
    return prisma.booking.create({
      data: {
        roomId: data.roomId,
        userId: data.userId,
        date: data.date,
        purpose: data.purpose,
      },
    })
  }

  async getRoomBookings(roomId: string) {
    return prisma.booking.findMany({
      where: { roomId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { date: "asc" },
    })
  }
}
```

#### **Dependency Injection**
```typescript
// src/server/services/service-container.ts
import { RoomRepository } from "@/server/repositories/room.repository"
import { RoomService } from "@/server/services/room.service"

// Service container for dependency injection
export class ServiceContainer {
  private static instance: ServiceContainer

  private roomRepository: RoomRepository
  private roomService: RoomService

  private constructor() {
    this.roomRepository = new RoomRepository()
    this.roomService = new RoomService(this.roomRepository)
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
    }
    return ServiceContainer.instance
  }

  public getRoomService(): RoomService {
    return this.roomService
  }

  public getRoomRepository(): RoomRepository {
    return this.roomRepository
  }
}
```

## 🔒 Authentication & Authorization

### 🎫 **Clerk Integration**

#### **Middleware Configuration**
```typescript
// src/server/middlewares/auth.middleware.ts
import { getAuth } from "@clerk/nextjs/server"
import { TRPCError } from "@trpc/server"

export const authMiddleware = async (req: any) => {
  const auth = getAuth(req)

  if (!auth?.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    })
  }

  return {
    userId: auth.userId,
    user: auth.user,
  }
}
```

#### **Role-Based Authorization**
```typescript
// src/server/middlewares/role.middleware.ts
import { TRPCError } from "@trpc/server"

export const requireRole = (requiredRole: UserRole) => {
  return async ({ ctx, next }: any) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      })
    }

    if (ctx.user.role !== requiredRole && ctx.user.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      })
    }

    return next()
  }
}
```

## 📊 Data Validation & Transformation

### ✅ **Input Validation with Zod**

#### **Schema Definitions**
```typescript
// src/server/schemas/room.schema.ts
import { z } from "zod"

export const roomCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  capacity: z.number().int().min(1).max(50),
  isActive: z.boolean().default(true),
})

export const roomUpdateSchema = roomCreateSchema.partial()

export const roomQuerySchema = z.object({
  id: z.string().cuid(),
})

export const roomListSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
})
```

#### **Validation Middleware**
```typescript
// src/server/middlewares/validation.middleware.ts
import { z } from "zod"
import { TRPCError } from "@trpc/server"

export const validateInput = <T extends z.ZodTypeAny>(schema: T) => {
  return async ({ input, next }: any) => {
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
  }
}
```

## 🔄 Database Migrations

### 📈 **Migration Strategy**

#### **Creating Migrations**
```bash
# Create new migration
npx prisma migrate dev --name add_room_capacity

# Apply migrations to database
npx prisma db push

# Reset database (development only)
npx prisma migrate reset
```

#### **Migration Files**
```sql
-- prisma/migrations/20240101000000_add_room_capacity/migration.sql

-- Add capacity column to rooms table
ALTER TABLE "rooms" ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 10;

-- Add check constraint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_capacity_check"
  CHECK ("capacity" >= 1 AND "capacity" <= 50);
```

#### **Migration Best Practices**
```typescript
// prisma/migrations/migration.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Migration logic here
  await prisma.$executeRaw`
    UPDATE "rooms"
    SET "capacity" = 10
    WHERE "capacity" IS NULL
  `
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## 📊 Performance Optimization

### ⚡ **Database Optimization**

#### **Indexing Strategy**
```sql
-- Create indexes for common queries
CREATE INDEX idx_rooms_is_active ON "rooms"("is_active");
CREATE INDEX idx_bookings_date ON "bookings"("date");
CREATE INDEX idx_bookings_user_id ON "bookings"("user_id");
CREATE INDEX idx_users_enterprise ON "users"("enterprise");
```

#### **Query Optimization**
```typescript
// Optimized query with select and include
const optimizedQuery = await prisma.room.findMany({
  select: {
    id: true,
    name: true,
    capacity: true,
    _count: {
      select: {
        bookings: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    },
  },
  where: {
    isActive: true,
  },
})
```

#### **Connection Pooling**
```typescript
// src/server/db.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration
  log: process.env.NODE_ENV === "development" ? ["query"] : [],
})
```

## 🛡️ Security Implementation

### 🔐 **SQL Injection Prevention**
```typescript
// ✅ Safe parameterized query
const safeQuery = await prisma.user.findMany({
  where: {
    email: email, // Automatically parameterized
  },
})

// ❌ Unsafe raw query (never do this)
const unsafeQuery = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = '${email}'
`
```

### 🛡️ **Rate Limiting**
```typescript
// src/server/middlewares/rate-limit.middleware.ts
import { TRPCError } from "@trpc/server"

const requests = new Map<string, number[]>()

export const rateLimitMiddleware = (limit: number, windowMs: number) => {
  return async ({ ctx, next }: any) => {
    const key = ctx.req?.ip || ctx.userId || "anonymous"
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing requests for this key
    const userRequests = requests.get(key) || []

    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      (timestamp) => timestamp > windowStart
    )

    if (validRequests.length >= limit) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      })
    }

    // Add current request
    validRequests.push(now)
    requests.set(key, validRequests)

    return next()
  }
}
```

## 📋 API Documentation

### 📚 **Auto-generated Documentation**

#### **tRPC Panel**
```typescript
// src/app/api/trpc/[trpc]/route.ts
import { appRouter } from "@/server/api/root"
import { createNextApiHandler } from "@trpc/server/adapters/next"

export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    process.env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(`❌ tRPC failed on ${path}:`, error)
        }
      : undefined,
})
```

#### **OpenAPI/Swagger Generation**
```typescript
// src/server/openapi.ts
import { generateOpenApiDocument } from "trpc-openapi"
import { appRouter } from "./api/root"

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Intranet ELO API",
  version: "1.0.0",
  baseUrl: "http://localhost:3000/api/trpc",
})
```

## 🧪 Testing Strategy

### 🧪 **Unit Tests**
```typescript
// src/server/tests/room.service.test.ts
import { RoomService } from "@/server/services/room.service"
import { mockRoomRepository } from "@/server/tests/mocks"

describe("RoomService", () => {
  let roomService: RoomService

  beforeEach(() => {
    roomService = new RoomService(mockRoomRepository)
  })

  describe("bookRoom", () => {
    it("should book a room successfully", async () => {
      const bookingData = {
        roomId: "room-1",
        userId: "user-1",
        date: new Date(),
        purpose: "Meeting",
      }

      const result = await roomService.bookRoom(bookingData)

      expect(result).toBeDefined()
      expect(result.roomId).toBe(bookingData.roomId)
    })

    it("should throw error for non-existent room", async () => {
      const bookingData = {
        roomId: "non-existent",
        userId: "user-1",
        date: new Date(),
        purpose: "Meeting",
      }

      await expect(roomService.bookRoom(bookingData)).rejects.toThrow(
        "Room not found"
      )
    })
  })
})
```

### 🧪 **Integration Tests**
```typescript
// src/server/tests/integration/room.integration.test.ts
import { createTRPCMsw } from "msw-trpc"
import { appRouter } from "@/server/api/root"

describe("Room Integration", () => {
  const msw = createTRPCMsw({
    router: appRouter,
  })

  beforeEach(() => {
    msw.start()
  })

  afterEach(() => {
    msw.stop()
  })

  it("should create and retrieve a room", async () => {
    // Mock the database
    msw.handlers.room.create.mockResolvedValue({
      id: "room-1",
      name: "Conference Room A",
      capacity: 10,
    })

    // Test the API
    const caller = appRouter.createCaller({})
    const room = await caller.room.create({
      name: "Conference Room A",
      capacity: 10,
    })

    expect(room.name).toBe("Conference Room A")
  })
})
```

## 📊 Monitoring & Logging

### 📈 **Performance Monitoring**
```typescript
// src/server/middlewares/performance.middleware.ts
import { TRPCError } from "@trpc/server"

export const performanceMiddleware = async ({ path, type, next }: any) => {
  const start = Date.now()

  try {
    const result = await next()

    const duration = Date.now() - start
    console.log(`✅ ${path} (${type}) - ${duration}ms`)

    // Log slow queries
    if (duration > 1000) {
      console.warn(`⚠️ Slow query: ${path} took ${duration}ms`)
    }

    return result
  } catch (error) {
    const duration = Date.now() - start
    console.error(`❌ ${path} (${type}) - ${duration}ms - Error:`, error)

    throw error
  }
}
```

### 📊 **Error Monitoring**
```typescript
// src/server/middlewares/error.middleware.ts
import { TRPCError } from "@trpc/server"

export const errorMonitoringMiddleware = async ({ path, next }: any) => {
  try {
    return await next()
  } catch (error) {
    // Log error details
    console.error(`Error in ${path}:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })

    // Send to monitoring service (e.g., Sentry)
    // captureException(error)

    throw error
  }
}
```

## 🚀 Deployment & Production

### 🐳 **Docker Configuration**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 🚀 **Production Configuration**
```typescript
// src/server/production.ts
export const productionConfig = {
  // Enable query logging in production for monitoring
  prisma: {
    log: ["error", "warn"],
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // Error handling
  errorHandling: {
    includeStackTrace: false,
    logErrors: true,
  },

  // Caching
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
  },
}
```

## 📋 Best Practices Implemented

### 🏗️ **Architecture**
- ✅ **Layered Architecture** - Clear separation of concerns
- ✅ **Repository Pattern** - Data access abstraction
- ✅ **Service Layer** - Business logic isolation
- ✅ **Middleware Pattern** - Cross-cutting concerns

### 🔒 **Security**
- ✅ **Type Safety** - End-to-end type validation
- ✅ **Authentication** - Clerk.js integration
- ✅ **Authorization** - Role-based access control
- ✅ **Input Validation** - Zod schema validation

### ⚡ **Performance**
- ✅ **Database Optimization** - Proper indexing
- ✅ **Connection Pooling** - Efficient database connections
- ✅ **Caching Strategy** - Smart data caching
- ✅ **Query Optimization** - Efficient database queries

### 🧪 **Quality**
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Logging** - Detailed operation logging
- ✅ **Testing** - Unit and integration tests
- ✅ **Documentation** - Auto-generated API docs

### 📊 **Monitoring**
- ✅ **Performance Monitoring** - Query timing
- ✅ **Error Tracking** - Exception logging
- ✅ **Rate Limiting** - API abuse protection
- ✅ **Health Checks** - System monitoring

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe Backend

