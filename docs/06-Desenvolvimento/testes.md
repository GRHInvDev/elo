# 🧪 Estratégia de Testes

## 📖 Visão Geral

A **estratégia de testes** do Sistema de Intranet ELO é baseada em uma abordagem **pyramid testing** com foco em qualidade, performance e manutenibilidade. Utilizamos ferramentas modernas como Jest, React Testing Library e Playwright para garantir que o código seja confiável e robusto.

## 🎯 Objetivos

### **Qualidade de Código**
- ✅ **Cobertura Adequada** - Testes cobrindo cenários críticos
- ✅ **Regressão Previne** - Detectar bugs antes do deploy
- ✅ **Documentação Viva** - Testes como documentação executável
- ✅ **Refatoração Segura** - Confiança para mudanças

### **Performance**
- ✅ **Testes Rápidos** - Execução em segundos
- ✅ **Paralelização** - Testes rodando em paralelo
- ✅ **Cache Inteligente** - Otimização de builds
- ✅ **CI/CD Integrado** - Testes automatizados no pipeline

### **Manutenibilidade**
- ✅ **Testes Legíveis** - Código de teste compreensível
- ✅ **Padrões Consistentes** - Estrutura padronizada
- ✅ **Ferramentas Adequadas** - Stack otimizada para o projeto
- ✅ **Feedback Rápido** - Resultados imediatos

## 🏗️ Pirâmide de Testes

### **Estrutura da Pirâmide**
```
     ┌─────────────┐
     │  E2E Tests │  <- Poucos, lentos, caros
     │ (Playwright)│
     └─────────────┘
           │
     ┌─────────────┐
     │Integration │  <- Alguns, médios, moderados
     │   Tests    │
     │ (Jest RTL) │
     └─────────────┘
           │
     ┌─────────────┐
     │   Unit     │  <- Muitos, rápidos, baratos
     │   Tests    │
     │ (Jest RTL) │
     └─────────────┘
```

### **Distribuição Recomendada**
- **Unit Tests**: 70-80% dos testes
- **Integration Tests**: 15-20% dos testes
- **E2E Tests**: 5-10% dos testes

## 🛠️ Stack de Testes

### **Ferramentas Principais**
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:e2e": "playwright test",
  "test:ui": "playwright test --ui"
}
```

### **Configuração Jest**
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^__tests__/(.*)$': '<rootDir>/src/__tests__/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

### **Setup de Testes**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Mock tRPC
jest.mock('@/server/api/trpc', () => ({
  trpc: {
    user: {
      getById: {
        useQuery: jest.fn(),
      },
      create: {
        useMutation: jest.fn(),
      },
    },
  },
}))

// Global test utilities
global.testUtils = {
  renderWithProviders: (component: React.ReactElement) => {
    return render(component, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            {children}
          </SessionProvider>
        </QueryClientProvider>
      ),
    })
  },
}
```

## 🧪 Testes Unitários

### **Testes de Componentes**
```typescript
// src/__tests__/components/UserCard.test.tsx
import { render, screen } from '@testing-library/react'
import { UserCard } from '@/components/UserCard'

const mockUser = {
  id: '1',
  firstName: 'João',
  lastName: 'Silva',
  email: 'joao.silva@empresa.com',
  avatar: 'https://example.com/avatar.jpg',
  role: 'USER',
  enterprise: 'Box',
  setor: 'TI',
  isActive: true,
}

describe('UserCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('joao.silva@empresa.com')).toBeInTheDocument()
    expect(screen.getByText('Box • TI')).toBeInTheDocument()
  })

  it('shows user avatar when provided', () => {
    render(<UserCard user={mockUser} />)

    const avatar = screen.getByRole('img')
    expect(avatar).toHaveAttribute('src', mockUser.avatar)
    expect(avatar).toHaveAttribute('alt', 'João Silva')
  })

  it('shows fallback avatar when no avatar provided', () => {
    const userWithoutAvatar = { ...mockUser, avatar: undefined }
    render(<UserCard user={userWithoutAvatar} />)

    expect(screen.getByText('JS')).toBeInTheDocument()
  })

  it('shows correct role badge', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('USER')).toBeInTheDocument()
  })

  it('shows edit button for admin users', () => {
    // Mock admin session context
    const mockSession = {
      user: { role: 'ADMIN' },
    }

    render(
      <SessionProvider value={mockSession}>
        <UserCard user={mockUser} onEdit={jest.fn()} />
      </SessionProvider>
    )

    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
  })

  it('does not show edit button for non-admin users', () => {
    const mockSession = {
      user: { role: 'USER' },
    }

    render(
      <SessionProvider value={mockSession}>
        <UserCard user={mockUser} onEdit={jest.fn()} />
      </SessionProvider>
    )

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn()
    const mockSession = {
      user: { role: 'ADMIN' },
    }

    render(
      <SessionProvider value={mockSession}>
        <UserCard user={mockUser} onEdit={mockOnEdit} />
      </SessionProvider>
    )

    const editButton = screen.getByRole('button', { name: /editar/i })
    fireEvent.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockUser)
  })
})
```

