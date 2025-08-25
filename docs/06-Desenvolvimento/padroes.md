# 📋 Padrões de Código e Arquitetura

## 📖 Visão Geral

Este documento define os padrões e convenções adotados no Sistema de Intranet ELO. Seguir estes padrões garante consistência, manutenibilidade e qualidade do código em toda a aplicação.

## 🏗️ Arquitetura Geral

### **Princípios Arquiteturais**

#### **1. Clean Architecture**
```
├── Domain (Business Logic)
├── Application (Use Cases)
├── Infrastructure (External Dependencies)
└── Presentation (UI/UX)
```

#### **2. Layered Architecture**
```
├── Presentation Layer (React Components)
├── Application Layer (tRPC Procedures)
├── Domain Layer (Business Logic)
└── Infrastructure Layer (Database, External APIs)
```

#### **3. Component-Based Architecture**
```
├── Atomic Design (Atoms → Molecules → Organisms)
├── Feature-Based Organization
├── Shared Components Library
└── Custom Hooks for Logic
```

## 📁 Estrutura de Arquivos

### **Organização por Feature**
```
src/
├── app/(authenticated)/
│   ├── dashboard/
│   │   ├── page.tsx          # Página principal
│   │   ├── components/       # Componentes específicos
│   │   └── _components/      # Componentes internos
│   └── [feature]/
│       ├── page.tsx
│       ├── layout.tsx        # Layout específico da feature
│       └── _components/
├── components/
│   ├── ui/                   # Componentes base (shadcn/ui)
│   ├── [feature]/            # Componentes por feature
│   └── shared/               # Componentes compartilhados
└── server/
    ├── api/
    │   └── routers/
    │       └── [feature].ts   # tRPC routers por feature
    └── db.ts                 # Configuração do banco
```

### **Convenções de Nomenclatura**

#### **Arquivos e Diretórios**
```typescript
// ✅ Correto
├── user-profile/
│   ├── page.tsx
│   ├── components/
│   │   ├── user-card.tsx
│   │   └── profile-form.tsx
│   └── _components/
│       └── internal-modal.tsx

// ❌ Evitar
├── UserProfile/
├── userProfile/
├── user_profile/
├── components/
│   ├── UserCard.tsx
│   └── userProfileForm.tsx
```

#### **Componentes React**
```typescript
// ✅ Componentes em PascalCase
export function UserProfile() { ... }
export function UserCard() { ... }
export function ProfileForm() { ... }

// ✅ Hooks em camelCase com prefixo 'use'
export function useUserData() { ... }
export function useProfileForm() { ... }

// ✅ Funções utilitárias em camelCase
export function formatUserName() { ... }
export function validateEmail() { ... }
```

#### **TypeScript**
```typescript
// ✅ Interfaces em PascalCase
interface User {
  id: string
  firstName: string
  lastName: string
}

interface UserProfile extends User {
  avatar?: string
  department: string
}

// ✅ Tipos em PascalCase
type UserRole = 'ADMIN' | 'MANAGER' | 'USER'
type UserStatus = 'ACTIVE' | 'INACTIVE'

// ✅ Enums em PascalCase
enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
}
```

#### **Constantes e Configurações**
```typescript
// ✅ Constantes em SCREAMING_SNAKE_CASE
export const MAX_FILE_SIZE = 1024 * 1024 * 5 // 5MB
export const API_TIMEOUT = 30000 // 30 seconds

// ✅ Configurações agrupadas
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
} as const

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
} as const
```

## 🔧 Padrões de Componentes

### **Componentes Funcionais**
```typescript
// ✅ Padrão recomendado
interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  className?: string
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  const { data: session } = useSession()

  const handleEdit = useCallback(() => {
    onEdit?.(user)
  }, [onEdit, user])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardHeader>

      {session?.user?.role === 'ADMIN' && (
        <CardFooter>
          <Button onClick={handleEdit} variant="outline">
            Editar
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
```

### **Custom Hooks**
```typescript
// ✅ Padrão para hooks
export function useUserData(userId?: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const data = await trpc.user.getById.query({ id: userId })
      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const updated = await trpc.user.update.mutate({
        id: userId,
        data: updates,
      })
      setUser(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return {
    user,
    loading,
    error,
    updateUser,
    refetch: fetchUser,
  }
}
```

### **Server Components vs Client Components**
```typescript
// ✅ Server Component (padrão)
export default function UserProfilePage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="space-y-6">
      <h1>Perfil do Usuário</h1>
      <UserProfile client:id={params.id} />
    </div>
  )
}

// ✅ Client Component (quando necessário)
'use client'

interface UserProfileProps {
  id: string
}

export function UserProfile({ id }: UserProfileProps) {
  const { data: user } = trpc.user.getById.useQuery({ id })

  if (!user) return <UserProfileSkeleton />

  return (
    <div className="space-y-4">
      <UserInfo user={user} />
      <UserActions user={user} />
    </div>
  )
}
```

