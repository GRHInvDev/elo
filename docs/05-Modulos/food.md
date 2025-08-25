# 🍽️ Sistema de Alimentação

## 📋 Visão Geral

O **Sistema de Alimentação** é uma plataforma completa para gestão de pedidos de refeições, conectando colaboradores aos restaurantes parceiros da empresa.

## 🎯 Objetivos

- ✅ **Pedidos Fáceis** - Interface intuitiva de seleção
- ✅ **Cardápios Atualizados** - Informações em tempo real
- ✅ **Personalização** - Escolhas de acompanhamentos
- ✅ **Controle de Horários** - Janelas de pedido
- ✅ **Histórico** - Controle de solicitações

## 🗄️ Modelo de Dados

```prisma
model Restaurant {
  id          String @id @default(cuid())
  name        String @unique
  description String?
  imageUrl    String?
  isActive    Boolean @default(true)
  menuItems   MenuItem[]
}

model MenuItem {
  id          String @id @default(cuid())
  name        String
  description String?
  price       Decimal @db.Decimal(10, 2)
  category    String?
  restaurantId String
  restaurant  Restaurant @relation(fields: [restaurantId], references: [id])
  options     MenuItemOption[]
  orders      FoodOrder[]
}

model FoodOrder {
  id          String @id @default(cuid())
  items       Json
  totalPrice  Decimal @db.Decimal(10, 2)
  status      OrderStatus @default(PENDING)
  userId      String
  menuItemId  String
  user        User @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
}
```

## 🎨 Interface do Usuário

### **Página Principal**
```tsx
export default function FoodPage() {
  const { data: restaurants } = trpc.restaurant.getAll.useQuery()
  const [cart, setCart] = useState([])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sistema de Alimentação</h1>
        <CartButton cart={cart} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants?.map(restaurant => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  )
}
```

### **Cardápio do Restaurante**
```tsx
function RestaurantMenu({ restaurant, menuItems }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
```

## ⚙️ Backend API

### **Restaurant Router**
```typescript
export const restaurantRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.restaurant.findMany({
      where: { isActive: true },
      include: { _count: { select: { menuItems: true } } }
    })
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.restaurant.findUnique({
        where: { id: input.id },
        include: { menuItems: { include: { options: true } } }
      })
    })
})
```

### **Food Order Router**
```typescript
export const foodOrderRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.foodOrder.create({
        data: {
          ...input,
          userId: ctx.user.id
        }
      })
    }),

  getMyOrders: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.foodOrder.findMany({
      where: { userId: ctx.user.id },
      include: { menuItem: { include: { restaurant: true } } },
      orderBy: { createdAt: 'desc' }
    })
  })
})
```

## 📊 Funcionalidades

### **Horários de Funcionamento**
- Janela de pedidos: 11:30 AM - 2:00 PM
- Prazo de antecedência: 30 minutos
- Limite diário: 3 pedidos por usuário

### **Status dos Pedidos**
- PENDING → CONFIRMED → PREPARING → READY → DELIVERED
- CANCELLED (se necessário)

## 📋 Checklist

- ✅ Cardápios dinâmicos
- ✅ Sistema de pedidos
- ✅ Personalização de itens
- ✅ Controle de horários
- ✅ Histórico de pedidos
- ✅ Notificações por email
- ✅ Analytics de uso

---

**📅 Última atualização**: Dezembro 2024
**👥 Mantido por**: Equipe de Produto
