# 🔧 tRPC Routers - Documentação Detalhada

## 📋 Visão Geral dos Routers

Cada router tRPC representa um domínio específico do sistema, contendo queries e mutations type-safe. Abaixo está a documentação completa de todos os routers implementados.

## 👥 **User Router** (`src/server/routers/user.ts`)

### **Queries**
```typescript
// Get all users (Admin only)
getAll: adminProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    search: z.string().optional(),
    enterprise: z.string().optional(),
  }))
  .query(async ({ ctx, input }) => {
    const users = await ctx.db.user.findMany({
      where: {
        ...(input.search && {
          OR: [
            { firstName: { contains: input.search, mode: 'insensitive' } },
            { lastName: { contains: input.search, mode: 'insensitive' } },
            { email: { contains: input.search, mode: 'insensitive' } },
          ],
        }),
        ...(input.enterprise && { enterprise: input.enterprise }),
      },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        enterprise: true,
        setor: true,
        role: true,
        createdAt: true,
      },
    })

    const total = await ctx.db.user.count({
      where: {
        ...(input.search && {
          OR: [
            { firstName: { contains: input.search, mode: 'insensitive' } },
            { lastName: { contains: input.search, mode: 'insensitive' } },
            { email: { contains: input.search, mode: 'insensitive' } },
          ],
        }),
        ...(input.enterprise && { enterprise: input.enterprise }),
      },
    })

    return { users, total, page: input.page, limit: input.limit }
  })

// Get user by ID
getById: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    return ctx.db.user.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        enterprise: true,
        setor: true,
        role: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            foodOrders: true,
            suggestions: true,
            posts: true,
          },
        },
      },
    })
  })

// Get current user profile
getProfile: protectedProcedure
  .query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        enterprise: true,
        setor: true,
        imageUrl: true,
        _count: {
          select: {
            bookings: true,
            foodOrders: true,
            suggestions: true,
            posts: true,
            comments: true,
          },
        },
      },
    })
  })
```

### **Mutations**
```typescript
// Update user profile
update: protectedProcedure
  .input(z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    setor: z.string().max(100).optional(),
    imageUrl: z.string().url().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.user.update({
      where: { id: ctx.user.id },
      data: input,
    })
  })

// Update user role (Admin only)
updateRole: adminProcedure
  .input(z.object({
    userId: z.string(),
    role: z.enum(['USER', 'ADMIN', 'TOTEM']),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.user.update({
      where: { id: input.userId },
      data: { role: input.role },
    })
  })

// Delete user (Admin only)
delete: adminProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.user.delete({
      where: { id: input.id },
    })
  })
```

## 🏢 **Room Router** (`src/server/routers/room.ts`)

### **Queries**
```typescript
// Get all rooms
getAll: protectedProcedure
  .query(async ({ ctx }) => {
    return ctx.db.room.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            bookings: {
              where: {
                date: {
                  gte: new Date(),
                  lt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next 24h
                },
              },
            },
          },
        },
      },
    })
  })

// Get room by ID
getById: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    return ctx.db.room.findUnique({
      where: { id: input.id },
      include: {
        bookings: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    })
  })

// Get available rooms for date/time
getAvailable: protectedProcedure
  .input(z.object({
    date: z.date(),
    duration: z.number().min(30).max(480).default(60), // minutes
  }))
  .query(async ({ ctx, input }) => {
    const endTime = new Date(input.date.getTime() + input.duration * 60 * 1000)

    return ctx.db.room.findMany({
      where: {
        isActive: true,
        bookings: {
          none: {
            OR: [
              {
                date: { lte: input.date },
                // Assuming booking has endTime or duration
                date: { gte: endTime },
              },
            ],
          },
        },
      },
    })
  })
```