## 🌐 Padrões de API (tRPC)

### **Estrutura de Routers**
```typescript
// ✅ server/api/routers/user.ts
import { createTRPCRouter, protectedProcedure, adminProcedure } from '@/server/api/trpc'
import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['USER', 'MANAGER', 'ADMIN']),
})

export const userRouter = createTRPCRouter({
  // Queries (GET)
  getAll: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where = input.search ? {
        OR: [
          { firstName: { contains: input.search, mode: 'insensitive' } },
          { lastName: { contains: input.search, mode: 'insensitive' } },
          { email: { contains: input.search, mode: 'insensitive' } },
        ],
      } : {}

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.user.count({ where }),
      ])

      return { users, total, page: input.page }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        include: {
          bookings: true,
          orders: true,
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado',
        })
      }

      return user
    }),

  // Mutations (POST, PUT, DELETE)
  create: adminProcedure
    .input(userSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.create({
        data: input,
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: userSchema.partial().omit({ id: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado',
        })
      }

      // Check permissions
      if (user.id !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso negado',
        })
      }

      return ctx.db.user.update({
        where: { id: input.id },
        data: input.data,
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.delete({
        where: { id: input.id },
      })
    }),
})
```

### **Padrões de Input/Output**
```typescript
// ✅ Schema validation with Zod
const createUserSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.enum(['USER', 'MANAGER', 'ADMIN']).default('USER'),
})

const userResponseSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: z.enum(['USER', 'MANAGER', 'ADMIN']),
  createdAt: z.date(),
  updatedAt: z.date(),
})
```

## 🗄️ Padrões de Banco de Dados

### **Modelos Prisma**
```prisma
// ✅ Padrões de modelagem
model User {
  id            String    @id @default(cuid())
  firstName     String
  lastName      String
  email         String    @unique
  imageUrl      String?
  role          UserRole  @default(USER)
  enterprise    Enterprise @default(NA)
  setor         String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  bookings      RoomBooking[]
  orders        FoodOrder[]
  suggestions   Suggestion[]

  // Indexes for performance
  @@index([email])
  @@index([enterprise])
  @@map("users")
}

model RoomBooking {
  id            String      @id @default(cuid())
  userId        String
  roomId        String
  startTime     DateTime
  endTime       DateTime
  title         String?
  status        BookingStatus @default(PENDING)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  user          User        @relation(fields: [userId], references: [id])
  room          Room        @relation(fields: [roomId], references: [id])

  // Composite indexes
  @@index([userId, startTime])
  @@index([roomId, startTime, endTime])
  @@unique([roomId, startTime, endTime])
  @@map("room_bookings")
}
```

### **Queries Otimizadas**
```typescript
// ✅ Padrão para queries complexas
export async function getUserBookingsWithDetails(userId: string) {
  return prisma.roomBooking.findMany({
    where: {
      userId,
      startTime: { gte: new Date() },
    },
    include: {
      room: {
        select: {
          id: true,
          name: true,
          location: true,
          capacity: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  })
}

// ✅ Padrão para queries agregadas
export async function getBookingStats(userId: string) {
  const [total, upcoming, past] = await Promise.all([
    prisma.roomBooking.count({ where: { userId } }),
    prisma.roomBooking.count({
      where: {
        userId,
        startTime: { gte: new Date() },
      },
    }),
    prisma.roomBooking.count({
      where: {
        userId,
        endTime: { lt: new Date() },
      },
    }),
  ])

  return { total, upcoming, past }
}
```

## 🎨 Padrões de UI/UX

### **Design System (shadcn/ui)**
```typescript
// ✅ Uso consistente de componentes
export function UserForm() {
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Digite seu nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Salvar
        </Button>
      </form>
    </Form>
  )
}
```

### **Responsividade**
```typescript
// ✅ Padrões de responsividade
export function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {children}
    </div>
  )
}

// ✅ Componentes condicionais por tela
export function AdaptiveLayout() {
  return (
    <>
      {/* Desktop only */}
      <div className="hidden lg:block">
        <DesktopSidebar />
      </div>

      {/* Mobile only */}
      <div className="block lg:hidden">
        <MobileNavigation />
      </div>

      {/* All screens */}
      <MainContent />
    </>
  )
}
```

## 🧪 Padrões de Testes

### **Estrutura de Testes**
```
src/
├── __tests__/
│   ├── components/
│   │   └── UserCard.test.tsx
│   ├── hooks/
│   │   └── useUserData.test.ts
│   ├── utils/
│   │   └── formatDate.test.ts
│   └── integration/
│       └── user-flow.test.ts
├── components/
│   └── UserCard.tsx
└── hooks/
    └── useUserData.ts
```

