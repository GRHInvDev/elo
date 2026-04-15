import { api } from "@/trpc/server"
import { TRPCError } from "@trpc/server"
import type { Tool } from "ai"
import { z } from "zod"

const STATUS_LABEL: Record<string, string> = {
  NEW: "Ainda não avaliado",
  IN_REVIEW: "Em avaliação",
  APPROVED: "Em orçamento",
  IN_PROGRESS: "Em execução",
  DONE: "Concluído",
  NOT_IMPLEMENTED: "Não implementado",
}

const CONTRIBUTION_TYPE_LABEL: Record<string, string> = {
  IDEIA_INOVADORA: "Ideia inovadora",
  SUGESTAO_MELHORIA: "Sugestão de melhoria",
  SOLUCAO_PROBLEMA: "Solução de problema",
  OUTRO: "Outro",
}

function truncate(text: string | null | undefined, max: number): string | null {
  if (text == null || text === "") return null
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

/** Evita enviar string vazia ao tRPC; compatível com prefer-nullish-coalescing (não usar `|| undefined` após trim). */
function trimmedOrUndefined(value: string | undefined): string | undefined {
  const t = value?.trim()
  return t === undefined || t === "" ? undefined : t
}

function formatContribution(contribution: unknown): string {
  const c = contribution as { type?: string; other?: string } | null
  if (!c?.type) return "Não informado"
  const base = CONTRIBUTION_TYPE_LABEL[c.type] ?? c.type
  if (c.type === "OUTRO" && c.other?.trim()) {
    return `${base}: ${c.other.trim()}`
  }
  return base
}

function formatAnalyst(first: string | null | undefined, last: string | null | undefined): string | null {
  const n = `${first ?? ""} ${last ?? ""}`.trim()
  return n || null
}

const contributionTypeSchema = z.enum([
  "IDEIA_INOVADORA",
  "SUGESTAO_MELHORIA",
  "SOLUCAO_PROBLEMA",
  "OUTRO",
])

export const listMyIdeas: Tool = {
  description: `
Lista as **ideias em ação** enviadas pelo próprio usuário (autor), com número, status e resumos de texto.

**Quando usar:**
- "Quais são minhas ideias?", "Como está minha ideia?", "O que eu já enviei?", "Status da ideia 105".
- Primeiro passo antes de pedir detalhes de uma ideia específica — use **getMyIdeaByNumber** com o número (#) se o usuário quiser ver tudo.

**Parâmetros:**
- limit (opcional): quantidade máxima a retornar (padrão 30, máximo 50), da mais recente para a mais antiga.

**O que retorna:**
- Lista com **numero** (número visível da ideia, ex.: 105), **status** (legível em português), resumos de problema e solução, tipo de contribuição, data de criação (ISO).
- Não inclui IDs internos do banco — use sempre o **numero** com o usuário.

**O que NÃO fazer:**
- Não use para ver ideias de outras pessoas (só as do usuário logado).
- Não invente status — sempre obtenha com esta ferramenta ou **getMyIdeaByNumber**.

**Problemas comuns:**
- Se a lista vier vazia, o usuário ainda não enviou ideias pela intranet — oriente a página "Minhas Ideias" ou o fluxo de nova ideia.
`,
  parameters: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Máximo de ideias a retornar (padrão 30)."),
  }),
  execute: async ({ limit }: { limit?: number }) => {
    try {
      const take = Math.min(limit ?? 30, 50)
      const rows = await api.suggestion.getMySuggestions()
      const slice = rows.slice(0, take)
      return {
        totalNoPerfil: rows.length,
        retornando: slice.length,
        ideias: slice.map((s) => ({
          numero: s.ideaNumber,
          status: STATUS_LABEL[s.status] ?? s.status,
          tipoContribuicao: formatContribution(s.contribution),
          problemaResumo: truncate(s.problem, 160),
          solucaoResumo: truncate(s.description, 160),
          criadaEm: s.createdAt.toISOString(),
        })),
      }
    } catch (e) {
      return `Erro ao listar ideias: ${e instanceof Error ? e.message : String(e)}`
    }
  },
}

