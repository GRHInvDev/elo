# 🌍 Configuração de Ambiente

## 📋 Visão Geral

Este guia detalha a configuração completa dos ambientes de desenvolvimento, teste e produção do Sistema de Intranet ELO.

## 🏗️ Estrutura de Ambientes

### 🔧 Ambientes Suportados

| Ambiente | Propósito | URL Base | Database |
|----------|-----------|----------|----------|
| **Development** | Desenvolvimento local | `http://localhost:3000` | Local PostgreSQL |
| **Staging** | Testes de aceitação | `https://staging.intranet.com` | Staging Database |
| **Production** | Ambiente de produção | `https://intranet.company.com` | Production Database |

### 📊 Configurações por Ambiente

#### 🏠 **Development**
```env
# .env.local
NODE_ENV=development
DATABASE_URL="postgresql://user:pass@localhost:5432/intranet_dev"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Clerk (Development keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_dev_..."
CLERK_SECRET_KEY="sk_test_dev_..."

# UploadThing (Development)
UPLOADTHING_SECRET="sk_live_dev_..."
UPLOADTHING_APP_ID="dev-app-id"

# Email (Development SMTP)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
```

#### 🧪 **Staging**
```env
# .env.staging
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@staging-db:5432/intranet_staging"
NEXT_PUBLIC_APP_URL="https://staging.intranet.company.com"

# Clerk (Staging keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_staging_..."
CLERK_SECRET_KEY="sk_test_staging_..."

# UploadThing (Staging)
UPLOADTHING_SECRET="sk_live_staging_..."
UPLOADTHING_APP_ID="staging-app-id"

# Email (Staging SMTP)
SMTP_HOST="smtp.staging.company.com"
SMTP_PORT="587"
SMTP_USER="noreply@staging.company.com"
SMTP_PASS="staging-password"
```

#### 🚀 **Production**
```env
# .env.production
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-db:5432/intranet_prod"
NEXT_PUBLIC_APP_URL="https://intranet.company.com"

# Clerk (Production keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."

# UploadThing (Production)
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="prod-app-id"

# Email (Production SMTP)
SMTP_HOST="smtp.company.com"
SMTP_PORT="587"
SMTP_USER="noreply@company.com"
SMTP_PASS="production-password"
```

## 🗄️ Configuração do Banco de Dados

### 🐘 PostgreSQL Setup

#### Configurações Recomendadas

##### Development
```sql
-- Database: intranet_dev
-- User: intranet_user
-- Password: dev_password_123

CREATE DATABASE intranet_dev;
CREATE USER intranet_user WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE intranet_dev TO intranet_user;

-- Extensions necessárias
\c intranet_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

##### Production
```sql
-- Database: intranet_prod
-- User: intranet_prod_user
-- Password: strong_production_password

CREATE DATABASE intranet_prod;
CREATE USER intranet_prod_user WITH PASSWORD 'strong_production_password';
GRANT ALL PRIVILEGES ON DATABASE intranet_prod TO intranet_prod_user;

-- Extensions necessárias
\c intranet_prod;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurações de performance
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
```

### 🔄 Conexão com Prisma

#### Configuração do Schema
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Configurações específicas por ambiente
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL") // Para migrations
}
```

#### Estratégia de Conexão
```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## 🔐 Configuração de Autenticação

### Clerk.js Setup

#### 1. **Criação da Aplicação**
```bash
# Development
clerk create app intranet-dev

# Staging
clerk create app intranet-staging

# Production
clerk create app intranet-prod
```

#### 2. **Configuração de Domínios**
```javascript
// Clerk Dashboard > Domains
const domains = {
  development: ['localhost:3000', '127.0.0.1:3000'],
  staging: ['staging.intranet.company.com'],
  production: ['intranet.company.com']
}
```

#### 3. **Configuração de Roles**
```javascript
// src/lib/auth.ts
export const ROLES = {
  USER: 'USER',     // Colaborador padrão
  ADMIN: 'ADMIN',   // Administrador
  TOTEM: 'TOTEM'    // Kiosk mode
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]
```

## 📧 Configuração de Email

### SMTP Configuration

#### Development (MailHog)
```bash
# Usando Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# .env.local
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
```

#### Production (Gmail)
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="noreply@company.com"
SMTP_PASS="app-specific-password"
```

#### Production (AWS SES)
```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="AKIA..."
SMTP_PASS="your-ses-smtp-password"
```

### Templates de Email
```typescript
// src/lib/mail/templates.ts
export const EMAIL_TEMPLATES = {
  suggestionApproved: 'suggestion-approved.html',
  suggestionRejected: 'suggestion-rejected.html',
  eventCreated: 'event-created.html',
  bookingConfirmed: 'booking-confirmed.html',
  foodOrderReady: 'food-order-ready.html'
}
```

## 📁 Configuração de Upload

### UploadThing Setup

#### 1. **Criação da Aplicação**
```bash
# Development
uploadthing create app intranet-dev

# Production
uploadthing create app intranet-prod
```

#### 2. **Configuração de Limites**
```typescript
// src/lib/uploadthing.ts
export const fileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(({ req }) => auth(req))
    .onUploadComplete(({ metadata, file }) => {
      console.log("Upload completo:", file.url)
    }),

  documentUploader: f({ pdf: { maxFileSize: "16MB" } })
    .middleware(adminMiddleware)
    .onUploadComplete(handler)
}
```

#### 3. **Tipos de Arquivo Suportados**
```typescript
export const FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp'],
  documents: ['application/pdf'],
  avatars: ['image/jpeg', 'image/png'],
  banners: ['image/jpeg', 'image/png', 'image/webp']
}
```

## 🌐 Configuração de Domínios

### Next.js Configuration

#### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    customKey: process.env.CUSTOM_KEY,
  },
  images: {
    domains: ['localhost', 'intranet.company.com', 'staging.intranet.company.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/f/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/trpc/:path*',
        destination: '/api/trpc/:path*',
      },
    ]
  },
}

module.exports = nextConfig
```

## 🔒 Configurações de Segurança

### Headers de Segurança
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]
```

### Rate Limiting
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
})
```

## 📊 Monitoramento e Logs

### Configuração de Logs

#### Development
```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ℹ️ ${message}`, ...args)
    }
  },
  error: (message: string, error?: Error) => {
    console.error(`❌ ${message}`, error)
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️ ${message}`, ...args)
  }
}
```

#### Production
```typescript
// Integração com serviço de logs
import { logtail } from '@logtail/next'

export const logger = logtail
```

## 🧪 Configuração de Testes

### Variáveis para Testes
```env
# .env.test
NODE_ENV=test
DATABASE_URL="postgresql://user:pass@localhost:5432/intranet_test"

# Test-specific settings
TEST_EMAIL="test@company.com"
TEST_PASSWORD="test_password"
```

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
}
```

## 📋 Checklist de Configuração

### Ambiente Development
- [ ] `.env.local` configurado
- [ ] PostgreSQL local rodando
- [ ] Clerk app criada
- [ ] UploadThing configurado
- [ ] Email service funcionando

### Ambiente Staging
- [ ] `.env.staging` configurado
- [ ] Database staging criada
- [ ] Domínio staging configurado
- [ ] SSL certificate válido

### Ambiente Production
- [ ] `.env.production` configurado
- [ ] Database production criada
- [ ] Domínio principal configurado
- [ ] Backup strategy implementada
- [ ] Monitoring configurado

### Segurança
- [ ] Headers de segurança configurados
- [ ] Rate limiting implementado
- [ ] Logs de auditoria ativos
- [ ] Backup automático configurado

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe de DevOps

