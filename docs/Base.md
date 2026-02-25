# Sistema de Intranet Corporativa - Documentação Geral  

## Visão Geral do Sistema


**Nome**: Sistema de Intranet ELO  

**Tipo**: Plataforma Corporativa Integrada  

**Tecnologias**: Next.js 15, React, tRPC, Prisma, PostgreSQL, Clerk Auth  

**Objetivo**: Centralizar funcionalidades corporativas e promover engajamento dos colaboradores

  

## Arquitetura Geral

  

### Stack Tecnológico

  

#### Frontend

- **Framework**: Next.js 15 (App Router)

- **UI Library**: React 19 + TypeScript

- **Styling**: Tailwind CSS + shadcn/ui

- **State Management**: React Hooks + tRPC Cache

- **Forms**: React Hook Form + Zod Validation

- **Icons**: Lucide React

- **Notifications**: Sonner Toast

  

#### Backend

- **API Layer**: tRPC (Type-safe APIs)

- **Database**: PostgreSQL + Prisma ORM

- **Authentication**: Clerk.js

- **File Upload**: UploadThing

- **Email**: Nodemailer + HTML Templates

- **Validation**: Zod Schemas

  

#### Infrastructure

- **Deployment**: Vercel / Railway

- **Database Hosting**: PostgreSQL Cloud

- **File Storage**: UploadThing CDN

- **Environment**: Dev/Test/Prod segregados

  

### Estrutura do Projeto

  

```

elo/

├── src/

│   ├── app/                    # Next.js App Router

│   │   ├── (auth)/            # Páginas de autenticação

│   │   ├── (authenticated)/   # Páginas protegidas

│   │   └── api/               # API Routes e tRPC

│   ├── components/            # Componentes React reutilizáveis

│   ├── server/                # Lógica backend (tRPC routers)

│   ├── lib/                   # Utilitários e configurações

│   ├── hooks/                 # Custom React hooks

│   ├── types/                 # Definições TypeScript

│   └── styles/                # Estilos globais

├── prisma/                    # Schema e migrações do banco

├── docs/                      # Documentação do sistema

└── public/                    # Assets estáticos

```

  

## Módulos do Sistema

  

### 1. 🏠 **Dashboard Central**

**Rota**: `/dashboard`  

**Funcionalidade**: Página inicial com visão geral

  

#### Recursos:

- **Carousel Principal**: Posts e notícias importantes

- **Aniversários do Mês**: Carrossel de colaboradores

- **Vídeos Institucionais**: Conteúdo corporativo

- **Quick Access**: Atalhos para módulos principais

- **Layout Responsivo**: Mobile-first design

  

#### Componentes:

- `MainCarousel` - Slider de posts principais

- `BirthdaysCarousel` - Aniversariantes

- `VideosCarousel` - Conteúdo multimídia

- `QuickAccess` - Menu de navegação rápida

  

---

  

### 2. 🍽️ **Sistema de Alimentação**

**Rota**: `/food`  

**Funcionalidade**: Pedidos de almoço com restaurantes parceiros

  

#### Recursos:

- **Cardápios Dinâmicos**: Gerenciados pelos restaurantes

- **Pedidos Online**: Interface intuitiva de seleção

- **Opções Personalizáveis**: Escolhas de acompanhamentos

- **Horários Controlados**: Janelas de pedido configuráveis

- **Histórico de Pedidos**: Acompanhamento de solicitações

  

#### Modelos do Banco:

```prisma

model Restaurant {

  id        String @id @default(cuid())

  name      String

  imageUrl  String?

  isActive  Boolean @default(true)

  menuItems MenuItem[]

}

  

model MenuItem {

  id           String @id @default(cuid())

  name         String

  description  String?

  price        Decimal

  imageUrl     String?

  category     String?

  restaurantId String

  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])

  options      MenuItemOption[]

}

  

model FoodOrder {

  id         String @id @default(cuid())

  userId     String

  user       User @relation(fields: [userId], references: [id])

  items      Json // Array de itens do pedido

  totalPrice Decimal

  status     OrderStatus @default(PENDING)

  createdAt  DateTime @default(now())

}

```

  

---

  

### 3. 🏢 **Sistema de Reserva de Salas**

**Rota**: `/rooms`  

**Funcionalidade**: Agendamento de salas de reunião

  

#### Recursos:

- **Calendário Integrado**: Visualização de disponibilidade

- **Reservas em Tempo Real**: Verificação instantânea

- **Mapa de Salas**: Localização visual das salas