export const getMyIdeaByNumber: Tool = {
  description: `
Busca **uma ideia sua** pelo **número visível** (#) — problema, solução, status, tipo de contribuição e campos relevantes de acompanhamento.

**Quando usar:**
- Usuário cita um número ("ideia 120", "#105") ou quer detalhes após **listMyIdeas**.
- Para explicar motivo de "Não implementado", nota final, pagamento (se houver), etc.

**Parâmetros:**
- ideaNumber: número inteiro da ideia (o mesmo exibido na intranet, ex.: 105).

**O que retorna:**
- Detalhes em português claro; **numero** para referência; sem IDs internos.

**O que NÃO fazer:**
- Não chute o número — confirme com **listMyIdeas** ou com o usuário.

**Problemas comuns:**
- Se não encontrar, o número pode ser de outra pessoa ou não existir — sugira listar "minhas ideias".
`,
  parameters: z.object({
    ideaNumber: z
      .number()
      .int()
      .positive()
      .describe("Número da ideia (#) como na intranet."),
  }),
  execute: async ({ ideaNumber }: { ideaNumber: number }) => {
    try {
      const rows = await api.suggestion.getMySuggestions()
      const s = rows.find((r) => r.ideaNumber === ideaNumber)
      if (!s) {
        return {
          encontrada: false,
          mensagem: `Não há ideia número ${ideaNumber} entre as suas ideias enviadas.`,
        }
      }

      const payment = s.payment as Record<string, unknown> | null | undefined
      let pagamentoResumo: string | null = null
      if (payment && typeof payment === "object") {
        const status = payment.status
        const amount = payment.amount
        if (typeof status === "string") {
          pagamentoResumo =
            typeof amount === "number"
              ? `Status: ${status}; valor registrado: R$ ${amount.toFixed(2)}`
              : `Status: ${status}`
        }
      }

      let classificacaoResumo: string | null = null
      if (s.finalClassification != null) {
        try {
          const raw = JSON.stringify(s.finalClassification)
          classificacaoResumo = raw.length > 400 ? `${raw.slice(0, 399)}…` : raw
        } catch {
          classificacaoResumo = null
        }
      }

      return {
        encontrada: true,
        numero: s.ideaNumber,
        status: STATUS_LABEL[s.status] ?? s.status,
        tipoContribuicao: formatContribution(s.contribution),
        problema: s.problem ?? null,
        solucaoProposta: s.description,
        criadaEm: s.createdAt.toISOString(),
        nomeInformado: s.submittedName ?? null,
        setorInformado: s.submittedSector ?? null,
        avaliador: formatAnalyst(s.analyst?.firstName, s.analyst?.lastName),
        notaFinal: s.finalScore ?? null,
        classificacaoResumo,
        motivoNaoImplementado:
          s.status === "NOT_IMPLEMENTED" && s.rejectionReason?.trim()
            ? s.rejectionReason.trim()
            : null,
        pagamentoResumo,
      }
    } catch (e) {
      return `Erro ao buscar ideia: ${e instanceof Error ? e.message : String(e)}`
    }
  },
}

export const createMyIdea: Tool = {
  description: `
**Registra uma nova ideia em ação** em nome do usuário logado (campos do formulário da intranet).

**Quando usar:**
- Usuário quer **enviar**, **cadastrar** ou **criar** uma nova ideia pelo assistente, com problema e solução.

**Fluxo obrigatório antes de chamar:**
1. Colete **solução proposta** (obrigatória) e, se possível, **problema identificado** (recomendado).
2. Colete o **tipo de contribuição** (ideia inovadora, sugestão de melhoria, solução de problema, ou outro — se for outro, peça o texto em contributionOther).
3. Opcional: nome e setor para exibição (submittedName, submittedSector).
4. **Confirme o resumo** com o usuário: problema, solução, tipo — e só então execute.

**Parâmetros:**
- description: texto da **solução proposta** (obrigatório).
- problem: **problema identificado** (opcional mas recomendado).
- contributionType: um dos valores do enum.
- contributionOther: obrigatório se contributionType for OUTRO.
- submittedName / submittedSector: opcionais.

**O que retorna:**
- numero: número da ideia criada (para acompanhamento na página Minhas Ideias).
- mensagem de confirmação.

**O que NÃO fazer:**
- Não registre sem confirmação explícita do usuário.
- Não use para ideias de terceiros.

**Problemas comuns:**
- Usuários **Totem** não podem enviar — a ferramenta retornará mensagem clara; oriente a usar outro perfil ou o totem físico conforme política da empresa.
`,
  parameters: z.object({
    description: z
      .string()
      .min(1)
      .max(20000)
      .describe("Solução proposta (campo obrigatório do formulário)."),
    problem: z
      .string()
      .max(20000)
      .optional()
      .describe("Problema identificado (recomendado)."),
    contributionType: contributionTypeSchema.describe(
      "Tipo de contribuição, alinhado ao formulário da intranet.",
    ),
    contributionOther: z
      .string()
      .max(2000)
      .optional()
      .describe('Detalhe quando o tipo for OUTRO (ex.: "processo de compras").'),
    submittedName: z.string().max(200).optional().describe("Nome para exibição (opcional)."),
    submittedSector: z.string().max(200).optional().describe("Setor para exibição (opcional)."),
  }),
  execute: async (input: {
    description: string
    problem?: string
    contributionType: z.infer<typeof contributionTypeSchema>
    contributionOther?: string
    submittedName?: string
    submittedSector?: string
  }) => {
    if (input.contributionType === "OUTRO") {
      const o = input.contributionOther?.trim()
      if (!o) {
        return "Para o tipo OUTRO é necessário informar contributionOther (em que sentido é 'outro')."
      }
    }

    try {
      const otherDetail =
        input.contributionType === "OUTRO"
          ? (input.contributionOther ?? "").trim()
          : trimmedOrUndefined(input.contributionOther)

      const created = await api.suggestion.create({
        description: input.description.trim(),
        problem: trimmedOrUndefined(input.problem),
        contribution: {
          type: input.contributionType,
          other: otherDetail,
        },
        submittedName: trimmedOrUndefined(input.submittedName),
        submittedSector: trimmedOrUndefined(input.submittedSector),
      })

      return {
        ok: true,
        numero: created.ideaNumber,
        mensagem: `Ideia registrada com sucesso. Número para acompanhamento: **${created.ideaNumber}** (Minhas Ideias na intranet).`,
      }
    } catch (e) {
      if (e instanceof TRPCError) {
        if (e.code === "FORBIDDEN") {
          return e.message
        }
        return e.message
      }
      return `Não foi possível registrar a ideia. ${e instanceof Error ? e.message : String(e)}`
    }
  },
}
