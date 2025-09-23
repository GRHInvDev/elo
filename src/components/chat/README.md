# Módulo de Chat Interno

Sistema de chat em tempo real para comunicação interna da plataforma Elo.

## 🚀 Funcionalidades

- **Chat Global**: Sala pública para todos os usuários
- **Grupos de Chat**: Conversas privadas entre múltiplos usuários selecionados
- **Chats Privados**: Conversas individuais entre dois usuários
- **Mensagens com Imagens**: Upload e exibição de imagens nas mensagens
- **Tempo Real**: Comunicação instantânea via WebSocket
- **Histórico Completo**: Persistência de todas as mensagens
- **Controle de Acesso**: Permissões granulares por sala
- **Interface Responsiva**: Funciona em desktop e mobile

## 🎯 Como Usar

### Chat Global
- Sempre disponível para todos os usuários
- Aparece como "Chat Global" no sidebar esquerdo

### Grupos de Chat
- Criados por administradores via `/admin/chat-groups`
- Apenas membros selecionados podem participar
- Aparecem no sidebar esquerdo com ícone de grupo

### Chats Privados
- Clique duas vezes em qualquer usuário no sidebar direito
- Conversa privada entre você e o usuário selecionado
- Não aparece no sidebar esquerdo (apenas acessível diretamente)

### Envio de Imagens
- Clique no botão de imagem 📷 na área de envio de mensagens
- Selecione uma imagem do seu dispositivo
- A imagem será enviada junto com o texto (opcional)
- Mensagens podem conter apenas imagens, apenas texto, ou ambos
- Imagens são automaticamente redimensionadas para visualização otimizada

## 🏗️ Arquitetura

### Tipos de Salas
- **`global`**: Chat público para todos
- **`group_{id}`**: Grupo com membros selecionados
- **`private_{user1}_{user2}`**: Chat privado entre dois usuários

### Componentes Principais
- **ChatSidebar**: Lista salas disponíveis (esquerda)
- **ChatRoom**: Área de conversa (centro)
- **UsersList**: Lista de usuários para chat privado (direita)

### Servidor WebSocket
- **Integrado ao Next.js**: API Route `/api/chat/socket`
- **Singleton Pattern**: Servidor mantido ativo durante execução
- **Auto-inicialização**: Criado na primeira requisição
- **Compatibilidade**: Funciona em dev e produção

### Layout Responsivo
- **Desktop Grande (xl+)**: 3 colunas (grupos + chat + usuários)
- **Desktop (lg+)**: 2 colunas (grupos + chat)
- **Tablet/Mobile**: 1 coluna (apenas chat)

## 🔐 Permissões

### Chat Global
- Todos os usuários não-TOTEM podem acessar

### Grupos
- Apenas administradores podem criar grupos
- Apenas membros selecionados podem acessar

### Chats Privados
- Qualquer usuário pode iniciar chat privado
- Ambos os participantes devem existir no sistema

## 📊 API Endpoints

### Grupos (Admin)
```typescript
// Criar grupo
api.adminChatGroups.createGroup.mutate({
  name: "Equipe de TI",
  description: "Discussões técnicas",
  memberIds: ["user1", "user2"]
})

// Listar grupos
api.adminChatGroups.getGroups.query()

// Editar grupo
api.adminChatGroups.updateGroup.mutate({
  id: "group-id",
  name: "Novo Nome",
  memberIds: ["user1", "user3"]
})
```

### Mensagens
```typescript
// Buscar mensagens
api.chatMessage.getRecentMessages.query({
  roomId: "global",
  limit: 20
})

// Grupos do usuário
api.chatMessage.getUserGroups.query()
```

## 🎨 Interface

### Sidebar Esquerdo (Grupos)
- Chat Global (sempre disponível)
- Grupos do usuário (se membro)
- Indicador visual para cada tipo

### Sidebar Direito (Usuários)
- Lista todos os colaboradores
- Busca em tempo real
- **Clique duplo** para iniciar chat privado
- Indicador online (verde)
- Informações de empresa/setor

### Área Central (Chat)
- Título dinâmico baseado no tipo de sala
- Indicador online/offline
- Área de mensagens com scroll infinito
- Campo de entrada com validação
- Indicador de digitação

## 🔄 Fluxo de Chat Privado

1. **Usuário clica 2x** em colaborador no sidebar direito
2. **Sistema gera** ID único: `private_{user1}_{user2}` (ordenado)
3. **WebSocket valida** se ambos usuários existem
4. **Chat abre** automaticamente na área central
5. **Mensagens são** enviadas apenas para os 2 participantes

## 🐛 Troubleshooting

### Chat Privado Não Abre
- Verificar se usuário clicado existe
- Confirmar permissões de acesso ao chat
- Verificar conexão WebSocket

### Grupos Não Aparecem
- Confirmar se usuário é membro do grupo
- Verificar permissões administrativas para criação
- Recarregar página

### Mensagens Não Enviam
- Verificar conexão WebSocket
- Confirmar permissões para a sala
- Verificar se sala ainda existe

## 🚀 Deploy e Configuração

### Ambiente de Desenvolvimento
```bash
# O servidor WebSocket inicia automaticamente com o Next.js
pnpm dev
```

### Produção
- **Vercel**: WebSocket funciona nativamente
- **Outros**: Configurar upgrade headers se necessário
- **Variáveis**:
  - `NEXT_PUBLIC_APP_URL`: URL da aplicação

### Configuração CORS
- Configurado automaticamente no `next.config.js`
- Headers aplicados a todas as rotas `/api/*`

## 🚀 Próximas Funcionalidades

- **Presença Real**: Sistema online/offline preciso
- **Notificações Desktop**: Alertas nativos do navegador
- **Upload de Arquivos**: Documentos e múltiplas imagens
- **Mentions**: @usuario para chamar atenção
- **Pesquisa**: Busca no histórico de mensagens
- **Reações**: Emojis nas mensagens