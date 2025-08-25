# 🔗 Webhooks & External Integrations

## 📡 Sistema de Webhooks

O Sistema de Intranet ELO integra com serviços externos através de webhooks para notificações em tempo real e sincronização de dados.

## 🔐 **Clerk Webhooks** (`src/app/api/webhooks/clerk/route.ts`)

### **Visão Geral**
O webhook do Clerk gerencia eventos de autenticação e sincroniza usuários entre Clerk e o banco local.

### **Eventos Suportados**
```typescript
// src/app/api/webhooks/clerk/route.ts
const webhook = createRouteHandler({
  router: clerkWebhookRouter,
  config: SVIX_CONFIG,
})

const clerkWebhookRouter = createTRPCRouter({
  userCreated: publicProcedure
    .input(clerkUserCreatedSchema)
    .mutation(async ({ ctx, input }) => {
      // Handle user creation
      const user = await ctx.db.user.create({
        data: {
          id: input.data.id,
          email: input.data.email_addresses[0].email_address,
          firstName: input.data.first_name,
          lastName: input.data.last_name,
          imageUrl: input.data.image_url,
        },
      })

      return { success: true, user }
    }),

  userUpdated: publicProcedure
    .input(clerkUserUpdatedSchema)
    .mutation(async ({ ctx, input }) => {
      // Handle user update
      const user = await ctx.db.user.update({
        where: { id: input.data.id },
        data: {
          email: input.data.email_addresses[0].email_address,
          firstName: input.data.first_name,
          lastName: input.data.last_name,
          imageUrl: input.data.image_url,
        },
      })

      return { success: true, user }
    }),

  userDeleted: publicProcedure
    .input(clerkUserDeletedSchema)
    .mutation(async ({ ctx, input }) => {
      // Handle user deletion (soft delete)
      await ctx.db.user.update({
        where: { id: input.data.id },
        data: {
          // Soft delete - mark as inactive
          role: 'INACTIVE',
        },
      })

      return { success: true }
    }),
})
```

### **Configuração**
```typescript
// .env.local
CLERK_WEBHOOK_SECRET=whsec_...

// src/lib/svix.ts
export const SVIX_CONFIG = {
  secret: process.env.CLERK_WEBHOOK_SECRET,
  tolerance: 300000, // 5 minutes
}
```

### **Payloads de Exemplo**
```json
// User Created Event
{
  "type": "user.created",
  "data": {
    "id": "user_2tgWqZss8GeX8QOxsUv0qZo1VWi",
    "email_addresses": [
      {
        "email_address": "user@company.com"
      }
    ],
    "first_name": "João",
    "last_name": "Silva",
    "image_url": "https://..."
  }
}

// User Updated Event
{
  "type": "user.updated",
  "data": {
    "id": "user_2tgWqZss8GeX8QOxsUv0qZo1VWi",
    "first_name": "João Carlos",
    "last_name": "Silva Santos"
  }
}
```

## 📧 **Email Service Integration**

### **Nodemailer Setup**
```typescript
// src/lib/mail/nodemailer.ts
import nodemailer from 'nodemailer'

export const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  try {
    const result = await emailTransporter.sendMail({
      from: options.from || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Email send failed:', error)
    return { success: false, error: error.message }
  }
}
```

### **Templates de Email**
```typescript
// src/lib/mail/templates.ts
export const EMAIL_TEMPLATES = {
  // Suggestion notifications
  suggestionApproved: (data: SuggestionData) => `
    <h1>Sugestão Aprovada!</h1>
    <p>Sua sugestão "${data.title}" foi aprovada.</p>
    <p>Analista: ${data.analystName}</p>
  `,

  suggestionRejected: (data: SuggestionData) => `
    <h1>Sugestão Rejeitada</h1>
    <p>Sua sugestão "${data.title}" foi rejeitada.</p>
    <p>Motivo: ${data.reason}</p>
  `,

  // Booking notifications
  bookingConfirmed: (data: BookingData) => `
    <h1>Reserva Confirmada</h1>
    <p>Sua reserva para ${data.roomName} foi confirmada.</p>
    <p>Data: ${data.date}</p>
    <p>Finalidade: ${data.purpose}</p>
  `,

  // Food order notifications
  foodOrderReady: (data: FoodOrderData) => `
    <h1>Pedido Pronto!</h1>
    <p>Seu pedido do ${data.restaurantName} está pronto.</p>
    <p>Total: R$ ${data.total}</p>
  `,
}
```

### **Email Queue System**
```typescript
// src/lib/mail/queue.ts
import { Queue } from 'bullmq'

export const emailQueue = new Queue('email', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
})

export async function queueEmail(jobData: EmailJobData) {
  await emailQueue.add('send-email', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  })
}
```

## 📱 **UploadThing Integration**

### **File Upload Configuration**
```typescript
// src/lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const fileRouter = {
  // Profile avatars
  avatarUploader: f({ image: { maxFileSize: "2MB" } })
    .middleware(async ({ req }) => {
      const user = await getCurrentUser(req)
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Update user avatar
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { imageUrl: file.url },
      })

      return { uploadedBy: metadata.userId }
    }),

  // Room images
  roomImageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const user = await getCurrentUser(req)
      if (user.role !== 'ADMIN') {
        throw new Error('Only admins can upload room images')
      }
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, uploadedBy: metadata.userId }
    }),

  // Document uploads
  documentUploader: f({ pdf: { maxFileSize: "16MB" } })
    .middleware(async ({ req }) => {
      const user = await getCurrentUser(req)
      return { userId: user.id, userRole: user.role }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Store document reference
      await prisma.document.create({
        data: {
          name: file.name,
          url: file.url,
          uploadedBy: metadata.userId,
          size: file.size,
        },
      })

      return { documentId: file.url }
    }),
} satisfies FileRouter

export type FileRouter = typeof fileRouter
```

