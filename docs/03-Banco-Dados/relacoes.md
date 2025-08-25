# 🔗 Relacionamentos do Banco de Dados

## 📊 **Diagrama Geral de Relacionamentos**

```
User (1) ────┬── (N) Booking ─── (1) Room
            │
            ├──── (N) FoodOrder ── (1) MenuItem ── (1) Restaurant
            │
            ├──── (N) VehicleRent ─ (1) Vehicle
            │
            ├──── (N) Suggestion ─── (N) SuggestionKPI
            │
            ├──── (N) Form ──────── (N) FormResponse
            │
            ├──── (N) Post ──────── (N) Comment
            │                    ├──── (N) Reaction
            │
            ├──── (N) Event (Many-to-Many via _EventAttendees)
            │
            ├──── (1) Birthday
            │
            └──── (N) Flyer
```

## 👥 **User - Relacionamentos Centrais**

### **User como Pai (1:N)**
```typescript
// User → Outros modelos
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    // 1:N relationships
    bookings: true,        // User → Booking (1:N)
    foodOrders: true,      // User → FoodOrder (1:N)
    vehicleRents: true,    // User → VehicleRent (1:N)
    suggestions: true,     // User → Suggestion (1:N)
    forms: true,           // User → Form (1:N)
    formResponses: true,   // User → FormResponse (1:N)
    posts: true,           // User → Post (1:N)
    comments: true,        // User → Comment (1:N)
    reactions: true,       // User → Reaction (1:N)
    flyers: true,          // User → Flyer (1:N)

    // 1:1 relationships
    birthDay: true,        // User → Birthday (1:1)

    // Many-to-many
    events: true,          // User ↔ Event (N:N)
  }
})
```

### **User como Filho (N:1)**
```typescript
// Outros modelos → User
const bookingWithUser = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: { user: true }
})

const postWithAuthor = await prisma.post.findUnique({
  where: { id: postId },
  include: { author: true }
})
```

## 🏢 **Sistema de Reservas**

### **Relacionamento Room ↔ Booking**
```typescript
// Room → Bookings (1:N)
const roomWithBookings = await prisma.room.findUnique({
  where: { id: roomId },
  include: {
    bookings: {
      include: {
        user: true // Booking → User (N:1)
      },
      orderBy: { date: 'asc' }
    }
  }
})

// Booking → Room (N:1)
const bookingWithRoom = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: {
    room: true,    // Booking → Room (N:1)
    user: true     // Booking → User (N:1)
  }
})
```

### **Verificação de Conflitos**
```typescript
// Verificar se sala está disponível
const conflictingBookings = await prisma.booking.findMany({
  where: {
    roomId: roomId,
    date: requestedDate,
    // Exclude current booking if updating
    ...(currentBookingId && { id: { not: currentBookingId } })
  }
})
```

## 🚗 **Sistema de Veículos**

### **Relacionamento Vehicle ↔ VehicleRent**
```typescript
// Vehicle → VehicleRents (1:N)
const vehicleWithRents = await prisma.vehicle.findUnique({
  where: { id: vehicleId },
  include: {
    rents: {
      include: {
        user: true // VehicleRent → User (N:1)
      },
      orderBy: { startDate: 'desc' }
    }
  }
})

// VehicleRent → Vehicle (N:1)
const rentWithVehicle = await prisma.vehicleRent.findUnique({
  where: { id: rentId },
  include: {
    vehicle: true, // VehicleRent → Vehicle (N:1)
    user: true     // VehicleRent → User (N:1)
  }
})
```

### **Verificação de Disponibilidade**
```typescript
// Verificar conflitos de datas
const conflictingRents = await prisma.vehicleRent.findMany({
  where: {
    vehicleId: vehicleId,
    OR: [
      {
        startDate: { lte: endDate },
        endDate: { gte: startDate }
      }
    ],
    status: { not: 'CANCELLED' }
  }
})
```

## 🍽️ **Sistema de Alimentação**

