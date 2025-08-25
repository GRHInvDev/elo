# 🎨 Componentes UI e Design System

## 📖 Visão Geral

O Sistema de Intranet ELO utiliza um design system baseado no **shadcn/ui** com **Tailwind CSS**, seguindo princípios de design consistentes e acessíveis. Este documento define os padrões de componentes, estilos e boas práticas de UI/UX.

## 🎯 Princípios de Design

### **Atomic Design**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│     Atoms       │ -> │   Molecules      │ -> │   Organisms     │
│ (Botões, Input) │    │ (Formulários)    │    │ (Cards, Modais) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Templates     │ -> │    Pages         │ -> │   Features      │
│ (Layouts)       │    │ (Páginas)        │    │ (Funcionalidades)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Princípios de Design**
1. **Consistência** - Componentes padronizados
2. **Acessibilidade** - WCAG 2.1 AA compliance
3. **Responsividade** - Mobile-first approach
4. **Performance** - Componentes otimizados
5. **Manutenibilidade** - Código reutilizável

## 🧩 Biblioteca de Componentes

### **Componentes Base (shadcn/ui)**

#### **Button**
```tsx
// ✅ Variantes de botão
<Button variant="default">Padrão</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="outline">Contorno</Button>
<Button variant="ghost">Fantasma</Button>
<Button variant="link">Link</Button>

// ❌ Destructive (apenas para ações perigosas)
<Button variant="destructive">Deletar</Button>

// ✅ Estados de loading
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Carregando...
</Button>

// ✅ Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="default">Padrão</Button>
<Button size="lg">Grande</Button>
```

#### **Input**
```tsx
// ✅ Input básico
<Input placeholder="Digite seu nome" />

// ✅ Input com label (usar FormField)
<FormField
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input
          type="email"
          placeholder="seu@email.com"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// ✅ Input com ícone
<div className="relative">
  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
  <Input placeholder="Buscar..." className="pl-8" />
</div>
```

#### **Card**
```tsx
// ✅ Estrutura básica
<Card>
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
    <CardDescription>Descrição opcional</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Conteúdo principal do card</p>
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>

// ✅ Card sem footer
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center space-x-4">
      <Avatar>
        <AvatarImage src="/avatar.jpg" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">João Silva</p>
        <p className="text-sm text-muted-foreground">joao@empresa.com</p>
      </div>
    </div>
  </CardContent>
</Card>
```

#### **Dialog/Modal**
```tsx
// ✅ Modal básico
<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título do Modal</DialogTitle>
      <DialogDescription>
        Descrição opcional do modal
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      <p>Conteúdo do modal</p>
    </div>
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// ✅ Sheet (sidebar mobile)
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" size="icon">
      <Menu className="h-4 w-4" />
    </Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Menu</SheetTitle>
    </SheetHeader>
    <div className="py-4">
      <NavigationMenu />
    </div>
  </SheetContent>
</Sheet>
```

### **Formulários**

#### **Estrutura de Formulários**
```tsx
// ✅ Padrão completo de formulário
'use client'

export function UserForm() {
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  })

  async function onSubmit(values: z.infer<typeof userSchema>) {
    try {
      await createUser.mutateAsync(values)
      toast.success('Usuário criado com sucesso!')
      form.reset()
    } catch (error) {
      toast.error('Erro ao criar usuário')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="João" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome</FormLabel>
                <FormControl>
                  <Input placeholder="Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="joao.silva@empresa.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Usuário
        </Button>
      </form>
    </Form>
  )
}
```

#### **Validação de Formulários**
```typescript
// ✅ Schema Zod para validação
const userSchema = z.object({
  firstName: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),

  lastName: z.string()
    .min(1, 'Sobrenome é obrigatório')
    .max(50, 'Sobrenome deve ter no máximo 50 caracteres'),

  email: z.string()
    .email('Email inválido')
    .toLowerCase(),

  department: z.string()
    .min(1, 'Setor é obrigatório'),

  role: z.enum(['USER', 'MANAGER', 'ADMIN'])
    .default('USER'),
})

const userFormSchema = userSchema.extend({
  confirmPassword: z.string(),
  acceptTerms: z.boolean()
    .refine(val => val === true, {
      message: 'Você deve aceitar os termos',
    }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})
```

### **Componentes Compostos**

#### **Data Table**
```tsx
// ✅ Tabela com funcionalidades completas
'use client'

export function UsersTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const { data: users, isLoading } = trpc.user.getAll.useQuery({
    page: 1,
    limit: 20,
  })

  const columns: ColumnDef<User>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) =>
            row.toggleSelected(!!value)
          }
        />
      ),
    },
    {
      accessorKey: 'firstName',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('firstName')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue('email')}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Função',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue('role')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: users || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filtrar usuários..."
          value={(table.getColumn('firstName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('firstName')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button>
          Adicionar Usuário
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{' '}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
```

