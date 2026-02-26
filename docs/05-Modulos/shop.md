# 🛒 Sistema de Loja Corporativa

## 📋 Visão Geral

O **Sistema de Loja Corporativa** é uma plataforma completa de e-commerce para venda de produtos personalizados da empresa, com controle de estoque, processamento de pedidos e gestão financeira integrada.

## 🎯 Objetivos

### **Para Colaboradores**
- ✅ **Catálogo Organizado** - Produtos por categoria
- ✅ **Compra Fácil** - Processo intuitivo de pedido
- ✅ **Produtos Personalizados** - Identidade visual da empresa
- ✅ **Histórico de Compras** - Controle de pedidos
- ✅ **Entrega Rastreável** - Acompanhamento em tempo real

### **Para Gestores**
- ✅ **Controle de Estoque** - Gestão automática
- ✅ **Relatórios de Vendas** - Analytics detalhado
- ✅ **Gestão Financeira** - Receitas e custos
- ✅ **Controle de Produtos** - CRUD completo
- ✅ **Performance** - Métricas de conversão

### **Para Administradores**
- ✅ **Configuração Global** - Regras e políticas
- ✅ **Integrações** - Sistemas externos
- ✅ **Auditoria** - Logs completos
- ✅ **Backup** - Recuperação de dados
- ✅ **Suporte** - Gestão de problemas

## 📝 Pré-cadastro Lojinha (SIGIN)

O pré-cadastro na Lojinha agiliza a liberação no processo de compra, evitando que o suporte precise contatar o RH para obter dados do funcionário antes de criar o cadastro.

### Objetivo
- Ao fazer um pedido na Lojinha, o sistema verifica se o usuário tem os dados de pré-cadastro preenchidos.
- Se não tiver, é exibido um **Dialog** solicitando o preenchimento antes de prosseguir com o pedido.
- Os dados são armazenados na tabela `users` (campos exclusivos do módulo Lojinha) e utilizados apenas neste fluxo.

### Campos obrigatórios
| Campo | Descrição / validação |
|-------|------------------------|
| Nome completo | Texto obrigatório |
| CPF | 11 dígitos (apenas números) |
| Endereço completo | Rua, número, complemento |
| Bairro | Texto obrigatório |
| CEP | 8 dígitos (apenas números) |
| RG | Texto obrigatório |
| E-mail | E-mail válido |
| Contato telefônico | Mínimo 10 dígitos (apenas números) |

### Fluxo do usuário
1. Usuário clica em **Finalizar Pedido** no carrinho da Lojinha.
2. O sistema verifica se o perfil Lojinha está completo (os 8 campos preenchidos em `user.me`).
3. Se **incompleto**: abre o **Dialog de pré-cadastro**, que informa que os dados são para pré-cadastro no SIGIN e estão seguros conforme a [política de privacidade (LGPD)](/lgpd).
4. Usuário preenche todos os campos e salva (procedure `user.updateLojinhaProfile`).
5. Após sucesso, o modal de pedido é aberto normalmente.

### Onde editar no admin
- **Painel de usuários** (`/admin/users`) → card do usuário → aba **Dados privados**.
- A aba **Dados privados** só é visível para quem tem a permissão **Visualizar dados privados** (`can_view_dados_privados`) ou é sudo.
- Ao acessar a aba, um **toast** exibe o aviso de que os dados são protegidos pela LGPD e que, ao acessar, o usuário está ciente. A política completa está em [Política de Privacidade (LGPD)](/lgpd).

### LGPD e segurança
- Os dados de pré-cadastro são tratados conforme a [Política de Privacidade e Proteção de Dados (LGPD)](/lgpd) do sistema.
- O Dialog de completar perfil da Lojinha informa explicitamente que os dados são para pré-cadastro no SIGIN e que estão seguros conforme essa política.
- Os dados coletados na etapa primária (pré-cadastro) ficam visíveis para quem emite/visualiza o pedido: no **Detalhes do Pedido** (card **Dados do Cliente**) e no **e-mail de notificação** enviado ao colaborador responsável pelos pedidos.

