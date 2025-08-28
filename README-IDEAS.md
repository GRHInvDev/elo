# 📋 Módulo de Ideias - Documentação Técnica

## 📖 Visão Geral

O **Módulo de Ideias** é uma plataforma colaborativa que permite aos usuários da empresa submeterem, acompanharem e gerenciarem ideias inovadoras. O sistema inclui funcionalidades completas de gestão, desde a submissão até a implementação e premiação.

## 🎯 Funcionalidades Principais

### Para Usuários Finais (`/my-suggestions`)
- ✅ **Submissão de ideias** através de formulário intuitivo
- ✅ **Acompanhamento em tempo real** do status das ideias
- ✅ **Visualização de informações de pagamento** para ideias concluídas
- ✅ **Histórico completo** de todas as ideias enviadas
- ✅ **Estatísticas pessoais** (total, em avaliação, aprovadas, concluídas)

### Para Administradores (`/admin/suggestions`)
- ✅ **Gestão completa via Kanban** com drag & drop
- ✅ **Sistema de classificação** (Impacto, Capacidade, Esforço)
- ✅ **Gestão de KPIs** com autocomplete inteligente
- ✅ **Controle de pagamentos** (Pago/Não Pago)
- ✅ **Atribuição de responsáveis** pela análise
- ✅ **Sistema de notificações** automatizado

## 🏗️ Arquitetura Técnica

### Frontend
```
src/app/(authenticated)/
├── my-suggestions/page.tsx      # Dashboard do usuário
├── admin/suggestions/page.tsx   # Gestão administrativa
└── dashboard/page.tsx           # Cards de acesso rápido
```

### Backend
```
src/server/api/routers/
└── suggestions.ts               # API completa de ideias
```

### Componentes
```
src/components/admin/suggestion/
├── suggestion-card.tsx          # Formulário de criação
└── kpi-management-modal.tsx     # Gestão de KPIs
```

## 🔄 Fluxo de Trabalho

### 1. Submissão (`NEW`)
- Usuário preenche formulário com problema e solução
- Escolhe tipo de contribuição (Inovadora/Melhoria/Problema/Outro)
- Pode ocultar nome e setor se desejar
- Sistema gera número único de identificação

### 2. Avaliação (`IN_REVIEW`)
- Administrador analisa a ideia
- Sistema calcula pontuação baseada em Impacto + Capacidade - Esforço
- Gera classificação automática (Aprovar/Ajustar/Descartar)
- Atribui responsável pela análise

### 3. Orçamento (`APPROVED`)
- Ideia aprovada para implementação
- Entra na fila de projetos
- Mantém responsável definido

### 4. Execução (`IN_PROGRESS`)
- Ideia em desenvolvimento
- Acompanhamento do progresso
- Possibilidade de ajustes

### 5. Conclusão (`DONE`)
- Ideia implementada com sucesso
- **Sistema de premiação ativado**
- Status de pagamento definido (Pago/Não Pago)

### 6. Não Implementação (`NOT_IMPLEMENTED`)
- Ideia não será implementada
- Motivo registrado obrigatoriamente
- Feedback fornecido ao usuário

## 💰 Sistema de Premiação

### Campos de Pagamento
```typescript
payment: {
  status: "paid" | "unpaid"     // Status do pagamento
  amount?: number               // Valor do prêmio
  description?: string          // Observações
}
paymentDate: Date               // Data do pagamento
```

### Regras de Exibição
- **Somente ideias concluídas** (`status === "DONE"`)
- **Visível para administradores** no Kanban (tag visual)
- **Visível para usuários** em "Minhas Ideias"
- **Dados persistidos** no banco de dados

## 🎨 Interface e UX

### Cores do Kanban
- **Cinza**: Novo
- **Amarelo Fraco**: Em avaliação
- **Amarelo Médio**: Em orçamento
- **Verde**: Concluído
- **Vermelho**: Não implantado

### Sistema de Pontuação
- **Impacto**: 1-10 (benefício da ideia)
- **Capacidade**: 1-10 (viabilidade técnica)
- **Esforço**: 1-10 (complexidade de implementação)
- **Fórmula**: `Pontuação = Impacto + Capacidade - Esforço`

