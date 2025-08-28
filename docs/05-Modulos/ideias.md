# 💡 Módulo de Ideias - Documentação Técnica v1.4.0

## 📋 Visão Geral

O **Módulo de Ideias** é uma plataforma completa de gestão colaborativa que permite aos usuários da empresa submeterem, acompanharem e gerenciarem ideias inovadoras com sistema de premiação integrado. O sistema evoluiu da versão de sugestões para uma solução mais robusta e completa.

## 🎯 Objetivos do Sistema

### **Para Colaboradores**
- ✅ **Submissão intuitiva** - Formulário otimizado para criação de ideias
- ✅ **Acompanhamento completo** - Status em tempo real com notificações
- ✅ **Sistema de premiação** - Visibilidade de pagamentos para ideias concluídas
- ✅ **Transparência total** - Histórico completo e métricas pessoais
- ✅ **Engajamento** - Participação ativa na melhoria da empresa

### **Para Administradores**
- ✅ **Gestão via Kanban** - Interface drag & drop completa
- ✅ **Sistema de classificação** - Impacto, Capacidade, Esforço (1-10)
- ✅ **Controle de pagamentos** - Status pago/não pago com valores
- ✅ **Relatórios avançados** - KPIs e métricas de performance
- ✅ **Atribuição de responsáveis** - Gestão de analistas

## 🏗️ Arquitetura do Sistema

### **Componentes Principais**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API (tRPC)     │    │   Database      │
│   React/TSX     │◄──►│   Procedures     │◄──►│   Models        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Kanban View   │    │   Payment System │    │   Scoring       │
│   Drag & Drop   │    │   JSON Storage   │    │   Algorithm     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🗄️ Modelo de Dados

### **Suggestion (Ideias)**
```prisma
model Suggestion {
  id                    String            @id @default(cuid())
  ideaNumber           Int               @unique @default(autoincrement())
  submittedName        String?
  submittedSector      String?
  isNameVisible        Boolean           @default(true)
  description          String            // Solução proposta
  problem              String?           // Problema identificado
  contribution         Json              // Tipo e detalhes
  status               String            @default("NEW")
  rejectionReason      String?
  analystId            String?
  payment              Json?             // {status, amount, description}
  paymentDate          DateTime?
  impact               Json?
  capacity             Json?
  effort               Json?
  finalScore           Int?
  finalClassification  Json?
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt

  userId               String
  user                 User              @relation("SuggestionAuthor", fields: [userId], references: [id])
  analyst              User?             @relation("SuggestionAnalyst", fields: [analystId], references: [id])
}
```

### **Enums e Status**
```typescript
enum SuggestionStatus {
  NEW           // Nova ideia - aguardando avaliação
  IN_REVIEW     // Em avaliação pelo analista
  APPROVED      // Aprovada para implementação
  IN_PROGRESS   // Em execução
  DONE          // Concluída com premiação
  NOT_IMPLEMENTED // Não implementada
}
```

## 🧮 Sistema de Pontuação

### **Algoritmo de Scoring**
```typescript
// Fórmula: Pontuação = Impacto + Capacidade - Esforço
export function calculateScore(
  impact: number,    // 1-10 (benefício)
  capacity: number,  // 1-10 (viabilidade)
  effort: number     // 1-10 (complexidade)
): number {
  return impact + capacity - effort
}
```

### **Classificação Automática**
- **15-20**: "Aprovar para Gestores"
- **10-14**: "Ajustar e incubar"
- **0-9**: "Descartar com justificativa clara"

## 💰 Sistema de Premiação

### **Estrutura de Pagamento**
```typescript
interface PaymentData {
  status: "paid" | "unpaid"     // Status do pagamento
  amount?: number               // Valor do prêmio
  description?: string          // Observações
}
```

### **Fluxo de Premiação**
1. **Ideia Concluída** → Status muda para "DONE"
2. **Pagamento Definido** → Admin configura status e valor
3. **Usuário Notificado** → Visualiza informações na dashboard
4. **Transparência** → Histórico completo mantido

