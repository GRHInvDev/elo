# Handoff: Redesign do Módulo de Solicitações (elo)

## Visão geral
Redesign do módulo **Solicitações** da intranet *elo* (Grupo R Henz), com **duas visões distintas** e um **toggle "Novo layout"** que troca o visual da página por usuário (preferência individual, sem afetar os demais):

- **Visão do Cliente** — catálogo limpo para o colaborador escolher um tipo de solicitação e abrir um chamado, além de acompanhar as próprias solicitações. Inspiração: Zendesk (limpo, corporativo).
- **Visão do Técnico** — workspace resolutivo para atender chamados: **Fila + Detalhe** lado a lado e um **Quadro** (kanban) refinado como visão alternativa.

Mantém: marca **elo**, fonte **Geist**, gradiente ambiente vermelho/verde como identidade, tema **claro e escuro**, iconografia minimalista (Lucide).

## Sobre os arquivos de design
Os arquivos deste pacote são **referências de design feitas em HTML/React (Babel inline)** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção para copiar**. A tarefa é **recriar estes designs no codebase real** (Next.js App Router + React + shadcn/ui + Tailwind + tRPC + Prisma), reutilizando os componentes e padrões já existentes.

## Fidelidade
**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamento e interações são finais. Recriar pixel a pixel usando a biblioteca de UI existente (shadcn/ui) e os tokens do `globals.css`.

---

## Mapeamento para o codebase atual

| Protótipo | Componente real a alterar/criar |
|---|---|
| Shell (sidebar + topbar + toggle de tema) | já existe — apenas adicionar o botão **"Novo layout"** na topbar e o contexto de preferência |
| **Visão do Cliente** (catálogo) | `src/components/forms/forms-list.tsx` |
| Drawer "abrir solicitação" | novo: `src/components/forms/form-quick-open-drawer.tsx` (usar `Sheet` do shadcn) |
| **Visão do Técnico — Fila+Detalhe** | nova página/visão sobre `src/components/forms/responses-list.tsx` + `response-details.tsx` + `response-chat.tsx` + `status-update-button.tsx` |
| **Visão do Técnico — Quadro** | evolução do kanban atual de `/forms` (Kanban de Solicitações) |
| Filtros | reaproveitar `responses-filters.tsx`, `setor-search.tsx`, `user-search.tsx` |

### Toggle "Novo layout" (preferência por usuário)
- Persistir uma flag por usuário: campo `uiLayoutVersion` (`"classic" | "v2"`) no model `User` (Prisma) **ou** preferência leve em `localStorage` para um rollout gradual.
- Expor um `LayoutPreferenceContext` (client) que lê/escreve a flag; a topbar recebe o botão de toggle (componente `<LayoutSwitch />`).
- Enquanto `v2` estiver ativo, renderizar os novos componentes; caso contrário, os atuais. Recomendado começar via `localStorage` + feature flag por role para testar com poucos usuários.

---

## Design Tokens

Reaproveitar os tokens HSL já existentes em `src/styles/globals.css` (shadcn). Adições/uso específico do redesign:

```css
/* Accent da marca (cristal) — usar com parcimônia */
--accent: 184 100% 33%;        /* #00a5a7 teal */
--accent-foreground: 0 0% 100%;

/* Gradiente ambiente de identidade (camada fixa, pointer-events:none, z-index 0) */
/* dark:  glow-a 0 72% 45% (vermelho), glow-b 158 64% 40% (verde), opacidade .22 */
/* light: glow-a 0 72% 60%, glow-b 158 54% 50%, opacidade .10 */
background:
  radial-gradient(60% 55% at 92% 8%, hsl(var(--glow-a) / var(--glow-op)), transparent 60%),
  radial-gradient(55% 60% at 6% 96%, hsl(var(--glow-b) / var(--glow-op)), transparent 62%);

/* radius padrão de card no redesign */ --radius-card: 12px;
```

**Status (tom minimalista):**
- Não iniciado → neutro (`dot` cinza `hsl(0 0% 55%)`)
- Em progresso → âmbar `hsl(38 92% 55%)` (texto), fundo `/.1`, borda `/.25`
- Concluído → verde `hsl(158 64% 45%)` (texto), fundo `/.1`, borda `/.25`

**Prioridade (dots):** alta `hsl(0 72% 55%)` · média `hsl(38 92% 55%)` · baixa `hsl(0 0% 50%)`.

**Tipografia:** Geist (já configurada via `--font-geist-sans`). Geist Mono para números/IDs (`#1159`), SLA e métricas. Título de página 28px/700/-0.025em; títulos de card 15px/600.

**Espaçamento:** container `max-width: 1380px`, padding de conteúdo `30px 34px`. Cards `padding 18px`, `gap 10–18px`, `border 1px hsl(var(--border-soft))`.

---

## Telas / Visões