### Referência técnica
- **Modelo (Prisma)**: No `User`, os campos são `lojinha_full_name`, `lojinha_cpf`, `lojinha_address`, `lojinha_neighborhood`, `lojinha_cep`, `lojinha_rg`, `lojinha_email`, `lojinha_phone` (todos opcionais).
- **API (tRPC)**:
  - `user.me`: retorna os 8 campos para o cliente verificar se o perfil está completo.
  - `user.updateLojinhaProfile`: atualiza os 8 campos do usuário atual (protected).
  - `user.listUsers`: retorna os 8 campos **somente** se o chamador tiver `can_view_dados_privados` ou for sudo.
  - `user.updateDadosPrivados`: atualiza os 8 campos de um usuário (apenas quem tem `can_view_dados_privados` ou sudo).
- **Frontend**: helper `hasCompleteLojinhaProfile()` em `@/lib/lojinha-profile.ts`; componente `CompleteLojinhaProfileModal` em `@/components/shop/complete-lojinha-profile-modal.tsx`; verificação no `ShoppingCart` antes de abrir o modal de pedido.
- **Permissão**: `can_view_dados_privados` em `RolesConfig`; hook `canViewDadosPrivados()` em `useAccessControl`.

## 🏗️ Arquitetura do Sistema

### **Componentes Principais**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API (tRPC)     │    │   Database      │
│   Shop UI       │◄──►│   Shop Router    │◄──►│   Models        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cart System   │    │   Payment        │    │   Inventory     │
│   Checkout      │    │   Processing     │    │   Management    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🗄️ Modelo de Dados

### **Product (Produtos)**
```prisma
model Product {
  id            String      @id @default(cuid())
  name          String
  description   String?
  price         Decimal     @db.Decimal(10, 2)
  costPrice     Decimal?    @db.Decimal(10, 2) // For internal cost tracking
  sku           String      @unique
  barcode       String?     @unique
  category      ProductCategory
  brand         String?
  tags          String[]    // Search tags
  images        String[]    // Array of image URLs
  isActive      Boolean     @default(true)

  // Inventory
  stockQuantity Int         @default(0)
  minStockLevel Int         @default(0)
  maxStockLevel Int?        // Optional max stock

  // Dimensions and weight
  weight        Decimal?    @db.Decimal(5, 2)
  dimensions    Json?       // {length, width, height}

  // Metadata
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  variants      ProductVariant[]
  orders        OrderItem[]

  @@map("products")
}
```

### **ProductVariant (Variações)**
```prisma
model ProductVariant {
  id            String      @id @default(cuid())
  name          String      // ex: "Tamanho P", "Cor Azul"
  value         String      // ex: "P", "Azul"
  priceModifier Decimal     @default(0) @db.Decimal(10, 2)
  stockQuantity Int         @default(0)
  sku           String?     @unique
  isActive      Boolean     @default(true)

  // Foreign Keys
  productId     String

  // Relations
  product       Product     @relation(fields: [productId], references: [id])
  orderItems    OrderItem[]

  @@map("product_variants")
}
```

### **Order (Pedidos)**
```prisma
model Order {
  id            String      @id @default(cuid())
  orderNumber   String      @unique
  status        OrderStatus @default(PENDING)
  totalAmount   Decimal     @db.Decimal(10, 2)
  taxAmount     Decimal     @default(0) @db.Decimal(10, 2)
  discountAmount Decimal    @default(0) @db.Decimal(10, 2)
  shippingAmount Decimal    @default(0) @db.Decimal(10, 2)
  finalAmount   Decimal     @db.Decimal(10, 2)

  // Shipping
  shippingAddress Json?
  shippingMethod  String?
  trackingNumber  String?

  // Payment
  paymentMethod   String?
  paymentStatus   PaymentStatus @default(PENDING)
  paymentDate     DateTime?

  // Metadata
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Foreign Keys
  userId          String

  // Relations
  user            User        @relation(fields: [userId], references: [id])
  items           OrderItem[]
  payments        OrderPayment[]

  @@map("orders")
}
```

### **OrderItem (Itens do Pedido)**
```prisma
model OrderItem {
  id            String      @id @default(cuid())
  quantity      Int
  unitPrice     Decimal     @db.Decimal(10, 2)
  totalPrice    Decimal     @db.Decimal(10, 2)

  // Foreign Keys
  orderId       String
  productId     String
  variantId     String?

  // Relations
  order         Order       @relation(fields: [orderId], references: [id])
  product       Product     @relation(fields: [productId], references: [id])
  variant       ProductVariant? @relation(fields: [variantId], references: [id])

  @@map("order_items")
}
```