## 🎨 Interface do Usuário

### **Dashboard do Usuário** (`/my-suggestions`)
```tsx
// Principais funcionalidades
- ✅ Lista de ideias pessoais
- ✅ Status com cores visuais
- ✅ Informações de pagamento (quando concluído)
- ✅ Estatísticas pessoais
- ✅ Filtros por status
- ✅ Busca por texto/número
```

### **Interface Administrativa** (`/admin/suggestions`)
```tsx
// Principais funcionalidades
- ✅ Kanban drag & drop
- ✅ Modal completo de edição
- ✅ Sistema de classificação 1-10
- ✅ Gestão de pagamentos
- ✅ Atribuição de analistas
- ✅ Relatórios e métricas
```

### **Cores do Kanban**
- **Cinza**: Novo
- **Amarelo Fraco**: Em avaliação
- **Amarelo Médio**: Em orçamento
- **Verde**: Concluído
- **Vermelho**: Não implementado

## 🔄 Fluxo de Trabalho

### **1. Submissão** (`NEW`)
- Usuário preenche formulário detalhado
- Sistema gera número único de identificação
- Notificação automática para gestores

### **2. Avaliação** (`IN_REVIEW`)
- Analista atribuído automaticamente
- Sistema calcula pontuação baseada nos critérios
- Classificação automática gerada

### **3. Aprovação** (`APPROVED`)
- Ideia entra na fila de implementação
- Recursos são alocados
- Timeline definido

### **4. Execução** (`IN_PROGRESS`)
- Desenvolvimento da ideia
- Acompanhamento de progresso
- Possibilidade de ajustes

### **5. Conclusão** (`DONE`)
- ✅ Ideia implementada com sucesso
- ✅ **Sistema de premiação ativado**
- ✅ Feedback para o usuário
- ✅ Métricas atualizadas

### **6. Não Implementação** (`NOT_IMPLEMENTED`)
- Motivo registrado obrigatoriamente
- Feedback construtivo fornecido
- Aprendizado para futuras ideias

## 📊 APIs Disponíveis

### **Queries (Leitura)**
```typescript
// Lista ideias para admin
getAll: adminProcedure
  .input({ status?, search?, page?, limit? })
  .query() → { suggestions, total, page, limit }

// Lista ideias do usuário logado
getMySuggestions: protectedProcedure
  .query() → Suggestion[]

// Busca ideia específica
getById: protectedProcedure
  .input({ id: string })
  .query() → Suggestion
```

### **Mutations (Escrita)**
```typescript
// Criar nova ideia
create: protectedProcedure
  .input({ description, problem?, contribution, ... })
  .mutation() → Suggestion

// Atualizar ideia (admin)
updateAdmin: adminProcedure
  .input({ id, status?, impact?, capacity?, effort?, payment?, ... })
  .mutation() → Suggestion

// Alterar status
updateStatus: adminProcedure
  .input({ id, status, analystId? })
  .mutation() → Suggestion
```

## 📱 Responsividade

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Componentes Adaptativos**
- ✅ **Cards responsivos** no Kanban
- ✅ **Modais otimizados** para mobile
- ✅ **Texto que quebra** automaticamente
- ✅ **Toques touch-friendly**

## 🔒 Segurança e Permissões

### **Níveis de Acesso**
```typescript
enum UserRole {
  USER     // Apenas visualizar e criar próprias ideias
  ADMIN    // Acesso completo a todas as funcionalidades
}
```

### **Validações**
- ✅ **Autenticação obrigatória** em todas as operações
- ✅ **Sanitização de entrada** contra XSS
- ✅ **Limitação de caracteres** (2000 para textos)
- ✅ **Validação de tipos** (pontuações 1-10)

## 📧 Sistema de Notificações

### **Tipos de Notificação**
- ✅ **Email automático** para mudanças de status
- ✅ **Notificações in-app** para usuários
- ✅ **Templates personalizados** por tipo de evento
- ✅ **Histórico completo** mantido