### **Mutations**
```typescript
// Create room (Admin)
create: adminProcedure
  .input(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    capacity: z.number().int().min(1).max(50),
    isActive: z.boolean().default(true),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.room.create({ data: input })
  })

// Update room (Admin)
update: adminProcedure
  .input(z.object({
    id: z.string(),
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    capacity: z.number().int().min(1).max(50).optional(),
    isActive: z.boolean().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { id, ...data } = input
    return ctx.db.room.update({
      where: { id },
      data,
    })
  })

// Delete room (Admin)
delete: adminProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.room.delete({
      where: { id: input.id },
    })
  })
```

## 🏢 **Booking Router** (`src/server/routers/booking.ts`)

### **Queries**
```typescript
// Get user's bookings
getMyBookings: protectedProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(10),
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
    upcoming: z.boolean().default(false),
  }))
  .query(async ({ ctx, input }) => {
    const where = {
      userId: ctx.user.id,
      ...(input.status && { status: input.status }),
      ...(input.upcoming && {
        date: { gte: new Date() },
      }),
    }

    const bookings = await ctx.db.booking.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      include: {
        room: true,
      },
      orderBy: { date: 'desc' },
    })

    const total = await ctx.db.booking.count({ where })

    return { bookings, total, page: input.page, limit: input.limit }
  })

// Get all bookings (Admin)
getAll: adminProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    search: z.string().optional(),
    roomId: z.string().optional(),
    userId: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }))
  .query(async ({ ctx, input }) => {
    const where = {
      ...(input.roomId && { roomId: input.roomId }),
      ...(input.userId && { userId: input.userId }),
      ...(input.startDate && input.endDate && {
        date: {
          gte: input.startDate,
          lte: input.endDate,
        },
      }),
      ...(input.search && {
        OR: [
          { purpose: { contains: input.search, mode: 'insensitive' } },
          { room: { name: { contains: input.search, mode: 'insensitive' } } },
          { user: { firstName: { contains: input.search, mode: 'insensitive' } } },
          { user: { lastName: { contains: input.search, mode: 'insensitive' } } },
        ],
      }),
    }

    const bookings = await ctx.db.booking.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      include: {
        room: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            enterprise: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    const total = await ctx.db.booking.count({ where })

    return { bookings, total, page: input.page, limit: input.limit }
  })
```

### **Mutations**
```typescript
// Create booking
create: protectedProcedure
  .input(z.object({
    roomId: z.string(),
    date: z.date(),
    purpose: z.string().min(1).max(500),
  }))
  .mutation(async ({ ctx, input }) => {
    // Check if room exists and is active
    const room = await ctx.db.room.findUnique({
      where: { id: input.roomId },
    })

    if (!room || !room.isActive) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Room not found or inactive',
      })
    }

    // Check if slot is available
    const conflictingBooking = await ctx.db.booking.findFirst({
      where: {
        roomId: input.roomId,
        date: input.date,
      },
    })

    if (conflictingBooking) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Room is already booked for this time slot',
      })
    }

    return ctx.db.booking.create({
      data: {
        userId: ctx.user.id,
        roomId: input.roomId,
        date: input.date,
        purpose: input.purpose,
      },
      include: {
        room: true,
      },
    })
  })

// Cancel booking
cancel: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const booking = await ctx.db.booking.findUnique({
      where: { id: input.id },
    })

    if (!booking) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Booking not found',
      })
    }

    // Check if user owns the booking or is admin
    if (booking.userId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only cancel your own bookings',
      })
    }

    // Check if booking is in the future
    if (booking.date <= new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot cancel past bookings',
      })
    }

    return ctx.db.booking.update({
      where: { id: input.id },
      data: { status: 'CANCELLED' },
    })
  })
```

## 🍽️ **Restaurant & Menu Router**

### **Restaurant Router** (`src/server/routers/restaurant.ts`)
```typescript
// Get all active restaurants
getAll: protectedProcedure
  .query(async ({ ctx }) => {
    return ctx.db.restaurant.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            menuItems: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  })

// Create restaurant (Admin)
create: adminProcedure
  .input(z.object({
    name: z.string().min(1).max(100),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().default(true),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.restaurant.create({ data: input })
  })
```