### **OrderPayment (Pagamentos)**
```prisma
model OrderPayment {
  id            String      @id @default(cuid())
  amount        Decimal     @db.Decimal(10, 2)
  method        PaymentMethod
  status        PaymentStatus @default(PENDING)
  transactionId String?     @unique
  paymentDate   DateTime?
  gateway       String?     // Stripe, PayPal, etc.
  gatewayData   Json?       // Gateway-specific data

  // Foreign Keys
  orderId       String

  // Relations
  order         Order       @relation(fields: [orderId], references: [id])

  @@map("order_payments")
}
```

### **Enums e Tipos**
```prisma
enum ProductCategory {
  CLOTHING      // Roupas
  ACCESSORIES   // Acessórios
  ELECTRONICS   // Eletrônicos
  OFFICE        // Materiais de escritório
  GIFT          // Brinde
  PROMOTIONAL   // Promocional
  OTHER         // Outros
}

enum OrderStatus {
  PENDING       // Aguardando pagamento
  CONFIRMED     // Confirmado
  PROCESSING    // Em processamento
  SHIPPED       // Enviado
  DELIVERED     // Entregue
  CANCELLED     // Cancelado
  REFUNDED      // Reembolsado
}

enum PaymentStatus {
  PENDING       // Aguardando
  PROCESSING    // Processando
  COMPLETED     // Concluído
  FAILED        // Falhou
  CANCELLED     // Cancelado
  REFUNDED      // Reembolsado
}

enum PaymentMethod {
  CREDIT_CARD   // Cartão de crédito
  DEBIT_CARD    // Cartão de débito
  PIX           // PIX
  BANK_TRANSFER // Transferência bancária
  CASH          // Dinheiro
  COMPANY_CARD  // Cartão corporativo
}
```

## 💰 Funcionalidades de E-commerce

### **Catálogo de Produtos**
- ✅ Busca avançada por nome, SKU, categoria
- ✅ Filtros por preço, categoria, marca
- ✅ Ordenação por relevância, preço, data
- ✅ Visualização em grid/lista
- ✅ Zoom de imagens e galeria
- ✅ Descrição detalhada com especificações

### **Sistema de Carrinho**
- ✅ Adição/removação de itens
- ✅ Atualização de quantidades
- ✅ Cálculo automático de totais
- ✅ Persistência entre sessões
- ✅ Limite de itens por produto
- ✅ Validação de estoque

### **Checkout e Pagamento**
- ✅ Formulário de endereço de entrega
- ✅ Seleção de método de pagamento
- ✅ Cálculo de frete automático
- ✅ Aplicação de cupons de desconto
- ✅ Revisão final do pedido
- ✅ Confirmação por email

## 📊 Funcionalidades de Gestão

### **Controle de Estoque**
- ✅ Níveis de estoque em tempo real
- ✅ Alertas de estoque baixo
- ✅ Controle de variantes
- ✅ Entrada/saída automática
- ✅ Histórico de movimentações
- ✅ Relatórios de inventário

### **Gestão de Pedidos**
- ✅ Dashboard de pedidos
- ✅ Status tracking
- ✅ Rastreamento de entrega
- ✅ Reembolsos e cancelamentos
- ✅ Notificações automáticas
- ✅ Histórico completo

## 🎨 Interface do Usuário

### **Página do Catálogo**
```tsx
export default function ShopPage() {
  const [filters, setFilters] = useState({
    category: null,
    priceRange: [0, 1000],
    search: '',
    sortBy: 'name',
  })

  const { data: products, isLoading } = trpc.product.getAll.useQuery({
    ...filters,
    page: 1,
    limit: 20,
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Loja Corporativa</h1>
        <CartButton />
      </div>

      {/* Filters */}
      <ShopFilters filters={filters} onFiltersChange={setFilters} />

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products?.products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <ProductPagination
        total={products?.total || 0}
        currentPage={1}
        onPageChange={(page) => {/* Handle page change */}}
      />
    </div>
  )
}
```

