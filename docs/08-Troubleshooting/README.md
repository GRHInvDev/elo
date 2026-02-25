# 🔧 Troubleshooting e Solução de Problemas

## 📖 Visão Geral

Este guia contém soluções para os problemas mais comuns encontrados durante o desenvolvimento, deploy e manutenção do Sistema de Intranet ELO. Está organizado por categoria para facilitar a localização rápida das soluções.

## 🎯 Objetivos

### **Para Desenvolvedores**
- ✅ **Soluções Rápidas** - Problemas comuns resolvidos
- ✅ **Debugging Eficiente** - Ferramentas e técnicas
- ✅ **Prevenção** - Boas práticas para evitar problemas
- ✅ **Suporte** - Canal de comunicação para ajuda

### **Para DevOps**
- ✅ **Diagnóstico** - Identificação rápida de problemas
- ✅ **Recuperação** - Estratégias de rollback
- ✅ **Monitoramento** - Alertas e métricas
- ✅ **Automação** - Resolução automática quando possível

## 📋 Estrutura do Guia

```
docs/08-Troubleshooting/
├── README.md                    # Este arquivo
├── desenvolvimento.md           # Problemas de desenvolvimento
├── deploy.md                    # Problemas de deploy
├── producao.md                  # Problemas em produção
├── database.md                  # Problemas de banco de dados
├── performance.md               # Problemas de performance
└── debug.md                     # Ferramentas de debugging
```

## 🚨 Problemas Críticos vs. Comuns

### **🚨 Críticos (P1)**
- Sistema indisponível
- Dados corrompidos
- Segurança comprometida
- Funcionalidades críticas falhando

### **⚠️ Importantes (P2)**
- Performance degradada
- Funcionalidades não críticas falhando
- Erros intermitentes
- Problemas de usabilidade

### **📝 Comuns (P3)**
- Configurações incorretas
- Problemas de desenvolvimento
- Documentação desatualizada

## 🛠️ Ferramentas de Diagnóstico

### **Comandos Essenciais**
```bash
# Verificar status do sistema
npm run health-check

# Verificar conectividade com banco
npm run db:check

# Executar testes
npm run test

# Verificar build
npm run build

# Ver logs em tempo real
npm run logs
```

### **Scripts de Diagnóstico**
```typescript
// src/scripts/diagnose.ts
import { prisma } from '@/server/db'
import { checkEnvironment } from '@/lib/env'

export async function runDiagnosis() {
  console.log('🔍 Executando diagnóstico do sistema...\n')

  // Check environment
  console.log('📋 Verificando variáveis de ambiente...')
  const envStatus = checkEnvironment()
  console.log(envStatus)

  // Check database
  console.log('🗄️ Verificando conexão com banco...')
  try {
    await prisma.$connect()
    const userCount = await prisma.user.count()
    console.log(`✅ Conexão OK - ${userCount} usuários`)
  } catch (error) {
    console.error('❌ Erro de conexão:', error)
  }

  // Check external services
  console.log('🔗 Verificando serviços externos...')
  await checkExternalServices()

  console.log('\n🏁 Diagnóstico concluído')
}
```

## 📱 Problemas Mais Comuns

### **1. Erro de Build**
```bash
# Problema
npm run build
# Error: Module not found: @/components/UserCard

# Solução
# Verificar se arquivo existe
ls -la src/components/UserCard.tsx

# Verificar imports
grep -r "UserCard" src/

# Limpar cache e reinstalar
rm -rf node_modules .next
npm install
npm run build
```

### **2. Erro de Database Connection**
```bash
# Problema
Error: P1001: Can't reach database server

# Soluções
# 1. Verificar DATABASE_URL
echo $DATABASE_URL

# 2. Testar conexão
psql $DATABASE_URL -c "SELECT 1"

# 3. Verificar firewall
telnet database-host 5432

# 4. Reiniciar serviço
sudo systemctl restart postgresql
```

### **3. Erro de Autenticação**
```bash
# Problema
Error: Invalid authentication token

# Soluções
# 1. Verificar Clerk keys
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY

# 2. Limpar cookies/sessão
# Browser: Ctrl+Shift+Delete > Cookies

# 3. Verificar middleware
cat src/middleware.ts

# 4. Reiniciar aplicação
npm run dev
```

### **4. Erro de TypeScript**
```bash
# Problema
error TS2307: Cannot find module '@/lib/utils'

# Soluções
# 1. Verificar tsconfig.json
cat tsconfig.json

# 2. Verificar se arquivo existe
ls -la src/lib/utils.ts

# 3. Reiniciar TypeScript server
# VS Code: Ctrl+Shift+P > TypeScript: Restart TS Server

# 4. Limpar cache
rm -rf .next node_modules/.cache
```

## 🚨 Problemas Críticos

### **Sistema Indisponível**
```bash
# Diagnóstico rápido
curl -f https://intranet.empresa.com/api/health

# Verificar logs
tail -f /var/log/nginx/error.log
tail -f /app/logs/app.log

# Verificar recursos do sistema
top
df -h
free -h

# Reiniciar serviços
sudo systemctl restart nginx
sudo systemctl restart postgresql
npm run restart
```

