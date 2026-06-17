# Handoff: Sub-páginas do Módulo de Solicitações (elo)

> Complemento ao `README.md` deste pacote. Cobre as **três telas internas** que sucedem o catálogo da Visão do Cliente, todas no mesmo tema (teal da marca, gradiente ambiente vermelho/verde, claro+escuro, Geist):
>
> 1. **Raiz do formulário** — `/forms/{slug}`
> 2. **Responder** — `/forms/{slug}/respond`
> 3. **Minhas solicitações** — `/forms/my-responses`
>
> Estes designs **já têm scaffolding no codebase** (`src/components/forms/v2/`). O objetivo do handoff é fechar o visual/comportamento dessas páginas usando os componentes que já existem.

## Sobre os arquivos de design
Referências em **HTML/React (Babel inline)** — protótipo, **não** código de produção. Recriar no codebase real (Next.js App Router + shadcn/ui + Tailwind + tRPC + Prisma) reaproveitando componentes existentes. Para rodar: abrir `Solicitacoes.html` no navegador, ligar **"Novo layout"**, **Visão do cliente**, e navegar pelo catálogo.

**Novos arquivos do protótipo nesta entrega:**
- `pages.jsx` — as três sub-páginas + `SubPageShell` (breadcrumb), `FieldInput` (todos os tipos de campo), drawer de detalhe do cliente.
- `data.js` — agora inclui `FORM_FIELDS` (definição de campos por formulário, espelhando `form-types.ts`), `CURRENT_USER` e `MY_REQUESTS` enriquecido (status, comentário, dados enviados, conversa).
- `client.jsx` / `shell.jsx` — navegação cliente (catálogo → raiz / responder / minhas solicitações).

---

## Mapeamento para o codebase

| Protótipo (`pages.jsx`) | Rota real | Componente real |
|---|---|---|
| `FormRootPage` | `src/app/(authenticated)/forms/[id]/page.tsx` | `FormsSubPageShell` + `FormsPanel` + `FormPreview` (readOnly) |
| `RespondPage` / `RespondForm` | `src/app/(authenticated)/forms/[id]/respond/page.tsx` | `FormsSubPageShell` + `FormsPanel` + `FormResponseComponent` |
| `MyResponsesPage` | `src/app/(authenticated)/forms/my-responses/page.tsx` | `FormsSubPageShell` + `UserResponsesList` |
| `SubPageShell` + `Breadcrumb` | — | `src/components/forms/v2/forms-sub-page-shell.tsx` (`FormsSubPageShell`, `FormsPanel`) + `useSetBreadcrumbs` (`breadcrumb-context`) |
| `FieldInput` / `FieldRow` | — | já existe em `form-response.tsx` / `form-preview.tsx` (render por `field.type`) |
| `RequestDrawer` (detalhe do cliente) | — | reaproveitar `response-details.tsx` + `response-chat.tsx` dentro de um `Sheet` |
| `MultiCombo` | — | `src/components/forms/multi-select.tsx` |
| `FORM_FIELDS` (mock) | — | `form.fields` (vem de `api.form.getById`), tipado por `src/lib/form-types.ts` |

> A casca (`FormsSubPageShell`) já publica a trilha de navegação no header global via `useSetBreadcrumbs`. As três páginas só precisam passar o array `breadcrumbs`, `title`, `description` e (quando houver) `actions`.

---

## Tokens / vocabulário (reaproveitar de `globals.css`)
Mesmos do README principal. Específicos destas telas:

- **Casca:** breadcrumb 12.5px (último item `font-weight:600`, cor `--foreground`); título 28px/700/-0.025em; `description` muted, `max-width: 70ch`; `actions` no topo direito.
- **Painel (`FormsPanel`):** `rounded-[var(--v2-radius-card)]`, `border hsl(var(--v2-border-soft))`, `bg hsl(var(--card)/.75)`, `shadow-[var(--v2-shadow)]`, `backdrop-blur`, padding 26–28px.
- **Campos do formulário:** label 13.5px/600 + `*` obrigatório em vermelho (`hsl(0 72% 58%)`); inputs altura 42px, radius 9px, `bg hsl(var(--v2-card-2)/.7)`, foco com borda accent + `box-shadow 0 0 0 3px accent/.12`; erro com borda `hsl(0 72% 55%/.7)` + mensagem 12.5px.
- **Faixa de info (raiz):** grid de 4 colunas, células `hsl(var(--card)/.9)` separadas por `border-soft`, label uppercase 11px + valor 14px com ícone Lucide.
- **Pílulas de status (minimalista):** Não iniciado → neutro (cinza); Em andamento → âmbar `hsl(38 92% 55%)`; Concluído → verde `hsl(158 64% 45%)`. (Os mesmos `dot`/tons do README.)

---

## Telas

### 1. Raiz do formulário — `/forms/{slug}`
**Propósito:** página inicial de um tipo de solicitação — entender do que se trata e abrir uma nova.