### **Card de Produto**
```tsx
function ProductCard({ product }: { product: ProductWithDetails }) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const addToCartMutation = trpc.cart.addItem.useMutation()

  const handleAddToCart = () => {
    addToCartMutation.mutate({
      productId: product.id,
      variantId: selectedVariant,
      quantity: 1,
    })
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        {product.images[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-48 object-cover rounded-md mb-3"
          />
        )}

        <div className="space-y-1">
          <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              R$ {product.price.toFixed(2)}
            </span>
            {product.stockQuantity <= product.minStockLevel && (
              <Badge variant="destructive">Estoque Baixo</Badge>
            )}
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Opções:</Label>
              <VariantSelector
                variants={product.variants}
                selectedId={selectedVariant}
                onSelect={setSelectedVariant}
              />
            </div>
          )}

          {/* Stock Info */}
          <div className="text-sm text-muted-foreground">
            {product.stockQuantity > 0 ? (
              `${product.stockQuantity} em estoque`
            ) : (
              <span className="text-red-600">Fora de estoque</span>
            )}
          </div>

          {/* Add to Cart Button */}
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={product.stockQuantity === 0 || addToCartMutation.isLoading}
          >
            {product.stockQuantity === 0 ? 'Indisponível' : 'Adicionar ao Carrinho'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### **Carrinho de Compras**
```tsx
function ShoppingCart({ cart }: { cart: CartItem[] }) {
  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation()
  const removeItemMutation = trpc.cart.removeItem.useMutation()

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0)

  return (
    <Card className="fixed right-4 top-20 w-96 h-[calc(100vh-6rem)] overflow-y-auto">
      <CardHeader>
        <CardTitle>Carrinho de Compras ({cart.length})</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {cart.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Seu carrinho está vazio
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {cart.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={(quantity) =>
                    updateQuantityMutation.mutate({ itemId: item.id, quantity })
                  }
                  onRemove={() =>
                    removeItemMutation.mutate({ itemId: item.id })
                  }
                />
              ))}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>

              <Button className="w-full" size="lg">
                Finalizar Compra
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

### **Checkout**
```tsx
function CheckoutPage() {
  const [step, setStep] = useState(1) // 1: Shipping, 2: Payment, 3: Review
  const createOrderMutation = trpc.order.create.useMutation()

  const steps = [
    { id: 1, name: 'Entrega', component: ShippingForm },
    { id: 2, name: 'Pagamento', component: PaymentForm },
    { id: 3, name: 'Revisão', component: OrderReview },
  ]

  const handleCompleteOrder = () => {
    createOrderMutation.mutate({
      // Order data
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      {/* Progress Steps */}
      <CheckoutSteps currentStep={step} steps={steps} />

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {steps.map(stepConfig =>
          step === stepConfig.id && (
            <stepConfig.component
              key={stepConfig.id}
              onNext={() => setStep(step + 1)}
              onPrev={() => setStep(step - 1)}
              onComplete={handleCompleteOrder}
            />
          )
        )}
      </div>
    </div>
  )
}
```

## ⚙️ Backend API

### **Product Router**
```typescript
export const productRouter = createTRPCRouter({
  // Get all products with filters
  getAll: protectedProcedure
    .input(z.object({
      category: z.nativeEnum(ProductCategory).optional(),
      search: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      inStock: z.boolean().optional(),
      sortBy: z.enum(['name', 'price', 'createdAt', 'popularity']).default('name'),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        isActive: true,
        ...(input.category && { category: input.category }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' } },
            { description: { contains: input.search, mode: 'insensitive' } },
            { sku: { contains: input.search, mode: 'insensitive' } },
          ],
        }),
        ...(input.minPrice && { price: { gte: input.minPrice } }),
        ...(input.maxPrice && { price: { lte: input.maxPrice } }),
        ...(input.inStock && { stockQuantity: { gt: 0 } }),
      }

      const [products, total] = await Promise.all([
        ctx.db.product.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            variants: {
              where: { isActive: true },
            },
          },
          orderBy: {
            [input.sortBy]: input.sortOrder,
          },
        }),
        ctx.db.product.count({ where }),
      ])

      return { products, total, page: input.page, limit: input.limit }
    }),

  // Get product by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          variants: {
            where: { isActive: true },
          },
        },
      })
    }),

  // Search products
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: input.query, mode: 'insensitive' } },
            { description: { contains: input.query, mode: 'insensitive' } },
            { tags: { hasSome: [input.query] } },
          ],
        },
        take: input.limit,
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          category: true,
        },
      })
    }),

  // Create product (Admin)
  create: adminProcedure
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.create({
        data: input,
        include: {
          variants: true,
        },
      })
    }),

  // Update product (Admin)
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      data: createProductSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.update({
        where: { id: input.id },
        data: input.data,
        include: {
          variants: true,
        },
      })
    }),

  // Update stock (Admin)
  updateStock: adminProcedure
    .input(z.object({
      id: z.string(),
      stockQuantity: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.update({
        where: { id: input.id },
        data: { stockQuantity: input.stockQuantity },
      })
    }),
})
```

