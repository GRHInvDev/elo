# 📊 Modelos do Banco de Dados

## 👥 **User - Usuários**

### **Estrutura Completa**
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

  // Relations
  comments         Coment[]
  reactions        Reaction[]
  birthDay         Birthday?
  bookings         Booking[]
  events           Event[]
  flyers           Flyer[]
  foodOrders       FoodOrder[]
  forms            Form[]
  formResponses    FormResponse[]
  posts            Post[]
  vehicleRents     VehicleRent[]
  authoredSuggestions Suggestion[] @relation("SuggestionAuthor")
  analyzedSuggestions Suggestion[] @relation("SuggestionAnalyst")

  @@map("users")
}
```

### **Campos Detalhados**

| Campo | Tipo | Descrição | Obrigatório | Padrão |
|-------|------|-----------|-------------|---------|
| `id` | String | ID único (CUID) | ✅ | Auto |
| `email` | String | Email único do usuário | ✅ | - |
| `firstName` | String | Primeiro nome | ❌ | null |
| `lastName` | String | Sobrenome | ❌ | null |
| `imageUrl` | String | URL do avatar | ❌ | null |
| `role` | UserRole | Nível de acesso | ✅ | USER |
| `enterprise` | Enterprise | Empresa do usuário | ✅ | NA |
| `setor` | String | Setor/departamento | ❌ | null |
| `createdAt` | DateTime | Data de criação | ✅ | now() |
| `updatedAt` | DateTime | Última atualização | ✅ | auto |

### **Relacionamentos**
- **1:N** com 14 modelos diferentes
- **Central** do sistema - todos os módulos se conectam a User

### **Queries Comuns**
```typescript
// Buscar usuário com relacionamentos
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    bookings: true,
    foodOrders: true,
    suggestions: true,
    posts: true,
  }
})

// Usuários por empresa
const usersByEnterprise = await prisma.user.findMany({
  where: { enterprise: 'Box' },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    setor: true
  }
})
```

## 🏢 **Room & Booking - Sistema de Reservas**

### **Room (Salas)**
```prisma
model Room {
  id          String    @id @default(cuid())
  name        String
  description String?
  capacity    Int
  isActive    Boolean   @default(true)

  bookings    Booking[]

  @@map("rooms")
}
```

### **Booking (Reservas)**
```prisma
model Booking {
  id          String    @id @default(cuid())
  date        DateTime
  purpose     String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  userId      String
  roomId      String

  user        User      @relation(fields: [userId], references: [id])
  room        Room      @relation(fields: [roomId], references: [id])

  @@map("bookings")
}
```

### **Regras de Negócio**
- **Sem conflitos**: Uma sala não pode ter reservas simultâneas
- **Capacidade**: Deve respeitar limite da sala
- **Horário comercial**: Preferencialmente 8h-18h

### **Queries de Disponibilidade**
```typescript
// Verificar disponibilidade
const availableRooms = await prisma.room.findMany({
  where: {
    isActive: true,
    capacity: { gte: attendees },
    bookings: {
      none: {
        date: {
          equals: requestedDate
        }
      }
    }
  }
})

// Reservas do usuário
const userBookings = await prisma.booking.findMany({
  where: { userId },
  include: {
    room: true
  },
  orderBy: { date: 'desc' }
})
```

## 🚗 **Vehicle & VehicleRent - Sistema de Veículos**

### **Vehicle (Veículos)**
```prisma
model Vehicle {
  id          String    @id @default(cuid())
  name        String
  model       String?
  plate       String?   @unique
  capacity    Int
  isActive    Boolean   @default(true)
  imageUrl    String?

  rents       VehicleRent[]

  @@map("vehicles")
}
```

### **VehicleRent (Locações)**
```prisma
model VehicleRent {
  id            String           @id @default(cuid())
  startDate     DateTime
  endDate       DateTime
  purpose       String?
  status        VehicleRentStatus @default(PENDING)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  userId        String
  vehicleId     String

  user          User             @relation(fields: [userId], references: [id])
  vehicle       Vehicle          @relation(fields: [vehicleId], references: [id])

  @@map("vehicle_rents")
}
```

### **Status do Aluguel**
```prisma
enum VehicleRentStatus {
  PENDING     // Aguardando aprovação
  APPROVED    // Aprovada
  IN_USE      // Em uso
  RETURNED    // Devolvida
  CANCELLED   // Cancelada
}
```

### **Fluxo de Aluguel**
1. **PENDING** → Usuário solicita
2. **APPROVED** → Administrador aprova
3. **IN_USE** → Veículo retirado
4. **RETURNED** → Veículo devolvido

### **Queries de Veículos**
```typescript
// Veículos disponíveis
const availableVehicles = await prisma.vehicle.findMany({
  where: {
    isActive: true,
    capacity: { gte: passengers },
    rents: {
      none: {
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate }
          }
        ]
      }
    }
  }
})