- **Gestão de Conflitos**: Prevenção de duplas reservas

- **Filtros Avançados**: Por capacidade, recursos, localização

  

#### Componentes:

- `RoomCalendar` - Interface de agendamento

- `RoomMap` - Visualização espacial

- `AvailableRooms` - Lista de salas disponíveis

- `MyBookings` - Reservas do usuário

  

---

  

### 4. 🚗 **Sistema de Frota de Veículos**

**Rota**: `/cars`  

**Funcionalidade**: Reserva e gestão de veículos corporativos

  

#### Recursos:

- **Catálogo de Veículos**: Cards informativos com especificações

- **Sistema de Reserva**: Datas e horários disponíveis

- **Gestão de Locações**: Controle de retirada/devolução

- **Histórico de Uso**: Relatórios por usuário

- **Status em Tempo Real**: Disponibilidade atualizada

  

#### Fluxo de Reserva:

1. **Seleção do Veículo**: Lista com filtros

2. **Escolha de Datas**: Calendário de disponibilidade

3. **Confirmação**: Detalhes da reserva

4. **Acompanhamento**: Status da locação

  

---

  

### 5. 📅 **Sistema de Eventos**

**Rota**: `/events`  

**Funcionalidade**: Gestão de eventos corporativos

  

#### Recursos:

- **Criação de Eventos**: Interface administrativa

- **Inscrições Online**: Sistema de participação

- **Calendário Visual**: Visualização temporal

- **Notificações**: Lembretes automáticos

- **Gerenciamento de Participantes**: Listas e controle

  

---

  

### 6. 📰 **Sistema de Encartes e Flyers**

**Rota**: `/flyers`  

**Funcionalidade**: Publicação de materiais promocionais

  

#### Recursos:

- **Upload de Imagens**: Interface drag-and-drop

- **Galeria Organizada**: Categorização por tipo

- **Visualização Responsiva**: Adaptação a diferentes telas

- **Gestão de Campanhas**: Controle de publicação

- **Métricas de Visualização**: Analytics básicos

  

---

  

### 7. 🛒 **Loja Corporativa**

**Rota**: `/shop`  

**Funcionalidade**: Venda de produtos personalizados

  

#### Recursos:

- **Catálogo de Produtos**: Grid responsivo

- **Carrinho de Compras**: Gestão de itens

- **Checkout Integrado**: Processo de pagamento

- **Produtos Personalizados**: BOX e Cristallux branded

- **Gestão de Estoque**: Controle administrativo

  

---

  

### 8. 📋 **Sistema de Formulários**

**Rota**: `/forms`  

**Funcionalidade**: Processos internos digitalizados

  

#### Recursos Principais:

- **Builder Dinâmico**: Criação de formulários customizados

- **Tipos de Campo Diversos**: Text, Number, Select, Date, etc.

- **Kanban de Respostas**: Gestão visual do fluxo

- **Workflow Configurável**: Etapas personalizáveis

- **Relatórios Automáticos**: Export de dados

  

#### Subpáginas:

- `/forms/new` - Criação de formulários

- `/forms/[id]` - Visualização de formulário

- `/forms/[id]/edit` - Edição de formulário

- `/forms/[id]/respond` - Resposta ao formulário

- `/forms/[id]/responses` - Gestão de respostas

- `/forms/kanban` - Visão Kanban

- `/forms/my-responses` - Respostas do usuário

  

#### Componentes Técnicos:

```typescript

// Form Builder com tipos dinâmicos

interface FormField {

  id: string

  type: 'text' | 'number' | 'select' | 'date' | 'textarea'

  label: string

  required: boolean

  options?: string[] // Para selects

  validation?: ValidationRules

}

  

// Kanban para gestão de respostas

interface KanbanColumn {

  id: string

  title: string

  status: ResponseStatus

  responses: FormResponse[]

}

```

  

---

  

### 9. 💡 **Sistema de Sugestões + KPIs**

**Rota**: Integrado ao `/admin` e cards públicos  

**Funcionalidade**: Coleta e gestão de ideias corporativas

  

#### Recursos Completos:

- **Submissão Pública**: Cards acessíveis para todos

- **Classificação Dinâmica**: Impacto, Capacidade, Esforço (0-20)

- **Pontuação Automática**: Algoritmo de recomendação

- **KPIs Reutilizáveis**: Métricas de sucesso vinculáveis

- **Workflow de Status**: NEW → IN_REVIEW → APPROVED → DONE