### **Menu Item Router** (`src/server/routers/menu-item.ts`)
```typescript
// Get menu items by restaurant
getByRestaurant: protectedProcedure
  .input(z.object({ restaurantId: z.string() }))
  .query(async ({ ctx, input }) => {
    return ctx.db.menuItem.findMany({
      where: {
        restaurantId: input.restaurantId,
        isActive: true,
      },
      include: {
        restaurant: true,
        options: {
          include: {
            choices: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  })

// Get all menu items
getAll: protectedProcedure
  .query(async ({ ctx }) => {
    return ctx.db.menuItem.findMany({
      where: { isActive: true },
      include: {
        restaurant: true,
        options: {
          include: {
            choices: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })
  })

// Create menu item (Admin)
create: adminProcedure
  .input(z.object({
    restaurantId: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    price: z.number().positive(),
    imageUrl: z.string().url().optional(),
    category: z.string().max(50).optional(),
    isActive: z.boolean().default(true),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.menuItem.create({ data: input })
  })
```

## 💡 **Suggestions Router** (`src/server/routers/suggestions.ts`)

### **Queries**
```typescript
// Get all suggestions
getAll: protectedProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(10),
    status: z.enum(['NEW', 'IN_REVIEW', 'APPROVED', 'IMPLEMENTED', 'REJECTED']).optional(),
    authorId: z.string().optional(),
    analystId: z.string().optional(),
    search: z.string().optional(),
  }))
  .query(async ({ ctx, input }) => {
    const where = {
      ...(input.status && { status: input.status }),
      ...(input.authorId && { authorId: input.authorId }),
      ...(input.analystId && { analystId: input.analystId }),
      ...(input.search && {
        OR: [
          { title: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
        ],
      }),
    }

    const suggestions = await ctx.db.suggestion.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            enterprise: true,
          },
        },
        analyst: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        kpis: true,
        _count: {
          select: {
            kpis: true,
          },
        },
      },
      orderBy: { score: 'desc' },
    })

    const total = await ctx.db.suggestion.count({ where })

    return { suggestions, total, page: input.page, limit: input.limit }
  })

// Get my suggestions
getMySuggestions: protectedProcedure
  .query(async ({ ctx }) => {
    return ctx.db.suggestion.findMany({
      where: { authorId: ctx.user.id },
      include: {
        analyst: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        kpis: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  })
```

### **Mutations**
```typescript
// Create suggestion
create: protectedProcedure
  .input(z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    impact: z.number().int().min(0).max(20),
    capacity: z.number().int().min(0).max(20),
    effort: z.number().int().min(0).max(20),
  }))
  .mutation(async ({ ctx, input }) => {
    // Calculate score
    const score = (input.impact * 0.4) + (input.capacity * 0.35) + ((21 - input.effort) * 0.25)

    return ctx.db.suggestion.create({
      data: {
        ...input,
        score,
        authorId: ctx.user.id,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            enterprise: true,
          },
        },
      },
    })
  })

// Update status (Admin/Analyst)
updateStatus: adminProcedure
  .input(z.object({
    id: z.string(),
    status: z.enum(['NEW', 'IN_REVIEW', 'APPROVED', 'IMPLEMENTED', 'REJECTED']),
    analystId: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.suggestion.update({
      where: { id: input.id },
      data: {
        status: input.status,
        ...(input.analystId && { analystId: input.analystId }),
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        analyst: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  })
```

## 📝 **Forms Router** (`src/server/routers/forms.ts`)

### **Queries**
```typescript
// Get all forms
getAll: protectedProcedure
  .query(async ({ ctx }) => {
    return ctx.db.form.findMany({
      where: { isActive: true },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

// Get form by ID
getById: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    return ctx.db.form.findUnique({
      where: { id: input.id },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    })
  })
```