- **Casca:** breadcrumb `Home / Solicitações / {título}`; título = `form.title`; descrição = `Criado há {tempo} · {setor}` + `form.description` (via `FormDescription`); ações à direita.
- **Ações (perfil colaborador):** `Minhas solicitações` (ghost → `/forms/my-responses`) + **`Abrir nova solicitação`** (accent teal → `/forms/{id}/respond`).
  - *No `page.tsx` real* há também `Respostas` e `Editar` (admin, gated por `canEditForm`) e `CreateManualResponseButtonWrapper`. Mantê-los condicionados à permissão; para o colaborador, exibir só as duas ações acima.
- **Faixa de info:** Setor responsável · Prazo de resposta · Campos (`form.fields.length`) · Em aberto agora.
- **Painel:** `FormPreview` (`readOnly`) — título do formulário + **todos os campos desabilitados**; campos `dynamic` já mostram nome/setor do usuário com cadeado "Preenchido automaticamente". Rodapé com `Abrir nova solicitação`.

### 2. Responder — `/forms/{slug}/respond`
**Propósito:** preencher e enviar a solicitação. Equivale a `FormResponseComponent`.

- **Casca:** breadcrumb `Home / Solicitações / {título} / Responder`; título = `form.title`; descrição = `form.description`.
- **Painel:** formulário real, um `FieldRow` por campo. Tipos suportados (de `form-types.ts`): `text`, `number`, `textarea`, `combobox` (single = `Select`; multiple = `MultiSelect`/`MultiCombo` com chips), `formatted` (`InputMask` — cpf/cnpj/phone/email), `file` (dropzone com tipos aceitos), `checkbox`, `dynamic` (read-only, preenchido por `api.user.me`).
- **Validação:** schema Zod dinâmico (já implementado em `form-response.tsx`); obrigatórios com `*` e mensagem "Este campo é obrigatório". Cabeçalho do painel informa nº de campos obrigatórios.
- **Rodapé:** `Cancelar` (→ raiz do formulário) + **`Enviar solicitação`** (accent, `Send`).
- **Sucesso (pós-`mutate`):** alerta verde "Solicitação enviada com sucesso!" + `Ver minhas solicitações` (ghost) e `Abrir nova solicitação` (accent → `reset` do form). Espelha o estado `isSubmitted` do componente real.

### 3. Minhas solicitações — `/forms/my-responses`
**Propósito:** acompanhar todas as próprias solicitações. Evolução visual de `UserResponsesList` para o vocabulário v2.

- **Casca:** breadcrumb `Home / Solicitações / Minhas solicitações`; título "Minhas solicitações"; descrição "Visualize e acompanhe o status…"; ação `Nova solicitação` (→ catálogo).
- **KPIs discretos:** Total · Em aberto · Aguardando você (âmbar) · Concluídas (accent).
- **Toolbar:** busca (nº / formulário) + segmented **`Lista | Quadro`** (substitui o `Tabs` "Lista com Filtros / Kanban" do componente atual).
- **Lista:** chips de filtro por status (`Todas / Não iniciadas / Em andamento / Concluídas`) + linhas ricas: `#id` (mono), pílula de status, badge "Aguardando você", título do formulário, **comentário de status** (`statusComment`), meta (`setor · Enviada {idade} · Responsável`). Linha inteira clicável.
- **Quadro:** 3 colunas (Não iniciado / Em progresso / Concluído) com contagem; cards compactos. (No real, manter o `DragDropContext`/`KanbanColumn`, **bloqueando** o arraste da própria solicitação — regra já existente.)
- **Drawer de detalhe (clique numa linha/card):** `#id` + status, título, nota de status, **Dados enviados** (grid de campos), **Conversa** (bolhas: você à direita em accent/.12, setor/técnico à esquerda) e caixa de resposta. Recriar com `Sheet` + `response-details.tsx` + `response-chat.tsx`.

---

## Navegação / estado (cliente)
- **Catálogo → telas:** "Ver" (linha) → raiz; "Abrir solicitação" (linha) e "Iniciar solicitação" (drawer rápido `FormQuickOpenDrawer`) → responder; "Minhas solicitações" / "Ver todas" / "Abrir o Kanban" → my-responses.
- **Estado (my-responses):** `view` (lista/quadro), `query`, `filter` (status), `selected` (drawer). Dados de `api.formResponse.listUserResponses`; resposta na conversa via `response-chat`; mudança de status no quadro via `formResponse.updateStatus`.
- **Campos dinâmicos:** preenchidos por `api.user.me` (`user_name`, `user_sector`) — read-only com cadeado.
- **Transições:** `fade-in` 0.3s nas trocas de página; drawer desliza da direita 0.26s `cubic-bezier(.2,.8,.2,1)`. *Garantir estado de repouso visível (opacity 1)* para não depender da animação completar.
- **Responsivo:** faixa de info colapsa para 2 colunas <860px; quadro vira 1 coluna <1000px; toolbar/ações quebram para coluna no mobile.

## Definição de campos (referência)
`data.js → FORM_FIELDS` traz um conjunto realista por formulário (categoria, urgência, local, descrição, anexo, etc.), apenas para o protótipo. **Em produção os campos vêm de `form.fields`** (montados no Form Builder e persistidos no Prisma); o renderer deve ser agnóstico ao conteúdo e dirigido por `field.type`.
