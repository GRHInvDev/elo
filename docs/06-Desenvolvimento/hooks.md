# 🪝 Custom Hooks

## 📖 Visão Geral

Os **Custom Hooks** são uma das principais ferramentas para reutilização de lógica no Sistema de Intranet ELO. Eles seguem o padrão do React para compartilhar lógica stateful entre componentes, mantendo a separação de responsabilidades e facilitando os testes.

## 🎯 Princípios dos Hooks

### **Regras dos Hooks**
1. **Somente em Componentes React** - Hooks só podem ser chamados dentro de componentes React ou outros hooks
2. **Chamar no Top Level** - Não chamar hooks dentro de loops, condições ou funções aninhadas
3. **Convenção de Nomenclatura** - Sempre começar com `use` (ex: `useUserData`)
4. **Composição sobre Herança** - Preferir composição a herança de componentes

### **Boas Práticas**
- ✅ **Single Responsibility** - Cada hook deve ter uma responsabilidade clara
- ✅ **Reutilização** - Hooks devem ser reutilizáveis em diferentes contextos
- ✅ **Testabilidade** - Hooks devem ser facilmente testáveis
- ✅ **Performance** - Otimizar re-renders e dependências
- ✅ **TypeScript** - Sempre tipar adequadamente

## 🪝 Hooks de Dados (Data Fetching)

### **useQuery (tRPC)**
```typescript
// ✅ Hook básico para queries tRPC
export function useUserProfile(userId?: string) {
  const { data: user, isLoading, error } = trpc.user.getById.useQuery(
    { id: userId! },
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    }
  )

  return {
    user,
    isLoading,
    error: error?.message,
    isError: !!error,
  }
}

// ✅ Hook com invalidação
export function useUserList(filters: UserFilters = {}) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = trpc.user.getAll.useQuery(filters, {
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['user.getAll'] })
  }, [queryClient])

  return {
    users: data?.users || [],
    total: data?.total || 0,
    isLoading,
    error: error?.message,
    invalidateUsers,
  }
}
```

### **useMutation (tRPC)**
```typescript
// ✅ Hook para mutations com feedback
export function useCreateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const mutation = trpc.user.create.useMutation({
    onSuccess: (newUser) => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['user.getAll'] })

      // Add to cache
      queryClient.setQueryData(['user.getById', { id: newUser.id }], newUser)

      toast({
        title: 'Sucesso!',
        description: 'Usuário criado com sucesso.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar usuário.',
        variant: 'destructive',
      })
    },
  })

  return {
    createUser: mutation.mutateAsync,
    isCreating: mutation.isLoading,
    error: mutation.error?.message,
  }
}

// ✅ Hook com rollback
export function useUpdateUser() {
  const queryClient = useQueryClient()

  const mutation = trpc.user.update.useMutation({
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user.getById', { id }] })

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(['user.getById', { id }])

      // Optimistically update to the new value
      queryClient.setQueryData(['user.getById', { id }], (old: any) => ({
        ...old,
        ...data,
      }))

      // Return a context object with the snapshotted value
      return { previousUser }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUser) {
        queryClient.setQueryData(
          ['user.getById', { id: variables.id }],
          context.previousUser
        )
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['user.getById', { id: variables.id }] })
    },
  })

  return {
    updateUser: mutation.mutateAsync,
    isUpdating: mutation.isLoading,
    error: mutation.error?.message,
  }
}
```

## 🎛️ Hooks de UI (Interface)

### **useLocalStorage**
```typescript
// ✅ Hook para localStorage com TypeScript
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}

// ✅ Uso prático
export function UserPreferences() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light')
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebar', false)

  return (
    <div>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
      <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
        Toggle Sidebar
      </button>
    </div>
  )
}
```

### **useDebounce**
```typescript
// ✅ Hook para debounce de valores
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// ✅ Hook para debounce de callbacks
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef<T>(callback)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }, [delay]) as T
}

// ✅ Uso em busca
export function SearchInput() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500)

  const { data: results } = trpc.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 2 }
  )

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar..."
      />
      {results?.map(result => (
        <div key={result.id}>{result.title}</div>
      ))}
    </div>
  )
}
```