### **Hierarquia de Relacionamentos**
```typescript
// Restaurant → MenuItem → FoodOrder
const restaurantWithMenu = await prisma.restaurant.findUnique({
  where: { id: restaurantId },
  include: {
    menuItems: {
      include: {
        orders: {
          include: {
            user: true // FoodOrder → User (N:1)
          }
        },
        options: {
          include: {
            choices: true
          }
        }
      }
    }
  }
})

// MenuItem → Restaurant & Orders
const menuItemWithDetails = await prisma.menuItem.findUnique({
  where: { id: menuItemId },
  include: {
    restaurant: true,  // MenuItem → Restaurant (N:1)
    orders: {
      include: {
        user: true     // FoodOrder → User (N:1)
      }
    }
  }
})
```

## 💡 **Sistema de Sugestões**

### **Relacionamentos Complexos**
```typescript
// Suggestion com múltiplos relacionamentos
const suggestionWithDetails = await prisma.suggestion.findUnique({
  where: { id: suggestionId },
  include: {
    author: true,     // Suggestion → User (N:1)
    analyst: true,    // Suggestion → User (N:1)
    kpis: true        // Suggestion → SuggestionKPI (1:N)
  }
})

// KPIs de uma sugestão
const suggestionKPIs = await prisma.suggestionKPI.findMany({
  where: { suggestionId },
  include: {
    suggestion: {
      include: {
        author: true
      }
    }
  }
})
```

## 📝 **Sistema de Formulários**

### **Hierarquia Form ↔ FormResponse**
```typescript
// Form → FormResponses (1:N)
const formWithResponses = await prisma.form.findUnique({
  where: { id: formId },
  include: {
    author: true,    // Form → User (N:1)
    responses: {
      include: {
        user: true   // FormResponse → User (N:1)
      },
      orderBy: { createdAt: 'desc' }
    }
  }
})

// FormResponse → Form (N:1)
const responseWithForm = await prisma.formResponse.findUnique({
  where: { id: responseId },
  include: {
    form: {
      include: {
        author: true  // Form → User (N:1)
      }
    },
    user: true       // FormResponse → User (N:1)
  }
})
```

## 📰 **Sistema de Conteúdo**

### **Post com Interações**
```typescript
// Post → Comments & Reactions (1:N)
const postWithInteractions = await prisma.post.findUnique({
  where: { id: postId },
  include: {
    author: true,    // Post → User (N:1)
    comments: {
      include: {
        user: true   // Comment → User (N:1)
      },
      orderBy: { createdAt: 'asc' }
    },
    reactions: {
      include: {
        user: true   // Reaction → User (N:1)
      }
    }
  }
})

// Comment → Post (N:1)
const commentWithPost = await prisma.coment.findUnique({
  where: { id: commentId },
  include: {
    user: true,     // Comment → User (N:1)
    post: {
      include: {
        author: true  // Post → User (N:1)
      }
    }
  }
})
```

### **Reaction (Unique Constraint)**
```typescript
// Uma reação por usuário por post
const reaction = await prisma.reaction.upsert({
  where: {
    userId_postId: {
      userId: userId,
      postId: postId
    }
  },
  update: {
    type: newType
  },
  create: {
    userId: userId,
    postId: postId,
    type: newType
  }
})
```

## 🏪 **Sistema de Loja**

### **Product com Carrinho e Vendas**
```typescript
// Product → ShopCarts & Sells (1:N)
const productWithTransactions = await prisma.product.findUnique({
  where: { id: productId },
  include: {
    carts: {
      include: {
        user: true   // ShopCart → User (N:1)
      }
    },
    sells: {
      include: {
        user: true   // Sell → User (N:1)
      },
      orderBy: { createdAt: 'desc' }
    }
  }
})

// ShopCart → Product & User
const cartItem = await prisma.shopCart.findUnique({
  where: { id: cartItemId },
  include: {
    product: true,  // ShopCart → Product (N:1)
    user: true      // ShopCart → User (N:1)
  }
})
```

## 🗓️ **Sistema de Eventos (Many-to-Many)**

### **Relacionamento N:N com Tabela de Junção**
```typescript
// Event com participantes (N:N)
const eventWithAttendees = await prisma.event.findUnique({
  where: { id: eventId },
  include: {
    organizer: true,  // Event → User (N:1)
    attendees: {      // Event ↔ User (N:N)
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    }
  }
})

// Usuário com eventos (N:N)
const userWithEvents = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    events: {         // User ↔ Event (N:N)
      include: {
        organizer: true
      },
      where: {
        startDate: {
          gte: new Date()
        }
      }
    }
  }
})
```