### **Testes de Hooks**
```typescript
// src/__tests__/hooks/useUserData.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useUserData } from '@/hooks/useUserData'
import { trpc } from '@/server/api/trpc'

// Mock tRPC
jest.mock('@/server/api/trpc', () => ({
  trpc: {
    user: {
      getById: {
        useQuery: jest.fn(),
      },
    },
  },
}))

const mockUser = {
  id: '1',
  firstName: 'João',
  lastName: 'Silva',
  email: 'joao.silva@empresa.com',
}

describe('useUserData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns user data when fetch is successful', async () => {
    // Mock successful response
    const mockUseQuery = jest.fn().mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
    })

    trpc.user.getById.useQuery = mockUseQuery

    const { result } = renderHook(() => useUserData('1'))

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    expect(mockUseQuery).toHaveBeenCalledWith(
      { id: '1' },
      expect.objectContaining({
        enabled: true,
      })
    )
  })

  it('returns loading state initially', () => {
    const mockUseQuery = jest.fn().mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })

    trpc.user.getById.useQuery = mockUseQuery

    const { result } = renderHook(() => useUserData('1'))

    expect(result.current.user).toBe(null)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(null)
  })

  it('returns error when fetch fails', async () => {
    const mockError = new Error('User not found')
    const mockUseQuery = jest.fn().mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
    })

    trpc.user.getById.useQuery = mockUseQuery

    const { result } = renderHook(() => useUserData('1'))

    await waitFor(() => {
      expect(result.current.user).toBe(null)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('User not found')
    })
  })

  it('does not fetch when userId is not provided', () => {
    const mockUseQuery = jest.fn().mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    })

    trpc.user.getById.useQuery = mockUseQuery

    renderHook(() => useUserData())

    expect(mockUseQuery).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        enabled: false,
      })
    )
  })
})
```

### **Testes de Utilitários**
```typescript
// src/__tests__/utils/formatDate.test.ts
import { formatDate, formatRelativeTime } from '@/utils/date'

describe('formatDate', () => {
  it('formats date in Brazilian Portuguese', () => {
    const date = new Date('2023-12-25T10:30:00')
    const result = formatDate(date, 'pt-BR')

    expect(result).toBe('25/12/2023')
  })

  it('formats date with time', () => {
    const date = new Date('2023-12-25T10:30:00')
    const result = formatDate(date, 'pt-BR', { includeTime: true })

    expect(result).toBe('25/12/2023 10:30')
  })

  it('handles invalid date', () => {
    expect(() => formatDate(new Date('invalid'))).toThrow('Invalid date')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-12-25T12:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('formats minutes ago', () => {
    const pastDate = new Date('2023-12-25T11:45:00')
    const result = formatRelativeTime(pastDate)

    expect(result).toBe('15 minutos atrás')
  })

  it('formats hours ago', () => {
    const pastDate = new Date('2023-12-25T09:00:00')
    const result = formatRelativeTime(pastDate)

    expect(result).toBe('3 horas atrás')
  })

  it('formats days ago', () => {
    const pastDate = new Date('2023-12-22T12:00:00')
    const result = formatRelativeTime(pastDate)

    expect(result).toBe('3 dias atrás')
  })
})
```

## 🔗 Testes de Integração

### **Testes de Páginas**
```typescript
// src/__tests__/integration/DashboardPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { DashboardPage } from '@/app/dashboard/page'
import { trpc } from '@/server/api/trpc'

jest.mock('@/server/api/trpc', () => ({
  trpc: {
    dashboard: {
      getPersonalizedData: {
        useQuery: jest.fn(),
      },
    },
    user: {
      getCurrent: {
        useQuery: jest.fn(),
      },
    },
  },
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dashboard with user data', async () => {
    const mockUser = {
      id: '1',
      firstName: 'João',
      lastName: 'Silva',
      role: 'USER',
    }

    const mockDashboardData = {
      recentBookings: [],
      pendingTasks: [],
      upcomingEvents: [],
    }

    // Mock the queries
    trpc.user.getCurrent.useQuery.mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
    })

    trpc.dashboard.getPersonalizedData.useQuery.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    trpc.user.getCurrent.useQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })

    render(<DashboardPage />)

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('shows error state when user fetch fails', async () => {
    const mockError = new Error('Failed to fetch user')

    trpc.user.getCurrent.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar dashboard')).toBeInTheDocument()
    })
  })
})
```