- **Notificações por Email**: Updates automáticos

- **Painel Administrativo**: Kanban + Lista detalhada

  

*Detalhes completos em: [Documentação do Módulo de Sugestões](./modulo-sugestoes.md)*

  

---

  

### 10. 🎂 **Sistema de Aniversários**

**Rota**: Integrado ao Dashboard  

**Funcionalidade**: Celebração de aniversariantes

  

#### Recursos:

- **Carrossel Automático**: Aniversariantes do mês

- **Upload de Fotos**: Galeria personalizada

- **Notificações**: Lembretes de aniversários

- **Gestão Administrativa**: CRUD de colaboradores

  

---

  

### 11. 📰 **Sistema de Notícias**

**Rota**: `/news`  

**Funcionalidade**: Central de comunicação interna

  

#### Recursos:

- **Posts Dinâmicos**: Criação de conteúdo

- **Categorização**: Organização por temas

- **Comentários**: Interação dos colaboradores

- **Reações**: Like/Dislike system

- **Rich Text Editor**: Formatação avançada

  

---

  

### 12. 🔧 **Painel Administrativo**

**Rota**: `/admin`  

**Funcionalidade**: Gestão centralizada do sistema

  

#### Módulos Administrativos:

- **Sugestões** (`/admin/suggestions`) - Gestão completa de ideias

- **Aniversários** (`/admin/birthday`) - Gestão de aniversariantes  

- **Cardápios** (`/admin/food`) - Editor de menus

- **Salas** (`/admin/rooms`) - Configuração de espaços

- **Notícias** (`/admin/news`) - Gestão de posts

  

#### Recursos Administrativos:

- **Dashboard de Métricas**: KPIs do sistema

- **Gestão de Usuários**: Roles e permissões

- **Configurações Globais**: Parâmetros do sistema

- **Logs de Auditoria**: Rastreamento de ações

  

---

  

## Sistema de Autenticação e Autorização

  

### Clerk.js Integration

```typescript

// Tipos de usuário

enum UserRole {

  USER = "USER"           // Colaborador padrão

  ADMIN = "ADMIN"         // Administrador geral

  TOTEM = "TOTEM"         // Totem/Kiosk mode

}

  

// Middleware de autorização

const adminProcedure = publicProcedure.use(middleware(

  async ({ ctx, next }) => {

    if (!ctx.auth?.userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

    const user = await ctx.db.user.findUnique({

      where: { id: ctx.auth.userId }

    })

    if (user?.role !== 'ADMIN') {

      throw new TRPCError({ code: 'FORBIDDEN' })

    }

    return next({ ctx: { ...ctx, user } })

  }

))

```

  

### Proteção de Rotas

- **Públicas**: `/`, `/sign-in`, `/sign-up`

- **Autenticadas**: Todas dentro de `(authenticated)/`

- **Administrativas**: Rotas `/admin/*` requerem role ADMIN

- **Middleware**: Verificação automática em `middleware.ts`

  

## Sistema de Upload e Arquivos

  

### UploadThing Integration

```typescript

// Configuração de tipos de arquivo

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

  

### Tipos de Upload Suportados:

- **Imagens**: JPG, PNG, WebP (até 4MB)

- **Documentos**: PDF (até 16MB)

- **Avatars**: Fotos de perfil (até 2MB)

- **Banners**: Materiais promocionais (até 8MB)

  

## Sistema de Notificações

  

### Email Templates

**Localização**: `src/lib/mail/html-mock.ts`

  

#### Templates Disponíveis:

- **Sugestão Aprovada**: Notificação de mudança de status

- **Sugestão Rejeitada**: Email específico com motivo

- **Evento Criado**: Convite para participação

- **Reserva Confirmada**: Sala/Veículo reservado

- **Pedido Confirmado**: Confirmação de almoço

  

### Sistema de Toast

```typescript

// Notificações in-app

import { toast } from "@/hooks/use-toast"

  

toast({

  title: "Sucesso!",

  description: "Operação realizada com sucesso.",

  variant: "success"

})

```

  

## Performance e Otimização

  

### Estratégias Implementadas:

- **Server Components**: Renderização no servidor

- **Static Generation**: Páginas pré-renderizadas onde possível

- **Image Optimization**: Next.js Image component

- **Code Splitting**: Lazy loading de componentes

- **Database Indexing**: Queries otimizadas no Prisma

  

### Métricas de Performance:

- **First Contentful Paint**: < 1.5s

- **Largest Contentful Paint**: < 2.5s

- **Cumulative Layout Shift**: < 0.1

- **First Input Delay**: < 100ms

  

## Monitoramento e Observabilidade

  

### Logs do Sistema:

- **API Requests**: Todos os endpoints tRPC

- **Database Queries**: Performance do Prisma

- **Authentication Events**: Login/logout via Clerk

- **Upload Events**: Arquivos via UploadThing

- **Email Delivery**: Status de envios

  

### Error Handling:

```typescript