### **Testes de Componentes**
```typescript
// ✅ src/__tests__/components/UserCard.test.tsx
import { render, screen } from '@testing-library/react'
import { UserCard } from '@/components/UserCard'

const mockUser = {
  id: '1',
  firstName: 'João',
  lastName: 'Silva',
  email: 'joao.silva@empresa.com',
  avatar: 'https://example.com/avatar.jpg',
}

describe('UserCard', () => {
  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('joao.silva@empresa.com')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', mockUser.avatar)
  })

  it('shows edit button for admin users', () => {
    // Mock admin session
    render(<UserCard user={mockUser} />)

    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
  })

  it('handles missing avatar gracefully', () => {
    const userWithoutAvatar = { ...mockUser, avatar: undefined }
    render(<UserCard user={userWithoutAvatar} />)

    const avatarFallback = screen.getByText('JS')
    expect(avatarFallback).toBeInTheDocument()
  })
})
```

### **Testes de Hooks**
```typescript
// ✅ src/__tests__/hooks/useUserData.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useUserData } from '@/hooks/useUserData'

describe('useUserData', () => {
  it('fetches user data successfully', async () => {
    const { result } = renderHook(() => useUserData('1'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.error).toBe(null)
    })
  })

  it('handles error states', async () => {
    // Mock API error
    const { result } = renderHook(() => useUserData('invalid-id'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.user).toBe(null)
      expect(result.current.error).toBe('User not found')
    })
  })
})
```

## 🔒 Padrões de Segurança

### **Validação de Input**
```typescript
// ✅ Validação server-side
export const createUserSchema = z.object({
  firstName: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),

  lastName: z.string()
    .min(1, 'Sobrenome é obrigatório')
    .max(50, 'Sobrenome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Sobrenome deve conter apenas letras'),

  email: z.string()
    .email('Email inválido')
    .toLowerCase(),

  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter maiúsculas, minúsculas e números'),
})
```

### **Controle de Acesso**
```typescript
// ✅ Middleware de autorização
export const adminProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    if (ctx.user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Acesso negado. Requer privilégios de administrador.',
      })
    }

    return next()
  })

// ✅ Verificação de propriedade
export const ownerProcedure = protectedProcedure
  .input(z.object({ resourceId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const resource = await ctx.db.resource.findUnique({
      where: { id: input.resourceId },
      select: { userId: true },
    })

    if (!resource || resource.userId !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Acesso negado. Você não tem permissão para este recurso.',
      })
    }

    return next()
  })
```

## 📝 Padrões de Documentação

### **Documentação de Componentes**
```typescript
/**
 * UserCard - Exibe informações básicas de um usuário
 *
 * @param user - Dados do usuário a ser exibido
 * @param onEdit - Callback opcional para edição
 * @param className - Classes CSS adicionais
 *
 * @example
 * ```tsx
 * <UserCard
 *   user={userData}
 *   onEdit={(user) => console.log('Edit', user)}
 *   className="custom-class"
 * />
 * ```
 */
interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  className?: string
}
```

### **Documentação de APIs**
```typescript
/**
 * GET /api/user/:id - Obtém dados de um usuário específico
 *
 * @param id - ID único do usuário
 * @returns Promise<User> - Dados completos do usuário
 *
 * @throws {TRPCError} NOT_FOUND - Usuário não encontrado
 * @throws {TRPCError} FORBIDDEN - Acesso negado
 *
 * @example
 * ```typescript
 * const user = await trpc.user.getById.query({ id: '123' })
 * console.log(user.firstName) // "João"
 * ```
 */
```

## 🔄 Padrões de Commit

### **Conventional Commits**
```
feat: add user authentication module
fix: resolve dashboard loading performance issue
docs: update API documentation for user endpoints
style: format code with prettier and fix linting issues
refactor: simplify user data fetching logic
test: add comprehensive unit tests for user service
chore: update dependencies and fix security vulnerabilities
```

### **Estrutura de Mensagem**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### **Tipos de Commit**
- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Documentação
- **style**: Formatação/código
- **refactor**: Refatoração
- **test**: Testes
- **chore**: Manutenção

## 📋 Checklist de Qualidade

### **Code Review Checklist**
- [ ] Arquitetura está consistente
- [ ] Código segue os padrões estabelecidos
- [ ] TypeScript types estão corretos
- [ ] Testes foram adicionados/modificados
- [ ] Documentação foi atualizada
- [ ] Performance foi considerada
- [ ] Segurança foi verificada

### **Pre-commit Checklist**
- [ ] ESLint passa sem erros
- [ ] Prettier formatou o código
- [ ] TypeScript compila sem erros
- [ ] Testes passam
- [ ] Build funciona
- [ ] Commit segue conventional commits

### **Pre-deploy Checklist**
- [ ] Testes de integração passam
- [ ] Build de produção funciona
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações do banco aplicadas
- [ ] Documentação atualizada

---

**📅 Última atualização**: Fevereiro 2025
**👥 Mantido por**: Equipe de Desenvolvimento