### **Mutations**
```typescript
// Create form (Admin)
create: adminProcedure
  .input(z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    schema: z.any(), // JSON schema for form fields
    isActive: z.boolean().default(true),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.form.create({
      data: {
        ...input,
        authorId: ctx.user.id,
      },
    })
  })

// Submit form response
submitResponse: protectedProcedure
  .input(z.object({
    formId: z.string(),
    data: z.any(), // Form response data
  }))
  .mutation(async ({ ctx, input }) => {
    // Check if form exists and is active
    const form = await ctx.db.form.findUnique({
      where: { id: input.formId },
    })

    if (!form || !form.isActive) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Form not found or inactive',
      })
    }

    return ctx.db.formResponse.create({
      data: {
        formId: input.formId,
        userId: ctx.user.id,
        data: input.data,
      },
    })
  })
```

## 🚗 **Vehicle Router** (`src/server/routers/vehicle.ts`)

### **Queries**
```typescript
// Get all vehicles
getAll: protectedProcedure
  .query(async ({ ctx }) => {
    return ctx.db.vehicle.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            rents: {
              where: {
                status: { not: 'CANCELLED' },
                startDate: { gte: new Date() },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  })

// Get available vehicles
getAvailable: protectedProcedure
  .input(z.object({
    startDate: z.date(),
    endDate: z.date(),
  }))
  .query(async ({ ctx, input }) => {
    return ctx.db.vehicle.findMany({
      where: {
        isActive: true,
        rents: {
          none: {
            OR: [
              {
                startDate: { lte: input.endDate },
                endDate: { gte: input.startDate },
                status: { not: 'CANCELLED' },
              },
            ],
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  })
```

### **Mutations**
```typescript
// Create vehicle (Admin)
create: adminProcedure
  .input(z.object({
    name: z.string().min(1).max(100),
    model: z.string().max(100).optional(),
    plate: z.string().max(20).optional(),
    capacity: z.number().int().min(1).max(50),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().default(true),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.vehicle.create({ data: input })
  })

// Request vehicle rental
requestRent: protectedProcedure
  .input(z.object({
    vehicleId: z.string(),
    startDate: z.date(),
    endDate: z.date(),
    purpose: z.string().min(1).max(500),
  }))
  .mutation(async ({ ctx, input }) => {
    // Validate dates
    if (input.startDate <= new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Start date must be in the future',
      })
    }

    if (input.endDate <= input.startDate) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'End date must be after start date',
      })
    }

    // Check if vehicle is available
    const conflictingRent = await ctx.db.vehicleRent.findFirst({
      where: {
        vehicleId: input.vehicleId,
        OR: [
          {
            startDate: { lte: input.endDate },
            endDate: { gte: input.startDate },
          },
        ],
        status: { not: 'CANCELLED' },
      },
    })

    if (conflictingRent) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Vehicle is not available for the selected period',
      })
    }

    return ctx.db.vehicleRent.create({
      data: {
        ...input,
        userId: ctx.user.id,
      },
      include: {
        vehicle: true,
      },
    })
  })

// Approve/reject rental (Admin)
updateRentStatus: adminProcedure
  .input(z.object({
    id: z.string(),
    status: z.enum(['APPROVED', 'REJECTED']),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.vehicleRent.update({
      where: { id: input.id },
      data: { status: input.status },
      include: {
        vehicle: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })
  })
```

## 📰 **Posts & Content Router**

### **Post Router** (`src/server/routers/post.ts`)
```typescript
// Get all published posts
getAll: protectedProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(20).default(10),
    search: z.string().optional(),
    category: z.string().optional(),
  }))
  .query(async ({ ctx, input }) => {
    const where = {
      isPublished: true,
      ...(input.search && {
        OR: [
          { title: { contains: input.search, mode: 'insensitive' } },
          { content: { contains: input.search, mode: 'insensitive' } },
        ],
      }),
    }

    const posts = await ctx.db.post.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: {
              where: { type: 'LIKE' },
            },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    })

    const total = await ctx.db.post.count({ where })

    return { posts, total, page: input.page, limit: input.limit }
  })

// Create post (Admin)
create: adminProcedure
  .input(z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    imageUrl: z.string().url().optional(),
    isPublished: z.boolean().default(false),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.post.create({
      data: {
        ...input,
        authorId: ctx.user.id,
        publishedAt: input.isPublished ? new Date() : null,
      },
    })
  })
```

