# 🛡️ Middlewares & Security

## 📋 Sistema de Middlewares

Os middlewares do Sistema de Intranet ELO garantem segurança, performance e consistência em todas as operações da API.

## 🔐 **Authentication Middleware**

### **Core Auth Middleware**
```typescript
// src/server/middlewares/auth.middleware.ts
import { TRPCError } from "@trpc/server"
import { getAuth } from "@clerk/nextjs/server"

export const authMiddleware = async (opts: any) => {
  const { ctx } = opts

  try {
    const auth = getAuth(ctx.req)

    if (!auth?.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      })
    }

    // Get user from database
    const user = await ctx.db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        enterprise: true,
        setor: true,
      },
    })

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found in database",
      })
    }

    return opts.next({
      ctx: {
        ...ctx,
        user,
        auth,
      },
    })
  } catch (error) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication failed",
    })
  }
}
```

### **Role-Based Access Control**
```typescript
// src/server/middlewares/role.middleware.ts
import { TRPCError } from "@trpc/server"

export const requireRole = (requiredRole: UserRole) => {
  return async (opts: any) => {
    const { ctx } = opts

    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      })
    }

    const hasAccess = ctx.user.role === requiredRole ||
                     ctx.user.role === "ADMIN" ||
                     checkRoleHierarchy(ctx.user.role, requiredRole)

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Access denied. Required role: ${requiredRole}`,
      })
    }

    return opts.next()
  }
}

function checkRoleHierarchy(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy = {
    USER: 1,
    MODERATOR: 2,
    ADMIN: 3,
  }

  return hierarchy[userRole] >= hierarchy[requiredRole]
}
```

### **Enterprise-Based Access**
```typescript
// src/server/middlewares/enterprise.middleware.ts
export const requireEnterprise = (allowedEnterprises: Enterprise[]) => {
  return async (opts: any) => {
    const { ctx } = opts

    if (!ctx.user?.enterprise) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Enterprise access required",
      })
    }

    if (!allowedEnterprises.includes(ctx.user.enterprise)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Access restricted to: ${allowedEnterprises.join(', ')}`,
      })
    }

    return opts.next()
  }
}
```

## ✅ **Validation Middleware**

### **Input Validation with Zod**
```typescript
// src/server/middlewares/validation.middleware.ts
import { z } from "zod"
import { TRPCError } from "@trpc/server"

export const validateInput = <T extends z.ZodTypeAny>(schema: T) => {
  return async (opts: any) => {
    const { input } = opts

    try {
      const validatedInput = schema.parse(input)
      return opts.next({
        ...opts,
        input: validatedInput,
      })
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

### **Common Validation Schemas**
```typescript
// src/server/schemas/common.ts
import { z } from "zod"

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

// ID validation
export const idSchema = z.object({
  id: z.string().cuid("Invalid ID format"),
})

export const idsSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(50),
})
```

## ⚡ **Performance Middleware**

### **Caching Middleware**
```typescript
// src/server/middlewares/cache.middleware.ts
import { Cache } from "@/lib/cache"

export const withCache = (keyPrefix: string, ttlSeconds: number = 300) => {
  return async (opts: any) => {
    const cacheKey = `${keyPrefix}:${JSON.stringify(opts.input)}`

    // Try to get from cache
    const cached = await Cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Execute procedure
    const result = await opts.next()

    // Cache the result
    await Cache.set(cacheKey, result, ttlSeconds)

    return result
  }
}
```

### **Rate Limiting Middleware**
```typescript
// src/server/middlewares/rate-limit.middleware.ts
import { TRPCError } from "@trpc/server"
import { rateLimiter } from "@/lib/rate-limit"

export const rateLimit = (options: {
  limit: number
  windowMs: number
  keyGenerator?: (opts: any) => string
}) => {
  return async (opts: any) => {
    const key = options.keyGenerator
      ? options.keyGenerator(opts)
      : opts.ctx.req?.ip || opts.ctx.user?.id || 'anonymous'

    const result = await rateLimiter.limit(key, options.limit, options.windowMs)

    if (!result.success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${Math.ceil(result.resetInMs / 1000)} seconds.`,
      })
    }

    return opts.next({
      ctx: {
        ...opts.ctx,
        rateLimit: {
          remaining: result.remaining,
          resetIn: result.resetInMs,
        },
      },
    })
  }
}
```

### **Query Optimization Middleware**
```typescript
// src/server/middlewares/optimization.middleware.ts
export const optimizeQuery = () => {
  return async (opts: any) => {
    const start = Date.now()
    const result = await opts.next()
    const duration = Date.now() - start

    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query: ${opts.path} took ${duration}ms`, {
        input: opts.input,
        user: opts.ctx.user?.id,
        timestamp: new Date().toISOString(),
      })
    }

    // Add performance metadata
    if (opts.ctx.user?.role === 'ADMIN') {
      return {
        ...result,
        _meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      }
    }

    return result
  }
}
```

## 📊 **Logging Middleware**

### **Request Logging**
```typescript
// src/server/middlewares/logging.middleware.ts
import { logger } from "@/lib/logger"