// Boundary de erro global

export function GlobalErrorBoundary({ error, reset }: ErrorBoundaryProps) {

  return (

    <div className="error-boundary">

      <h2>Algo deu errado!</h2>

      <details>{error.message}</details>

      <button onClick={reset}>Tentar novamente</button>

    </div>

  )

}

```

  

## Configuração de Ambiente

  

### Variáveis Necessárias:

```env

# Database

DATABASE_URL="postgresql://username:password@localhost:5432/intranet"

  

# Authentication (Clerk)

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

CLERK_SECRET_KEY="sk_test_..."

  

# Upload (UploadThing)

UPLOADTHING_SECRET="sk_live_..."

UPLOADTHING_APP_ID="your-app-id"

  

# Email (SMTP)

SMTP_HOST="smtp.gmail.com"

SMTP_PORT="587"

SMTP_USER="your-email@company.com"

SMTP_PASS="app-specific-password"

  

# App Configuration

NEXT_PUBLIC_APP_URL="https://intranet.company.com"

NODE_ENV="production"

```

  

### Scripts Disponíveis:

```json

{

  "scripts": {

    "dev": "next dev",

    "build": "next build",

    "start": "next start",

    "db:generate": "prisma generate",

    "db:push": "prisma db push",

    "db:migrate": "prisma migrate dev",

    "db:studio": "prisma studio",

    "lint": "next lint",

    "type-check": "tsc --noEmit"

  }

}

```

  

## Roadmap e Próximos Passos  

### Versão Atual: 1.0.0

#### Funcionalidades Completas:

- ✅ Autenticação e autorização

- ✅ Dashboard central

- ✅ Sistema de sugestões + KPIs

- ✅ Formulários dinâmicos

- ✅ Reserva de salas/veículos

- ✅ Sistema de alimentação

- ✅ Loja corporativa

- ✅ Gestão de eventos/flyers

  

### Versão 2.1.0 (Q2 2025)

#### Melhorias Planejadas:

- [ ] **Analytics Dashboard**: Métricas de uso por módulo

- [ ] **Push Notifications**: PWA com notificações

- [ ] **Mobile App**: React Native companion

- [ ] **API Pública**: Endpoints para integrações

- [ ] **Relatórios Avançados**: Export de dados em massa

  

### Versão 2.2.0 (Q3 2025)

#### Novas Funcionalidades:

- [ ] **Chat Interno**: Mensagens entre colaboradores

- [ ] **Gamificação**: Pontuação e rankings

- [ ] **Workflow Engine**: Aprovações customizáveis

- [ ] **Integração ERP**: Sincronização com sistemas externos

- [ ] **BI Dashboard**: Inteligência de negócios

  

### Versão 3.0.0 (Q4 2025)

#### Grandes Mudanças:

- [ ] **Arquitetura Microserviços**: Separação por domínio

- [ ] **GraphQL API**: Substituição gradual do tRPC

- [ ] **Real-time Features**: WebSockets para colaboração

- [ ] **AI Integration**: Chatbot e recomendações

- [ ] **Multi-tenancy**: Suporte a múltiplas empresas

  

## Conclusão

  

O Sistema de Intranet ELO representa uma solução completa e moderna para as necessidades corporativas, integrando múltiplos módulos em uma experiência coesa e eficiente. Com foco em:

  

- **📱 User Experience**: Interface intuitiva e responsiva

- **⚡ Performance**: Otimizações em todas as camadas

- **🔒 Security**: Autenticação robusta e autorização granular

- **🎛️ Flexibility**: Configurações dinâmicas e extensibilidade

- **📊 Analytics**: Dados estruturados para tomada de decisão

  

O sistema está preparado para escalar e evoluir junto com as necessidades organizacionais, mantendo sempre a qualidade técnica e a experiência do usuário como prioridades principais.

---

  

**Sistema Desenvolvido por**: Equipe de Inovação  

**Documentação criada em**: Agosto 2025  

**Versão do Sistema**: 1.0.0  

**Última Atualização**: Agosto 2025