### **useIntersectionObserver**
```typescript
// ✅ Hook para lazy loading e infinite scroll
export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [elementRef, options])

  return isIntersecting
}

// ✅ Uso para infinite scroll
export function InfiniteScroll({ children }: { children: React.ReactNode }) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isIntersecting = useIntersectionObserver(loadMoreRef, {
    threshold: 0.1,
  })

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery(
    ['posts'],
    ({ pageParam = 1 }) => fetchPosts(pageParam),
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  )

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isLoading) {
      fetchNextPage()
    }
  }, [isIntersecting, hasNextPage, isLoading, fetchNextPage])

  return (
    <div>
      {children}
      <div ref={loadMoreRef}>
        {isLoading && <div>Loading more...</div>}
      </div>
    </div>
  )
}
```

## 📝 Hooks de Formulários

### **useForm (React Hook Form + Zod)**
```typescript
// ✅ Hook para formulários com validação
export function useUserForm() {
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      role: 'USER',
    },
  })

  const { mutateAsync: createUser, isLoading } = trpc.user.create.useMutation()

  const onSubmit = useCallback(async (values: z.infer<typeof userSchema>) => {
    try {
      await createUser(values)
      form.reset()
      toast.success('Usuário criado com sucesso!')
    } catch (error) {
      toast.error('Erro ao criar usuário')
    }
  }, [createUser, form])

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting || isLoading,
    errors: form.formState.errors,
  }
}

// ✅ Hook para formulário de edição
export function useUserEditForm(userId: string) {
  const { data: user, isLoading: isLoadingUser } = trpc.user.getById.useQuery({ id: userId })
  const { mutateAsync: updateUser, isLoading: isUpdating } = trpc.user.update.useMutation()

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      role: 'USER',
    },
  })

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.setor || '',
        role: user.role,
      })
    }
  }, [user, form])

  const onSubmit = useCallback(async (values: z.infer<typeof userSchema>) => {
    try {
      await updateUser({ id: userId, data: values })
      toast.success('Usuário atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar usuário')
    }
  }, [updateUser, userId])

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading: isLoadingUser,
    isSubmitting: form.formState.isSubmitting || isUpdating,
    errors: form.formState.errors,
  }
}
```

### **useFieldArray**
```typescript
// ✅ Hook para arrays de campos dinâmicos
export function useDynamicFields() {
  const { fields, append, remove, swap, move, insert } = useFieldArray({
    name: 'items',
    control: form.control,
  })

  const addField = useCallback(() => {
    append({ name: '', value: '' })
  }, [append])

  const removeField = useCallback((index: number) => {
    remove(index)
  }, [remove])

  const moveField = useCallback((from: number, to: number) => {
    move(from, to)
  }, [move])

  return {
    fields,
    addField,
    removeField,
    moveField,
    hasFields: fields.length > 0,
  }
}

// ✅ Uso em formulário dinâmico
export function DynamicForm() {
  const { fields, addField, removeField } = useDynamicFields()

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <Input
            {...form.register(`items.${index}.name`)}
            placeholder="Nome"
          />
          <Input
            {...form.register(`items.${index}.value`)}
            placeholder="Valor"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => removeField(index)}
          >
            Remover
          </Button>
        </div>
      ))}

      <Button type="button" onClick={addField}>
        Adicionar Campo
      </Button>
    </div>
  )
}
```

## 🔄 Hooks de Estado

### **useToggle**
```typescript
// ✅ Hook simples para toggle
export function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue(prev => !prev)
  }, [])

  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])

  return [value, toggle, setTrue, setFalse] as const
}

// ✅ Hook para múltiplos toggles
export function useToggles(initialValues: Record<string, boolean> = {}) {
  const [values, setValues] = useState(initialValues)

  const toggle = useCallback((key: string) => {
    setValues(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const setValue = useCallback((key: string, value: boolean) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }, [])

  const setAll = useCallback((value: boolean) => {
    setValues(prev => Object.keys(prev).reduce((acc, key) => ({
      ...acc,
      [key]: value,
    }), {}))
  }, [])

  return {
    values,
    toggle,
    setValue,
    setAll,
  }
}

// ✅ Uso prático
export function ToggleExample() {
  const [isOpen, toggleOpen] = useToggle()
  const { values, toggle } = useToggles({
    notifications: true,
    darkMode: false,
    autoSave: true,
  })

  return (
    <div>
      <button onClick={toggleOpen}>
        {isOpen ? 'Fechar' : 'Abrir'}
      </button>

      <div>
        <label>
          <input
            type="checkbox"
            checked={values.notifications}
            onChange={() => toggle('notifications')}
          />
          Notificações
        </label>
      </div>
    </div>
  )
}
```

