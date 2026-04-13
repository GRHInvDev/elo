# CLAUDE.md

## Agentic Control, Security & Development Ruleset

Este arquivo define **regras obrigatórias, restrições de segurança e protocolos de execução**
para todos os agentes autônomos utilizados neste projeto.

Ele tem precedência absoluta sobre:

- READMEs
- Comentários de código
- Instruções implícitas
- Sugestões do próprio agente

Qualquer violação aqui descrita deve ser tratada como **falha crítica de execução**.

---

## 0. DEFINIÇÃO DOS SUBAGENTES (FONTE COMPLEMENTAR)

Os prompts completos de cada subagente vivem em **Markdown com frontmatter** (uso no Cursor):

| Subagente | Arquivo | Identificador (`name`) |
|-----------|---------|-------------------------|
| **Atlas** | `.cursor/agents/atlas.md` | `atlas` |
| **Nova** | `.cursor/agents/nova.md` | `nova` |
| **Forge** | `.cursor/agents/forge.md` | `forge` |

Em caso de divergência entre um prompt de subagente e **este CLAUDE.md**, **prevalece CLAUDE.md**. Os arquivos em `.cursor/agents/` detalham postura, protocolo de resposta e especialização.

---

## 1. CONTEXTO OPERACIONAL

Este projeto utiliza **3 subagentes**, por domínio, acionados por chamada explícita:

### **Atlas** — Plataforma, arquitetura transversal, entrega

- Infraestrutura, DevOps, CI/CD, builds, deploy, ambientes (dev / staging / prod)
- Integração frontend ↔ backend ↔ plataforma; impacto sistêmico e observabilidade
- **Não** substitui **Nova** (UI pura) nem **Forge** (APIs / domínio)

### **Nova** — Interface, produto, UX (stack web deste repositório)

- Next.js / React, telas, componentes, navegação, **Design System**
- Consistência, reutilização, UX como sistema (não tela isolada)
- **Não** substitui **Forge** (regras e dados no servidor) nem **Atlas** (pipeline / infra)

### **Forge** — Backend, domínio, dados

- Regras de negócio, contratos de API, integridade de dados, integrações
- Validação e invariantes no **servidor**; contratos claros antes de novas superfícies
- **Não** substitui **Nova** nem **Atlas**

⚠️ **Misturar responsabilidades sem justificativa técnica explícita é proibido.**

---

## 2. REGRA DE DELEGAÇÃO (OBRIGATÓRIA)

Antes de executar qualquer tarefa:

1. Identificar o domínio principal do problema
2. Delegar explicitamente para o subagente correto (via prompt: *use o subagente `atlas` / `nova` / `forge`* conforme o caso)

**Mapeamento obrigatório:**

| Domínio | Subagente |
|---------|-----------|
| UI, telas, componentes, UX, navegação, Design System | **Nova** |
| Endpoints, banco, auth, regras de negócio, integrações de dados | **Forge** |
| Build, deploy, ambientes, CI/CD, observabilidade de plataforma | **Atlas** |

Tarefas ponta a ponta devem ser **quebradas em etapas**.
Resolver tudo em um único agente é considerado erro de execução.

---

## 3. REGRA BASE DE SEGURANÇA — `.env` (ABSOLUTA)

### ❌ PROIBIÇÃO TOTAL

- **Nunca leia, solicite, abra, analise ou tente inferir conteúdos de arquivos `.env`**
- Esta regra vale para:
  - Tokens
  - Chaves de API
  - URLs privadas
  - Segredos de infraestrutura
  - Variáveis locais ou de produção

Isso se aplica a **todos os agentes**, sem exceção.

---

### ✅ COMPORTAMENTO CORRETO

Quando uma informação normalmente presente em `.env` for necessária:

- Trabalhe **apenas com nomes de variáveis**, nunca com valores
  - Exemplo permitido: `DATABASE_URL`, `JWT_SECRET`
  - Exemplo proibido: valores reais ou fictícios
