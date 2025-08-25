# 📦 Dependências e Versões

## 🔧 Stack Tecnológico Principal

### 🎨 Frontend Framework
```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "typescript": "^5.0.0"
}
```

### 🎯 UI Components
```json
{
  "@radix-ui/react-dialog": "^1.1.6",
  "@radix-ui/react-dropdown-menu": "^2.1.6",
  "@radix-ui/react-select": "^2.1.6",
  "@radix-ui/react-tabs": "^1.1.3",
  "@radix-ui/react-toast": "^1.2.6",
  "lucide-react": "^0.294.0",
  "tailwindcss": "^3.3.0"
}
```

### ⚙️ Backend & Database
```json
{
  "@prisma/client": "^5.14.0",
  "prisma": "^5.14.0",
  "@trpc/client": "^11.0.0-rc.446",
  "@trpc/server": "^11.0.0-rc.446",
  "zod": "^3.22.0"
}
```

### 🔐 Authentication
```json
{
  "@clerk/nextjs": "^6.12.0",
  "@clerk/localizations": "^3.10.8"
}
```

## 📋 Dependências de Desenvolvimento

### 🔨 Build & Development
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/react-dom": "^18.0.0",
  "autoprefixer": "^10.4.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^14.0.0",
  "postcss": "^8.4.0",
  "prettier": "^3.0.0",
  "tailwindcss": "^3.3.0",
  "typescript": "^5.0.0"
}
```

### 🧪 Testing
```json
{
  "@testing-library/jest-dom": "^6.0.0",
  "@testing-library/react": "^14.0.0",
  "jest": "^29.0.0",
  "jest-environment-jsdom": "^29.0.0"
}
```

### 📚 Documentation
```json
{
  "typedoc": "^0.25.0",
  "markdownlint-cli": "^0.37.0"
}
```

## 🗄️ Database Schema Version

### Prisma Schema
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Modelos Principais
- **User**: Autenticação e perfis
- **Room**: Reserva de salas
- **FoodOrder**: Pedidos de alimentação
- **VehicleRent**: Locação de veículos
- **Suggestion**: Sistema de ideias
- **Form**: Formulários dinâmicos

## 🔄 Versionamento

### Estratégia de Versionamento
- **SemVer**: Major.Minor.Patch
- **Breaking Changes**: Major version
- **Novas Features**: Minor version
- **Bug Fixes**: Patch version

### Versionamento de Dependências
```json
{
  "next": "^14.0.0",           // Permite updates de patch
  "react": "^18.2.0",          // Fixa major e minor
  "@prisma/client": "^5.14.0", // Fixa versão específica
  "zod": "^3.22.0"             // Permite updates compatíveis
}
```

## 📦 Gerenciamento de Dependências

### Scripts NPM
```json
{
  "scripts": {
    "install": "npm install",
    "install:ci": "npm ci",
    "update": "npm update",
    "audit": "npm audit",
    "audit:fix": "npm audit fix"
  }
}
```

### Boas Práticas
1. **Lock Files**: Sempre commite `package-lock.json`
2. **CI/CD**: Use `npm ci` em pipelines
3. **Security**: Execute `npm audit` regularmente
4. **Updates**: Teste thoroughly antes de major updates

## 🐳 Docker Configuration

### Dockerfile
```dockerfile
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

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/intranet
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=intranet
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    ports:
      - "5432:5432"
```

## 🔒 Security Dependencies

### Dependências de Segurança
- **@clerk/nextjs**: Autenticação segura
- **zod**: Validação de dados
- **@t3-oss/env-nextjs**: Validação de variáveis de ambiente

### Auditoria de Segurança
```bash
# Execute auditoria de segurança
npm audit

# Fix vulnerabilidades automáticas
npm audit fix

# Fix com breaking changes
npm audit fix --force
```

## 🚀 Otimização de Bundle

### Bundle Analyzer
```bash
# Instale analyzer
npm install --save-dev @next/bundle-analyzer

# Execute análise
npm run build:analyze
```

### Estratégias de Otimização
1. **Code Splitting**: Componentes lazy-loaded
2. **Tree Shaking**: Remoção de código morto
3. **Image Optimization**: Next.js Image component
4. **Font Optimization**: Google Fonts otimizado

## 📊 Dependências por Módulo

### Core System
- **Next.js**: Framework principal
- **React**: Interface do usuário
- **TypeScript**: Type safety

### Database Layer
- **Prisma**: ORM e migrações
- **PostgreSQL**: Banco de dados

### UI/UX Layer
- **Radix UI**: Componentes primitivos
- **Tailwind CSS**: Estilização
- **Lucide React**: Ícones

### Business Logic
- **tRPC**: API type-safe
- **Zod**: Validação de schemas
- **React Hook Form**: Formulários

### External Services
- **Clerk**: Autenticação
- **UploadThing**: File uploads
- **Nodemailer**: Email service

## 📋 Checklist de Dependências

### Setup Inicial
- [ ] Node.js 18+ instalado
- [ ] NPM/Yarn configurado
- [ ] Dependências instaladas
- [ ] Prisma client gerado

### Manutenção
- [ ] Auditoria de segurança mensal
- [ ] Updates de dependências regulares
- [ ] Testes após updates
- [ ] Documentação de breaking changes

### Produção
- [ ] Dependências de produção apenas
- [ ] Bundle otimizado
- [ ] Security audit passado
- [ ] Performance testado

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe de DevOps

