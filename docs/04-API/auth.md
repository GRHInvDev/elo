# 🔐 Sistema de Autenticação e Autorização

## 📋 Visão Geral

O Sistema de Intranet ELO utiliza **Clerk** como provedor principal de autenticação, combinado com um sistema robusto de autorização baseado em roles e permissões.

## 🏗️ Arquitetura de Autenticação

### **Componentes Principais**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Clerk.js       │    │   Database      │
│   (Next.js)     │◄──►│   (Auth)         │◄──►│   (Users)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   tRPC          │    │   JWT Tokens     │    │   Sessions      │
│   Procedures    │    │   & Cookies      │    │   Management    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔑 **Clerk Integration**

### **Configuração Inicial**
```typescript
// src/lib/clerk.ts
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware((auth, req) => {
  // Custom middleware logic
  console.log('Auth request:', req.url, auth.userId)
})
```

### **Middleware de Autenticação**
```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/rooms(.*)',
  '/food(.*)',
  '/cars(.*)',
  '/events(.*)',
  '/forms(.*)',
  '/admin(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Protect routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // Redirect authenticated users away from auth pages
  if (isPublicRoute(req) && auth.userId) {
    const homeUrl = new URL('/dashboard', req.url)
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

### **Client-Side Integration**
```tsx
// src/app/providers.tsx
import { ClerkProvider } from '@clerk/nextjs'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: 'light',
        variables: {
          colorPrimary: '#000000',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#000000',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
```

## 👤 **Sistema de Usuários**

### **Modelo de Usuário**
```prisma
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

  // Relations...
  @@map("users")
}

enum UserRole {
  USER    // Colaborador padrão
  ADMIN   // Administrador geral
  TOTEM   // Kiosk mode
}

enum Enterprise {
  NA                      // Não definido
  Box                     // Box Distribuidora
  RHenz                   // RH Enz
  Cristallux              // Cristallux
  Box_Distribuidor        // Box Distribuidor
  Box_Distribuidor___Filial // Box Distribuidor - Filial
}
```

### **Sincronização Clerk ↔ Database**
```typescript
// src/app/api/webhooks/clerk/route.ts
import { WebhookEvent } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const svix_id = headers().get('svix-id')!
  const svix_timestamp = headers().get('svix-timestamp')!
  const svix_signature = headers().get('svix-signature')!

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(webhookSecret)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: verification failed', { status: 400 })
  }

  // Handle the event
  switch (evt.type) {
    case 'user.created':
      await handleUserCreated(evt.data)
      break
    case 'user.updated':
      await handleUserUpdated(evt.data)
      break
    case 'user.deleted':
      await handleUserDeleted(evt.data)
      break
    default:
      console.log(`Unhandled event type: ${evt.type}`)
  }

  return new Response('OK', { status: 200 })
}

async function handleUserCreated(user: any) {
  await prisma.user.create({
    data: {
      id: user.id,
      email: user.email_addresses[0].email_address,
      firstName: user.first_name,
      lastName: user.last_name,
      imageUrl: user.image_url,
      enterprise: determineEnterprise(user.email_addresses[0].email_address),
    },
  })
}