### **Eventos Notificados**
```typescript
// Para usuários
- Ideia criada → Confirmação
- Status alterado → Atualização
- Ideia concluída → Premiação
- Ideia rejeitada → Feedback

// Para administradores
- Nova ideia → Análise necessária
- Ideia concluída → Pagamento pendente
```

## 📊 KPIs e Métricas

### **Métricas Principais**
- ✅ **Total de ideias** submetidas
- ✅ **Taxa de implementação** (concluídas/total)
- ✅ **Score médio** das ideias
- ✅ **Tempo médio** de implementação
- ✅ **Top contribuidores** por período

### **Relatórios Disponíveis**
- ✅ **Por período** (semanal, mensal, anual)
- ✅ **Por status** (distribuição)
- ✅ **Por analista** (performance)
- ✅ **Por setor** (engajamento)

## 🎯 Funcionalidades Especiais

### **Sistema de Pagamentos**
```typescript
// Apenas para ideias concluídas
if (status === "DONE") {
  showPaymentSection({
    status: payment.status,
    amount: payment.amount,
    date: paymentDate,
    description: payment.description
  })
}
```

### **Autocomplete de KPIs**
- ✅ **Busca inteligente** por nome
- ✅ **Sugestões automáticas** enquanto digita
- ✅ **Criação dinâmica** de novos KPIs
- ✅ **Validação de duplicatas**

### **Responsável pela Devolutiva**
- ✅ **Seleção automática** baseada em carga de trabalho
- ✅ **Atribuição manual** quando necessário
- ✅ **Persistência correta** da seleção
- ✅ **Histórico de mudanças**

## 🚀 Próximas Melhorias Planejadas

### **Funcionalidades (v1.5.0)**
- [ ] Sistema de comentários nas ideias
- [ ] Votação colaborativa
- [ ] Sistema de tags/categorias
- [ ] Anexos e arquivos

### **Integrações (v1.6.0)**
- [ ] API externa para integrações
- [ ] Webhooks automáticos
- [ ] Integração com Slack/Teams
- [ ] Exportação de relatórios

### **Analytics (v1.7.0)**
- [ ] Dashboard executivo avançado
- [ ] Predição de sucesso de ideias
- [ ] Análise de tendências
- [ ] Benchmarking por setor

## 📋 Checklist da Versão 1.4.0

### **✅ Funcionalidades Core**
- [x] Submissão de ideias com formulário intuitivo
- [x] Sistema de pontuação inteligente (1-10)
- [x] Classificação automática baseada em score
- [x] Workflow estruturado (6 etapas)
- [x] Sistema de premiação integrado
- [x] Gestão via Kanban drag & drop

### **✅ Interface e UX**
- [x] Dashboard responsivo para usuários
- [x] Interface administrativa completa
- [x] Sistema de cores otimizado
- [x] Quebra automática de textos longos
- [x] Modal de edição completo
- [x] Tags visuais de status/pagamento

### **✅ Backend e Performance**
- [x] APIs tRPC type-safe
- [x] Persistência correta no banco
- [x] Sistema de notificações
- [x] Validações robustas
- [x] Cache inteligente
- [x] Tratamento de erros

### **✅ Segurança e Qualidade**
- [x] Controle de permissões granular
- [x] Sanitização de dados
- [x] Logs de auditoria
- [x] Rate limiting
- [x] Error boundaries

---

## 📞 Suporte e Manutenção

### **Equipe Responsável**
- **Desenvolvimento**: Equipe de Produto
- **Documentação**: Tech Writers
- **Suporte**: Help Desk

### **Canais de Comunicação**
- **Issues**: GitHub Issues
- **Documentação**: Pasta `/docs`
- **Suporte**: `suporte@empresa.com`

### **Monitoramento**
- **Uptime**: 99.9%
- **Performance**: < 500ms response time
- **Logs**: Centralizados e rotacionados
- **Alertas**: Automáticos para anomalias

---

**📅 Versão**: 1.4.0
**📆 Data de Lançamento**: Dezembro 2024
**👥 Mantido por**: Equipe de Desenvolvimento
**📧 Contato**: dev@empresa.com
