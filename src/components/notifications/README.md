# Notificações do Browser

Este componente implementa notificações nativas do sistema operacional para mensagens do chat.

## Como Funciona

1. **Primeiro Acesso**: Um prompt aparece solicitando permissão para notificações
2. **Após Permissão**: As notificações são mostradas automaticamente quando:
   - Receber novas mensagens no chat
   - Não estiver na página de chat
   - Não estiver com a aba em foco

## Testando as Notificações

Após conceder permissão, um botão "🧪 Testar Notificação" aparece no canto inferior direito. Clique nele para testar se as notificações estão funcionando.

## Resolução de Problemas

### "Clico em permitir mas nada ocorre"

Possíveis causas:

1. **Contexto não seguro**: As notificações do browser só funcionam em HTTPS. Se estiver em desenvolvimento local, use HTTPS ou ignore este erro.

2. **Permissões bloqueadas**: O navegador pode ter bloqueado as notificações permanentemente. Verifique as configurações do navegador:
   - Chrome: Configurações > Privacidade > Configurações do site > Notificações
   - Firefox: Configurações > Privacidade & Segurança > Permissões > Notificações

3. **Browser não suporta**: Alguns browsers antigos não suportam a API de notificações.

### Debug

Abra o console do navegador (F12) e procure por mensagens relacionadas a:
- `[useBrowserNotifications]`
- `[BrowserNotificationPermission]`

## Configurações

As notificações respeitam:
- ✅ Permissões do usuário
- ✅ Contexto da página (não notifica se estiver no chat)
- ✅ Foco da aba (não notifica se aba estiver ativa)
- ✅ Preferências do sistema operacional