// Histórico de aluguéis
const rentalHistory = await prisma.vehicleRent.findMany({
  where: { userId },
  include: {
    vehicle: true
  },
  orderBy: { createdAt: 'desc' }
})
```

## 🍽️ **Restaurant, MenuItem & FoodOrder - Alimentação**

### **Restaurant (Restaurantes)**
```prisma
model Restaurant {
  id          String    @id @default(cuid())
  name        String
  imageUrl    String?
  isActive    Boolean   @default(true)

  menuItems   MenuItem[]

  @@map("restaurants")
}
```

### **MenuItem (Itens do Cardápio)**
```prisma
model MenuItem {
  id            String    @id @default(cuid())
  name          String
  description   String?
  price         Decimal
  imageUrl      String?
  category      String?
  isActive      Boolean   @default(true)

  restaurantId  String

  restaurant    Restaurant @relation(fields: [restaurantId], references: [id])
  options       MenuItemOption[]
  orders        FoodOrder[]

  @@map("menu_items")
}
```

### **FoodOrder (Pedidos)**
```prisma
model FoodOrder {
  id            String      @id @default(cuid())
  items         Json        // Array de itens do pedido
  totalPrice    Decimal
  status        OrderStatus @default(PENDING)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  userId        String
  menuItemId    String

  user          User        @relation(fields: [userId], references: [id])
  menuItem      MenuItem    @relation(fields: [menuItemId], references: [id])

  @@map("food_orders")
}
```

### **Estrutura do JSON de Pedido**
```typescript
interface OrderItem {
  menuItemId: string
  quantity: number
  options?: {
    optionId: string
    choiceId: string
  }[]
  specialInstructions?: string
}

interface FoodOrderData {
  items: OrderItem[]
  totalPrice: number
  deliveryTime?: string
}
```

### **Queries de Cardápio**
```typescript
// Cardápio completo com opções
const menu = await prisma.menuItem.findMany({
  where: { isActive: true },
  include: {
    restaurant: true,
    options: {
      include: {
        choices: true
      }
    }
  },
  orderBy: [
    { category: 'asc' },
    { name: 'asc' }
  ]
})

// Pedidos do usuário
const userOrders = await prisma.foodOrder.findMany({
  where: { userId },
  include: {
    menuItem: {
      include: {
        restaurant: true
      }
    }
  },
  orderBy: { createdAt: 'desc' }
})
```

## 💡 **Suggestion & SuggestionKPI - Sistema de Sugestões**

### **Suggestion (Sugestões)**
```prisma
model Suggestion {
  id                String            @id @default(cuid())
  title             String
  description       String
  impact            Int               // 0-20
  capacity          Int               // 0-20
  effort            Int               // 0-20
  score             Float?
  status            SuggestionStatus  @default(NEW)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  authorId          String
  analystId         String?

  author            User              @relation("SuggestionAuthor", fields: [authorId], references: [id])
  analyst           User?             @relation("SuggestionAnalyst", fields: [analystId], references: [id])
  kpis              SuggestionKPI[]

  @@map("suggestions")
}
```

### **SuggestionKPI (KPIs)**
```prisma
model SuggestionKPI {
  id            String    @id @default(cuid())
  name          String
  description   String?
  value         Float
  unit          String?
  createdAt     DateTime  @default(now())

  suggestionId  String

  suggestion    Suggestion @relation(fields: [suggestionId], references: [id])

  @@map("suggestion_kpis")
}
```

### **Cálculo do Score**
```typescript
function calculateScore(impact: number, capacity: number, effort: number): number {
  // Impacto: 40%, Capacidade: 35%, Esforço: 25%
  return (impact * 0.4) + (capacity * 0.35) + ((21 - effort) * 0.25)
}
```

### **Workflow de Status**
```typescript
enum SuggestionStatus {
  NEW           // Nova sugestão
  IN_REVIEW     // Em análise pelo analista
  APPROVED      // Aprovada para implementação
  IMPLEMENTED   // Implementada
  REJECTED      // Rejeitada
}
```

### **Queries de Sugestões**
```typescript
// Sugestões com ranking
const suggestions = await prisma.suggestion.findMany({
  include: {
    author: {
      select: { firstName: true, lastName: true }
    },
    analyst: {
      select: { firstName: true, lastName: true }
    },
    kpis: true
  },
  orderBy: { score: 'desc' }
})