### **Dados Corrompidos**
```bash
# Backup dos dados atuais
pg_dump -U elo_user -d elo_prod > emergency_backup.sql

# Verificar integridade
psql -U elo_user -d elo_prod -c "SELECT COUNT(*) FROM users;"

# Restaurar backup se necessário
psql -U elo_user -d elo_prod < latest_backup.sql

# Verificar logs de transações
tail -f /var/log/postgresql/postgresql.log
```

### **Ataque de Segurança**
```bash
# Verificar logs de acesso
tail -f /var/log/nginx/access.log | grep -i suspicious

# Bloquear IP suspeito
sudo ufw deny from suspicious_ip

# Verificar tentativas de login
grep "Failed login" /app/logs/auth.log

# Atualizar dependências de segurança
npm audit fix

# Reiniciar com configurações de segurança
sudo systemctl restart nginx
```

## 🔍 Debugging por Categoria

### **Problemas de Frontend**

#### **Componente não renderiza**
```typescript
// 1. Verificar console do navegador
console.log('Component rendered')

// 2. Usar React DevTools
// Chrome: F12 > React tab

// 3. Verificar props
const UserCard = ({ user, onEdit }) => {
  console.log('UserCard props:', { user, onEdit })
  if (!user) return <div>No user data</div>

  return <div>{user.name}</div>
}

// 4. Verificar estado
const [users, setUsers] = useState([])
useEffect(() => {
  console.log('Users state changed:', users)
}, [users])
```

#### **CSS não aplicado**
```typescript
// 1. Verificar classes no DOM
// Chrome DevTools: Elements > Computed

// 2. Verificar se CSS está carregando
// Network tab > CSS files

// 3. Verificar Tailwind classes
<div className="bg-blue-500 text-white p-4">
  {/* Should be blue background */}
</div>

// 4. Reiniciar build
rm -rf .next
npm run dev
```

### **Problemas de Backend**

#### **API retornando erro 500**
```typescript
// src/app/api/users/route.ts
export async function GET() {
  try {
    console.log('API called: /api/users')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    })

    console.log('Users found:', users.length)
    return Response.json(users)

  } catch (error) {
    console.error('API Error:', error)

    // Log detailed error for debugging
    return Response.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
```

#### **tRPC procedure falhando**
```typescript
// src/server/api/routers/user.ts
export const userRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log('tRPC: getUserById', input.id)

      try {
        const user = await ctx.db.user.findUnique({
          where: { id: input.id },
        })

        if (!user) {
          console.warn('User not found:', input.id)
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Usuário não encontrado',
          })
        }

        console.log('User found:', user.id)
        return user

      } catch (error) {
        console.error('tRPC Error:', error)
        throw error
      }
    }),
})
```

### **Problemas de Database**

#### **Query lenta**
```sql
-- 1. Verificar plano de execução
EXPLAIN ANALYZE
SELECT u.*, COUNT(b.id) as booking_count
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id;

-- 2. Adicionar índices
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);

-- 3. Otimizar query
SELECT u.id, u.first_name, u.last_name,
       COUNT(b.id) as booking_count
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.first_name, u.last_name;
```

#### **Deadlocks**
```sql
-- Verificar deadlocks no PostgreSQL
SELECT * FROM pg_stat_activity
WHERE state = 'active' AND wait_event = 'Lock';

-- Verificar locks
SELECT locktype, relation::regclass, mode, granted
FROM pg_locks
WHERE NOT granted;

-- Solução: Usar transações menores
BEGIN;
-- Operações rápidas
COMMIT;
```

### **Problemas de Performance**

#### **Aplicação lenta**
```typescript
// 1. Medir performance
const start = performance.now()
const result = await expensiveOperation()
const end = performance.now()
console.log(`Operation took ${end - start}ms`)

// 2. Usar React DevTools Profiler
// React DevTools > Profiler tab

// 3. Otimizar componentes
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return processData(data)
  }, [data])

  return <div>{processedData}</div>
})
```

#### **Memory leaks**
```typescript
// 1. Verificar listeners
useEffect(() => {
  const handleResize = () => setSize(window.innerWidth)

  window.addEventListener('resize', handleResize)

  // Cleanup obrigatório
  return () => {
    window.removeEventListener('resize', handleResize)
  }
}, [])

// 2. Verificar subscriptions
useEffect(() => {
  const subscription = someService.subscribe(data => {
    setData(data)
  })

  return () => {
    subscription.unsubscribe()
  }
}, [])

// 3. Usar React DevTools Memory tab
// Chrome DevTools > Memory > Take heap snapshot
```

## 📊 Monitoramento e Alertas

