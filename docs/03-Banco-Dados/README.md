# Banco de Dados — ELO

**Schema, modelos e migrações**

Esta pasta contém a documentação do banco de dados do Sistema de Intranet ELO (PostgreSQL + Prisma). O documento mestre do projeto está em [DOCUMENTACAO-MESTRE.md](../DOCUMENTACAO-MESTRE.md).

---

## Conteúdo

| Documento | Descrição |
|-----------|-----------|
| [modelos.md](modelos.md) | Modelos Prisma, campos e relacionamentos |
| [migracoes.md](migracoes.md) | Migrações, versionamento e procedimentos |
| [relacoes.md](relacoes.md) | Relacionamentos entre entidades |

---

## Stack

- **ORM:** Prisma
- **Banco:** PostgreSQL
- **Convenções:** `snake_case` em colunas quando aplicável (via `@map`); migrations versionadas; enums para domínios fixos (Enterprise, OrderStatus, etc.).

---

## Referências

- [Documentação Mestre](../DOCUMENTACAO-MESTRE.md) — visão geral e levantamento de funcionalidades
- [Estrutura de pastas](../DOCUMENTACAO-MESTRE.md#14-estrutura-de-pastas) — onde ficam `prisma/` e `src/server/`