function determineEnterprise(email: string): Enterprise {
  if (email.includes('@box.com')) return 'Box'
  if (email.includes('@rhenz.com')) return 'RHenz'
  if (email.includes('@cristallux.com')) return 'Cristallux'
  if (email.includes('@boxdistribuidor.com')) return 'Box_Distribuidor'
  if (email.includes('@boxfilial.com')) return 'Box_Distribuidor___Filial'
  return 'NA'
}
```

## 🛡️ **Sistema de Autorização**

### **Role-Based Access Control (RBAC)**

#### **Hierarquia de Roles**
```typescript
// src/lib/auth/roles.ts
export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const ROLE_HIERARCHY = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canAccessResource(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  const permissions = PERMISSIONS[userRole]
  return permissions?.[resource]?.includes(action) ?? false
}
```

#### **Matriz de Permissões**
```typescript
// src/lib/auth/permissions.ts
export const PERMISSIONS = {
  [UserRole.USER]: {
    bookings: ['create', 'read', 'update_own', 'delete_own'],
    foodOrders: ['create', 'read', 'update_own', 'delete_own'],
    suggestions: ['create', 'read', 'update_own'],
    forms: ['read', 'submit'],
    posts: ['read'],
    comments: ['create', 'read', 'update_own', 'delete_own'],
  },
  [UserRole.MODERATOR]: {
    bookings: ['create', 'read', 'update', 'delete'],
    foodOrders: ['create', 'read', 'update', 'delete'],
    suggestions: ['create', 'read', 'update', 'delete', 'approve'],
    forms: ['read', 'submit', 'create', 'update'],
    posts: ['create', 'read', 'update', 'delete', 'publish'],
    comments: ['create', 'read', 'update', 'delete'],
  },
  [UserRole.ADMIN]: {
    '*': ['*'], // Full access
  },
}
```

### **Enterprise-Based Access**
```typescript
// src/lib/auth/enterprise-access.ts
export function canAccessEnterpriseData(
  userEnterprise: Enterprise,
  targetEnterprise: Enterprise
): boolean {
  // Users can access their own enterprise data
  if (userEnterprise === targetEnterprise) {
    return true
  }

  // Admins can access all enterprises
  if (userEnterprise === 'ADMIN') {
    return true
  }

  // Special rules for subsidiaries
  if (targetEnterprise === 'Box_Distribuidor___Filial' &&
      userEnterprise === 'Box_Distribuidor') {
    return true // Parent company can access subsidiary
  }

  return false
}
```

### **Resource-Based Access Control**
```typescript
// src/lib/auth/resource-access.ts
export function canAccessBooking(
  user: User,
  booking: Booking,
  action: string
): boolean {
  // Users can access their own bookings
  if (booking.userId === user.id) {
    return true
  }

  // Admins can access all bookings
  if (user.role === 'ADMIN') {
    return true
  }

  // Moderators can access bookings in their enterprise
  if (user.role === 'MODERATOR' && user.enterprise === booking.user.enterprise) {
    return true
  }

  return false
}
```

## 🔒 **tRPC Authorization Middleware**

### **Base Procedures**
```typescript
// src/server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server"
import { type CreateNextContextOptions } from "@trpc/server/adapters/next"
import { getAuth } from "@clerk/nextjs/server"

export const createTRPCContext = async (opts?: CreateNextContextOptions) => {
  const { req, res } = opts || {}
  const auth = getAuth(req!)

  const userId = auth?.userId

  let user = null
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
    })
  }

  return {
    req,
    res,
    db: prisma,
    auth,
    userId,
    user,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.auth?.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found in database'
      })
    }

    return next({ ctx: { ...ctx, user: ctx.user } })
  })
)

// Admin procedure - requires admin role
export const adminProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (ctx.user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required'
      })
    }

    return next()
  })
)
```

### **Enterprise-Specific Procedures**
```typescript
// src/server/procedures/enterprise.ts
export const enterpriseProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, input, next }) => {
    // Check enterprise access for relevant operations
    if (input && typeof input === 'object' && 'enterprise' in input) {
      if (!canAccessEnterpriseData(ctx.user.enterprise, input.enterprise)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Enterprise access denied'
        })
      }
    }

    return next()
  })
)
```

## 🎫 **JWT e Session Management**

### **Clerk JWT Configuration**
```typescript
// src/lib/auth/jwt.ts
import { verifyToken } from '@clerk/nextjs/server'

export async function getUserFromToken(token: string) {
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    })

    return {
      userId: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      enterprise: payload.enterprise,
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}
```

### **Session Validation**
```typescript
// src/lib/auth/session.ts
export async function validateSession(sessionToken: string) {
  try {
    const user = await getUserFromToken(sessionToken)

    if (!user) {
      return { isValid: false, user: null }
    }

    // Check if user still exists in database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!dbUser) {
      return { isValid: false, user: null }
    }

    // Check if user is active
    if (dbUser.role === 'INACTIVE') {
      return { isValid: false, user: null }
    }

    return { isValid: true, user: dbUser }
  } catch (error) {
    console.error('Session validation failed:', error)
    return { isValid: false, user: null }
  }
}
```

## 🔐 **Security Features**

### **Rate Limiting**
```typescript
// src/server/middlewares/rate-limit.ts
import { TRPCError } from "@trpc/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
})

