# 🔄 Migrações e Seeds

## 📋 **Estratégia de Migrações**

### **Princípios**
- **Versionamento**: Toda mudança no schema é versionada
- **Reversibilidade**: Migrações podem ser desfeitas
- **Testabilidade**: Migrações são testadas antes do deploy
- **Consistência**: Ambiente consistente entre desenvolvimento e produção

### **Ferramentas**
- **Prisma Migrate**: Para mudanças no schema
- **Prisma Seed**: Para dados iniciais
- **Database Backup**: Antes de qualquer migração em produção

## 🚀 **Comandos de Migração**

### **Desenvolvimento**
```bash
# Criar nova migração
npx prisma migrate dev --name add_user_profile_fields

# Aplicar migrações
npx prisma db push

# Reset completo (cuidado!)
npx prisma migrate reset

# Status das migrações
npx prisma migrate status
```

### **Produção**
```bash
# Aplicar migrações pendentes
npx prisma migrate deploy

# Verificar status
npx prisma migrate status
```

### **Ferramentas**
```bash
# Studio (GUI para banco)
npx prisma studio

# Formatar schema
npx prisma format

# Validar schema
npx prisma validate
```

## 📝 **Criando Migrações**

### **Passo 1: Alterar Schema**
```prisma
// prisma/schema.prisma
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
  phone            String?            // ← Novo campo
  department       String?            // ← Novo campo

  // Relations...
  @@map("users")
}
```

### **Passo 2: Gerar Migração**
```bash
npx prisma migrate dev --name add_user_contact_fields
```

### **Passo 3: Arquivo Gerado**
```sql
-- prisma/migrations/20240101000000_add_user_contact_fields/migration.sql

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;
ALTER TABLE "users" ADD COLUMN     "department" TEXT;
```

### **Passo 4: Aplicar**
```bash
npx prisma db push
```

## 🔄 **Tipos de Migração**

### **1. Adicionar Coluna**
```prisma
// ANTES
model User {
  id    String @id
  email String @unique
}

// DEPOIS
model User {
  id    String @id
  email String @unique
  phone String?  // ← Nova coluna
}
```

```sql
-- Migração gerada
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
```

### **2. Remover Coluna**
```prisma
// ANTES
model User {
  id    String @id
  email String @unique
  temp  String?  // ← Coluna temporária
}

// DEPOIS
model User {
  id    String @id
  email String @unique
}
```

```sql
-- Migração gerada
ALTER TABLE "users" DROP COLUMN "temp";
```

### **3. Alterar Tipo**
```prisma
// ANTES
model Product {
  price String  // ← Era string
}

// DEPOIS
model Product {
  price Decimal  // ← Agora decimal
}
```

```sql
-- Migração gerada
ALTER TABLE "products" ALTER COLUMN "price" SET DATA TYPE DECIMAL;
```

### **4. Renomear Coluna**
```prisma
// ANTES
model User {
  id    String @id
  name  String  // ← Vai renomear
}

// DEPOIS
model User {
  id        String @id
  fullName  String  // ← Novo nome
}
```

```sql
-- Migração manual necessária
ALTER TABLE "users" RENAME COLUMN "name" TO "full_name";
```

### **5. Adicionar Tabela**
```prisma
// Novo modelo
model Category {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]

  @@map("categories")
}

// Relacionamento
model Post {
  id         String @id @default(cuid())
  categoryId String

  category   Category @relation(fields: [categoryId], references: [id])
}
```

```sql
-- Migração gerada
CREATE TABLE "categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

ALTER TABLE "posts" ADD COLUMN "category_id" TEXT;

ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id");
```

### **6. Adicionar Enum**
```prisma
// ANTES
enum UserRole {
  USER
  ADMIN
}

// DEPOIS
enum UserRole {
  USER
  ADMIN
  MANAGER  // ← Novo valor
}
```

```sql
-- Migração gerada
ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
```

## 🧪 **Migrações Customizadas**

### **Quando Usar**
- Renomear colunas
- Transformar dados
- Lógica complexa
- Validações customizadas

### **Exemplo: Renomear Coluna**
```typescript
// prisma/migrations/[timestamp]/migration.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Renomear coluna
  await prisma.$executeRaw`
    ALTER TABLE "users" RENAME COLUMN "name" TO "full_name";
  `

  // Popular dados se necessário
  await prisma.$executeRaw`
    UPDATE "users" SET "full_name" = 'Unknown' WHERE "full_name" IS NULL;
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

### **Exemplo: Transformar Dados**
```typescript
// prisma/migrations/[timestamp]/migration.ts
async function main() {
  // Transformar string em enum
  await prisma.$executeRaw`
    UPDATE "users"
    SET "role" = 'ADMIN'::"UserRole"
    WHERE "email" LIKE '%@admin.company.com';
  `

  // Padronizar formato de telefone
  await prisma.$executeRaw`
    UPDATE "users"
    SET "phone" = REGEXP_REPLACE("phone", '[^0-9]', '', 'g')
    WHERE "phone" IS NOT NULL;
  `
}
```

## 🌱 **Seeds - Dados Iniciais**

### **Arquivo de Seed**
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Criar usuário admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@intranet.com' },
    update: {},
    create: {
      id: 'admin_user_id',
      email: 'admin@intranet.com',
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'ADMIN',
      enterprise: 'NA',
    },
  })

  // Criar salas
  const rooms = [
    { id: 'room_001', name: 'Sala de Reunião A', capacity: 10 },
    { id: 'room_002', name: 'Sala de Reunião B', capacity: 8 },
    { id: 'room_003', name: 'Auditório', capacity: 50 },
  ]

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: {},
      create: room,
    })
  }

  // Criar restaurantes
  const restaurants = [
    { id: 'rest_001', name: 'Restaurante Principal' },
    { id: 'rest_002', name: 'Lanchonete' },
  ]

  for (const restaurant of restaurants) {
    await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      update: {},
      create: restaurant,
    })
  }

  console.log('✅ Seed completed!')
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