### **Gerenciamento de Participantes**
```typescript
// Adicionar participante ao evento
await prisma.event.update({
  where: { id: eventId },
  data: {
    attendees: {
      connect: { id: userId }
    }
  }
})

// Remover participante do evento
await prisma.event.update({
  where: { id: eventId },
  data: {
    attendees: {
      disconnect: { id: userId }
    }
  }
})
```

## 🎯 **Relacionamentos Especiais**

### **1:1 (User ↔ Birthday)**
```typescript
// User com aniversário
const userWithBirthday = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    birthDay: true
  }
})

// Aniversariantes do mês
const birthdaysThisMonth = await prisma.birthday.findMany({
  where: {
    birthDate: {
      gte: startOfMonth,
      lte: endOfMonth
    }
  },
  include: {
    user: true
  }
})
```

### **Auto-referências (Suggestion)**
```typescript
// Suggestion com author e analyst (ambos User)
const suggestionWithUsers = await prisma.suggestion.findUnique({
  where: { id: suggestionId },
  include: {
    author: {    // Suggestion → User (N:1)
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    },
    analyst: {   // Suggestion → User (N:1)
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    }
  }
})
```

## 📊 **Consultas Complexas**

### **Dashboard Analytics**
```typescript
// Estatísticas do usuário
const userStats = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    _count: {
      select: {
        bookings: true,
        foodOrders: true,
        suggestions: true,
        posts: true,
        comments: true
      }
    }
  }
})
```

### **Relatórios Agregados**
```typescript
// Estatísticas por empresa
const enterpriseStats = await prisma.user.groupBy({
  by: ['enterprise'],
  _count: {
    id: true
  },
  orderBy: {
    _count: {
      id: 'desc'
    }
  }
})

// Top usuários mais ativos
const topUsers = await prisma.user.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    _count: {
      select: {
        bookings: true,
        foodOrders: true,
        suggestions: true,
        posts: true
      }
    }
  },
  orderBy: {
    bookings: {
      _count: 'desc'
    }
  },
  take: 10
})
```

## 🔍 **Padrões de Query Otimizados**

### **Include Estratégico**
```typescript
// Evitar N+1 queries
const optimizedQuery = await prisma.user.findMany({
  include: {
    bookings: {
      include: {
        room: true
      },
      orderBy: { date: 'desc' },
      take: 5 // Limitar resultados
    },
    foodOrders: {
      include: {
        menuItem: {
          include: {
            restaurant: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    }
  }
})
```

### **Select Específico**
```typescript
// Selecionar apenas campos necessários
const userSummary = await prisma.user.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    enterprise: true,
    setor: true,
    _count: {
      select: {
        bookings: true,
        suggestions: true
      }
    }
  }
})
```

### **Paginação**
```typescript
// Paginação eficiente
const paginatedResults = await prisma.post.findMany({
  take: 20,
  skip: (page - 1) * 20,
  include: {
    author: true,
    _count: {
      select: {
        comments: true,
        reactions: true
      }
    }
  },
  orderBy: { createdAt: 'desc' }
})
```

## 📋 **Checklist de Relacionamentos**

### 🏗️ **Estrutura**
- [x] Chaves primárias definidas
- [x] Chaves estrangeiras configuradas
- [x] Cardinalidade correta (1:1, 1:N, N:N)
- [x] Constraints de integridade
- [x] Índices em foreign keys

### 🔗 **Queries**
- [x] Joins otimizados
- [x] Includes estratégicos
- [x] Paginação implementada
- [x] Filtros apropriados
- [x] Ordenação consistente

### ⚡ **Performance**
- [x] N+1 queries evitadas
- [x] Índices criados
- [x] Queries agregadas otimizadas
- [x] Cache implementado quando necessário

### 🔒 **Integridade**
- [x] Cascade deletes configurados
- [x] Constraints de unicidade
- [x] Validações de dados
- [x] Soft delete quando necessário

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe de Backend

