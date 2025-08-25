# 🛠️ Problemas de Desenvolvimento

## Build e Compilação

### **Erro: Module not found**
```bash
# Erro
Module not found: Can't resolve '@/components/UserCard'

# Soluções
# 1. Verificar se arquivo existe
ls -la src/components/UserCard.tsx

# 2. Verificar tsconfig.json paths
cat tsconfig.json | grep "paths"

# 3. Limpar cache
rm -rf .next node_modules/.cache
npm install

# 4. Verificar import statement
grep -r "UserCard" src/ --include="*.tsx"
```

### **Erro: TypeScript compilation failed**
```bash
# Erro
error TS2307: Cannot find module '@/lib/utils'

# Soluções
# 1. Verificar se arquivo existe
ls -la src/lib/utils.ts

# 2. Verificar exports
cat src/lib/utils.ts

# 3. Reiniciar TypeScript server
# VS Code: Ctrl+Shift+P > TypeScript: Restart TS Server

# 4. Verificar tsconfig paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### **Build falhando em produção**
```bash
# Erro
Build failed because of webpack errors

# Soluções
# 1. Verificar dependências
npm ls --depth=0

# 2. Limpar node_modules
rm -rf node_modules package-lock.json
npm install

# 3. Verificar variáveis de ambiente
echo $NODE_ENV
echo $DATABASE_URL

# 4. Build local
npm run build
```

## Database e Prisma

### **Erro: P1001 Can't reach database server**
```bash
# Erro
P1001: Can't reach database server at `localhost:5432`

# Soluções
# 1. Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# 2. Verificar porta
netstat -tlnp | grep 5432

# 3. Testar conexão
psql -h localhost -U postgres -d postgres

# 4. Verificar DATABASE_URL
echo $DATABASE_URL

# 5. Reiniciar serviço
sudo systemctl restart postgresql
```

### **Erro: P2002 Unique constraint violation**
```sql
-- Erro
P2002: Unique constraint failed on the constraint: `users_email_key`

-- Soluções
-- 1. Verificar dados existentes
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

-- 2. Limpar dados duplicados
DELETE FROM users a USING (
  SELECT MIN(ctid) as ctid, email
  FROM users
  GROUP BY email HAVING COUNT(*) > 1
) b
WHERE a.email = b.email
AND a.ctid <> b.ctid;

-- 3. Adicionar constraint no código
await prisma.user.create({
  data: {
    email: 'user@example.com',
    // ... other fields
  },
})
```

### **Migrações falhando**
```bash
# Erro
Migration failed: relation "users" already exists

# Soluções
# 1. Verificar status das migrações
npx prisma migrate status

# 2. Resolver conflitos
npx prisma migrate resolve --applied 20240101120000_init

# 3. Reset database (cuidado!)
npx prisma migrate reset

# 4. Push schema (desenvolvimento)
npx prisma db push
```

## Autenticação e Clerk

### **Erro: Invalid authentication token**
```typescript
// Erro
Error: Invalid authentication token

// Soluções
// 1. Verificar Clerk keys
console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
console.log(process.env.CLERK_SECRET_KEY)

// 2. Verificar middleware
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}

// 3. Limpar cookies
// Browser: DevTools > Application > Cookies > Clear

// 4. Verificar configuração Clerk
// Dashboard Clerk > Your application > Settings
```

### **Erro: User not found**
```typescript
// Erro
TRPCError: User not found

// Soluções
// 1. Verificar se usuário existe
const user = await prisma.user.findUnique({
  where: { id: ctx.user.id },
})

if (!user) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'User not found',
  })
}

// 2. Verificar Clerk webhook
// Clerk Dashboard > Webhooks > Add endpoint
// URL: https://your-domain.com/api/webhooks/clerk
```

## Componentes e UI

### **Componente não renderiza**
```typescript
// Problema
const UserCard = ({ user }) => {
  if (!user) return null // Pode causar problemas

  return <div>{user.name}</div>
}

// Soluções
// 1. Adicionar console.log
const UserCard = ({ user }) => {
  console.log('UserCard rendered:', user)
  if (!user) {
    console.log('No user data')
    return <div>No user data</div>
  }

  return <div>{user.name}</div>
}

