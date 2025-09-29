import { Server } from 'socket.io';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapa global para rastrear usuários online (compartilhado entre instâncias)
const globalOnlineUsers = new Map<string, { socketId: string; userId: string; roomId?: string }>();

// Mapa para rastrear usuários conectados para notificações
export const notificationUsers = new Map<string, string>() // socketId -> userId

export function createChatServer(io?: Server) {
  console.log('🔧 createChatServer chamado', { hasExistingIO: !!io })

  // Se não foi passado um servidor IO, criar um novo
  if (!io) {
    const httpServer = createServer();
    io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        methods: ["GET", "POST"]
      },
    });
  }

  io.on('connection', (socket) => {
    console.log(`🔗 Novo cliente conectado: ${socket.id}`);

    // Evento para usuário se registrar para notificações
    socket.on('joinNotifications', ({ userId }: { userId: string }) => {
      console.log(`🔔 Usuário ${userId} registrado para notificações: ${socket.id}`)
      notificationUsers.set(socket.id, userId)

      // Confirmar registro
      socket.emit('notificationsJoined', { userId, message: 'Registrado para notificações' })

      // Enviar contagem atual de notificações não lidas
      try {
        void prisma.notification.count({
          where: { userId, isRead: false }
        }).then((unreadCount) => {
          socket.emit('unreadCountUpdate', { count: unreadCount })
        })
      } catch (error) {
        console.error('Erro ao buscar contagem de notificações:', error)
      }
    })

    // Evento para usuário entrar no chat
    socket.on('joinChat', async ({ userId, roomId = 'global' }: { userId: string; roomId?: string }) => {
      console.log(`🔐 [BACKEND] Usuário ${userId} tentando entrar na sala ${roomId}`)
      console.log(`📊 [BACKEND] Detalhes:`, { userId, roomId, socketId: socket.id })

      try {
        // Validar acesso à sala/grupo
        if (roomId.startsWith('group_')) {
          const groupId = roomId.replace('group_', '')

          // Verificar se o usuário é membro do grupo
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const membership = await prisma.chat_group_member.findUnique({
            where: {
              groupId_userId: {
                groupId,
                userId,
              },
            },
          })

          if (!membership) {
            socket.emit('error', { message: 'Você não tem permissão para acessar este grupo' })
            return
          }
        } else if (roomId.startsWith('private_')) {
          // Para chats privados, verificar se o usuário faz parte da conversa
          console.log(`🔍 [BACKEND] Validando chat privado: ${roomId}`)
          const idPattern = /user_[^_]+/g
          const matchResult = roomId.match(idPattern)
          const ids: string[] = matchResult ?? []
          console.log(`👥 [BACKEND] IDs extraídos:`, ids)
          console.log(`👤 [BACKEND] UserID atual:`, userId)
          console.log(`✅ [BACKEND] Inclui userId?`, ids.includes(userId))

          if (!ids.includes(userId)) {
            console.log(`❌ [BACKEND] ACESSO NEGADO: Usuário não faz parte desta conversa privada`)
            socket.emit('error', { message: 'Você não tem permissão para acessar esta conversa privada' })
            return
          }
          console.log(`✅ [BACKEND] ACESSO PERMITIDO: Usuário autorizado para chat privado`)

          // Verificar se ambos os usuários existem
          const users = await prisma.user.findMany({
            where: {
              id: { in: ids }
            }
          })

          if (users.length !== ids.length) {
            socket.emit('error', { message: 'Um dos participantes não foi encontrado' })
            return
          }
        }

        // Adicionar usuário à sala
        await socket.join(roomId);

        // Registrar usuário online
        globalOnlineUsers.set(socket.id, { socketId: socket.id, userId, roomId });

        // Notificar outros usuários na sala sobre novo usuário online
        socket.to(roomId).emit('userJoined', { userId, roomId });

        // Confirmar entrada para o próprio usuário
        socket.emit('joinedRoom', { roomId, userId, message: 'Entrou na sala com sucesso' });
      } catch (error) {
        console.error('Erro ao validar acesso à sala:', error);
        socket.emit('error', { message: 'Erro ao entrar na sala' });
      }
    });

    // Evento para receber e processar novas mensagens
    socket.on('sendMessage', async ({
      content,
      userId,
      roomId = 'global',
      imageUrl
    }: {
      content: string | null;
      userId: string;
      roomId?: string;
      imageUrl?: string;
    }) => {
      try {
        // Validar permissões
        let groupId: string | null = null
        if (roomId.startsWith('group_')) {
          groupId = roomId.replace('group_', '')

          // Verificar se o usuário é membro do grupo
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const membership = await prisma.chat_group_member.findUnique({
            where: {
              groupId_userId: {
                groupId,
                userId,
              },
            },
          })

          if (!membership) {
            socket.emit('error', { message: 'Você não tem permissão para enviar mensagens neste grupo' })
            return
          }
        } else if (roomId.startsWith('private_')) {
          // Para chats privados, verificar se o usuário faz parte da conversa
          const idPattern = /user_[^_]+/g
          const matchResult = roomId.match(idPattern)
          const ids: string[] = matchResult ?? []
          if (!ids.includes(userId)) {
            socket.emit('error', { message: 'Você não tem permissão para enviar mensagens nesta conversa privada' })
            return
          }
        }

        // Salva a mensagem no banco de dados usando o Prisma
        const newMessage = await prisma.chat_message.create({
          data: {
            content,
            userId,
            roomId,
            groupId,
            imageUrl,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
            group: groupId ? {
              select: {
                id: true,
                name: true,
              },
            } : false,
          },
        });

        // Emite a nova mensagem para todos os clientes na mesma sala
        io?.to(roomId).emit('receiveMessage', newMessage);

        // Criar notificações para usuários online na sala (exceto o remetente)
        try {
          // Buscar todos os usuários online na sala (exceto o remetente)
          const onlineUsersInRoom = Array.from(globalOnlineUsers.values())
            .filter(user =>
              user.roomId === roomId &&
              user.userId !== userId &&
              user.socketId !== socket.id // Não notificar o próprio remetente
            )
            .map(user => user.userId);

          // Remover duplicatas
          const uniqueUserIds = [...new Set(onlineUsersInRoom)];

          // Criar notificações para cada usuário
          if (uniqueUserIds.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const userName = newMessage.user.firstName ?? newMessage.user.lastName
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              ? `${newMessage.user.firstName ?? ''} ${newMessage.user.lastName ?? ''}`.trim()
              : 'Usuário';

            // Criar mensagem de notificação baseada no conteúdo
            let notificationMessage = ''
            if (newMessage.content && newMessage.imageUrl) {
              notificationMessage = `${newMessage.content} [imagem]`
            } else if (newMessage.content) {
              notificationMessage = newMessage.content
            } else if (newMessage.imageUrl) {
              notificationMessage = '[imagem]'
            }

            // Limitar tamanho da mensagem
            if (notificationMessage.length > 100) {
              notificationMessage = `${notificationMessage.substring(0, 100)}...`
            }

            const notificationPromises = uniqueUserIds.map(userId =>
              prisma.notification.create({
                data: {
                  title: `Nova mensagem de ${userName}`,
                  message: notificationMessage,
                  type: 'CHAT_MESSAGE',
                  channel: 'IN_APP',
                  userId,
                  entityId: newMessage.id,
                  entityType: 'chat_message',
                  actionUrl: '/chat',
                  data: {
                    roomId,
                    senderId: userId,
                    senderName: userName,
                    hasImage: !!newMessage.imageUrl,
                  },
                },
              })
            );

            // Executar todas as notificações em paralelo
            await Promise.all(notificationPromises);

            console.log(`Criadas ${notificationPromises.length} notificações para nova mensagem`);
          }
        } catch (notificationError) {
          console.error('Erro ao criar notificações:', notificationError);
          // Não falhar o envio da mensagem por causa das notificações
        }

      } catch (error) {
        console.error('Erro ao salvar ou emitir mensagem:', error);
        // Opcional: emitir um evento de erro para o cliente
        socket.emit('messageError', { error: 'Erro ao enviar mensagem' });
      }
    });

    // Evento para indicar que usuário está digitando
    socket.on('typing', ({ userId, roomId = 'global', isTyping }: {
      userId: string;
      roomId?: string;
      isTyping: boolean;
    }) => {
      socket.to(roomId).emit('userTyping', { userId, isTyping });
    });

    // Evento para desconectar
    socket.on('disconnect', () => {
      const userData = globalOnlineUsers.get(socket.id);
      if (userData) {
        const { userId, roomId = 'global' } = userData;

        // Notificar outros usuários que o usuário saiu
        socket.to(roomId).emit('userLeft', { userId, roomId });

        // Remover do mapa de usuários online
        globalOnlineUsers.delete(socket.id);

        console.log(`Usuário ${userId} desconectado da sala ${roomId}`);
      }

      // Remover do mapa de notificações se estava registrado
      if (notificationUsers.has(socket.id)) {
        const userId = notificationUsers.get(socket.id)
        notificationUsers.delete(socket.id)
        console.log(`🔔 Usuário ${userId} removido das notificações`)
      }

      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  // Retornar o servidor apropriado baseado em como foi inicializado
  return io;
}

// Função para obter usuários online (para APIs)
export function getOnlineUsers() {
  // Retornar usuários realmente online do WebSocket server
  return Array.from(globalOnlineUsers.values()).map((userData) => ({
    userId: userData.userId,
    socketId: userData.socketId,
    roomId: !!!userData.roomId || '',
  }))
}

// Função para iniciar o servidor (para desenvolvimento)
export function startChatServer(port = 3001) {
  const io = createChatServer();

  // Quando criamos um novo servidor, ele vem com httpServer
  // Vamos encontrar o httpServer e iniciá-lo
  const httpServer = io.httpServer;
  if (httpServer) {
    httpServer.listen(port, () => {
      console.log(`🚀 Servidor de chat WebSocket rodando na porta ${port}`);
    });
    return httpServer;
  }

  console.error('Não foi possível encontrar o servidor HTTP');
  return null;
}
