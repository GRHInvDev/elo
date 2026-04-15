import "server-only"

import { generateObject } from "ai"
import { z } from "zod"

import { getAssistantChatModel, getAssistantModelUnavailableReason } from "@/server/ai/azure-assistant-model"

const scoreField = z
  .number()
  .int()
  .min(0)
  .max(10)
  .describe("Nota inteira de 0 a 10, como nos selects da tela de avaliação")

const textField = z
  .string()
  .max(2000)
  .describe("Texto livre de justificativa para o campo, alinhado ao estilo do avaliador")

export const suggestionClassificationAiSchema = z.object({
  impactText: textField,
  impactScore: scoreField,
  capacityText: textField,
  capacityScore: scoreField,
  effortText: textField,
  effortScore: scoreField,
})

export type SuggestionClassificationAiResult = z.infer<typeof suggestionClassificationAiSchema>

export type ClassificationSuggestError = "model_unavailable"

type ScoreJson = { text?: string; label?: string; score?: unknown }

function truncate(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function parseScoreJson(j: unknown): { text: string; score: number } | null {
  if (!j || typeof j !== "object") return null
  const o = j as ScoreJson
  if (typeof o.score !== "number" || o.score < 0 || o.score > 10) return null
  const text = (o.text ?? o.label ?? "").toString()
  return { text, score: Math.round(o.score) }
}

export function rowHasFullClassification(row: {
  impact: unknown
  capacity: unknown
  effort: unknown
}): boolean {
  return (
    parseScoreJson(row.impact) !== null &&
    parseScoreJson(row.capacity) !== null &&
    parseScoreJson(row.effort) !== null
  )
}

export function formatClassificationPoolsForPrompt(
  impact: { label: string; score: number }[],
  capacity: { label: string; score: number }[],
  effort: { label: string; score: number }[]
): string {
  const lines = (title: string, rows: { label: string; score: number }[]) =>
    `${title}:\n${rows.map((r) => `  • Nota ${r.score}: ${r.label}`).join("\n")}`
  return [
    lines("IMPACTO (potencial no negócio)", impact),
    lines("CAPACIDADE (recursos e know-how)", capacity),
    lines("ESFORÇO (tempo, custo, dificuldade)", effort),
  ].join("\n\n")
}

export function formatRecentEvaluationsForPrompt(
  rows: Array<{
    ideaNumber: number
    problem: string | null
    description: string
    impact: unknown
    capacity: unknown
    effort: unknown
    finalScore: number | null
  }>
): string {
  if (rows.length === 0) {
    return "(Sem avaliações anteriores com pontuação completa atribuídas a este avaliador no recorte consultado.)"
  }
  return rows
    .map((r, idx) => {
      const imp = parseScoreJson(r.impact)
      const cap = parseScoreJson(r.capacity)
      const eff = parseScoreJson(r.effort)
      if (!imp || !cap || !eff) return ""
      return [
        `--- Exemplo ${idx + 1}: ideia #${r.ideaNumber}, total ${r.finalScore ?? "n/d"} ---`,
        `Problema (trecho): ${truncate(r.problem ?? "", 220)}`,
        `Solução (trecho): ${truncate(r.description, 220)}`,
        `Impacto ${imp.score}: ${truncate(imp.text, 450)}`,
        `Capacidade ${cap.score}: ${truncate(cap.text, 450)}`,
        `Esforço ${eff.score}: ${truncate(eff.text, 450)}`,
      ].join("\n")
    })
    .filter(Boolean)
    .join("\n\n")
}

const SYSTEM = `Você apoia gestores a preencher a avaliação de ideias internas (Impacto, Capacidade, Esforço).

Regras:
- Cada dimensão tem nota inteira de 0 a 10 (igual aos selects da interface).
- Fórmula exibida ao gestor: pontuação total = Impacto + Capacidade - Esforço. Esforço alto reduz o total.
- impactText, capacityText e effortText: parágrafos em português brasileiro, profissional e direto. Sem Markdown (sem **, #, listas numeradas).
- Use o histórico de avaliações recentes DO MESMO AVALIADOR para imitar tom, extensão típica e como ele calibra notas (quando o histórico existir).
- Use os rótulos cadastrados no sistema só como referência de vocabulário e escala; não é obrigatório copiar um rótulo literalmente.
- Baseie-se no conteúdo da ideia. Não invente dados, números ou fatos não mencionados.
- Se o gestor já escreveu rascunhos ou notas nos campos, trate-os como ponto de partida: refine e alinhe, não ignore completamente sem motivo.
- Seja conservador: notas extremas (0 ou 10) exigem justificativa clara no texto.`

export async function runSuggestSuggestionClassifications(input: {
  ideaNumber: number
  problem: string | null
  description: string
  contributionSummary: string
  morrisonNote: string | null
  evaluatorDisplayName: string
  draft: {
    impact?: { text: string; score: number }
    capacity?: { text: string; score: number }
    effort?: { text: string; score: number }
  }
  recentEvaluationsBlock: string
  poolsBlock: string
}): Promise<{ result: SuggestionClassificationAiResult } | { error: ClassificationSuggestError }> {
  const model = getAssistantChatModel()
  if (!model) {
    console.error("[classification-suggest] modelo indisponível", {
      reason: getAssistantModelUnavailableReason() ?? "unknown",
    })
    return { error: "model_unavailable" }
  }

  const draftLines: string[] = []
  if (input.draft.impact) {
    draftLines.push(
      `Impacto (rascunho do gestor): nota ${input.draft.impact.score}. Texto: """${truncate(input.draft.impact.text, 1200)}"""`
    )
  }
  if (input.draft.capacity) {
    draftLines.push(
      `Capacidade (rascunho do gestor): nota ${input.draft.capacity.score}. Texto: """${truncate(input.draft.capacity.text, 1200)}"""`
    )
  }
  if (input.draft.effort) {
    draftLines.push(
      `Esforço (rascunho do gestor): nota ${input.draft.effort.score}. Texto: """${truncate(input.draft.effort.text, 1200)}"""`
    )
  }
  const draftBlock =
    draftLines.length > 0
      ? `Rascunho atual do gestor neste formulário (use como base):\n${draftLines.join("\n")}\n`
      : "O gestor ainda não preencheu rascunhos neste formulário.\n"

  const morrisonBlock = input.morrisonNote?.trim()
    ? `\nNota auxiliar do avaliador IA (Morrison), se útil — não contradiz o gestor, só contexto:\n"""${truncate(input.morrisonNote, 1500)}"""\n`
    : ""

  const userPrompt = `Avaliador: ${input.evaluatorDisplayName}

Ideia #${input.ideaNumber}
Tipo de contribuição: ${input.contributionSummary}
Problema identificado:
"""${truncate(input.problem ?? "", 3500)}"""
Solução proposta:
"""${truncate(input.description, 3500)}"""
${morrisonBlock}
${draftBlock}
Referência de rótulos cadastrados no sistema (por tipo e pontuação):
${input.poolsBlock}

Histórico resumido de avaliações recentes deste mesmo avaliador (padrão de escrita e notas). Se vazio, ignore esta seção:
${input.recentEvaluationsBlock}

Tarefa: preencha impactText, impactScore, capacityText, capacityScore, effortText, effortScore para esta ideia, alinhando-se ao estilo do avaliador quando houver histórico.`

  try {
    const { object } = await generateObject({
      model,
      mode: "auto",
      // AI SDK costuma usar 0 em generateObject; deployments Azure exigem explicitamente 1.
      temperature: 1,
      schema: suggestionClassificationAiSchema,
      schemaName: "SuggestionClassification",
      schemaDescription: "Classificações de impacto, capacidade e esforço com notas 0-10 e textos justificativos",
      system: SYSTEM,
      prompt: userPrompt,
      providerOptions: {
        openai: {
          maxCompletionTokens: 2500,
        },
      },
    })

    return { result: object }
  } catch (e) {
    console.error("[classification-suggest] generateObject falhou", {
      message: e instanceof Error ? e.message : String(e),
    })
    return { error: "model_unavailable" }
  }
}
