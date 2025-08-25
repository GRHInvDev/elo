# 🎨 Arquitetura Frontend

## 📱 Next.js App Router Architecture

### 🏗️ **App Router Structure**

```
src/app/
├── (auth)/                    # Authentication routes
│   ├── sign-in/
│   └── sign-up/
│
├── (authenticated)/           # Protected routes
│   ├── dashboard/            # Main dashboard
│   ├── rooms/                # Room booking
│   ├── food/                 # Food ordering
│   ├── cars/                 # Vehicle rental
│   ├── events/               # Events management
│   ├── flyers/               # Flyers gallery
│   ├── shop/                 # Corporate store
│   ├── forms/                # Dynamic forms
│   ├── news/                 # News & posts
│   └── admin/                # Admin panel
│
├── api/                      # API routes
│   ├── trpc/                 # tRPC endpoint
│   ├── uploadthing/          # File uploads
│   └── webhooks/             # External webhooks
│
├── layout.tsx                # Root layout
└── page.tsx                  # Home page
```

### 🎯 **Key Features of App Router**

#### **1. Server Components by Default**
```tsx
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // Server-side data fetching
  const user = await getCurrentUser()

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <DashboardContent user={user} />
    </div>
  )
}
```

#### **2. Nested Layouts**
```tsx
// app/(authenticated)/layout.tsx
export default function AuthenticatedLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4">
        {children}
      </main>
      <Footer />
    </div>
  )
}
```

#### **3. Loading States**
```tsx
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}
```

#### **4. Error Boundaries**
```tsx
// app/dashboard/error.tsx
export default function DashboardError({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-destructive">
        Something went wrong!
      </h2>
      <p className="text-muted-foreground mt-2">
        {error.message}
      </p>
      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </div>
  )
}
```

## 🧩 Component Architecture

### 📦 **Component Organization**

```
src/components/
├── ui/                       # Base UI components
│   ├── button.tsx           # Button component
│   ├── input.tsx            # Input component
│   ├── dialog.tsx           # Modal dialog
│   └── ...
│
├── dashboard/               # Dashboard components
│   ├── birthdays-carousel.tsx
│   ├── main-carousel.tsx
│   ├── news-display.tsx
│   └── videos-carousel.tsx
│
├── forms/                   # Form components
│   ├── form-builder.tsx
│   ├── field-editor.tsx
│   ├── responses-list.tsx
│   └── ...
│
├── rooms/                   # Room booking components
│   ├── room-calendar.tsx
│   ├── room-map.tsx
│   ├── available-rooms.tsx
│   └── ...
│
└── ...
```

### 🎨 **UI Component Strategy**

#### **shadcn/ui Integration**
```tsx
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

#### **Composition Pattern**
```tsx
// components/forms/form-field.tsx
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function FormField({
  label,
  error,
  required,
  children
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
```

## 🎯 State Management Strategy

### 📊 **Data Fetching with tRPC**

#### **React Query Integration**
```tsx
// hooks/use-rooms.ts
import { useQuery } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc"

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: () => trpc.room.getAll.query(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

#### **Optimistic Updates**
```tsx
// hooks/use-book-room.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc"

export function useBookRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BookRoomData) =>
      trpc.room.book.mutate(data),
    onMutate: async (newBooking) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["rooms"] })

      // Snapshot the previous value
      const previousRooms = queryClient.getQueryData(["rooms"])

      // Optimistically update to the new value
      queryClient.setQueryData(["rooms"], (old: Room[]) =>
        old.map(room =>
          room.id === newBooking.roomId
            ? { ...room, isAvailable: false }
            : room
        )
      )

      return { previousRooms }
    },
    onError: (err, newBooking, context) => {
      // If the mutation fails, use the context returned
      // from onMutate to roll back
      if (context?.previousRooms) {
        queryClient.setQueryData(["rooms"], context.previousRooms)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
    },
  })
}
```

### 🎛️ **Local State Management**

#### **Custom Hooks Pattern**
```tsx
// hooks/use-form-state.ts
import { useState, useCallback } from "react"

interface FormState<T> {
  data: T
  errors: Record<string, string>
  isSubmitting: boolean
  isDirty: boolean
}

export function useFormState<T>(initialData: T) {
  const [state, setState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    isSubmitting: false,
    isDirty: false,
  })

  const updateField = useCallback((field: keyof T, value: any) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      isDirty: true,
      errors: { ...prev.errors, [field]: "" }
    }))
  }, [])

  const setErrors = useCallback((errors: Record<string, string>) => {
    setState(prev => ({ ...prev, errors }))
  }, [])

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({ ...prev, isSubmitting }))
  }, [])

  return {
    ...state,
    updateField,
    setErrors,
    setSubmitting,
  }
}
```

## 🔄 Routing & Navigation

### 🧭 **App Router Navigation**

#### **Client-Side Navigation**
```tsx
// components/navigation/main-nav.tsx
import Link from "next/link"
import { usePathname } from "next/navigation"

export function MainNav() {
  const pathname = usePathname()

  const routes = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/rooms", label: "Salas" },
    { href: "/food", label: "Alimentação" },
    { href: "/cars", label: "Veículos" },
  ]

  return (
    <nav className="flex items-center space-x-4">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === route.href
              ? "text-black dark:text-white"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  )
}
```

#### **Programmatic Navigation**
```tsx
// lib/navigation.ts
import { useRouter } from "next/navigation"

export function useNavigation() {
  const router = useRouter()

  const navigateToRoom = (roomId: string) => {
    router.push(`/rooms/${roomId}`)
  }

  const navigateToBooking = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`)
  }

  const goBack = () => {
    router.back()
  }

  return {
    navigateToRoom,
    navigateToBooking,
    goBack,
  }
}
```

## 🎨 Styling Strategy

### 🎯 **Tailwind CSS Configuration**

#### **Design System**
```javascript
// tailwind.config.ts
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### **CSS Variables**
```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## 📱 Responsive Design Strategy

### 🎯 **Mobile-First Approach**

#### **Breakpoint System**
```javascript
// lib/responsive.ts
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
}

