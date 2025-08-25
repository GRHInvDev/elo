# ⚙️ Setup do Sistema de Intranet ELO

## 📋 Pré-requisitos

### 🔧 Requisitos Mínimos
- **Node.js**: 18.17.0 ou superior
- **NPM**: 9.0.0 ou superior (recomendado Yarn/PNPM)
- **PostgreSQL**: 15.0 ou superior
- **Git**: 2.30.0 ou superior

### 🖥️ Sistema Operacional
- ✅ **Windows 10/11**
- ✅ **macOS 12+**
- ✅ **Linux (Ubuntu 20.04+, CentOS 8+)**
- ✅ **Docker** (opcional, para desenvolvimento)

## 🚀 Instalação Rápida

### 📥 1. Clone o Repositório
```bash
# Clone via HTTPS
git clone https://github.com/company/intranet-elo.git
cd intranet-elo

# Ou via SSH
git clone git@github.com:company/intranet-elo.git
cd intranet-elo
```

### 📦 2. Instale Dependências
```bash
# Com NPM (padrão)
npm install

# Ou com Yarn (recomendado para performance)
yarn install

# Ou com PNPM (mais rápido e eficiente)
pnpm install
```

### 🔧 3. Configure o Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite as variáveis de ambiente
code .env.local
```

### 🗄️ 4. Configure o Banco de Dados
```bash
# Gere o cliente Prisma
npm run db:generate

# Execute as migrações
npm run db:migrate

# Ou se preferir push direto (desenvolvimento)
npm run db:push
```

### ▶️ 5. Execute o Sistema
```bash
# Desenvolvimento com hot-reload
npm run dev

# Build para produção
npm run build

# Execute em produção
npm run start
```

## 📝 Configuração Detalhada

### 🔐 Variáveis de Ambiente

#### Arquivo `.env.local`
```env
# =================================
# DATABASE
# =================================
DATABASE_URL="postgresql://username:password@localhost:5432/intranet_db"

# =================================
# CLERK AUTHENTICATION
# =================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# =================================
# UPLOADTHING
# =================================
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"

# =================================
# EMAIL CONFIGURATION
# =================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@company.com"
SMTP_PASS="app-specific-password"

# =================================
# APPLICATION
# =================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

#### Como Obter as Chaves

##### Clerk.js (Autenticação)
1. Acesse [Clerk Dashboard](https://dashboard.clerk.com)
2. Crie uma nova aplicação
3. Copie as chaves de API

##### UploadThing (Upload de Arquivos)
1. Acesse [UploadThing](https://uploadthing.com)
2. Crie uma conta
3. Gere as chaves de API

##### Email (SMTP)
- **Gmail**: Use app passwords
- **Outlook**: Configure SMTP settings
- **Empresa**: Consulte IT

### 🐘 PostgreSQL Setup

#### 🐧 Linux (Ubuntu/Debian)
```bash
# Instale PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Crie usuário e banco
sudo -u postgres createuser --createdb --superuser your_username
sudo -u postgres createdb intranet_db

# Configure senha
sudo -u postgres psql -c "ALTER USER your_username PASSWORD 'your_password';"
```

#### 🍎 macOS
```bash
# Instale via Homebrew
brew install postgresql

# Inicie o serviço
brew services start postgresql

# Crie banco
createdb intranet_db
```

#### 🪟 Windows
```bash
# Baixe e instale PostgreSQL
# URL: https://www.postgresql.org/download/windows/

# Use pgAdmin ou psql para criar banco
createdb intranet_db
```

#### 🐳 Docker (Recomendado)
```bash
# Execute PostgreSQL em container
docker run --name intranet-postgres \
  -e POSTGRES_DB=intranet_db \
  -e POSTGRES_USER=your_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15

# Para desenvolvimento, use docker-compose
docker-compose up -d
```

### 📊 Prisma Setup

#### Geração do Cliente
```bash
# Gera o cliente Prisma baseado no schema
npm run db:generate
```

#### Migrações do Banco
```bash
# Aplica migrações pendentes (produção)
npm run db:migrate

# Push schema direto (desenvolvimento)
npm run db:push

# Reset completo do banco (cuidado!)
npx prisma migrate reset
```

#### Prisma Studio (GUI)
```bash
# Abra interface gráfica para o banco
npm run db:studio
```

## 🧪 Verificação da Instalação

### ✅ Testes Automáticos
```bash
# Execute todos os testes
npm test

# Testes específicos
npm run test:unit    # Testes unitários
npm run test:e2e     # Testes end-to-end
npm run test:lint    # Linting
```

### 🔍 Verificações Manuais

#### 1. **Banco de Dados**
```bash
# Verifique conexão
npx prisma db push --preview-feature

# Liste tabelas
npx prisma studio
```

#### 2. **Build da Aplicação**
```bash
# Verifique se compila sem erros
npm run build

# TypeScript check
npm run typecheck
```

#### 3. **Linting**
```bash
# Verifique padrões de código
npm run lint

# Auto-fix
npm run lint:fix
```

## 🏃‍♂️ Primeiros Passos

### 🌐 Acesse a Aplicação
- **Desenvolvimento**: http://localhost:3000
- **Produção**: Configure domínio

### 👤 Criação do Primeiro Usuário
1. Acesse `/sign-up`
2. Use email corporativo
3. Primeiro usuário é admin automaticamente

### 🔧 Configuração Inicial
1. **Dashboard**: Personalize widgets
2. **Salas**: Configure espaços disponíveis
3. **Cardápios**: Configure restaurantes
4. **Formulários**: Crie templates padrão

## 🐛 Troubleshooting

### 🔴 Problemas Comuns

#### ❌ **Erro de Conexão com Banco**
```bash
# Verifique se PostgreSQL está rodando
sudo systemctl status postgresql

# Teste conexão
psql -h localhost -U your_user -d intranet_db
```

#### ❌ **Erro de Porta Ocupada (3000)**
```bash
# Use porta diferente
npm run dev -- -p 3001

# Ou mate processo na porta 3000
npx kill-port 3000
```

#### ❌ **Erro de Dependências**
```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

#### ❌ **Erro de Variáveis de Ambiente**
```bash
# Verifique se .env.local existe
ls -la .env*

# Recarregue variáveis
source .env.local
```

### 📞 Suporte
- **📧 Email**: dev@intranet.com
- **💬 Slack**: #setup-intranet
- **🐛 Issues**: [GitHub](https://github.com/company/intranet-elo/issues)

## 📋 Checklist de Setup

- [ ] Repositório clonado
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL configurado
- [ ] Dependências instaladas
- [ ] `.env.local` configurado
- [ ] Banco de dados criado
- [ ] Prisma client gerado
- [ ] Migrações aplicadas
- [ ] Build funcionando
- [ ] Aplicação rodando
- [ ] Primeiro usuário criado

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe de DevOps