### **Testes de Formulários**
```typescript
// src/__tests__/integration/UserForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserForm } from '@/components/UserForm'
import { trpc } from '@/server/api/trpc'

jest.mock('@/server/api/trpc', () => ({
  trpc: {
    user: {
      create: {
        useMutation: jest.fn(),
      },
    },
  },
}))

describe('UserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('submits form successfully', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({
      id: '1',
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao.silva@empresa.com',
    })

    trpc.user.create.useMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
      error: null,
    })

    render(<UserForm />)

    // Fill form
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'João' },
    })
    fireEvent.change(screen.getByLabelText('Sobrenome'), {
      target: { value: 'Silva' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joao.silva@empresa.com' },
    })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /criar usuário/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao.silva@empresa.com',
      })
    })
  })

  it('shows validation errors for empty fields', async () => {
    render(<UserForm />)

    // Submit without filling
    fireEvent.click(screen.getByRole('button', { name: /criar usuário/i }))

    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument()
      expect(screen.getByText('Sobrenome é obrigatório')).toBeInTheDocument()
      expect(screen.getByText('Email é obrigatório')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    trpc.user.create.useMutation.mockReturnValue({
      mutateAsync: jest.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
      isLoading: true,
      error: null,
    })

    render(<UserForm />)

    fireEvent.click(screen.getByRole('button', { name: /criar usuário/i }))

    expect(screen.getByText('Criando...')).toBeInTheDocument()
  })
})
```

## 🌐 Testes E2E (Playwright)

### **Configuração Playwright**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### **Testes de Fluxo Completo**
```typescript
// src/__tests__/e2e/user-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/sign-in')
    await page.fill('[data-testid="email"]', 'admin@empresa.com')
    await page.fill('[data-testid="password"]', 'password')
    await page.click('[data-testid="sign-in-button"]')

    // Wait for dashboard
    await page.waitForURL('/dashboard')
  })

  test('should create new user successfully', async ({ page }) => {
    // Navigate to users page
    await page.click('[data-testid="users-menu"]')
    await page.waitForURL('/admin/users')

    // Click create user button
    await page.click('[data-testid="create-user-button"]')

    // Fill user form
    await page.fill('[data-testid="firstName"]', 'Maria')
    await page.fill('[data-testid="lastName"]', 'Santos')
    await page.fill('[data-testid="email"]', 'maria.santos@empresa.com')
    await page.selectOption('[data-testid="department"]', 'TI')
    await page.selectOption('[data-testid="role"]', 'USER')

    // Submit form
    await page.click('[data-testid="submit-button"]')

    // Wait for success message
    await expect(page.getByText('Usuário criado com sucesso!')).toBeVisible()

    // Verify user appears in list
    await expect(page.getByText('Maria Santos')).toBeVisible()
    await expect(page.getByText('maria.santos@empresa.com')).toBeVisible()
  })

  test('should edit existing user', async ({ page }) => {
    // Navigate to users page
    await page.click('[data-testid="users-menu"]')
    await page.waitForURL('/admin/users')

    // Find and click edit button for first user
    await page.click('[data-testid="edit-user-1"]')

    // Modify user data
    await page.fill('[data-testid="firstName"]', 'João Editado')
    await page.fill('[data-testid="lastName"]', 'Silva Editado')

    // Submit form
    await page.click('[data-testid="submit-button"]')

    // Wait for success message
    await expect(page.getByText('Usuário atualizado com sucesso!')).toBeVisible()

    // Verify changes
    await expect(page.getByText('João Editado Silva Editado')).toBeVisible()
  })

  test('should delete user with confirmation', async ({ page }) => {
    // Navigate to users page
    await page.click('[data-testid="users-menu"]')
    await page.waitForURL('/admin/users')

    // Click delete button
    page.on('dialog', dialog => dialog.accept())
    await page.click('[data-testid="delete-user-1"]')

    // Wait for success message
    await expect(page.getByText('Usuário deletado com sucesso!')).toBeVisible()

    // Verify user is removed from list
    await expect(page.getByText('João Editado')).not.toBeVisible()
  })

  test('should handle form validation errors', async ({ page }) => {
    // Navigate to create user
    await page.click('[data-testid="users-menu"]')
    await page.click('[data-testid="create-user-button"]')

    // Try to submit empty form
    await page.click('[data-testid="submit-button"]')

    // Check validation errors
    await expect(page.getByText('Nome é obrigatório')).toBeVisible()
    await expect(page.getByText('Sobrenome é obrigatório')).toBeVisible()
    await expect(page.getByText('Email é obrigatório')).toBeVisible()
  })
})
```