### **Client Usage**
```tsx
// src/components/upload-avatar.tsx
import { UploadButton } from "@/lib/uploadthing"

export function AvatarUploader() {
  return (
    <UploadButton
      endpoint="avatarUploader"
      onClientUploadComplete={(res) => {
        console.log("Upload Completed: ", res)
        // Refresh user data
        queryClient.invalidateQueries(['user'])
      }}
      onUploadError={(error: Error) => {
        toast.error(`Upload failed: ${error.message}`)
      }}
    />
  )
}
```

## 🔄 **External API Integrations**

### **Shop Webhook Integration**
```typescript
// src/app/api/webhooks/shop/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-shop-signature')

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Process different event types
    switch (body.event) {
      case 'order.created':
        await handleOrderCreated(body.data)
        break
      case 'order.updated':
        await handleOrderUpdated(body.data)
        break
      case 'payment.completed':
        await handlePaymentCompleted(body.data)
        break
      default:
        console.log(`Unhandled event: ${body.event}`)
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handleOrderCreated(orderData: any) {
  // Create order in our system
  await prisma.sell.create({
    data: {
      userId: orderData.customer_id,
      productId: orderData.product_id,
      quantity: orderData.quantity,
      totalPrice: orderData.total,
      status: 'PENDING',
    },
  })

  // Send confirmation email
  await sendOrderConfirmationEmail(orderData)
}
```

### **Calendar Integration**
```typescript
// src/lib/integrations/calendar.ts
export class CalendarIntegration {
  private apiKey: string
  private calendarId: string

  constructor() {
    this.apiKey = process.env.GOOGLE_CALENDAR_API_KEY!
    this.calendarId = process.env.GOOGLE_CALENDAR_ID!
  }

  async createEvent(booking: Booking) {
    const event = {
      summary: `Reserva: ${booking.room.name}`,
      description: booking.purpose,
      start: {
        dateTime: booking.date.toISOString(),
      },
      end: {
        dateTime: new Date(booking.date.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour
      },
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create calendar event')
      }

      return await response.json()
    } catch (error) {
      console.error('Calendar integration error:', error)
      throw error
    }
  }

  private async getAccessToken() {
    // Implement OAuth flow
    // This would typically use a service account or OAuth2 flow
  }
}
```

## 📊 **Third-party Service Integrations**

### **Redis for Caching**
```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache wrapper
export class Cache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 300) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  static async invalidate(pattern: string) {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidate error:', error)
    }
  }
}
```

### **Rate Limiting**
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
})

// Middleware usage
export const rateLimitMiddleware = async (identifier: string) => {
  const result = await rateLimiter.limit(identifier)

  if (!result.success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
    })
  }

  return result
}
```

## 🔐 **Security Best Practices**

### **Webhook Security**
```typescript
// src/lib/webhooks/security.ts
import crypto from 'crypto'

export function verifySignature(payload: any, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export function validateWebhookRequest(request: Request, secret: string) {
  const signature = request.headers.get('x-webhook-signature')
  const timestamp = request.headers.get('x-webhook-timestamp')

  if (!signature || !timestamp) {
    throw new Error('Missing webhook headers')
  }

  // Check timestamp to prevent replay attacks
  const now = Date.now()
  const requestTime = parseInt(timestamp)
  const fiveMinutes = 5 * 60 * 1000

  if (Math.abs(now - requestTime) > fiveMinutes) {
    throw new Error('Webhook timestamp too old')
  }

  return signature
}
```

### **API Key Management**
```typescript
// src/lib/api-keys.ts
export class ApiKeyManager {
  static async validateKey(apiKey: string): Promise<User | null> {
    const hashedKey = await hashApiKey(apiKey)

    return prisma.user.findFirst({
      where: {
        apiKey: hashedKey,
        role: 'ADMIN', // Only admins can use API keys
      },
    })
  }

  static async generateKey(userId: string): Promise<string> {
    const apiKey = generateSecureToken()
    const hashedKey = await hashApiKey(apiKey)

    await prisma.user.update({
      where: { id: userId },
      data: { apiKey: hashedKey },
    })

    return apiKey // Return unhashed key only once
  }

  static async revokeKey(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { apiKey: null },
    })
  }
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

async function hashApiKey(key: string): Promise<string> {
  return crypto.createHash('sha256').update(key).digest('hex')
}
```

## 📋 **Integration Checklist**

### **Webhook Setup**
- [ ] **Secret keys** configuradas e seguras
- [ ] **Signature verification** implementada
- [ ] **Error handling** robusto
- [ ] **Logging** detalhado
- [ ] **Retry mechanism** para falhas

### **External Services**
- [ ] **Clerk webhooks** configurados
- [ ] **UploadThing** integrado
- [ ] **Email service** funcionando
- [ ] **Redis** para cache
- [ ] **Rate limiting** ativo

### **Security**
- [ ] **API keys** gerenciadas com segurança
- [ ] **Signature validation** em todos os webhooks
- [ ] **Input sanitization** aplicada
- [ ] **Rate limiting** configurado
- [ ] **Audit logging** ativo

### **Monitoring**
- [ ] **Error tracking** implementado
- [ ] **Performance monitoring** ativo
- [ ] **Webhook delivery** monitorado
- [ ] **Rate limit hits** logados
- [ ] **Service health** verificado

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe Backend