### **Configuração de Alertas**
```typescript
// src/lib/monitoring.ts
export class MonitoringService {
  static async checkSystemHealth() {
    const alerts = []

    // Check database
    try {
      await prisma.$connect()
      const userCount = await prisma.user.count()

      if (userCount < 10) {
        alerts.push({
          level: 'warning',
          message: 'Poucos usuários no sistema',
          metric: 'user_count',
          value: userCount,
        })
      }
    } catch (error) {
      alerts.push({
        level: 'critical',
        message: 'Erro de conexão com banco',
        error: error.message,
      })
    }

    // Check external services
    const clerkStatus = await checkClerkStatus()
    if (!clerkStatus.healthy) {
      alerts.push({
        level: 'critical',
        message: 'Clerk indisponível',
      })
    }

    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert)
    }

    return alerts
  }

  static async sendAlert(alert: Alert) {
    // Send to Slack
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${alert.level.toUpperCase()}: ${alert.message}`,
        attachments: [{
          fields: [
            { title: 'Métrica', value: alert.metric || 'N/A' },
            { title: 'Valor', value: alert.value?.toString() || 'N/A' },
          ],
        }],
      }),
    })

    // Log alert
    await prisma.systemLog.create({
      data: {
        level: alert.level,
        message: alert.message,
        data: alert,
      },
    })
  }
}
```

### **Dashboard de Monitoramento**
```typescript
// src/app/admin/monitoring/page.tsx
export default function MonitoringPage() {
  const [alerts, setAlerts] = useState([])
  const [metrics, setMetrics] = useState({})

  useEffect(() => {
    const checkHealth = async () => {
      const healthData = await trpc.admin.getSystemHealth.query()
      setMetrics(healthData.metrics)
      setAlerts(healthData.alerts)
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Monitoramento</h1>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.level === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.level.toUpperCase()}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CPU</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cpu}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.memory}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={metrics.db ? 'default' : 'destructive'}>
              {metrics.db ? 'Online' : 'Offline'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={metrics.api ? 'default' : 'destructive'}>
              {metrics.api ? 'Healthy' : 'Unhealthy'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

## 📋 Checklist de Troubleshooting

### **Antes de Investigar**
- [ ] Reprovar o problema
- [ ] Verificar logs
- [ ] Verificar configuração
- [ ] Verificar dependências
- [ ] Verificar permissões

### **Durante a Investigação**
- [ ] Usar console.log estrategicamente
- [ ] Verificar network requests
- [ ] Testar em diferentes browsers
- [ ] Verificar variáveis de ambiente
- [ ] Testar com dados diferentes

### **Resolução**
- [ ] Implementar correção
- [ ] Testar correção
- [ ] Verificar se não quebrou nada
- [ ] Documentar solução
- [ ] Criar teste para prevenir recorrência

### **Pós-Resolução**
- [ ] Atualizar documentação
- [ ] Notificar equipe
- [ ] Monitorar por recorrência
- [ ] Implementar melhorias preventivas

## 📞 Canais de Suporte

### **Comunicação**
- **Slack**: #support-intranet
- **GitHub Issues**: Para bugs e problemas
- **Email**: suporte@intranet.com
- **Wiki**: Confluence - Troubleshooting

### **Escalation**
1. **Desenvolvedor**: Primeiro nível de troubleshooting
2. **Tech Lead**: Problemas complexos ou arquitetura
3. **DevOps**: Problemas de infraestrutura
4. **Gerente**: Problemas de negócio ou prioridade

### **Documentação de Incidentes**
```typescript
// src/lib/incident.ts
export class IncidentManager {
  static async reportIncident(incident: IncidentReport) {
    await prisma.incident.create({
      data: {
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: 'OPEN',
        reportedBy: incident.reportedBy,
        assignedTo: null,
        tags: incident.tags,
      },
    })

    // Notify team
    await this.notifyTeam(incident)

    // Create GitHub issue if needed
    if (incident.createIssue) {
      await this.createGitHubIssue(incident)
    }
  }

  static async updateIncident(id: string, update: IncidentUpdate) {
    await prisma.incident.update({
      where: { id },
      data: update,
    })

    if (update.status === 'RESOLVED') {
      await this.notifyResolution(id)
    }
  }
}
```

## 🛠️ Ferramentas de Debug

### **Browser DevTools**
```javascript
// Console debugging
console.log('Debug info:', data)
console.table(data)
console.time('Operation')
console.timeEnd('Operation')

// Network debugging
fetch('/api/debug')
  .then(res => res.json())
  .then(data => console.log('API Response:', data))

// Performance debugging
performance.mark('start')
expensiveOperation()
performance.mark('end')
performance.measure('operation', 'start', 'end')
console.log(performance.getEntriesByName('operation')[0])
```

### **Node.js Debugging**
```bash
# Run with debugger
node --inspect-brk src/scripts/debug.js

# Use VS Code debugger
# F5 > Node.js > Attach to process

# Debug Next.js
NODE_OPTIONS='--inspect' npm run dev
```

### **Database Debugging**
```sql
-- Query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@test.com';

-- Active connections
SELECT * FROM pg_stat_activity;

-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Slow queries
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

**📅 Última atualização**: Fevereiro 2025
**👥 Mantido por**: Equipe de Suporte