### **Testes de Responsividade**
```typescript
// src/__tests__/e2e/responsive.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/dashboard')

    // Check mobile navigation
    await expect(page.getByTestId('mobile-menu')).toBeVisible()
    await expect(page.getByTestId('desktop-sidebar')).toBeHidden()

    // Check responsive layout
    await expect(page.getByTestId('dashboard-grid')).toHaveClass(/grid-cols-1/)
  })

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto('/dashboard')

    // Check tablet layout
    await expect(page.getByTestId('dashboard-grid')).toHaveClass(/md:grid-cols-2/)
  })

  test('should work on desktop devices', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })

    await page.goto('/dashboard')

    // Check desktop layout
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible()
    await expect(page.getByTestId('dashboard-grid')).toHaveClass(/lg:grid-cols-4/)
  })
})
```

## 📊 Cobertura de Testes

### **Configuração de Cobertura**
```javascript
// jest.config.js - Coverage configuration
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
    '!src/**/types/**',
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
}
```

### **Relatório de Cobertura**
```bash
# Run tests with coverage
npm run test:coverage

# Generate coverage report
# Output: coverage/lcov-report/index.html
```

### **Métricas de Cobertura**
- **Statements**: 85% (mínimo 80%)
- **Branches**: 82% (mínimo 80%)
- **Functions**: 88% (mínimo 80%)
- **Lines**: 84% (mínimo 80%)

## 🔄 Integração com CI/CD

### **GitHub Actions**
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run type check
      run: npm run type-check

    - name: Run linting
      run: npm run lint

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration

    - name: Run E2E tests
      run: npm run test:e2e
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### **Scripts NPM**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__/unit",
    "test:integration": "jest --testPathPattern=__tests__/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  }
}
```

## 📋 Boas Práticas

### **Princípios de Teste**
1. **Teste Comportamento, Não Implementação**
2. **Testes Legíveis como Documentação**
3. **Testes Independentes e Isolados**
4. **Testes Rápidos e Confiáveis**
5. **Manutenção Contínua**

### **Convenções de Nome**
```typescript
// ✅ Unit tests
describe('UserCard', () => { ... })
it('renders user information correctly', () => { ... })

// ✅ Integration tests
describe('UserForm Integration', () => { ... })
it('submits form successfully', () => { ... })

// ✅ E2E tests
test.describe('User Management Flow', () => { ... })
test('should create new user successfully', async ({ page }) => { ... })
```

### **Test Data Management**
```typescript
// src/__tests__/fixtures/users.ts
export const mockUsers = {
  admin: {
    id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@empresa.com',
    role: 'ADMIN',
    enterprise: 'Box',
    setor: 'TI',
    isActive: true,
  },
  regular: {
    id: '2',
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao.silva@empresa.com',
    role: 'USER',
    enterprise: 'Box',
    setor: 'Vendas',
    isActive: true,
  },
}

// src/__tests__/fixtures/factories.ts
export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  role: 'USER',
  enterprise: 'Box',
  setor: 'TI',
  isActive: true,
  ...overrides,
})
```

## 🐛 Debugging de Testes

### **Ferramentas de Debug**
```bash
# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test UserCard.test.tsx

# Run tests with coverage
npm run test:coverage

# Debug E2E tests
npm run test:e2e -- --debug

# Show test output with colors
npm run test -- --verbose --colors
```

### **Problemas Comuns**
1. **Async Operations**: Use `waitFor` e `act`
2. **Mocking**: Configure mocks adequadamente
3. **DOM Updates**: Aguarde mudanças no DOM
4. **Memory Leaks**: Limpe recursos após testes
5. **Timing Issues**: Use timers falsos

### **Debugging Patterns**
```typescript
// ✅ Debugging async operations
it('should handle async data', async () => {
  render(<AsyncComponent />)

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  // Check final state
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
})

// ✅ Debugging user interactions
it('should handle user input', async () => {
  render(<InputComponent />)

  const input = screen.getByRole('textbox')

  // Use act for state updates
  await act(async () => {
    fireEvent.change(input, { target: { value: 'test' } })
  })

  expect(input).toHaveValue('test')
})
```

---

**📅 Última atualização**: Fevereiro 2025
**👥 Mantido por**: Equipe de Desenvolvimento