### **useAsync**
```typescript
// ✅ Hook para operações assíncronas
export function useAsync<T, Args extends any[]>(
  asyncFunction: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<{
    data: T | null
    error: Error | null
    loading: boolean
  }>({
    data: null,
    error: null,
    loading: false,
  })

  const execute = useCallback(async (...args: Args) => {
    setState({ data: null, error: null, loading: true })

    try {
      const data = await asyncFunction(...args)
      setState({ data, error: null, loading: false })
      return data
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      setState({ data: null, error: err, loading: false })
      throw err
    }
  }, [asyncFunction])

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

// ✅ Uso com API
export function useUserCreation() {
  const createUserAsync = useAsync(trpc.user.create.mutateAsync)

  const createUser = useCallback(async (userData: CreateUserData) => {
    try {
      const newUser = await createUserAsync.execute(userData)
      toast.success('Usuário criado com sucesso!')
      return newUser
    } catch (error) {
      toast.error('Erro ao criar usuário')
      throw error
    }
  }, [createUserAsync])

  return {
    createUser,
    isLoading: createUserAsync.loading,
    error: createUserAsync.error,
  }
}
```

### **usePrevious**
```typescript
// ✅ Hook para valor anterior
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  })

  return ref.current
}

// ✅ Uso para comparações
export function useHasChanged<T>(value: T): boolean {
  const previous = usePrevious(value)
  return previous !== value
}

// ✅ Hook para detectar mudanças
export function UserProfile({ userId }: { userId: string }) {
  const hasUserIdChanged = useHasChanged(userId)

  useEffect(() => {
    if (hasUserIdChanged) {
      // Reset form or perform cleanup
      console.log('User ID changed, resetting...')
    }
  }, [hasUserIdChanged])

  return <div>User Profile for ID: {userId}</div>
}
```

## 🎯 Hooks de Utilitários

### **useCopyToClipboard**
```typescript
// ✅ Hook para copiar para clipboard
export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text: ', error)
    }
  }, [])

  return { copy, isCopied }
}

// ✅ Uso prático
export function CopyButton({ text }: { text: string }) {
  const { copy, isCopied } = useCopyToClipboard()

  return (
    <Button onClick={() => copy(text)}>
      {isCopied ? 'Copiado!' : 'Copiar'}
    </Button>
  )
}
```

### **useWindowSize**
```typescript
// ✅ Hook para tamanho da janela
export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

// ✅ Hook para breakpoints
export function useBreakpoint() {
  const { width } = useWindowSize()

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isLargeDesktop: width >= 1440,
  }
}

// ✅ Uso responsivo
export function ResponsiveComponent() {
  const { isMobile, isTablet } = useBreakpoint()

  if (isMobile) {
    return <MobileLayout />
  }

  if (isTablet) {
    return <TabletLayout />
  }

  return <DesktopLayout />
}
```