// Sugestões por status
const suggestionsByStatus = await prisma.suggestion.groupBy({
  by: ['status'],
  _count: { status: true }
})
```

## 📝 **Form & FormResponse - Sistema de Formulários**

### **Form (Formulários)**
```prisma
model Form {
  id            String      @id @default(cuid())
  title         String
  description   String?
  schema        Json        // Schema do formulário
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  authorId      String

  author        User        @relation(fields: [authorId], references: [id])
  responses     FormResponse[]

  @@map("forms")
}
```

### **FormResponse (Respostas)**
```prisma
model FormResponse {
  id            String      @id @default(cuid())
  data          Json        // Dados da resposta
  status        ResponseStatus @default(PENDING)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  userId        String
  formId        String

  user          User        @relation(fields: [userId], references: [id])
  form          Form        @relation(fields: [formId], references: [id])
  chats         FormResponseChat[]

  @@map("form_responses")
}
```

### **Estrutura do Schema**
```typescript
interface FormSchema {
  title: string
  description?: string
  fields: FormField[]
}

interface FormField {
  id: string
  type: 'text' | 'number' | 'select' | 'date' | 'textarea'
  label: string
  required: boolean
  options?: string[] // Para selects
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}
```

### **Queries de Formulários**
```typescript
// Formulários ativos
const activeForms = await prisma.form.findMany({
  where: { isActive: true },
  include: {
    author: {
      select: { firstName: true, lastName: true }
    },
    _count: {
      select: { responses: true }
    }
  }
})

// Respostas de um formulário
const formResponses = await prisma.formResponse.findMany({
  where: { formId },
  include: {
    user: {
      select: { firstName: true, lastName: true }
    }
  },
  orderBy: { createdAt: 'desc' }
})
```

## 📰 **Post, Comment & Reaction - Sistema de Conteúdo**

### **Post (Posts/Notícias)**
```prisma
model Post {
  id            String      @id @default(cuid())
  title         String
  content       String
  imageUrl      String?
  isPublished   Boolean     @default(false)
  publishedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  authorId      String

  author        User        @relation(fields: [authorId], references: [id])
  comments      Coment[]
  reactions     Reaction[]

  @@map("posts")
}
```

### **Coment (Comentários)**
```prisma
model Coment {
  id            String      @id @default(cuid())
  content       String
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  userId        String
  postId        String

  user          User        @relation(fields: [userId], references: [id])
  post          Post        @relation(fields: [postId], references: [id])

  @@map("comments")
}
```

### **Reaction (Reações)**
```prisma
model Reaction {
  id            String      @id @default(cuid())
  type          ReactionType
  createdAt     DateTime    @default(now())

  userId        String
  postId        String

  user          User        @relation(fields: [userId], references: [id])
  post          Post        @relation(fields: [postId], references: [id])

  @@unique([userId, postId]) // Uma reação por usuário por post
  @@map("reactions")
}
```

### **Queries de Conteúdo**
```typescript
// Posts publicados com estatísticas
const posts = await prisma.post.findMany({
  where: { isPublished: true },
  include: {
    author: {
      select: { firstName: true, lastName: true }
    },
    _count: {
      select: {
        comments: true,
        reactions: {
          where: { type: 'LIKE' }
        }
      }
    }
  },
  orderBy: { publishedAt: 'desc' }
})

// Comentários de um post
const postComments = await prisma.coment.findMany({
  where: { postId },
  include: {
    user: {
      select: { firstName: true, lastName: true, imageUrl: true }
    }
  },
  orderBy: { createdAt: 'asc' }
})
```

## 🏪 **Product & ShopCart & Sell - Sistema de Loja**

### **Product (Produtos)**
```prisma
model Product {
  id            String      @id @default(cuid())
  name          String
  description   String?
  price         Decimal
  imageUrl      String?
  category      String?
  stock         Int         @default(0)
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  carts         ShopCart[]
  sells         Sell[]

  @@map("products")
}
```

### **ShopCart (Carrinho)**
```prisma
model ShopCart {
  id            String      @id @default(cuid())
  quantity      Int         @default(1)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  userId        String
  productId     String

  user          User        @relation(fields: [userId], references: [id])
  product       Product     @relation(fields: [productId], references: [id])

  @@unique([userId, productId]) // Um produto por usuário no carrinho
  @@map("shop_carts")
}
```

### **Sell (Vendas)**
```prisma
model Sell {
  id            String      @id @default(cuid())
  quantity      Int
  totalPrice    Decimal
  status        SellStatus  @default(PENDING)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  userId        String
  productId     String

  user          User        @relation(fields: [userId], references: [id])
  product       Product     @relation(fields: [productId], references: [id])

  @@map("sells")
}
```

### **Queries de Loja**
```typescript
// Produtos disponíveis
const products = await prisma.product.findMany({
  where: {
    isActive: true,
    stock: { gt: 0 }
  },
  orderBy: { name: 'asc' }
})

// Carrinho do usuário
const cart = await prisma.shopCart.findMany({
  where: { userId },
  include: {
    product: true
  }
})