export const requestLogger = () => {
  return async (opts: any) => {
    const { path, type, input } = opts
    const userId = opts.ctx.user?.id || 'anonymous'
    const userAgent = opts.ctx.req?.headers?.['user-agent'] || 'unknown'

    logger.info(`API Request: ${path}`, {
      path,
      type,
      userId,
      userAgent,
      input: JSON.stringify(input).substring(0, 500), // Limit input size
      timestamp: new Date().toISOString(),
    })

    try {
      const result = await opts.next()

      logger.info(`API Response: ${path}`, {
        path,
        type,
        userId,
        success: true,
        timestamp: new Date().toISOString(),
      })

      return result
    } catch (error) {
      logger.error(`API Error: ${path}`, {
        path,
        type,
        userId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })

      throw error
    }
  }
}
```

### **Audit Logging**
```typescript
// src/server/middlewares/audit.middleware.ts
export const auditLogger = (actions: string[]) => {
  return async (opts: any) => {
    const result = await opts.next()

    // Log specific actions
    if (actions.includes(opts.path)) {
      await prisma.auditLog.create({
        data: {
          userId: opts.ctx.user?.id,
          action: opts.path,
          input: opts.input,
          timestamp: new Date(),
          ipAddress: opts.ctx.req?.ip,
          userAgent: opts.ctx.req?.headers?.['user-agent'],
        },
      })
    }

    return result
  }
}
```

## 🛡️ **Security Middleware**

### **Input Sanitization**
```typescript
// src/server/middlewares/security.middleware.ts
import DOMPurify from 'isomorphic-dompurify'