### **useEventListener**
```typescript
// ✅ Hook para event listeners
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Element | Window = window,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    const targetElement = element?.current || element
    if (!(targetElement && targetElement.addEventListener)) return

    const eventListener = (event: Event) => savedHandler.current(event as any)

    targetElement.addEventListener(eventName, eventListener, options)

    return () => {
      targetElement.removeEventListener(eventName, eventListener, options)
    }
  }, [eventName, element, options])
}

// ✅ Uso para keyboard shortcuts
export function useKeyboardShortcut(
  shortcut: string,
  callback: () => void,
  options?: { ctrl?: boolean; shift?: boolean; alt?: boolean }
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { ctrl = false, shift = false, alt = false } = options || {}

    if (
      event.key.toLowerCase() === shortcut.toLowerCase() &&
      event.ctrlKey === ctrl &&
      event.shiftKey === shift &&
      event.altKey === alt
    ) {
      event.preventDefault()
      callback()
    }
  }, [shortcut, callback, options])

  useEventListener('keydown', handleKeyDown)
}

// ✅ Uso prático
export function KeyboardShortcuts() {
  useKeyboardShortcut('s', () => {
    console.log('Save shortcut pressed')
  }, { ctrl: true })

  useKeyboardShortcut('n', () => {
    console.log('New item shortcut')
  }, { ctrl: true, shift: true })

  return <div>Press Ctrl+S to save, Ctrl+Shift+N for new item</div>
}
```

## 🧪 Testando Hooks

### **Padrões de Teste**
```typescript
// ✅ Teste de hook com Testing Library
import { renderHook, waitFor } from '@testing-library/react'
import { useUserData } from '@/hooks/useUserData'

describe('useUserData', () => {
  it('should fetch user data successfully', async () => {
    const mockUser = { id: '1', name: 'John Doe' }

    // Mock the tRPC query
    const mockQuery = jest.fn().mockResolvedValue(mockUser)
    // Setup your mock implementation

    const { result } = renderHook(() => useUserData('1'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.error).toBe(null)
    })
  })

  it('should handle errors', async () => {
    const mockError = new Error('User not found')

    // Mock error response
    const mockQuery = jest.fn().mockRejectedValue(mockError)

    const { result } = renderHook(() => useUserData('invalid-id'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toBe(null)
      expect(result.current.error).toBe('User not found')
    })
  })
})
```

### **Teste de Hooks com User Events**
```typescript
// ✅ Teste de hooks de UI
import { renderHook, act } from '@testing-library/react'
import { useToggle } from '@/hooks/useToggle'

describe('useToggle', () => {
  it('should toggle value', () => {
    const { result } = renderHook(() => useToggle(false))

    expect(result.current[0]).toBe(false)

    act(() => {
      result.current[1]() // toggle
    })

    expect(result.current[0]).toBe(true)

    act(() => {
      result.current[1]() // toggle again
    })

    expect(result.current[0]).toBe(false)
  })

  it('should set value to true', () => {
    const { result } = renderHook(() => useToggle(false))

    act(() => {
      result.current[2]() // setTrue
    })

    expect(result.current[0]).toBe(true)
  })
})
```

## 📋 Boas Práticas

### **Checklist para Criar Hooks**
- [ ] O hook começa com `use`?
- [ ] É reutilizável em diferentes contextos?
- [ ] Segue as regras dos hooks do React?
- [ ] Tem uma responsabilidade clara?
- [ ] Está bem tipado com TypeScript?
- [ ] Tem testes adequados?
- [ ] A documentação está atualizada?

### **Performance**
- [ ] Usa `useCallback` para funções?
- [ ] Usa `useMemo` para computações caras?
- [ ] Evita re-renders desnecessários?
- [ ] Limpa event listeners e timers?

### **Convenções de Nomenclatura**
- ✅ `useUserData()` - Data fetching
- ✅ `useForm()` - Formulários
- ✅ `useToggle()` - Estado simples
- ✅ `useDebounce()` - Utilitários
- ✅ `useLocalStorage()` - Side effects

### **Estrutura de Hook**
```typescript
// ✅ Estrutura recomendada
export function useCustomHook(param: ParamType) {
  // State
  const [state, setState] = useState(initialValue)

  // Refs
  const ref = useRef(value)

  // Computed values
  const computed = useMemo(() => expensiveComputation(state), [state])

  // Callbacks
  const callback = useCallback(() => {
    // Implementation
  }, [dependencies])

  // Effects
  useEffect(() => {
    // Side effect
    return () => cleanup()
  }, [dependencies])

  // Return object
  return {
    // State
    state,

    // Computed
    computed,

    // Actions
    callback,

    // Metadata
    isLoading,
    error,
  }
}
```

---

**📅 Última atualização**: Fevereiro 2025
**👥 Mantido por**: Equipe de Desenvolvimento