### 1. Visão do Cliente — Catálogo de Solicitações
- **Propósito:** colaborador encontra o tipo certo de solicitação, abre um chamado e acompanha os seus.
- **Layout:** header (título + subtítulo à esquerda; ações `Minhas solicitações` ghost + `Criar formulário` primary à direita). Abaixo, **faixa de KPIs discretos** (números grandes em mono, label pequena): *Em aberto, Aguardando você, Concluídas no mês, Tempo médio de resposta*. Depois, grid `1fr / 320px`:
  - **Coluna principal:** busca (input com ícone) + **chips** de filtro por setor (Todos, TI, Compras, Marketing, Infraestrutura) + **lista de linhas de catálogo**.
  - **Trilho direito (sticky):** card "Minhas solicitações" com itens compactos (#id, status pill, título, idade, responsável / "Aguardando você") + botão "Abrir o Kanban".
- **Linha de catálogo (`.cat-row`):** ícone do setor em quadrado teal `42px` (fundo `accent/.1`, borda `accent/.2`) · título + badge opcional "Mais usado" · descrição (muted, máx ~62ch) · meta (`setor · N campos · �clock Resposta em {SLA}`) · ações à direita (`Ver` ghost + `Abrir solicitação` accent). Hover: borda accent + leve `translateY(-1px)` + sombra.
- **Drawer (Sheet à direita, 460px):** ao clicar numa linha — ícone+título, descrição, grid de info (Setor responsável / Prazo / Em aberto agora), placeholders dos campos do formulário, footer com `Cancelar` + `Iniciar solicitação`.

### 2. Visão do Técnico — Fila + Detalhe (`view = "fila"`, padrão)
- **Propósito:** atender e resolver chamados rápido, sem trocar de tela.
- **Layout:** header (título "Central de chamados" + `Gerenciar Tags` ghost + segmented `Fila | Quadro`). Faixa de KPIs: *Não iniciados, Em progresso, Sem responsável, SLA em risco, Resolvidos hoje*. Abaixo, grid `372px / 1fr`, altura `calc(100vh - 290px)`.
  - **Fila (esquerda):** busca + tabs (`Todos / Novos / Andamento / Concluídos`) + lista de `.q-row` (dot de prioridade, `#id`, badge "Novo", status à direita, resumo, avatar+solicitante, SLA — vermelho se em risco). Item ativo: borda+fundo accent.
  - **Detalhe (direita):** header (`#id`, prioridade, formulário, título do chamado; ações: **status changer** com menu, **Assumir chamado** / pílula de responsável, menu `...`). Corpo: 2 cards (Solicitante / SLA), **Dados da solicitação** (grid de campos enviados), **Conversa** (bolhas: solicitante à esquerda neutro, técnico à direita em accent/.12). Rodapé fixo: anexar + input "Responder ao solicitante…" + `Enviar`.
- **Comportamentos resolutivos:** "Assumir" define responsável = usuário atual e move `NOT_STARTED → IN_PROGRESS`; responder também promove para `IN_PROGRESS`; trocar status via menu (Não iniciado / Em progresso / Concluído).

### 3. Visão do Técnico — Quadro (`view = "quadro"`)
- Kanban refinado de 3 colunas (Não iniciado / Em progresso / Concluído) com contadores reais (18 / 21 / 746). Cards compactos: dot de prioridade, `#id`, badge "Novo", resumo, solicitante, rodapé com SLA + responsável (ou "Sem responsável" em vermelho). Clicar num card abre o **Detalhe** (volta para a Fila com o item selecionado). Arrastar entre colunas para mudar status é o próximo passo natural.

---

## Interações & Estado
- **Estado (técnico):** lista de tickets em estado client-side derivada da query tRPC `formResponse.listByForm` (ou uma nova `formResponse.listQueue`); `selectedId`, `view` (fila/quadro), `tab` (status), `query` (busca). Mutations: `status` (já existe `status-update-button`), `assign`, `reply` (usar `response-chat`).
- **Estado (cliente):** `query`, `categoria` (setor), `drawerForm`.
- **Tema:** classe `data-theme` / `dark` no `<html>` (já há toggle de tema). Todos os tokens respeitam claro/escuro.
- **Transições:** fade-in 0.3s nas trocas de visão; drawer desliza da direita 0.26s `cubic-bezier(.2,.8,.2,1)`.
- **Responsivo:** abaixo de 1100px a fila/detalhe e o grid do cliente colapsam para 1 coluna; sidebar recolhe.

## Assets
- Logo **elo**: glyph de corrente (ver `public/favicon.svg`) + wordmark "elo".
- Accent teal `#00a5a7` derivado de `public/icon_cristal.svg`.
- Ícones: Lucide (já usado no projeto). Sem SVGs desenhados à mão.

## Arquivos neste pacote (referência de design)
- `Solicitacoes.html` — entrypoint (tokens CSS de claro/escuro, gradiente, fontes, mount React)
- `shell.jsx` — sidebar + topbar + toggle "Novo layout" + segmented de visão + navegação das sub-páginas
- `client.jsx` — Visão do Cliente (catálogo + drawer + minhas solicitações)
- `pages.jsx` — sub-páginas do cliente (raiz do formulário, responder, minhas solicitações) — ver `HANDOFF-subpaginas.md`
- `tech.jsx` — Visão do Técnico (fila + detalhe + quadro)
- `classic.jsx` — recriação do visual atual (o "antes" do toggle)
- `icons.jsx` — ícones Lucide e o glyph da marca
- `data.js` — mock derivado das telas reais (formulários e chamados)

> Para rodar o protótipo: abrir `Solicitacoes.html` num navegador (sem build). É só referência visual/comportamental.
