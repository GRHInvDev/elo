# Script de Atualização de Status de Colaboradores

Este script atualiza a tabela `new_collaborators` marcando todos os usuários existentes como **não novos** (`isNew = false`), pois eles já são colaboradores antigos do sistema e não devem ver o card de boas-vindas.

## Pré-requisitos

- Node.js instalado
- Banco de dados configurado e acessível
- Variável de ambiente `DATABASE_URL` configurada
- Prisma Client gerado (`npx prisma generate`)

## Executando o Script

### Opção 1: Usando tsx (recomendado)

```bash
pnpm tsx scripts/populate-new-collaborators.ts
```

ou

```bash
npx tsx scripts/populate-new-collaborators.ts
```

### Opção 2: Usando ts-node

```bash
npx ts-node scripts/populate-new-collaborators.ts
```

## O que o script faz?

1. **Busca todos os usuários** do sistema
2. **Verifica se já existe** registro na tabela `new_collaborators`
3. **Cria registro** com `isNew = false` para usuários que não possuem
4. **Atualiza para `isNew = false`** usuários que estavam marcados como novos
5. **Mantém como está** usuários que já estavam marcados como não novos
6. **Exibe relatório** detalhado com quantidade criada, atualizada e ignorada

## Exemplo de Saída

```
🔄 Iniciando atualização de status de colaboradores...
📊 Encontrados 150 usuários no sistema
✅ Criado (não novo): João Silva (joao@example.com)
🔄 Atualizado (não novo): Maria Santos (maria@example.com)
⏭️  Já marcado como não novo: Pedro Oliveira (pedro@example.com)
...

✨ Processo concluído!
📈 Resumo:
   - Criados: 145
   - Atualizados: 3
   - Já estavam corretos: 2
   - Total processado: 150
🎉 Script executado com sucesso!
📝 Todos os colaboradores existentes foram marcados como não novos.
🆕 Apenas novos usuários que acessarem pela primeira vez verão o card de boas-vindas.
```

## Quando executar?

Execute este script:

- **Após criar a migration** do novo model `NewCollaborator`
- **Após fazer o deploy** da nova funcionalidade
- Quando quiser **marcar todos os usuários existentes** como não novos
- Para **garantir que colaboradores antigos** não vejam o card de boas-vindas

## Observações

- O script é **idempotente**: pode ser executado múltiplas vezes sem problemas
- Usuários que já estão marcados como **não novos** não serão modificados
- Usuários marcados como **novos** serão **atualizados** para não novos
- O script **cria registros** para usuários que ainda não possuem registro

## Comportamento Após Executar

Após executar o script:

1. **Todos os usuários existentes** estarão marcados como `isNew = false`
2. **Não verão o card** de boas-vindas ao acessar a Intranet
3. **Novos usuários** que acessarem pela primeira vez terão registro criado automaticamente com `isNew = true`
4. **Apenas novos usuários** verão o card de boas-vindas ao acessar pela primeira vez
5. Ao **fechar o card**, o status será atualizado para `isNew = false`
