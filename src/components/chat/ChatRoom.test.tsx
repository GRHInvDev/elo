/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChatRoom } from './ChatRoom'

// Mock do tRPC
const mockGetRecentMessages = jest.fn()
const mockGetMessages = jest.fn()

jest.mock('@/trpc/react', () => ({
  api: {
    chatMessage: {
      getRecentMessages: {
        useQuery: mockGetRecentMessages
      },
      getMessages: {
        useQuery: mockGetMessages
      }
    }
  }
}))

// Mock do Socket.io
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connect: jest.fn(),
}

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket)
}))

// Mock do Clerk
const mockUseUser = jest.fn(() => ({
  user: {
    id: 'test-user-id',
    firstName: 'João',
    lastName: 'Silva'
  }
}))

jest.mock('@clerk/nextjs', () => ({
  useUser: mockUseUser
}))

describe('ChatRoom', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    jest.clearAllMocks()
  })

  const renderComponent = (props = {}): ReturnType<typeof render> => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ChatRoom roomId="global" {...props} />
      </QueryClientProvider>
    )
  }

  it('deve mostrar indicador de carregamento inicialmente', () => {
    mockGetRecentMessages.mockReturnValue({
      data: undefined,
      isLoading: true
    })

    renderComponent()

    expect(screen.getByText('Carregando chat...')).toBeInTheDocument()
  })

  it('deve renderizar mensagens quando carregadas', async () => {
    const mockMessages = [
      {
        id: '1',
        content: 'Olá, pessoal!',
        createdAt: new Date(),
        userId: 'user-1',
        roomId: 'global',
        user: {
          id: 'user-1',
          firstName: 'João',
          lastName: 'Silva',
          imageUrl: null
        }
      }
    ]

    mockGetRecentMessages.mockReturnValue({
      data: mockMessages,
      isLoading: false
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Olá, pessoal!')).toBeInTheDocument()
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    })
  })

  it('deve permitir enviar mensagem', async () => {
    mockGetRecentMessages.mockReturnValue({
      data: [],
      isLoading: false
    })

    renderComponent()

    const input = screen.getByPlaceholderText('Digite sua mensagem...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(input, { target: { value: 'Nova mensagem' } })
    fireEvent.click(sendButton)

    // Verificar se o input foi limpo
    expect(input).toHaveValue('')
  })

  it('deve mostrar status offline quando não conectado', () => {
    mockGetRecentMessages.mockReturnValue({
      data: [],
      isLoading: false
    })

    renderComponent()

    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('deve mostrar contador de usuários online', () => {
    mockGetRecentMessages.mockReturnValue({
      data: [],
      isLoading: false
    })

    renderComponent()

    expect(screen.getByText('0 online')).toBeInTheDocument()
  })
})