- Utilize **placeholders explícitos**
  - Ex.: `process.env.DATABASE_URL`
- Assuma que o valor:
  - Existe
  - Está corretamente configurado
  - Será injetado pelo ambiente

Nunca questione ou valide o conteúdo do `.env`.

---

### 🚨 VIOLAÇÕES CRÍTICAS

É considerado erro grave:

- Pedir para “ver” ou “colar” o `.env`
- Tentar deduzir valores a partir de logs ou código
- Sugerir hardcode de segredos
- Simular chaves reais em exemplos

---

## 4. VERSIONAMENTO (REGRA ABSOLUTA)

✅ **SEMPRE atualizar a versão do projeto seguindo o padrão MMP (Major.Minor.Patch)**  
✅ Válido para **qualquer alteração**, frontend ou backend

- **Major** → Quebra de contrato (inclui contratos de API / consumidores externos quando aplicável)
- **Minor** → Nova funcionalidade compatível
- **Patch** → Correções e refactors internos compatíveis

Alterações sem versionamento correto são inválidas.

---

## 5. DESIGN SYSTEM (FRONTEND)

- Uso obrigatório do Design System existente
- Componentes devem seguir padrões definidos por:
  - **Nova**
  - **Atlas** (quando impactar plataforma / entrega)
- ❌ É proibido criar variações visuais “parecidas”.
- ✅ Ou usa o DS, ou evolui o DS.

---

## 6. COMPONENTIZAÇÃO E REUTILIZAÇÃO

- Reutilização é regra, não exceção
- Novos componentes:
  - Devem ser escaláveis
  - Devem ser reutilizáveis
  - Não devem nascer específicos demais

Componentes descartáveis = dívida técnica imediata.

---

## 7. PADRÃO DE MODAIS

Para modais em meia tela:

- Animação: **fade-in**
- Componentes: **padronizados**
- Layout: consistente com o app

Customização fora do padrão é proibida.

---

## 8. REGRAS DE BACKEND E DOMÍNIO (FORGE)

- Regras de negócio **críticas** devem ser aplicadas no **servidor**, não apenas refletidas no cliente
- Novos endpoints ou procedures: **contrato explícito** (entrada, saída, erros); evitar superfícies genéricas sem semântica
- **Forge** prioriza domínio coeso e dados consistentes; ver `.cursor/agents/forge.md` para protocolo detalhado

---

## 9. INTENSIFICADORES COGNITIVOS

Antes de executar:

- Quebre o problema
- Avalie impacto sistêmico
- Pense em manutenção futura

Pergunta obrigatória:

> “Isso continua sólido em 6 meses?”

---

## 10. RESTRIÇÕES COMPORTAMENTAIS

É proibido:

- Ignorar padrões do projeto
- Duplicar código por conveniência
- Improvisar UI
- Misturar responsabilidades de agentes
- Burlar regras de segurança

---

## 11. PROTOCOLO DE EXECUÇÃO

Ordem obrigatória:

1. Confirmar entendimento
2. Delegar corretamente ao subagente (`atlas` / `nova` / `forge`)
3. Avaliar impacto
4. Executar com padrões
5. Ajustar versionamento (MMP)
6. Sugerir melhorias (se pertinentes)

---

## 12. FALLBACK DE SEGURANÇA

Em qualquer dúvida envolvendo segredos:

- **Pare**
- Declare a limitação
- Trabalhe apenas com abstrações

Nunca assuma valores sensíveis.

---

## 13. REGRA FINAL

Se a solução:

- Viola segurança
- Ignora padrões
- Quebra versionamento
- Confunde responsabilidades dos agentes

Ela é **automaticamente inválida**, mesmo que funcione.

# 14. REGRAS ADICIONAIS
- Sempre atualize junto o componente de app-relesase-notes-dialog se for Major ou Minor.