import "server-only"

import { generateObject } from "ai"
import { z } from "zod"

import { getAssistantChatModel, getAssistantModelUnavailableReason } from "@/server/ai/azure-assistant-model"

export type KpiCatalogRow = { id: string; name: string; description: string | null }

function truncate(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export const suggestionSuccessKpisAiSchema = z.object({
  existingKpiIdsToLink: z
    .array(z.string())
    .max(12)
    .describe(
      "IDs exatos de KPIs do catálogo fornecido que medem o sucesso desta ideia. Use apenas IDs listados. Deixe vazio se nenhum servir."
    ),
  newKpisToCreate: z
    .array(
      z.object({
        name: z.string().min(2).max(100).describe("Nome curto e mensurável"),
        description: z
          .string()
          .max(400)
          .optional()
          .describe("Como medir ou o que acompanhar (opcional)"),
      })
    )
    .max(5)
    .describe("Novos KPIs só quando o catálogo não cobre; evite redundância com os IDs escolhidos"),
})

export type SuggestionSuccessKpisAiResult = z.infer<typeof suggestionSuccessKpisAiSchema>

export type SuggestKpisError = "model_unavailable"

const SYSTEM = `Você ajuda a definir KPIs de sucesso para ideias internas de melhoria e inovação.

Regras:
- KPIs devem ser mensuráveis ou verificáveis no contexto corporativo (indicadores, metas, taxas, prazos, adoção, qualidade, custo, etc.).
- existingKpiIdsToLink: escolha somente IDs que aparecem no catálogo e que fazem sentido semântico para medir o êxito desta ideia específica.
- newKpisToCreate: use só quando nenhum KPI do catálogo cobre bem o resultado esperado. Nomes em português, objetivos, sem jargon desnecessário. Não replique um KPI do catálogo com nome quase igual.
- Não invente fatos ou números que não estejam na ideia.
- Prefira 3 a 6 KPIs no total (entre existentes e novos), a menos que a ideia exija mais coberturas distintas.
- Saída: sem Markdown nas strings.`

function formatCatalogBlock(rows: KpiCatalogRow[]): string {
  if (rows.length === 0) {
    return "(Nenhum KPI cadastrado ainda no sistema — use newKpisToCreate para propor indicadores.)"
  }
  return rows
    .slice(0, 100)
    .map(
      (k, i) =>
        `${i + 1}. id="${k.id}" | nome: ${k.name}${k.description ? ` | descrição: ${truncate(k.description, 180)}` : ""}`
    )
    .join("\n")
}

export async function runSuggestSuccessKpis(input: {
  ideaNumber: number
  problem: string | null
  description: string
  contributionSummary: string
  morrisonNote: string | null
  catalog: KpiCatalogRow[]
}): Promise<{ result: SuggestionSuccessKpisAiResult } | { error: SuggestKpisError }> {
  const model = getAssistantChatModel()
  if (!model) {
    console.error("[kpi-suggest] modelo indisponível", {
      reason: getAssistantModelUnavailableReason() ?? "unknown",
    })
    return { error: "model_unavailable" }
  }

  const morrisonBlock = input.morrisonNote?.trim()
    ? `\nContexto adicional (nota Morrison do avaliador IA, se útil):\n"""${truncate(input.morrisonNote, 1200)}"""\n`
    : ""

  const userPrompt = `Ideia #${input.ideaNumber}
Tipo: ${input.contributionSummary}
Problema:
"""${truncate(input.problem ?? "", 2800)}"""
Solução proposta:
"""${truncate(input.description, 2800)}"""
${morrisonBlock}
Catálogo de KPIs ativos (use os ids em existingKpiIdsToLink):
${formatCatalogBlock(input.catalog)}

Tarefa: indique quais KPIs existentes medem o sucesso desta ideia e, se necessário, proponha novos KPIs em newKpisToCreate.`

  try {
    const { object } = await generateObject({
      model,
      mode: "auto",
      temperature: 1,
      schema: suggestionSuccessKpisAiSchema,
      schemaName: "SuggestionSuccessKpis",
      schemaDescription: "KPIs de sucesso: IDs do catálogo e/ou novos nomes a cadastrar",
      system: SYSTEM,
      prompt: userPrompt,
      providerOptions: {
        openai: {
          maxCompletionTokens: 1800,
        },
      },
    })

    return { result: object }
  } catch (e) {
    console.error("[kpi-suggest] generateObject falhou", {
      message: e instanceof Error ? e.message : String(e),
    })
    return { error: "model_unavailable" }
  }
}