### **Executar Seed**
```bash
# Desenvolvimento
npx prisma db seed

# Com arquivo específico
npx prisma db seed --seed prisma/seed.ts

# Forçar re-seed
npx prisma db seed --force
```

### **Seeds por Ambiente**
```typescript
// prisma/seed-development.ts
// Dados de desenvolvimento
const devUsers = [
  {
    id: 'user_dev_1',
    email: 'user1@company.com',
    firstName: 'João',
    lastName: 'Silva',
    role: 'USER',
    enterprise: 'Box',
    setor: 'TI',
  },
  // ... mais usuários
]

// prisma/seed-production.ts
// Dados de produção (mínimos)
const prodUsers = [
  {
    id: 'admin_prod',
    email: 'admin@company.com',
    firstName: 'Admin',
    lastName: 'Produção',
    role: 'ADMIN',
    enterprise: 'NA',
  }
]
```

## 📊 **Migração de Dados**

### **Cenários Comuns**

#### **1. Popular Campo Obrigatório**
```typescript
// Quando adicionar campo obrigatório
async function main() {
  // Popular com valor padrão
  await prisma.$executeRaw`
    UPDATE "products"
    SET "category" = 'Geral'
    WHERE "category" IS NULL;
  `

  // Alterar para NOT NULL
  await prisma.$executeRaw`
    ALTER TABLE "products"
    ALTER COLUMN "category" SET NOT NULL;
  `
}
```

#### **2. Migrar Enum**
```typescript
// Quando alterar valores do enum
async function main() {
  // Mapear valores antigos para novos
  const mappings = {
    'OLD_VALUE': 'NEW_VALUE',
    'ANOTHER_OLD': 'ANOTHER_NEW',
  }

  for (const [oldValue, newValue] of Object.entries(mappings)) {
    await prisma.$executeRaw`
      UPDATE "users"
      SET "role" = ${newValue}::"UserRole"
      WHERE "role" = ${oldValue}::"UserRole";
    `
  }
}
```

#### **3. Limpeza de Dados**
```typescript
// Limpar dados órfãos
async function main() {
  // Remover bookings sem sala
  await prisma.$executeRaw`
    DELETE FROM "bookings"
    WHERE "room_id" NOT IN (SELECT "id" FROM "rooms");
  `

  // Remover orders sem usuário
  await prisma.$executeRaw`
    DELETE FROM "food_orders"
    WHERE "user_id" NOT IN (SELECT "id" FROM "users");
  `
}
```

## 🔄 **Rollback de Migrações**

### **Desenvolvimento**
```bash
# Desfazer última migração
npx prisma migrate reset

# Desfazer migrations específicas
npx prisma migrate resolve --rolled-back [migration_name]
```

### **Produção (Cuidado!)**
```bash
# Backup antes de qualquer operação
pg_dump intranet_prod > backup_before_rollback.sql

# Rollback manual (consultar DBA)
psql -d intranet_prod -f prisma/migrations/[timestamp]/migration.sql
```

## 📋 **Boas Práticas**

### **📝 Convenções de Nome**
```bash
# Formato: [ação]_[entidade]_[detalhe]

# ✅ Bom
add_user_phone_field
create_booking_status_enum
remove_product_temp_column
update_user_role_values

# ❌ Ruim
migration1
fix_stuff
update
```

### **🔍 Testes de Migração**
```typescript
// prisma/test-migration.ts
async function testMigration() {
  const prisma = new PrismaClient()

  try {
    // Testar queries afetadas
    const users = await prisma.user.findMany({
      select: { id: true, phone: true }
    })

    console.log('✅ Migration successful!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}
```

### **📊 Validação de Dados**
```typescript
// Validar antes de migrar
async function validateBeforeMigration() {
  const issues = []

  // Verificar integridade referencial
  const orphanedRecords = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM "bookings" b
    LEFT JOIN "rooms" r ON b."room_id" = r."id"
    WHERE r."id" IS NULL;
  `

  if (orphanedRecords[0].count > 0) {
    issues.push(`Found ${orphanedRecords[0].count} orphaned bookings`)
  }

  if (issues.length > 0) {
    console.error('❌ Data validation failed:', issues)
    process.exit(1)
  }
}
```

## 📋 **Checklist de Migração**

### 🏗️ **Planejamento**
- [ ] Schema alterado no arquivo correto
- [ ] Dados validados antes da migração
- [ ] Backup realizado (produção)
- [ ] Rollback plan definido
- [ ] Comunicação com stakeholders

### 🔧 **Execução**
- [ ] Migração gerada com nome descritivo
- [ ] Queries customizadas testadas
- [ ] Constraints validadas
- [ ] Índices criados quando necessário

### 🧪 **Testes**
- [ ] Aplicação compila após migração
- [ ] Queries afetadas testadas
- [ ] Performance não degradada
- [ ] Dados íntegros após migração

### 🚀 **Deploy**
- [ ] Migração aplicada em staging primeiro
- [ ] Rollback testado em staging
- [ ] Deploy em produção agendado
- [ ] Monitoramento ativo durante deploy

### 📊 **Pós-Deploy**
- [ ] Logs verificados
- [ ] Métricas de performance ok
- [ ] Usuários notificados se necessário
- [ ] Documentação atualizada

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe de Backend