### **Reaction Router** (`src/server/routers/reaction.ts`)
```typescript
// Add or update reaction
upsert: protectedProcedure
  .input(z.object({
    postId: z.string(),
    type: z.enum(['LIKE', 'DISLIKE']),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.reaction.upsert({
      where: {
        userId_postId: {
          userId: ctx.user.id,
          postId: input.postId,
        },
      },
      update: {
        type: input.type,
      },
      create: {
        userId: ctx.user.id,
        postId: input.postId,
        type: input.type,
      },
    })
  })

// Remove reaction
remove: protectedProcedure
  .input(z.object({ postId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.reaction.deleteMany({
      where: {
        userId: ctx.user.id,
        postId: input.postId,
      },
    })
  })
```

## 📊 **Analytics & KPI Router**

### **KPI Router** (`src/server/routers/kpi.ts`)
```typescript
// Get system KPIs (Admin)
getSystemKPIs: adminProcedure
  .input(z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }))
  .query(async ({ ctx, input }) => {
    const { startDate, endDate } = input

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    } : {}

    const [
      totalUsers,
      totalBookings,
      totalSuggestions,
      totalPosts,
      recentBookings,
      recentSuggestions,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.booking.count({ where: dateFilter }),
      ctx.db.suggestion.count({ where: dateFilter }),
      ctx.db.post.count({ where: dateFilter }),
      ctx.db.booking.count({
        where: {
          ...dateFilter,
          date: { gte: new Date() },
        },
      }),
      ctx.db.suggestion.count({
        where: {
          ...dateFilter,
          status: 'NEW',
        },
      }),
    ])

    return {
      totalUsers,
      totalBookings,
      totalSuggestions,
      totalPosts,
      recentBookings,
      recentSuggestions,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    }
  })

// Get user activity KPIs
getUserKPIs: protectedProcedure
  .input(z.object({
    userId: z.string().optional(), // Admin can see other users
  }))
  .query(async ({ ctx, input }) => {
    const targetUserId = input.userId || ctx.user.id

    // Check permissions
    if (input.userId && ctx.user.role !== 'ADMIN' && input.userId !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only view your own KPIs',
      })
    }

    const [
      myBookings,
      mySuggestions,
      myPosts,
      myComments,
    ] = await Promise.all([
      ctx.db.booking.count({ where: { userId: targetUserId } }),
      ctx.db.suggestion.count({ where: { authorId: targetUserId } }),
      ctx.db.post.count({ where: { authorId: targetUserId } }),
      ctx.db.comment.count({ where: { userId: targetUserId } }),
    ])

    return {
      myBookings,
      mySuggestions,
      myPosts,
      myComments,
      totalActivity: myBookings + mySuggestions + myPosts + myComments,
    }
  })
```

## 📋 **Best Practices Implementadas**

### **🔒 Security**
- ✅ **Role-based access** em todos os endpoints
- ✅ **Input validation** com Zod
- ✅ **SQL injection prevention** via Prisma
- ✅ **Authentication required** para dados sensíveis

### **⚡ Performance**
- ✅ **Pagination** em todas as queries grandes
- ✅ **Include estratégico** apenas dados necessários
- ✅ **Select específico** para campos requeridos
- ✅ **Índices otimizados** nas queries de busca

### **🛡️ Error Handling**
- ✅ **TRPCError codes** apropriados
- ✅ **Mensagens de erro** seguras (não expõem dados)
- ✅ **Logging detalhado** para debugging
- ✅ **Fallbacks** para estados de erro

### **📊 Type Safety**
- ✅ **End-to-end types** via tRPC
- ✅ **Schema validation** em todos os inputs
- ✅ **Auto-completion** no frontend
- ✅ **Runtime validation** com Zod

### **🔄 Data Consistency**
- ✅ **Database transactions** para operações complexas
- ✅ **Foreign key constraints** ativas
- ✅ **Cascade deletes** onde apropriado
- ✅ **Soft deletes** para dados importantes

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe Backend
