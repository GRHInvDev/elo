# Documentação Mestre — ELO

**Sistema de Gestão Empresarial / Intranet Corporativa**

Versão do documento: 1.0 | Última atualização: Fevereiro 2025

---

## Como usar este documento

Este é o **documento mestre** do projeto ELO. Ele serve como:

- **Ponto de entrada** para entender stack, arquitetura e estrutura de pastas.
- **Índice central** das funcionalidades por módulo, com rotas, API tRPC, componentes e modelos de dados.
- **Referência rápida** para configuração (variáveis de ambiente, scripts, ferramentas).

**Para quem é:**

- **Novos devs:** comece pela [Introdução](#1-relatório-técnico) e pela [Estrutura de pastas](#14-estrutura-de-pastas).
- **Arquitetos / tech leads:** use o [Relatório técnico](#1-relatório-técnico) e o [Levantamento de funcionalidades](#2-levantamento-de-funcionalidades) para visão de sistema e módulos.
- **Product / negócio:** o [Levantamento por módulo](#2-levantamento-de-funcionalidades) resume o que cada área faz e onde está no código.

A documentação detalhada por tema está em `docs/` (setup, arquitetura, API, módulos, desenvolvimento, deploy, troubleshooting). Este arquivo faz **links internos** para as seções abaixo e **referências** para documentos em `docs/` quando existirem.

---

## Índice

1. [Relatório técnico](#1-relatório-técnico)  
   - [1.1 Stack tecnológica](#11-stack-tecnológica)  
   - [1.2 Arquitetura](#12-arquitetura)  
   - [1.3 Padrões adotados](#13-padrões-adotados)  
   - [1.4 Estrutura de pastas](#14-estrutura-de-pastas)  
   - [1.5 Configuração](#15-configuração)  
2. [Levantamento de funcionalidades](#2-levantamento-de-funcionalidades)  
   - [2.1 Autenticação e usuários](#21-autenticação-e-usuários)  
   - [2.2 Dashboard e início](#22-dashboard-e-início)  
   - [2.3 Notícias (posts)](#23-notícias-posts)  
   - [2.4 Eventos e flyers](#24-eventos-e-flyers)  
   - [2.5 Salas e reservas (rooms/bookings)](#25-salas-e-reservas-roomsbookings)  
   - [2.6 Veículos e locações](#26-veículos-e-locações)  
   - [2.7 Aniversariantes (birthdays)](#27-aniversariantes-birthdays)  
   - [2.8 Formulários e chamados](#28-formulários-e-chamados)  
   - [2.9 Alimentação (food orders)](#29-alimentação-food-orders)  
   - [2.10 Loja (shop / produtos e pedidos)](#210-loja-shop--produtos-e-pedidos)  
   - [2.11 Ideias / sugestões e KPIs](#211-ideias--sugestões-e-kpis)  
   - [2.12 Chat e grupos](#212-chat-e-grupos)  
   - [2.13 Ramais e extensões](#213-ramais-e-extensões)  
   - [2.14 Gestão de qualidade](#214-gestão-de-qualidade)  
   - [2.15 Régua de emoções](#215-régua-de-emoções)  
   - [2.16 Notificações](#216-notificações)  
   - [2.17 Painel administrativo](#217-painel-administrativo)  
3. [Próximos passos / documentação futura](#3-próximos-passos--documentação-futura)  
4. [Referências à documentação em docs/](#4-referências-à-documentação-em-docs)

---

## 1. Relatório técnico

### 1.1 Stack tecnológica

Confirmado com base em `package.json` e estrutura do repositório:

| Camada | Tecnologia | Observação |
|--------|------------|------------|
| **Framework** | Next.js 15.x | App Router |
| **UI / React** | React 19.x | (react 19.2.0) |
| **Linguagem** | TypeScript 5.x | Tipagem estrita |
| **API** | tRPC 11 (rc) | Queries e mutations tipadas |
| **ORM / DB** | Prisma 6.x, PostgreSQL | `prisma/schema.prisma` |
| **Auth** | Clerk (@clerk/nextjs) | Autenticação e sessão |
| **Estilos** | Tailwind CSS 3.x | Utility-first |
| **Componentes base** | Radix UI + shadcn/ui | Componentes acessíveis |
| **Forms** | React Hook Form, Zod, @hookform/resolvers | Validação e schemas |
| **Estado servidor** | TanStack Query (React Query) 5.x | Cache e dados tRPC |
| **Upload** | UploadThing | Arquivos e imagens |
| **E-mail** | Resend / Nodemailer | Notificações e envios |
| **Outros** | date-fns, Recharts, Framer Motion, Monaco Editor, Leaflet, etc. | Datas, gráficos, mapas, edição |

Documentação de ambiente e dependências: [docs/01-Setup/](01-Setup/README.md), [docs/01-Setup/dependencias.md](01-Setup/dependencias.md), [docs/01-Setup/ambiente.md](01-Setup/ambiente.md).

### 1.2 Arquitetura

- **Frontend:** Next.js 15 com **App Router**. Rotas em `src/app/`: `(auth)` (login/cadastro), `(authenticated)` (área logada), páginas públicas quando houver.
- **Backend / API:** tRPC como única API type-safe. Routers em `src/server/api/routers/`, raiz em `src/server/api/root.ts`. Não há camada REST separada; toda lógica de dados passa por procedures tRPC.
- **Camadas de backend:**
  - **Routers (API):** definem procedures (query/mutation), validam input com Zod e chamam serviços ou acessam o banco.
  - **Serviços:** lógica de negócio quando existir (ex.: envio de e-mail, regras de negócio); em vários casos a lógica ainda está nos próprios routers.
  - **Repositório / dados:** acesso a dados via **Prisma** (`ctx.db`). Não há camada de repositório explícita; os routers usam `ctx.db` diretamente. Padrão próximo a “router + Prisma”.
- **Autenticação:** Clerk. Contexto tRPC obtém `userId` via `currentUser()` e expõe em `ctx.auth`; procedures protegidas usam `protectedProcedure` ou `adminProcedure` (com checagem de role/config).

Visão geral de arquitetura: [docs/02-Arquitetura/README.md](02-Arquitetura/README.md), [docs/02-Arquitetura/backend.md](02-Arquitetura/backend.md), [docs/02-Arquitetura/frontend.md](02-Arquitetura/frontend.md).

### 1.3 Padrões adotados

- **API:** procedures com Zod para input; `protectedProcedure` para rotas autenticadas; `adminProcedure` para ações administrativas; uso de `ctx.db` (Prisma) nos routers.
- **Frontend:** componentes funcionais; hooks do tRPC (`api.*.useQuery`, `api.*.useMutation`); React Hook Form + Zod em formulários; aliases `@/` para imports.
- **Banco:** convenção `snake_case` em colunas quando necessário (via `@map`); migrations versionadas com Prisma; enums para domínios fixos (Enterprise, OrderStatus, etc.).
- **Segurança:** validação de entrada (Zod), uso de roles/config (ex.: `role_config` em User), sem expor dados sensíveis em respostas.

Regras do projeto (Cursor/AGENTS): `.cursor/rules/` (trpc, forms, components, db, security, etc.). Documentação de padrões: [docs/06-Desenvolvimento/padroes.md](06-Desenvolvimento/padroes.md).

### 1.4 Estrutura de pastas

Estrutura relevante sob `src/`:

| Caminho | Descrição |
|---------|-----------|
| **`src/app/`** | App Router: layouts, rotas, páginas. `(auth)` = login/cadastro; `(authenticated)` = área logada com layout comum; rotas dinâmicas com `[id]`, etc. |
| **`src/components/`** | Componentes React: `ui/` (shadcn/base), `forms/`, `dashboard/`, `news/`, `events/`, `rooms/`, `vehicles/`, `birthday/`, `flyers/`, `shop/`, `chat/`, `admin/`, `emotion-ruler/`, `quality/`, etc. |
| **`src/server/`** | Lado servidor: `api/` (tRPC: `trpc.ts`, `root.ts`, `routers/`), `db.ts` (Prisma client). |
| **`src/server/api/routers/`** | Um arquivo por domínio (post, user, event, room, booking, vehicle, vehicle-rent, product, product-order, forms, form-response, restaurant, menu-item*, food-order, order-log, suggestion, classification, kpi, chat-message, admin-chat-groups, enterprise-manager, global-config, purchase-registration, quality-document, quality-enum, quality-access, emotion-ruler, birthday, reaction, comment). |
| **`src/hooks/`** | Custom hooks (dados, formulários, UI). |
| **`src/lib/`** | Utilitários, helpers, configurações compartilhadas. |
| **`src/types/`** | Tipos e interfaces TypeScript (ex.: role-config). |
| **`src/trpc/`** | Cliente tRPC para React (provider, chamadas tipadas). |
| **`prisma/`** | `schema.prisma` (modelos e enums), migrations. |

Documentação de componentes e hooks: [docs/06-Desenvolvimento/componentes.md](06-Desenvolvimento/componentes.md), [docs/06-Desenvolvimento/hooks.md](06-Desenvolvimento/hooks.md).

### 1.5 Configuração

**Variáveis de ambiente**

Schema validado em `src/env.js` (apenas `DATABASE_URL` e `NODE_ENV` no schema mínimo). Exemplo completo em `.env.example`:

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Conexão PostgreSQL (Prisma) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk (front) |
| `CLERK_SECRET_KEY` | Clerk (backend) |
| `UPLOADTHING_SK` / `UPLOADTHING_TOKEN` | UploadThing |
| `RESEND_API_KEY` / `RESEND_FROM` | E-mail (Resend) |
| `NEXT_PUBLIC_FOOD_ORDER_DEADLINE_HOUR` | Horário limite para pedido de alimentação (ex.: 9) |

**Scripts principais (`package.json`)**

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `next dev` | Servidor de desenvolvimento |
| `build` | `next build` | Build de produção |
| `start` | `next start` | Servidor de produção |
| `lint` | `eslint .` | Lint |
| `lint:fix` | `eslint --fix .` | Lint com correção |
| `typecheck` | `tsc --noEmit` | Verificação de tipos |
| `check` | `eslint . && tsc --noEmit` | Lint + typecheck |
| `db:generate` | `prisma generate` | Gera cliente Prisma |
| `db:push` | `prisma db push` | Sincroniza schema com o DB (dev) |
| `db:migrate` | `prisma migrate deploy` | Aplica migrações |
| `db:studio` | `prisma studio` | UI do banco |
| `format:check` / `format:write` | Prettier | Formatação |
| `version` / `version:major` / `version:minor` / `version:patch` | `node scripts/version.js` | Bump de versão |

**Ferramentas de build e qualidade**

- **Build:** Next.js 15.
- **Lint:** ESLint (eslint-config-next).
- **Formatação:** Prettier (prettier-plugin-tailwindcss).
- **Tipos:** TypeScript (strict).

Detalhes de ambiente: [docs/01-Setup/ambiente.md](01-Setup/ambiente.md).

---

## 2. Levantamento de funcionalidades

Levantamento com base em: `src/server/api/root.ts`, `src/server/api/routers/*.ts`, `src/app/**/page.tsx`, `src/components/**`, `prisma/schema.prisma`.  
Cada subseção indica: **rotas/páginas**, **procedures tRPC** (por router), **componentes principais** e **modelos Prisma** envolvidos.

### 2.1 Autenticação e usuários

- **Rotas:** Login/cadastro em `(auth)/sign-in`, `(auth)/sign-up`; perfil/usuário via layout e páginas da área autenticada; gestão de usuários em `(authenticated)/admin/users`.
- **Routers:** `user` (`src/server/api/routers/user.ts`).
- **Procedures (resumo):** `me`, `getCurrent`, `getById`, `listAll` (admin), `listAdmins` (admin), `updateProfile`, `listUsers`, `searchMinimal`, `listForChat`, `updateRoleConfig`, `updateBasicInfo`, `listExtensions`, `updateExtension`, `listcustom_extensions`, `createcustom_extension`, `updatecustom_extension`, `deletecustom_extension`, `checkNewCollaborator`, `markAsNotNew`.
- **Componentes:** Layout autenticado, `user-nav`, `settings-menu`, `complete-profile-modal`, `enterprise-filter`, etc.
- **Modelos Prisma:** `User` (e relações com Birthday, Booking, Post, Form, etc.).

Documentação: [docs/04-API/auth.md](04-API/auth.md).

### 2.2 Dashboard e início

- **Rotas:** `(authenticated)/dashboard/page.tsx`.
- **Dados:** Agregação de notícias, aniversariantes, eventos, clima, vídeos, etc., via vários routers (post, birthday, event, etc.).
- **Componentes:** `dashboard/welcome-card`, `news-displ`, `birthdays-carousel`, `videos-carousel`, `weather-widget`, `main-carousel`, etc.
- **Modelos Prisma:** Post, Event, Birthday, User, etc.

Documentação: [docs/05-Modulos/dashboard.md](05-Modulos/dashboard.md).

### 2.3 Notícias (posts)

- **Rotas:** `(authenticated)/news/page.tsx`.
- **Routers:** `post`, `reaction`, `comment`.
- **Procedures:**  
  - **post:** `create`, `update`, `delete`, `list`, `listAll`, `incrementView`.  
  - **reaction:** `addReaction`, `removeReaction`, `listByPost`, `getReactionCounts`, `getUserReaction`.  
  - **comment:** `addComment`, `removeComment`, `updateComment`, `listByPost`, `getUserComment`.
- **Componentes:** `news/content-feed`, `news/posts-list`, etc.
- **Modelos Prisma:** `Post`, `PostImage`, `Reaction`, `Coment`, `User`.

Documentação: [docs/05-Modulos/news.md](05-Modulos/news.md).

### 2.4 Eventos e flyers

- **Rotas:** `(authenticated)/events/page.tsx`, `(authenticated)/flyers/page.tsx`.
- **Routers:** `event`, `flyer`.
- **Procedures:**  
  - **event:** `create`, `update`, `delete`, `list`.  
  - **flyer:** `create`, `update`, `delete`, `list`.
- **Componentes:** `events/events-list`, `events/create-event-button`, `flyers/flyers-list`, `flyers/create-flyer-button`.
- **Modelos Prisma:** `Event`, `Flyer`, `User`.

Documentação: [docs/05-Modulos/events.md](05-Modulos/events.md).

### 2.5 Salas e reservas (rooms/bookings)

- **Rotas:** `(authenticated)/rooms/page.tsx`; admin em `(authenticated)/admin/rooms/page.tsx`.
- **Routers:** `room`, `booking`.
- **Procedures:**  
  - **room:** `create`, `update`, `delete`, `byId`, `list`, `checkAvailability`, `listBookings`, `listAvailable`.  
  - **booking:** `create`, `delete`, `update`, `list`, `listMine`.
- **Componentes:** `rooms/room-map`, `rooms/avalible-rooms`, `rooms/room-dialog`, `rooms/rooms-list`, `rooms/room-calendar`, `rooms/room-admin`, `birthday/my-bookings`.
- **Modelos Prisma:** `Room`, `Booking`, `User`.

Documentação: [docs/05-Modulos/rooms.md](05-Modulos/rooms.md).

### 2.6 Veículos e locações

- **Rotas:** `(authenticated)/cars/page.tsx`, `(authenticated)/cars/my-rents/page.tsx`, `(authenticated)/cars/details/[id]/page.tsx`, `(authenticated)/cars/details/[id]/rent/page.tsx`; admin em `(authenticated)/admin/vehicles/page.tsx`.
- **Routers:** `vehicle`, `vehicleRent`.
- **Procedures:**  
  - **vehicle:** `getAvailable`, `getAll`, `getById`, `create`, `update`, `delete`.  
  - **vehicleRent:** `getAll`, `getById`, `getMyActiveRent`, `getMyAllRents`, `getCalendarReservations`, `create`, `finish`, `finishWithoutUsage`, `cancel`, `edit`.
- **Componentes:** `vehicles/vehicle-card`, `vehicles/rent-vehicle-button`, `vehicles/rent-form`, `vehicles/finish-rent-button`, `vehicles/vehicle-calendar`, `admin/vehicles/vehicle-form`, `admin/vehicles/vehicle-usage-history`, `admin/vehicles/vehicle-metrics`, `admin/vehicles/user-ranking`.
- **Modelos Prisma:** `Vehicle`, `VehicleRent`, `User`.

Documentação: [docs/05-Modulos/cars.md](05-Modulos/cars.md).

### 2.7 Aniversariantes (birthdays)

- **Rotas:** `(authenticated)/birthdays/page.tsx`; admin em `(authenticated)/admin/birthday/page.tsx`.
- **Routers:** `birthday`.
- **Procedures:** `create`, `update`, `delete`, `byId`, `list`, `listCurrentMonth`, `getMine`, `importBirthdays` (admin), `getTodayBirthdays`.
- **Componentes:** `birthday/birthday-form`, `birthday/monthly-birthdays`, `birthday/birthdays-tab`, `birthday/birthday-admin`, `birthday/birthday-import`, `birthday/birthday-confetti`, `dashboard/birthdays-carousel`.
- **Modelos Prisma:** `Birthday`, `User`.

### 2.8 Formulários e chamados

- **Rotas:** `(authenticated)/forms/page.tsx`, `(authenticated)/forms/new/page.tsx`, `(authenticated)/forms/[id]/page.tsx`, `(authenticated)/forms/[id]/edit/page.tsx`, `(authenticated)/forms/[id]/respond/page.tsx`, `(authenticated)/forms/[id]/responses/page.tsx`, `(authenticated)/forms/[id]/responses/[responseId]/page.tsx`, `(authenticated)/forms/my-responses/page.tsx`, `(authenticated)/forms/kanban/page.tsx`; qualidade em `(authenticated)/quality/page.tsx`; admin qualidade em `(authenticated)/admin/quality/page.tsx`, `(authenticated)/admin/quality/enums/page.tsx`.
- **Routers:** `forms`, `formResponse`.
- **Procedures:**  
  - **forms:** `create`, `update`, `delete`, `list`, `getById`, `updateFormVisibility`, `getUsersForFormVisibility`, `isOwnerOfAnyForm`.  
  - **formResponse:** `create`, `createManual`, `listByForm`, `listKanBan`, `getChat`, `sendChatMessage`, `markViewed`, `listUserResponses`, `updateStatus`, `getById`, `update`, `getAllTags`, `createTag`, `updateTag`, `applyTag`, `removeTag`, `getTags`.
- **Componentes:** `forms/forms-list`, `forms/form-builder`, `forms/form-response`, `forms/response-details`, `forms/response-chat`, `forms/responses-list`, `forms/field-editor`, `forms/user-search`, `forms/response-details`, `forms/edit-response-modal`, etc.
- **Modelos Prisma:** `Form`, `FormResponse`, `FormResponseChat`, `FormResponseView`.

Documentação: [docs/05-Modulos/forms.md](05-Modulos/forms.md).

### 2.9 Alimentação (food orders)

- **Rotas:** `(authenticated)/food/page.tsx`; admin em `(authenticated)/admin/food/page.tsx`.
- **Routers:** `restaurant`, `menuItem`, `menuItemOption`, `menuItemOptionChoice`, `foodOrder`, `orderLog`.
- **Procedures (resumo):**  
  - **restaurant:** `create`, `update`, `delete`, `byId`, `list`, `listActive`, `getCities`.  
  - **menuItem:** `create`, `update`, `delete`, `byId`, `byRestaurant`, `getCategories`, `byCategory`.  
  - **menuItemOption / menuItemOptionChoice:** CRUD e listagens por item/opção.  
  - **foodOrder:** `create`, `createManual`, `updateStatus`, `sendOrdersEmailByRestaurant`, `cancel`, `delete`, `byId`, `myOrders`, `list`, `listToExcel`, `exportOrdersByRestaurantAndDate`, `byDate`, `byRestaurant`, `checkTodayOrder`, `checkOrderByDate`, `getMetricsByRestaurant`, `getChartDataByRestaurant`, `getDREData`.  
  - **orderLog:** `generateMonthlyLogs`, `getByMonth`, `getByUser`, `list`, `exportForPayroll`.
- **Componentes:** (componentes de cardápio e pedidos nas páginas de food/admin food).
- **Modelos Prisma:** `Restaurant`, `MenuItem`, `MenuItemOption`, `MenuItemOptionChoice`, `FoodOrder`, `OrderOptionSelection`, `OrderLog`.

Documentação: [docs/05-Modulos/food.md](05-Modulos/food.md).

### 2.10 Loja (shop / produtos e pedidos)

- **Rotas:** `(authenticated)/shop/page.tsx`; admin em `(authenticated)/admin/products/page.tsx`.
- **Routers:** `product`, `productOrder`, `purchaseRegistration`, `enterpriseManager`, `globalConfig`.
- **Procedures (resumo):**  
  - **product:** `create`, `update`, `delete`, `getAll`, `getAllForAdmin`, `getById`, `toggleActive`.  
  - **productOrder:** `create`, `createMultiple`, `listKanban`, `countUnread`, `updateStatus`, `markAsRead`, `listMyPendingGroups`, `listMyOrders`, `countMyUnread`, `markMyOrderAsRead`, `getChat`, `sendChatMessage`, `countChatNotifications`, `markChatNotificationsAsRead`, `deleteOrder`.  
  - **purchaseRegistration:** `checkRegistration`, `createOrUpdate`, `getByEnterprise`, `getByUserIdAndEnterprise`.  
  - **enterpriseManager:** `list` (admin), `create`, `delete`, `isManager`.  
  - **globalConfig:** `get` (admin), `updateShopNotificationEmail`.
- **Componentes:** `shop/product-grid`, `shop/product-card`, `shop/shopping-cart`, `shop/create-order-modal`, `shop/order-chat`, `shop/my-orders-list`, `admin/products/product-list-table`, `admin/products/product-form`, `admin/products/orders-kanban`, `admin/products/order-details-modal`, `admin/products/enterprise-managers`, `admin/products/shop-notification-settings`.
- **Modelos Prisma:** `Product`, `ShopCart`, `Sell`, `OrderGroup`, `ProductOrder`, `ShopChat`, `EnterpriseManager`, `PurchaseRegistration`, `GlobalConfig`.

Documentação: [docs/05-Modulos/shop.md](05-Modulos/shop.md).

### 2.11 Ideias / sugestões e KPIs

- **Rotas:** `(authenticated)/my-suggestions/page.tsx`, `(authenticated)/doubts/page.tsx`; admin em `(authenticated)/admin/suggestions/page.tsx`.
- **Routers:** `suggestion`, `classification`, `kpi`.
- **Procedures (resumo):**  
  - **suggestion:** `create`, `createManual` (admin), `list` (admin), `listKanban`, `updateAdmin`, `updateDescription`, `updateProblem`, `getMySuggestions`, `sendRejectionNotification` (admin), `getStats`.  
  - **classification:** `listByType`, `listAll` (admin), `create`, `update`, `delete`, `reorder` (admin).  
  - **kpi:** `listActive`, `search` (admin), `create`, `update`, `delete`, `getBySuggestionId`, `linkToSuggestion`, `unlinkFromSuggestion` (admin).
- **Componentes:** `admin/suggestion/suggestion-card`, `admin/suggestion/kpi-management-modal`, etc.
- **Modelos Prisma:** `Suggestion`, `SuggestionKpi`, `Kpi`, `Classification`.

Documentação: [docs/05-Modulos/ideias.md](05-Modulos/ideias.md), [docs/05-Modulos/sugestoes.md](05-Modulos/sugestoes.md).

### 2.12 Chat e grupos

- **Rotas:** `(authenticated)/chat/page.tsx`; admin em `(authenticated)/admin/chat/page.tsx`, `(authenticated)/admin/chat-groups/page.tsx`.
- **Routers:** `chatMessage`, `adminChatGroups`.
- **Procedures:**  
  - **chatMessage:** `getMessages`, `getRecentMessages`, `sendMessage`, `getStats`, `getRooms`, `getUserGroups`, `getActiveConversations`, `getGlobalStats`.  
  - **adminChatGroups:** `createGroup`, `updateGroup`, `deleteGroup`, `getGroups`, `getGroup`, `addMembers`, `removeMember`, `getAvailableUsers`.
- **Componentes:** `chat/ChatRoom`, `chat/ChatSidebar`, `chat/ImageUpload`, `chat/FileUpload`, `chat/FileMessage`, `chat/ImageMessage`.
- **Modelos Prisma:** `chat_group`, `chat_group_member`, `chat_message`, `User`.

### 2.13 Ramais e extensões

- **Rotas:** `(authenticated)/extension/page.tsx`; admin em `(authenticated)/admin/extension/page.tsx`.
- **Routers:** `user` (extensions e custom_extensions).
- **Procedures:** (já listadas em [2.1](#21-autenticação-e-usuários): `listExtensions`, `updateExtension`, `listcustom_extensions`, `createcustom_extension`, `updatecustom_extension`, `deletecustom_extension`.
- **Modelos Prisma:** `User` (extension, custom_extension), `custom_extension`.

### 2.14 Gestão de qualidade

- **Rotas:** `(authenticated)/quality/page.tsx`; admin em `(authenticated)/admin/quality/page.tsx`, `(authenticated)/admin/quality/enums/page.tsx`.
- **Routers:** `qualityDocument`, `qualityEnum`, `qualityAccess`.
- **Procedures:**  
  - **qualityDocument:** `list`, `getById`, `create`, `update`, `delete`.  
  - **qualityEnum:** `list`, `create`, `update`, `delete`.  
  - **qualityAccess:** `listByDocument`, `grantAccess`, `revokeAccess`, `checkAccess`.
- **Componentes:** `admin/quality/quality-document-form`, etc.
- **Modelos Prisma:** `QualityDocument`, `QualityDocumentAccess`, `QualityEnum`, `User`.

### 2.15 Régua de emoções

- **Rotas:** `(authenticated)/forms/emotion-ruler/page.tsx`; admin em `(authenticated)/admin/emotion-ruler/page.tsx`.
- **Routers:** `emotionRuler`.
- **Procedures:** `getActive`, `shouldShowModal`, `registerAccess`, `registerDismissal`, `createResponse`, `getAll`, `getById`, `create`, `update`, `getStats`, `getResponses`.
- **Componentes:** `emotion-ruler/emotion-ruler-modal`, `emotion-ruler/emotion-ruler-wrapper`, `emotion-ruler/animated-emoji`, `admin/emotion-ruler/emotion-ruler-form`, `admin/emotion-ruler/emotion-ruler-list`, `admin/emotion-ruler/emotion-ruler-stats`, `admin/emotion-ruler/animated-emoji-picker`.
- **Modelos Prisma:** `EmotionRuler`, `EmotionRulerEmotion`, `EmotionRulerResponse`, `EmotionRulerDailyAccess`, `User`.

### 2.16 Notificações

- **Implementação:** Modelo `Notification` e `NotificationPreference` no Prisma; criação de notificações feita por outros módulos (sugestões, formulários, chat, etc.). Não há router tRPC dedicado “notification” em `root.ts`; notificações são criadas/consumidas via lógica nos routers existentes ou em serviços.
- **Modelos Prisma:** `Notification`, `NotificationPreference`, `User`.

### 2.17 Painel administrativo

- **Rotas:** `(authenticated)/admin/page.tsx` e subpáginas: `admin/users`, `admin/suggestions`, `admin/rooms`, `admin/extension`, `admin/news`, `admin/products`, `admin/emotion-ruler`, `admin/chat`, `admin/birthday`, `admin/chat-groups`, `admin/vehicles`, `admin/quality`, `admin/quality/enums`, `admin/food`.
- **Procedures:** Todas as listadas como `adminProcedure` nos routers (user, birthday, suggestion, kpi, classification, enterpriseManager, adminChatGroups, globalConfig, etc.) e demais procedures administrativas por módulo.
- **Componentes:** Componentes em `components/admin/` (products, suggestion, vehicles, emotion-ruler, quality).

Documentação: [docs/05-Modulos/admin.md](05-Modulos/admin.md).

---

## 3. Próximos passos / documentação futura

- **Manter este documento alinhado ao código:** ao adicionar routers, páginas ou módulos, atualizar o [Levantamento de funcionalidades](#2-levantamento-de-funcionalidades) e o [Relatório técnico](#1-relatório-técnico) quando a stack ou a estrutura mudar.
- **Detalhar procedures por router:** para cada router em `server/api/routers/`, manter (neste doc ou em `docs/04-API/trpc.md`) a lista de procedures com assinatura e uso principal.
- **Documentar notificações:** descrever onde e como notificações são criadas (sugestões, formulários, chat, etc.) e se haverá um router `notification` no futuro.
- **Diagramas:** considerar diagramas de arquitetura (C4 ou similar) e de fluxo por módulo principal, referenciados a partir deste documento.
- **Changelog do doc:** manter uma linha “Última atualização” e, se útil, um mini changelog no final do arquivo para mudanças relevantes na documentação mestre.

---

## 4. Referências à documentação em docs/

| Tema | Caminho em docs/ |
|------|-------------------|
| Índice geral | [docs/README.md](README.md) |
| Introdução | [docs/00-Introducao/README.md](00-Introducao/README.md) |
| Setup | [docs/01-Setup/README.md](01-Setup/README.md), [ambiente.md](01-Setup/ambiente.md), [dependencias.md](01-Setup/dependencias.md) |
| Arquitetura | [docs/02-Arquitetura/README.md](02-Arquitetura/README.md), [frontend.md](02-Arquitetura/frontend.md), [backend.md](02-Arquitetura/backend.md), [infraestrutura.md](02-Arquitetura/infraestrutura.md) |
| Banco de dados | [docs/03-Banco-Dados/README.md](03-Banco-Dados/README.md), [modelos.md](03-Banco-Dados/modelos.md), [migracoes.md](03-Banco-Dados/migracoes.md), [relacoes.md](03-Banco-Dados/relacoes.md) |
| API | [docs/04-API/README.md](04-API/README.md), [trpc.md](04-API/trpc.md), [auth.md](04-API/auth.md), [middlewares.md](04-API/middlewares.md), [webhooks.md](04-API/webhooks.md) |
| Módulos | [docs/05-Modulos/](05-Modulos/) — dashboard, ideias, sugestões, forms, food, rooms, cars, events, shop, news, admin |
| Desenvolvimento | [docs/06-Desenvolvimento/README.md](06-Desenvolvimento/README.md), [padroes.md](06-Desenvolvimento/padroes.md), [componentes.md](06-Desenvolvimento/componentes.md), [hooks.md](06-Desenvolvimento/hooks.md), [testes.md](06-Desenvolvimento/testes.md), [deploy.md](06-Desenvolvimento/deploy.md) |
| Deploy | [docs/07-Deploy/README.md](07-Deploy/README.md) |
| Troubleshooting | [docs/08-Troubleshooting/README.md](08-Troubleshooting/README.md), [desenvolvimento.md](08-Troubleshooting/desenvolvimento.md) |
| Roles (exemplos) | [docs/role-config-examples.md](role-config-examples.md), [docs/migration-to-role-config.md](migration-to-role-config.md) |

---

*Documento mestre do projeto ELO — Sistema de Gestão Empresarial.*