export const rateLimitMiddleware = (limit: number, windowMs: number) => {
  return async (opts: any) => {
    const identifier = opts.ctx.user?.id || opts.ctx.req?.ip || 'anonymous'

    const result = await rateLimiter.limit(identifier, limit, windowMs)

    if (!result.success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${Math.ceil(result.resetInMs / 1000)} seconds.`,
      })
    }

    return opts.next()
  }
}
```

### **Input Validation**
```typescript
// src/lib/validation/auth.ts
import { z } from "zod"

export const signUpSchema = z.object({
  email: z.string()
    .email("Invalid email address")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format")
    .refine(
      (email) => {
        const allowedDomains = [
          'company.com',
          'box.com',
          'rhenz.com',
          'cristallux.com'
        ]
        const domain = email.split('@')[1]
        return allowedDomains.includes(domain)
      },
      "Email domain not allowed"
    ),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name too long")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters"),
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name too long")
    .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters"),
})
```

## 🔄 **Authentication Flow**

### **Sign Up Process**
```tsx
// src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        redirectUrl="/onboarding"
        appearance={{
          elements: {
            formButtonPrimary: 'bg-black hover:bg-gray-800',
            card: 'shadow-lg',
          },
        }}
      />
    </div>
  )
}
```

### **Sign In Process**
```tsx
// src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        redirectUrl="/dashboard"
        appearance={{
          elements: {
            formButtonPrimary: 'bg-black hover:bg-gray-800',
            card: 'shadow-lg',
          },
        }}
      />
    </div>
  )
}
```

### **Onboarding After Sign Up**
```tsx
// src/app/onboarding/page.tsx
'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { trpc } from '@/lib/trpc'

export default function OnboardingPage() {
  const { user: clerkUser } = useUser()
  const router = useRouter()
  const { data: dbUser } = trpc.user.getProfile.useQuery()

  useEffect(() => {
    if (dbUser && dbUser.setor) {
      // User has completed onboarding
      router.push('/dashboard')
    }
  }, [dbUser, router])

  if (!clerkUser) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-2xl font-bold text-center">
          Complete seu perfil
        </h1>
        <OnboardingForm userId={clerkUser.id} />
      </div>
    </div>
  )
}
```

## 📊 **User Management**

### **Profile Management**
```tsx
// src/components/auth/user-profile.tsx
'use client'

import { useUser } from '@clerk/nextjs'
import { trpc } from '@/lib/trpc'

export function UserProfile() {
  const { user: clerkUser } = useUser()
  const { data: dbUser } = trpc.user.getProfile.useQuery()
  const updateMutation = trpc.user.update.useMutation()

  const handleUpdate = async (data: any) => {
    await updateMutation.mutateAsync({
      firstName: data.firstName,
      lastName: data.lastName,
      setor: data.setor,
    })
  }

  if (!dbUser) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <img
          src={clerkUser?.imageUrl}
          alt="Profile"
          className="w-16 h-16 rounded-full"
        />
        <div>
          <h2 className="text-xl font-semibold">
            {dbUser.firstName} {dbUser.lastName}
          </h2>
          <p className="text-gray-600">{dbUser.email}</p>
          <p className="text-sm text-gray-500">
            {dbUser.enterprise} • {dbUser.setor}
          </p>
        </div>
      </div>

      <ProfileForm user={dbUser} onSubmit={handleUpdate} />
    </div>
  )
}
```

### **Admin User Management**
```tsx
// src/app/admin/users/page.tsx
'use client'

import { trpc } from '@/lib/trpc'

export default function UsersManagement() {
  const { data: users, isLoading } = trpc.user.getAll.useQuery({
    page: 1,
    limit: 20,
  })

  const updateRoleMutation = trpc.user.updateRole.useMutation()

  const handleRoleUpdate = async (userId: string, role: string) => {
    await updateRoleMutation.mutateAsync({ userId, role })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users?.users.map((user) => (
            <li key={user.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={user.imageUrl || '/default-avatar.png'}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      {user.enterprise} • {user.setor}
                    </p>
                  </div>
                </div>

                <select
                  value={user.role}
                  onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="USER">User</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

## 📋 **Security Best Practices**

### **Authentication Security**
- [x] **Secure Password Requirements** - Complexidade obrigatória
- [x] **Email Domain Validation** - Apenas domínios corporativos
- [x] **Session Management** - Controle de sessões ativas
- [x] **Token Security** - JWT assinado e verificado
- [x] **Logout Security** - Invalidação de tokens

### **Authorization Security**
- [x] **Role-Based Access** - Controle granular por roles
- [x] **Enterprise Isolation** - Dados isolados por empresa
- [x] **Resource Ownership** - Usuários só acessam seus dados
- [x] **Admin Verification** - Verificação extra para ações admin
- [x] **Audit Logging** - Logs de todas as ações

### **API Security**
- [x] **Rate Limiting** - Proteção contra abuso
- [x] **Input Validation** - Validação rigorosa de dados
- [x] **SQL Injection Prevention** - Queries parametrizadas
- [x] **XSS Protection** - Sanitização de HTML
- [x] **CSRF Protection** - Next.js built-in

### **Infrastructure Security**
- [x] **HTTPS Only** - Comunicação criptografada
- [x] **Secure Headers** - Headers de segurança
- [x] **CORS Configuration** - Controle de origens
- [x] **Data Encryption** - Dados sensíveis criptografados
- [x] **Backup Security** - Backups criptografados

## 📊 **Monitoring & Analytics**

### **Authentication Metrics**
```typescript
// src/lib/analytics/auth.ts
export class AuthAnalytics {
  static async trackLogin(userId: string, method: string) {
    await prisma.authLog.create({
      data: {
        userId,
        action: 'login',
        method,
        timestamp: new Date(),
      },
    })
  }

  static async trackFailedLogin(email: string, reason: string) {
    await prisma.authLog.create({
      data: {
        email,
        action: 'failed_login',
        reason,
        timestamp: new Date(),
      },
    })
  }

  static async getAuthMetrics(timeRange: string) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeRange))

    const [totalUsers, activeUsers, loginAttempts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          updatedAt: { gte: startDate },
        },
      }),
      prisma.authLog.count({
        where: {
          timestamp: { gte: startDate },
        },
      }),
    ])

    return {
      totalUsers,
      activeUsers,
      loginAttempts,
      period: timeRange,
    }
  }
}
```

### **Authorization Events**
```typescript
// src/lib/analytics/authorization.ts
export class AuthorizationAnalytics {
  static async trackAccess(
    userId: string,
    resource: string,
    action: string,
    granted: boolean
  ) {
    await prisma.authorizationLog.create({
      data: {
        userId,
        resource,
        action,
        granted,
        timestamp: new Date(),
      },
    })
  }