export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  "2xl": `@media (min-width: ${breakpoints["2xl"]})`,
}
```

#### **Responsive Component Pattern**
```tsx
// components/layout/responsive-grid.tsx
interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

export function ResponsiveGrid({
  children,
  cols = { default: 1, sm: 2, md: 3, lg: 4 }
}: ResponsiveGridProps) {
  const gridCols = cn(
    "grid gap-4",
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  )

  return (
    <div className={gridCols}>
      {children}
    </div>
  )
}
```

## 🚀 Performance Optimizations

### ⚡ **Next.js Optimizations**

#### **Image Optimization**
```tsx
// components/ui/optimized-image.tsx
import Image from "next/image"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  priority = false,
  className,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    />
  )
}
```

#### **Font Optimization**
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    optimizeFonts: true,
  },
}
```

### 📦 **Bundle Optimization**

#### **Code Splitting**
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}
```

#### **Dynamic Imports**
```tsx
// components/dynamic-import.tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('./heavy-component'),
  {
    loading: () => <div>Loading...</div>,
    ssr: false,
  }
)

export function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <HeavyComponent />
    </div>
  )
}
```

## 🛡️ Error Handling Strategy

### 🌐 **Global Error Boundary**
```tsx
// components/error-boundary.tsx
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mt-2">
              Please refresh the page or try again later.
            </p>
            <Button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4"
            >
              Try again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 📊 **Error Monitoring**
```tsx
// lib/error-monitoring.ts
import { captureException } from '@sentry/nextjs'

export function logError(error: Error, context?: Record<string, any>) {
  console.error('Application error:', error, context)

  // Send to error monitoring service
  captureException(error, {
    tags: {
      component: 'frontend',
      ...context,
    },
  })
}
```

## 📱 Progressive Web App (PWA)

### ⚙️ **PWA Configuration**
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    appDir: true,
  },
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
      ],
    },
  ],
}
```

#### **Service Worker**
```typescript
// public/sw.js
const CACHE_NAME = 'intranet-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/static/js/bundle.js',
        '/static/css/main.css',
      ])
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})
```

## 🎯 Best Practices Implemented

### 📝 **Code Organization**
- ✅ **Feature-based structure** - Agrupamento por funcionalidade
- ✅ **Component composition** - Reutilização via composição
- ✅ **Custom hooks** - Lógica reutilizável
- ✅ **TypeScript strict** - Type safety completo

### 🎨 **UI/UX Standards**
- ✅ **Consistent design system** - shadcn/ui + Tailwind
- ✅ **Mobile-first responsive** - Design adaptativo
- ✅ **Accessibility (WCAG)** - Componentes acessíveis
- ✅ **Loading states** - Feedback visual

### ⚡ **Performance**
- ✅ **Server components** - Renderização otimizada
- ✅ **Image optimization** - Next.js Image
- ✅ **Code splitting** - Bundle otimizado
- ✅ **Caching strategy** - Cache inteligente

### 🔒 **Security**
- ✅ **Type-safe APIs** - tRPC validation
- ✅ **Input sanitization** - Zod schemas
- ✅ **Authentication** - Clerk.js integration
- ✅ **Error boundaries** - Graceful error handling

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe Frontend