#### **Charts e Visualizações**
```tsx
// ✅ Gráficos com Recharts
'use client'

export function UserStatsChart({ data }: { data: UserStats[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => format(new Date(value), 'dd/MM')}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="activeUsers"
          stroke="#8884d8"
          strokeWidth={2}
          name="Usuários Ativos"
        />
        <Line
          type="monotone"
          dataKey="newUsers"
          stroke="#82ca9d"
          strokeWidth={2}
          name="Novos Usuários"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ✅ Gráfico de barras
export function DepartmentChart({ data }: { data: DepartmentData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" name="Funcionários" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ✅ Gráfico de pizza
export function RoleDistributionChart({ data }: { data: RoleData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

### **Layouts e Estruturas**

#### **Layout Principal**
```tsx
// ✅ Layout base da aplicação
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// ✅ Layout de dashboard
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao Sistema de Intranet ELO
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <UserNav />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </div>
  )
}
```

#### **Responsive Design**
```tsx
// ✅ Padrões de responsividade
export function ResponsiveGrid({
  children,
  cols = { default: 1, md: 2, lg: 3, xl: 4 }
}: {
  children: React.ReactNode
  cols?: { default?: number; md?: number; lg?: number; xl?: number }
}) {
  const gridClass = cn(
    'grid gap-6',
    `grid-cols-${cols.default || 1}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  )

  return (
    <div className={gridClass}>
      {children}
    </div>
  )
}

// ✅ Componentes condicionais
export function ConditionalContent() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <DesktopContent />
      </div>

      {/* Tablet */}
      <div className="hidden md:block lg:hidden">
        <TabletContent />
      </div>

      {/* Mobile */}
      <div className="block md:hidden">
        <MobileContent />
      </div>
    </>
  )
}
```

### **Estados e Feedback**

#### **Loading States**
```tsx
// ✅ Skeleton loading
export function UserCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[160px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  )
}

// ✅ Loading button
export function LoadingButton({ loading, children, ...props }: ButtonProps & { loading?: boolean }) {
  return (
    <Button disabled={loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}

// ✅ Page loading
export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}
```

#### **Empty States**
```tsx
// ✅ Empty state informativo
export function EmptyUsersState() {
  return (
    <div className="text-center py-12">
      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Nenhum usuário encontrado</h3>
      <p className="mt-2 text-muted-foreground">
        Comece adicionando o primeiro usuário ao sistema.
      </p>
      <Button className="mt-4">
        Adicionar Usuário
      </Button>
    </div>
  )
}

// ✅ Empty state com busca
export function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="text-center py-12">
      <Search className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Nenhum resultado encontrado</h3>
      <p className="mt-2 text-muted-foreground">
        Não encontramos resultados para "{query}".
      </p>
      <Button variant="outline" className="mt-4">
        Limpar busca
      </Button>
    </div>
  )
}
```

#### **Error States**
```tsx
// ✅ Error boundary
export function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
      <h3 className="mt-4 text-lg font-semibold">Algo deu errado</h3>
      <p className="mt-2 text-muted-foreground">
        {error.message || 'Ocorreu um erro inesperado.'}
      </p>
      <Button onClick={resetError} className="mt-4">
        Tentar novamente
      </Button>
    </div>
  )
}

// ✅ Inline error
export function InlineError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
```

### **Acessibilidade**

#### **Padrões WCAG 2.1**
```tsx
// ✅ Componentes acessíveis
export function AccessibleButton() {
  return (
    <Button
      aria-label="Fechar modal"
      aria-describedby="close-button-description"
    >
      <X className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Fechar</span>
    </Button>
  )
}

// ✅ Formulários acessíveis
export function AccessibleForm() {
  return (
    <form role="form" aria-labelledby="form-title">
      <h2 id="form-title">Criar Novo Usuário</h2>

      <div role="group" aria-labelledby="personal-info">
        <h3 id="personal-info">Informações Pessoais</h3>

        <label htmlFor="firstName">
          Nome <span aria-label="obrigatório">*</span>
        </label>
        <Input
          id="firstName"
          name="firstName"
          aria-required="true"
          aria-describedby="firstName-error"
        />
        <div id="firstName-error" role="alert" aria-live="polite">
          {/* Error message */}
        </div>
      </div>
    </form>
  )
}

// ✅ Navegação acessível
export function AccessibleNavigation() {
  return (
    <nav role="navigation" aria-label="Menu principal">
      <ul role="menubar">
        <li role="none">
          <Link
            role="menuitem"
            href="/dashboard"
            aria-current="page"
          >
            Dashboard
          </Link>
        </li>
        <li role="none">
          <Link role="menuitem" href="/users">
            Usuários
          </Link>
        </li>
      </ul>
    </nav>
  )
}
```

### **Theming e Customização**

#### **Design Tokens**
```typescript
// ✅ src/lib/theme.ts
export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      900: '#111827',
    },
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
  },
  typography: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
  },
} as const
```

#### **Dark Mode**
```tsx
// ✅ Hook para tema
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  const resolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }, [theme])

  return { theme, setTheme, resolvedTheme }
}

// ✅ Theme provider
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()

  return (
    <div className={resolvedTheme === 'dark' ? 'dark' : ''}>
      {children}
    </div>
  )
}
```

## 📋 Checklist de Componentes

### **Antes de Criar um Componente**
- [ ] Já existe um componente similar na biblioteca?
- [ ] O componente segue os padrões do design system?
- [ ] Está acessível (WCAG 2.1)?
- [ ] É responsivo?
- [ ] Tem estados de loading e error apropriados?

### **Estrutura do Componente**
- [ ] Interface TypeScript bem definida
- [ ] Props documentados com JSDoc
- [ ] Exemplos de uso na documentação
- [ ] Testes unitários
- [ ] Estados de loading e error
- [ ] Responsividade testada

### **Performance**
- [ ] Usa memoização quando necessário?
- [ ] Evita re-renders desnecessários?
- [ ] Componente é lazy loaded?
- [ ] Bundle size otimizado?

### **Acessibilidade**
- [ ] Navegação por teclado funciona?
- [ ] Leitores de tela funcionam?
- [ ] Contraste de cores adequado?
- [ ] Labels e descrições apropriadas?

---

**📅 Última atualização**: Fevereiro 2025
**👥 Mantido por**: Equipe de Design