  static async getAccessPatterns(userId: string) {
    const logs = await prisma.authorizationLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    })

    return logs.reduce((patterns, log) => {
      const key = `${log.resource}:${log.action}`
      patterns[key] = (patterns[key] || 0) + 1
      return patterns
    }, {} as Record<string, number>)
  }
}
```

## 📋 **Authentication Checklist**

### **Setup & Configuration**
- [x] **Clerk Account** - Aplicação criada no Clerk
- [x] **Environment Variables** - Chaves configuradas
- [x] **Middleware** - Rotas protegidas configuradas
- [x] **Database Sync** - Webhooks configurados
- [x] **Email Templates** - Templates de autenticação

### **Security Implementation**
- [x] **Password Policies** - Requisitos de senha
- [x] **Domain Validation** - Restrição de domínios
- [x] **Rate Limiting** - Proteção contra brute force
- [x] **Session Control** - Gerenciamento de sessões
- [x] **Audit Logging** - Logs de segurança

### **User Experience**
- [x] **Sign Up Flow** - Processo de registro
- [x] **Sign In Flow** - Processo de login
- [x] **Profile Management** - Gerenciamento de perfil
- [x] **Password Reset** - Recuperação de senha
- [x] **Email Verification** - Verificação de email

### **Authorization**
- [x] **Role System** - Hierarquia de roles
- [x] **Permission Matrix** - Matriz de permissões
- [x] **Resource Access** - Controle de recursos
- [x] **Enterprise Isolation** - Isolamento por empresa
- [x] **API Protection** - Proteção de endpoints

### **Monitoring**
- [x] **Login Tracking** - Monitoramento de logins
- [x] **Access Patterns** - Padrões de acesso
- [x] **Security Events** - Eventos de segurança
- [x] **Failed Attempts** - Tentativas falhadas
- [x] **Audit Reports** - Relatórios de auditoria

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe de Segurança