### Responsividade
- ✅ **Mobile-first** design
- ✅ **Breakpoints** otimizados
- ✅ **Texto responsivo** com quebra automática
- ✅ **Toasts** para feedback imediato

## 🔧 Funcionalidades Técnicas

### Pesquisa e Filtros
- ✅ **Busca por texto** (problema, solução, número)
- ✅ **Filtro por status**
- ✅ **Ordenação** por data de criação
- ✅ **Paginação** (50 itens por página)

### Gestão de Usuários
- ✅ **Identificação automática** do usuário logado
- ✅ **Setor integrado** ao perfil
- ✅ **Visibilidade controlada** (nome/setor visível/oculto)

### Notificações
- ✅ **Email automático** para mudanças de status
- ✅ **Notificações in-app** para usuários
- ✅ **Templates customizáveis**

## 📊 Banco de Dados

### Schema Principal (`Suggestion`)
```sql
model Suggestion {
  id                    String   @id @default(cuid())
  ideaNumber           Int      @unique @default(autoincrement())
  submittedName        String?
  submittedSector      String?
  isNameVisible        Boolean  @default(true)
  description          String   // Solução proposta
  problem              String?  // Problema identificado
  contribution         Json     // Tipo e detalhes
  status               String   @default("NEW")
  rejectionReason      String?
  analystId            String?
  payment              Json?    // Status e detalhes do pagamento
  paymentDate          DateTime?
  impact               Json?
  capacity             Json?
  effort               Json?
  finalScore           Int?
  finalClassification  Json?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  userId               String
  user                 User     @relation(fields: [userId], references: [id])
  analyst              User?    @relation("SuggestionAnalyst", fields: [analystId], references: [id])
}
```

## 🚀 APIs Disponíveis

### Queries (Leitura)
- `getMySuggestions` - Lista ideias do usuário logado
- `list` - Lista todas as ideias (admin)
- `listKanban` - Dados formatados para Kanban

### Mutations (Escrita)
- `create` - Criar nova ideia
- `updateAdmin` - Atualizar ideia (admin)
- `update` - Atualizar ideia (com permissões)

## 🔒 Segurança e Permissões

### Níveis de Acesso
- **Usuários**: Podem criar e visualizar suas próprias ideias
- **Administradores**: Acesso completo a todas as ideias
- **Sistema**: Validações automáticas de permissões

### Validações
- ✅ **Autenticação obrigatória**
- ✅ **Sanitização de entrada**
- ✅ **Limitação de caracteres** (2000 para textos)
- ✅ **Validação de tipos** (pontuações 1-10)

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Componentes Adaptativos
- ✅ **Cards responsivos** no Kanban
- ✅ **Modais otimizados** para mobile
- ✅ **Textos que quebram** automaticamente
- ✅ **Botões touch-friendly**

## 🎯 Próximas Melhorias Planejadas

### Funcionalidades
- [ ] **Sistema de comentários** nas ideias
- [ ] **Votação colaborativa** em ideias
- [ ] **Integração com Slack/Teams**
- [ ] **Relatórios avançados**
- [ ] **API externa** para integrações

### Performance
- [ ] **Cache inteligente** para queries frequentes
- [ ] **Lazy loading** para listas grandes
- [ ] **Otimização de imagens**
- [ ] **Compressão de dados JSON**

## 📋 Manutenção

### Logs e Monitoramento
- ✅ **Logs detalhados** de operações
- ✅ **Métricas de uso**
- ✅ **Alertas automáticos**
- ✅ **Backup automático**

### Suporte
- ✅ **Documentação técnica** completa
- ✅ **Guias de usuário**
- ✅ **FAQ** frequente
- ✅ **Canal de suporte**

---

## 📞 Suporte

Para dúvidas técnicas ou solicitações de melhorias, entre em contato com a equipe de desenvolvimento.

**Última atualização**: Dezembro 2024
**Versão atual**: 1.3.0