### **Cart Router**
```typescript
export const cartRouter = createTRPCRouter({
  // Get user's cart
  get: protectedProcedure.query(async ({ ctx }) => {
    // In a real implementation, you'd have a cart table
    // For now, we'll use a simple session-based approach
    return ctx.session?.cart || []
  }),

  // Add item to cart
  addItem: protectedProcedure
    .input(z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().int().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.productId },
        include: {
          variants: input.variantId ? {
            where: { id: input.variantId },
          } : undefined,
        },
      })

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      }

      // Check stock availability
      const variant = input.variantId ? product.variants[0] : null
      const availableStock = variant ? variant.stockQuantity : product.stockQuantity

      if (availableStock < input.quantity) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Insufficient stock',
        })
      }

      // Add to cart (in session for simplicity)
      const cart = ctx.session?.cart || []
      const existingItemIndex = cart.findIndex(
        item => item.productId === input.productId && item.variantId === input.variantId
      )

      if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += input.quantity
      } else {
        cart.push({
          productId: input.productId,
          variantId: input.variantId,
          quantity: input.quantity,
          product, // Include product data for display
          variant,
        })
      }

      return cart
    }),

  // Update item quantity
  updateQuantity: protectedProcedure
    .input(z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const cart = ctx.session?.cart || []
      const itemIndex = cart.findIndex(
        item => item.productId === input.productId && item.variantId === input.variantId
      )

      if (itemIndex >= 0) {
        if (input.quantity === 0) {
          cart.splice(itemIndex, 1)
        } else {
          cart[itemIndex].quantity = input.quantity
        }
      }

      return cart
    }),

  // Remove item from cart
  removeItem: protectedProcedure
    .input(z.object({
      productId: z.string(),
      variantId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const cart = ctx.session?.cart || []
      const itemIndex = cart.findIndex(
        item => item.productId === input.productId && item.variantId === input.variantId
      )

      if (itemIndex >= 0) {
        cart.splice(itemIndex, 1)
      }

      return cart
    }),

  // Clear cart
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    return []
  }),
})
```

