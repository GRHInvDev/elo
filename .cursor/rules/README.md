# Cursor Rules - Projeto ELO

Este diretório contém regras específicas para o desenvolvimento do projeto ELO, um sistema de gestão intra-empresarial organizacional construído com Next.js, TypeScript, Prisma e tRPC.

## 📋 Regras Disponíveis

### Fundamentos
1. **[TypeScript Patterns](01-typescript-patterns.mdc)** - Padrões de tipagem rigorosa e boas práticas
2. **[React Components](02-react-components.mdc)** - Estrutura e padrões para componentes React
3. **[Imports & File Structure](03-imports-file-structure.mdc)** - Organização de arquivos e sistema de imports

### Tecnologias Específicas
4. **[tRPC API Patterns](04-trpc-api-patterns.mdc)** - Padrões para API com tRPC
5. **[Database Prisma](05-database-prisma.mdc)** - Boas práticas para modelagem com Prisma
6. **[UI/UX Patterns](06-ui-ux-patterns.mdc)** - Padrões de interface com Tailwind/shadcn

### Segurança e Qualidade
7. **[Security & Access Control](07-security-access-control.mdc)** - Controle de acesso e segurança
8. **[Forms & Validation](08-forms-validation.mdc)** - Formulários e validação robusta
9. **[Custom Hooks](09-custom-hooks.mdc)** - Padrões para hooks customizados
10. **[Testing Patterns](10-testing-patterns.mdc)** - Estratégias de testes

### Performance e Documentação
11. **[Performance Optimization](11-performance-optimization.mdc)** - Otimização e performance
12. **[Documentation & Comments](12-documentation-comments.mdc)** - Documentação e comentários

## 🎯 Como Usar

### Aplicação Automática
Regras marcadas com `alwaysApply: true` são aplicadas automaticamente pelo Cursor em todos os arquivos relevantes.

### Aplicação Manual
Para regras específicas, mencione o nome da regra no contexto da conversa ou use a funcionalidade "Apply Rule" do Cursor.

### Escopo de Aplicação
Cada regra define seu escopo através de:
- **`globs`**: Padrões de arquivo (ex: `*.ts,*.tsx` para TypeScript)
- **`description`**: Descrição para busca e aplicação manual

## 🏗️ Arquitetura do Projeto

```
src/
├── app/              # Next.js App Router
├── components/       # Componentes React (UI + Lógica)
├── hooks/           # Hooks customizados
├── lib/             # Utilitários e configurações
├── server/          # API tRPC + Lógica de negócio
├── types/           # Definições TypeScript
├── schemas/         # Validações Zod
└── trpc/            # Configuração tRPC
```

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 15, React 18, TypeScript 5.5
- **Backend**: tRPC, Prisma, PostgreSQL
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Autenticação**: Clerk
- **Deploy**: Vercel
- **Outros**: UploadThing, React Query, React Hook Form

## 📝 Convenções Gerais

### Nomenclatura
- **Arquivos**: `kebab-case` (ex: `user-profile.tsx`)
- **Componentes**: `PascalCase` (ex: `UserProfile`)
- **Funções/Hooks**: `camelCase` (ex: `useUserProfile`)
- **Constantes**: `SCREAMING_SNAKE_CASE`

### Imports
- Sempre use aliases `@/` para imports internos
- Agrupe imports por categoria
- Ordene alfabeticamente dentro de cada grupo

### Commits
- Use conventional commits
- Mantenha mensagens descritivas em português
- Referencie issues quando aplicável

## 🤝 Contribuição

Para adicionar novas regras:

1. Crie um arquivo `.mdc` numerado sequencialmente
2. Use frontmatter YAML para metadados
3. Siga o formato estabelecido pelas regras existentes
4. Atualize este README com a nova regra

## 📚 Recursos Adicionais

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação tRPC](https://trpc.io/docs)
- [Documentação Prisma](https://www.prisma.io/docs)
- [Guia shadcn/ui](https://ui.shadcn.com)
- [Conventional Commits](https://conventionalcommits.org)

---

**Nota**: Estas regras são específicas para o projeto ELO e podem ser adaptadas conforme as necessidades do time.