// 2. Verificar props
const UserList = () => {
  const { data: users } = trpc.user.getAll.useQuery()

  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

### **CSS/Tailwind não funciona**
```typescript
// Problema
<div className="bg-blue-500 text-white">
  {/* Não está azul */}
</div>

// Soluções
// 1. Verificar se Tailwind está instalado
npm list tailwindcss

// 2. Verificar configuração
cat tailwind.config.js

// 3. Verificar classes no DOM
// Chrome DevTools > Elements > Computed

// 4. Reiniciar build
rm -rf .next
npm run dev

// 5. Verificar postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## API e tRPC

### **Erro 500 na API**
```typescript
// Problema
export async function GET() {
  return Response.json({ error: 'Internal server error' })
}

// Soluções
// 1. Adicionar try/catch
export async function GET() {
  try {
    const users = await prisma.user.findMany()
    return Response.json(users)
  } catch (error) {
    console.error('API Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 2. Verificar logs
tail -f /app/logs/app.log

// 3. Testar endpoint
curl -X GET http://localhost:3000/api/users
```

### **tRPC procedure timeout**
```typescript
// Problema
export const slowProcedure = protectedProcedure
  .query(async () => {
    // Query muito lenta
    const users = await prisma.user.findMany()
    const bookings = await prisma.booking.findMany()
    // ...
  })

// Soluções
// 1. Otimizar queries
export const optimizedProcedure = protectedProcedure
  .query(async () => {
    const [users, bookings] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true } }),
      prisma.booking.findMany({ select: { id: true, userId: true } }),
    ])

    return { users, bookings }
  })

// 2. Adicionar timeout
export const timeoutProcedure = protectedProcedure
  .query(async () => {
    const timeout = setTimeout(() => {
      throw new TRPCError({
        code: 'TIMEOUT',
        message: 'Operation timed out',
      })
    }, 30000) // 30 seconds

    try {
      const result = await slowOperation()
      clearTimeout(timeout)
      return result
    } catch (error) {
      clearTimeout(timeout)
      throw error
    }
  })
```

## Performance

### **Aplicação lenta**
```typescript
// Problema
const SlowComponent = () => {
  const { data: users } = trpc.user.getAll.useQuery() // Busca todos os dados

  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}

// Soluções
// 1. Adicionar paginação
const FastComponent = () => {
  const [page, setPage] = useState(1)
  const { data: users } = trpc.user.getAll.useQuery({
    page,
    limit: 20,
  })

  return (
    <div>
      {users?.users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
      <Pagination
        current={page}
        total={users?.total || 0}
        onChange={setPage}
      />
    </div>
  )
}

// 2. Usar React.memo
const UserCard = React.memo(({ user }) => {
  return <div>{user.name}</div>
})
```

### **Memory leaks**
```typescript
// Problema
const LeakyComponent = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [...prev, Date.now()])
    }, 1000)

    // Cleanup faltando!
  }, [])

  return <div>{data.length} items</div>
}

// Solução
const FixedComponent = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [...prev, Date.now()])
    }, 1000)

    // Cleanup obrigatório
    return () => clearInterval(interval)
  }, [])

  return <div>{data.length} items</div>
}
```

## Debugging Tools

### **Console Debugging**
```javascript
// Debug básico
console.log('Debug info:', data)
console.warn('Warning:', warning)
console.error('Error:', error)

// Debug estruturado
console.table(data)
console.time('Operation')
expensiveOperation()
console.timeEnd('Operation')

// Debug condicional
if (process.env.NODE_ENV === 'development') {
  console.log('Dev only debug')
}
```

### **React DevTools**
```typescript
// 1. Instalar React DevTools
npm install -D react-devtools

// 2. Usar Profiler
import { Profiler } from 'react'

const onRender = (id, phase, actualDuration) => {
  console.log('Render:', id, phase, actualDuration)
}

<Profiler id="UserList" onRender={onRender}>
  <UserList />
</Profiler>
```

### **Network Debugging**
```typescript
// Debug API calls
const { data, isLoading, error } = trpc.user.getAll.useQuery()

if (error) {
  console.error('tRPC Error:', error)
}

// Debug HTTP requests
fetch('/api/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
.then(response => {
  console.log('Response status:', response.status)
  return response.json()
})
.then(data => console.log('Response data:', data))
.catch(error => console.error('Network error:', error))
```

---

**📅 Última atualização**: Fevereiro 2025
**👥 Mantido por**: Equipe de Desenvolvimento