export const sanitizeInput = (fields: string[]) => {
  return async (opts: any) => {
    const input = { ...opts.input }

    // Sanitize HTML fields
    for (const field of fields) {
      if (input[field] && typeof input[field] === 'string') {
        input[field] = DOMPurify.sanitize(input[field])
      }
    }

    // Remove potential XSS patterns
    Object.keys(input).forEach(key => {
      if (typeof input[key] === 'string') {
        input[key] = input[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+="[^"]*"/gi, '')
      }
    })

    return opts.next({
      ...opts,
      input,
    })
  }
}
```

### **SQL Injection Prevention**
```typescript
// src/server/middlewares/sql-injection.middleware.ts
export const preventSQLInjection = () => {
  return async (opts: any) => {
    const input = { ...opts.input }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(union|select|insert|delete|update|drop|create|alter)\b)/gi,
      /('|(\\x27)|(\\x2D\\x2D)|(\-\-)|(#))/gi,
      /((\%3D)|(=))[^\n]*((\%27)|(\\x27)|('|(\\x22)|(\\x22)))/gi,
    ]

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        for (const pattern of sqlPatterns) {
          if (pattern.test(value)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Invalid input detected in field: ${key}`,
            })
          }
        }
      }
    }

    return opts.next({
      ...opts,
      input,
    })
  }
}
```

## 🔄 **Transaction Middleware**

### **Database Transaction Wrapper**
```typescript
// src/server/middlewares/transaction.middleware.ts
export const withTransaction = () => {
  return async (opts: any) => {
    return opts.ctx.db.$transaction(async (tx) => {
      return opts.next({
        ...opts,
        ctx: {
          ...opts.ctx,
          db: tx,
        },
      })
    })
  }
}
```

### **Conditional Transaction**
```typescript
// src/server/middlewares/conditional-transaction.middleware.ts
export const conditionalTransaction = (condition: (opts: any) => boolean) => {
  return async (opts: any) => {
    if (condition(opts)) {
      return opts.ctx.db.$transaction(async (tx) => {
        return opts.next({
          ...opts,
          ctx: {
            ...opts.ctx,
            db: tx,
          },
        })
      })
    }

    return opts.next()
  }
}
```

## 📋 **Custom Business Logic Middleware**

### **Booking Validation**
```typescript
// src/server/middlewares/booking.middleware.ts
export const validateBookingRules = () => {
  return async (opts: any) => {
    const { input } = opts

    // Check if it's a booking operation
    if (opts.path.includes('booking')) {
      // Validate business hours
      const bookingDate = new Date(input.date)
      const hour = bookingDate.getHours()

      if (hour < 8 || hour > 18) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bookings are only allowed between 8 AM and 6 PM",
        })
      }

      // Check weekend restrictions
      const dayOfWeek = bookingDate.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Weekend bookings are not allowed",
        })
      }

      // Check advance booking limit (max 30 days)
      const daysDiff = Math.ceil(
        (bookingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff > 30) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bookings can only be made up to 30 days in advance",
        })
      }
    }

    return opts.next()
  }
}
```

### **Food Order Validation**
```typescript
// src/server/middlewares/food-order.middleware.ts
export const validateFoodOrderRules = () => {
  return async (opts: any) => {
    if (opts.path.includes('foodOrder')) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()

      // Lunch time validation (11:30 AM - 2:00 PM)
      const lunchStart = 11.5 // 11:30 AM
      const lunchEnd = 14.0   // 2:00 PM
      const currentTime = currentHour + currentMinute / 60

      if (currentTime < lunchStart || currentTime > lunchEnd) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Food orders are only accepted between 11:30 AM and 2:00 PM",
        })
      }

      // Check daily order limit per user
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dailyOrders = await opts.ctx.db.foodOrder.count({
        where: {
          userId: opts.ctx.user.id,
          createdAt: {
            gte: today,
          },
        },
      })

      if (dailyOrders >= 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Maximum 3 food orders per day",
        })
      }
    }

    return opts.next()
  }
}
```

## 🔧 **Middleware Composition**

### **Procedure Builder**
```typescript
// src/server/procedures/base.ts
import { protectedProcedure } from "@/server/api/trpc"
import { rateLimit } from "@/server/middlewares/rate-limit.middleware"
import { requestLogger } from "@/server/middlewares/logging.middleware"
import { validateInput } from "@/server/middlewares/validation.middleware"

// Base protected procedure with common middlewares
export const baseProcedure = protectedProcedure
  .use(requestLogger())
  .use(rateLimit({ limit: 100, windowMs: 15 * 60 * 1000 })) // 100 requests per 15 minutes

// Admin procedure with additional restrictions
export const adminProcedure = baseProcedure
  .use(requireRole('ADMIN'))

// Business logic procedures
export const bookingProcedure = baseProcedure
  .use(validateBookingRules())

export const foodOrderProcedure = baseProcedure
  .use(validateFoodOrderRules())
```

### **Router-Level Middleware**
```typescript
// src/server/routers/booking.ts
import { bookingProcedure } from "@/server/procedures/base"

export const bookingRouter = createTRPCRouter({
  create: bookingProcedure
    .input(createBookingSchema)
    .use(withTransaction()) // Wrap in transaction
    .use(auditLogger(['booking.create'])) // Audit logging
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),

  cancel: bookingProcedure
    .input(cancelBookingSchema)
    .use(auditLogger(['booking.cancel']))
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
})
```

## 📊 **Middleware Performance**

### **Middleware Execution Order**
```typescript
// Execution order matters!
const procedure = t.procedure
  .use(authMiddleware)        // 1. Authentication
  .use(rateLimit(...))        // 2. Rate limiting
  .use(requestLogger())       // 3. Logging
  .use(validateInput(...))    // 4. Input validation
  .use(withTransaction())     // 5. Database transaction
  .use(auditLogger(...))      // 6. Audit logging
```

### **Performance Monitoring**
```typescript
// src/server/middlewares/performance.middleware.ts
export const performanceMonitor = () => {
  return async (opts: any) => {
    const startTime = process.hrtime.bigint()

    try {
      const result = await opts.next()

      const endTime = process.hrtime.bigint()
      const duration = Number(endTime - startTime) / 1_000_000 // Convert to milliseconds

      // Log performance metrics
      console.log(`Procedure ${opts.path} took ${duration.toFixed(2)}ms`)

      // Track slow procedures
      if (duration > 1000) {
        await logSlowProcedure(opts.path, duration, opts.input)
      }

      return result
    } catch (error) {
      const endTime = process.hrtime.bigint()
      const duration = Number(endTime - startTime) / 1_000_000

      console.error(`Procedure ${opts.path} failed after ${duration.toFixed(2)}ms:`, error)

      throw error
    }
  }
}
```

## 📋 **Middleware Checklist**

### **Security**
- [ ] **Authentication** - Todos os endpoints protegidos
- [ ] **Authorization** - Roles e permissões verificadas
- [ ] **Input validation** - Dados sanitizados e validados
- [ ] **Rate limiting** - Proteção contra abuso
- [ ] **SQL injection** - Prevenção ativa

### **Performance**
- [ ] **Caching** - Dados cacheados quando apropriado
- [ ] **Optimization** - Queries otimizadas
- [ ] **Rate limiting** - Controle de carga
- [ ] **Monitoring** - Performance trackeada

### **Reliability**
- [ ] **Error handling** - Erros tratados graciosamente
- [ ] **Logging** - Logs detalhados para debugging
- [ ] **Transactions** - Operações atômicas
- [ ] **Fallbacks** - Planos B para falhas

### **Maintainability**
- [ ] **Composition** - Middlewares reutilizáveis
- [ ] **Documentation** - Código bem documentado
- [ ] **Testing** - Middlewares testados
- [ ] **Monitoring** - Alertas configurados

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe Backend