// Histórico de compras
const purchaseHistory = await prisma.sell.findMany({
  where: { userId },
  include: {
    product: true
  },
  orderBy: { createdAt: 'desc' }
})
```

## 🗓️ **Event - Sistema de Eventos**

### **Event (Eventos)**
```prisma
model Event {
  id            String      @id @default(cuid())
  title         String
  description   String?
  startDate     DateTime
  endDate       DateTime
  location      String?
  maxAttendees  Int?
  imageUrl      String?
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  organizerId   String

  organizer     User        @relation(fields: [organizerId], references: [id])
  attendees     User[]      // Many-to-many via tabela de junção

  @@map("events")
}
```

### **Queries de Eventos**
```typescript
// Eventos futuros
const upcomingEvents = await prisma.event.findMany({
  where: {
    isActive: true,
    startDate: { gte: new Date() }
  },
  include: {
    organizer: {
      select: { firstName: true, lastName: true }
    },
    _count: {
      select: { attendees: true }
    }
  },
  orderBy: { startDate: 'asc' }
})

// Eventos do usuário
const userEvents = await prisma.event.findMany({
  where: {
    OR: [
      { organizerId: userId },
      { attendees: { some: { id: userId } } }
    ]
  },
  orderBy: { startDate: 'desc' }
})
```

## 📋 **Modelos de Suporte**

### **GlobalConfig (Configurações)**
```prisma
model GlobalConfig {
  id            String      @id @unique @default(cuid())
  shopWebhook   String      // Webhook para integração com loja

  @@map("global_configs")
}
```

### **Birthday (Aniversários)**
```prisma
model Birthday {
  id            String      @id @default(cuid())
  birthDate     DateTime
  imageUrl      String?
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user          User        @relation(fields: [userId], references: [id])

  @@map("birthdays")
}
```

### **Flyer (Materiais Promocionais)**
```prisma
model Flyer {
  id            String      @id @default(cuid())
  title         String
  description   String?
  imageUrl      String
  category      String?
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  authorId      String

  author        User        @relation(fields: [authorId], references: [id])

  @@map("flyers")
}
```

## 📊 **Estatísticas dos Modelos**

| Modelo | Tabela | Campos | Relacionamentos |
|--------|--------|--------|-----------------|
| User | users | 12 | 14 (1:N) |
| Room | rooms | 5 | 1 (N:1) |
| Booking | bookings | 8 | 2 (N:1) |
| Vehicle | vehicles | 7 | 1 (N:1) |
| VehicleRent | vehicle_rents | 10 | 2 (N:1) |
| Restaurant | restaurants | 4 | 1 (1:N) |
| MenuItem | menu_items | 9 | 3 (N:1) |
| FoodOrder | food_orders | 8 | 2 (N:1) |
| Suggestion | suggestions | 12 | 3 (N:1) |
| Form | forms | 8 | 2 (1:N) |
| FormResponse | form_responses | 7 | 3 (N:1) |
| Post | posts | 9 | 3 (1:N) |
| Product | products | 10 | 2 (1:N) |
| Event | events | 11 | 2 (1:N) |
| **Total** | **14 tabelas** | **118 campos** | **37 relacionamentos** |

## 🔍 **Padrões de Query**

### **Padrão Repository**
```typescript
// src/server/repositories/base.repository.ts
export abstract class BaseRepository<T> {
  protected prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }

  abstract findAll(): Promise<T[]>
  abstract findById(id: string): Promise<T | null>
  abstract create(data: any): Promise<T>
  abstract update(id: string, data: any): Promise<T>
  abstract delete(id: string): Promise<T>
}
```

### **Padrão Service**
```typescript
// src/server/services/base.service.ts
export abstract class BaseService {
  protected repository: BaseRepository<any>

  constructor(repository: BaseRepository<any>) {
    this.repository = repository
  }

  abstract validate(data: any): Promise<boolean>
  abstract process(data: any): Promise<any>
}
```

## 📋 **Checklist de Modelos**

### 🏗️ **Estrutura**
- [x] Modelos normalizados
- [x] Chaves primárias definidas
- [x] Chaves estrangeiras configuradas
- [x] Constraints aplicados
- [x] Enums apropriados

### 🔗 **Relacionamentos**
- [x] Foreign keys corretas
- [x] Cardinalidade apropriada
- [x] Nomes de campos consistentes
- [x] Tabelas de junção quando necessário

### ⚡ **Performance**
- [x] Índices em campos de busca
- [x] Queries otimizadas
- [x] Includes estratégicos
- [x] Paginação implementada

### 🔒 **Segurança**
- [x] Validações de dados
- [x] Sanitização implementada
- [x] Constraints de integridade
- [x] Soft delete quando necessário

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe de Backend

