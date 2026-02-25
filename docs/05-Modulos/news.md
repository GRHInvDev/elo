# Notícias (posts) — ELO

**Módulo de notícias, reações e comentários**

Este documento descreve o módulo de **notícias** (posts) do Sistema de Intranet ELO, alinhado ao [DOCUMENTACAO-MESTRE.md](../DOCUMENTACAO-MESTRE.md#23-notícias-posts).

---

## Visão geral

- **Rotas:** `(authenticated)/news/page.tsx`
- **Routers tRPC:** `post`, `reaction`, `comment`
- **Modelos Prisma:** `Post`, `PostImage`, `Reaction`, `Coment`, `User`

---

## Procedures tRPC

### Router `post`

| Procedure | Tipo | Descrição |
|-----------|------|-----------|
| `create` | mutation | Criar post |
| `update` | mutation | Atualizar post |
| `delete` | mutation | Remover post |
| `list` | query | Listar posts (com filtros) |
| `listAll` | query | Listar todos (admin) |
| `incrementView` | mutation | Incrementar visualizações |

### Router `reaction`

| Procedure | Tipo | Descrição |
|-----------|------|-----------|
| `addReaction` | mutation | Adicionar reação ao post |
| `removeReaction` | mutation | Remover reação |
| `listByPost` | query | Reações de um post |
| `getReactionCounts` | query | Contagem de reações por post |
| `getUserReaction` | query | Reação do usuário no post |

### Router `comment`

| Procedure | Tipo | Descrição |
|-----------|------|-----------|
| `addComment` | mutation | Adicionar comentário |
| `removeComment` | mutation | Remover comentário |
| `updateComment` | mutation | Editar comentário |
| `listByPost` | query | Comentários de um post |
| `getUserComment` | query | Comentário do usuário no post |

---

## Componentes principais

- `news/content-feed` — feed de conteúdo
- `news/posts-list` — listagem de posts

Localização: `src/components/news/`.

---

## Modelos Prisma

- **Post** — título, conteúdo, autor, imagens, visualizações.
- **PostImage** — imagens vinculadas ao post.
- **Reaction** — reações (ex.: curtir) vinculadas a post e usuário.
- **Coment** — comentários em posts, com autor e conteúdo.

---

## Referências

- [Documentação Mestre](../DOCUMENTACAO-MESTRE.md) — levantamento completo
- [API tRPC](../04-API/trpc.md) — estrutura dos routers
- [Banco de dados](../03-Banco-Dados/modelos.md) — modelos detalhados