### **Order Router**
```typescript
export const orderRouter = createTRPCRouter({
  // Create order
  create: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate cart items and stock
      for (const item of input.items) {
        const product = await ctx.db.product.findUnique({
          where: { id: item.productId },
          include: {
            variants: item.variantId ? {
              where: { id: item.variantId },
            } : undefined,
          },
        })

        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: `Product ${item.productId} not found` })
        }

        const availableStock = item.variantId ? product.variants[0]?.stockQuantity : product.stockQuantity

        if (availableStock < item.quantity) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Insufficient stock for ${product.name}`,
          })
        }
      }

      // Calculate totals
      let totalAmount = 0
      const orderItems = []

      for (const item of input.items) {
        const product = await ctx.db.product.findUnique({
          where: { id: item.productId },
          include: {
            variants: item.variantId ? {
              where: { id: item.variantId },
            } : undefined,
          },
        })

        const variant = item.variantId ? product!.variants[0] : null
        const unitPrice = variant ? product!.price + variant.priceModifier : product!.price
        const itemTotal = unitPrice * item.quantity

        totalAmount += itemTotal

        orderItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice,
          totalPrice: itemTotal,
        })
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

      // Create order in transaction
      const order = await ctx.db.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: ctx.user.id,
            totalAmount,
            finalAmount: totalAmount, // Add tax/shipping logic here
            shippingAddress: input.shippingAddress,
            shippingMethod: input.shippingMethod,
            notes: input.notes,
            items: {
              create: orderItems,
            },
          },
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        })

        // Update stock
        for (const item of orderItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQuantity: { decrement: item.quantity } },
            })
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { decrement: item.quantity } },
            })
          }
        }

        return createdOrder
      })

      return order
    }),

  // Get user's orders
  getMyOrders: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
      status: z.nativeEnum(OrderStatus).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        userId: ctx.user.id,
        ...(input.status && { status: input.status }),
      }

      const [orders, total] = await Promise.all([
        ctx.db.order.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.order.count({ where }),
      ])

      return { orders, total, page: input.page, limit: input.limit }
    }),

  // Get order by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          payments: true,
        },
      })

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' })
      }

      // Check ownership or admin
      if (order.userId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      return order
    }),

  // Update order status (Admin)
  updateStatus: adminProcedure
    .input(z.object({
      id: z.string(),
      status: z.nativeEnum(OrderStatus),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.order.update({
        where: { id: input.id },
        data: {
          status: input.status,
          notes: input.notes,
        },
      })
    }),

  // Cancel order
  cancel: protectedProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: { items: true },
      })

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' })
      }

      // Check ownership or admin
      if (order.userId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      // Check if can cancel
      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order cannot be cancelled' })
      }

      // Restore stock
      await ctx.db.$transaction(async (tx) => {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQuantity: { increment: item.quantity } },
            })
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } },
            })
          }
        }

        await tx.order.update({
          where: { id: input.id },
          data: {
            status: 'CANCELLED',
            notes: input.reason,
          },
        })
      })

      return { success: true }
    }),
})
```

## 📊 Analytics e Relatórios

### **Dashboard de Vendas**
```tsx
function SalesDashboard() {
  const { data: analytics } = trpc.analytics.getShopAnalytics.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            +{analytics?.orderGrowth}% vs mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receita Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {analytics?.totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            +{analytics?.revenueGrowth}% vs mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalProductsSold}</div>
          <p className="text-xs text-muted-foreground">
            Unidades vendidas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Carrinho para venda
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 📧 Sistema de Notificações

### **Templates de Email**
```typescript
export const SHOP_EMAIL_TEMPLATES = {
  orderConfirmation: (data: OrderConfirmationData) => `
    <h2>🎉 Pedido Confirmado!</h2>
    <p>Olá ${data.customerName},</p>
    <p>Seu pedido #${data.orderNumber} foi confirmado com sucesso!</p>

    <div style="background: #f9f9f9; padding: 20px; margin: 20px 0;">
      <h3>Resumo do Pedido:</h3>
      ${data.items.map(item => `
        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
          <span>${item.name} (${item.quantity}x)</span>
          <span>R$ ${item.totalPrice.toFixed(2)}</span>
        </div>
      `).join('')}
      <hr style="margin: 10px 0;">
      <div style="display: flex; justify-content: space-between; font-weight: bold;">
        <span>Total:</span>
        <span>R$ ${data.totalAmount.toFixed(2)}</span>
      </div>
    </div>

    <p><strong>Endereço de Entrega:</strong></p>
    <p>${data.shippingAddress}</p>

    <p>Você receberá atualizações sobre o status do seu pedido por email.</p>
    <p>Obrigado por comprar na nossa loja!</p>
  `,

  orderShipped: (data: OrderShippedData) => `
    <h2>🚚 Pedido Enviado!</h2>
    <p>Olá ${data.customerName},</p>
    <p>Seu pedido #${data.orderNumber} foi enviado!</p>

    <div style="background: #e8f5e8; padding: 20px; margin: 20px 0;">
      <h3>Informações de Entrega:</h3>
      <p><strong>Transportadora:</strong> ${data.shippingMethod}</p>
      <p><strong>Código de Rastreamento:</strong> ${data.trackingNumber}</p>
      <p><strong>Previsão de Entrega:</strong> ${data.estimatedDelivery}</p>
    </div>

    <p>Você pode acompanhar a entrega através do nosso site.</p>
  `,

  orderDelivered: (data: OrderDeliveredData) => `
    <h2>✅ Pedido Entregue!</h2>
    <p>Olá ${data.customerName},</p>
    <p>Seu pedido #${data.orderNumber} foi entregue com sucesso!</p>

    <p>Esperamos que tenha gostado dos produtos.</p>
    <p>Não esqueça de deixar sua avaliação na nossa loja!</p>

    <p>Atenciosamente,<br>Equipe da Loja Corporativa</p>
  `,

  lowStockAlert: (data: LowStockAlertData) => `
    <h2>⚠️ Alerta de Estoque Baixo</h2>
    <p>Olá Administrador,</p>
    <p>O produto <strong>${data.productName}</strong> está com estoque baixo.</p>

    <div style="background: #fff3e0; padding: 20px; margin: 20px 0;">
      <h3>Detalhes:</h3>
      <p><strong>Produto:</strong> ${data.productName}</p>
      <p><strong>SKU:</strong> ${data.sku}</p>
      <p><strong>Estoque Atual:</strong> ${data.currentStock}</p>
      <p><strong>Estoque Mínimo:</strong> ${data.minStock}</p>
    </div>

    <p>Por favor, considere reabastecer o estoque.</p>
  `,
}
```

### **Webhook System**
```typescript
export class ShopWebhookService {
  static async emitOrderCreated(order: OrderData) {
    await fetch(process.env.SHOP_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Type': 'order.created',
      },
      body: JSON.stringify({
        event: 'order.created',
        data: order,
        timestamp: new Date().toISOString(),
      }),
    })
  }

  static async emitPaymentCompleted(payment: PaymentData) {
    await fetch(process.env.SHOP_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Type': 'payment.completed',
      },
      body: JSON.stringify({
        event: 'payment.completed',
        data: payment,
        timestamp: new Date().toISOString(),
      }),
    })
  }

  static async emitOrderShipped(order: OrderData) {
    await fetch(process.env.SHOP_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Type': 'order.shipped',
      },
      body: JSON.stringify({
        event: 'order.shipped',
        data: order,
        timestamp: new Date().toISOString(),
      }),
    })
  }
}
```

## 📋 Checklist do Sistema

### **Funcionalidades Core**
- ✅ **Catálogo de Produtos** - Busca, filtros, categorias
- ✅ **Sistema de Carrinho** - Adição, remoção, cálculo
- ✅ **Processo de Checkout** - Endereço, pagamento, confirmação
- ✅ **Gestão de Pedidos** - Status, histórico, cancelamento
- ✅ **Controle de Estoque** - Níveis, alertas, atualizações
- ✅ **Variações de Produto** - Tamanhos, cores, etc.

### **Backend e API**
- ✅ **tRPC Procedures** - Endpoints type-safe
- ✅ **Validação de Dados** - Regras de negócio
- ✅ **Transações** - Consistência de dados
- ✅ **Stock Management** - Controle automático
- ✅ **Order Processing** - Fluxo completo
- ✅ **Payment Integration** - Gateway de pagamento

### **Interface do Usuário**
- ✅ **Responsive Design** - Mobile-first
- ✅ **Product Gallery** - Imagens, zoom, navegação
- ✅ **Search & Filter** - Busca avançada
- ✅ **Cart Management** - Interface intuitiva
- ✅ **Order Tracking** - Status em tempo real
- ✅ **User Dashboard** - Histórico e preferências

### **Notificações e Integrações**
- ✅ **Email Templates** - Templates personalizados
- ✅ **Webhook System** - Integrações externas
- ✅ **SMS Notifications** - Opcional para urgentes
- ✅ **Order Updates** - Notificações automáticas
- ✅ **Payment Confirmations** - Confirmações de pagamento
- ✅ **Shipping Updates** - Atualizações de entrega

### **Analytics e Relatórios**
- ✅ **Sales Metrics** - Receita, pedidos, conversão
- ✅ **Product Analytics** - Produtos mais vendidos
- ✅ **Customer Insights** - Comportamento de compra
- ✅ **Inventory Reports** - Relatórios de estoque
- ✅ **Financial Reports** - Custos e lucros
- ✅ **Custom Dashboards** - Visualizações personalizadas

### **Segurança e Qualidade**
- ✅ **Input Validation** - Sanitização completa
- ✅ **Rate Limiting** - Proteção contra abuso
- ✅ **Audit Trails** - Logs de auditoria
- ✅ **Data Encryption** - Dados sensíveis
- ✅ **Payment Security** - PCI compliance
- ✅ **Unit Tests** - Cobertura de código

---

**📅 Última atualização**: Janeiro 2025
**👥 Mantido por**: Equipe de Produto
