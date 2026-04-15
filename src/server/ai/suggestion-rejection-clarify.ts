import "server-only"

import { generateObject } from "ai"
import { z } from "zod"

import { getAssistantChatModel, getAssistantModelUnavailableReason } from "@/server/ai/azure-assistant-model"

const clarifiedSchema = z.object({
  clarifiedReason: z
    .string()
    .max(3500)
    .describe("Texto para o colaborador explicando por que a ideia não será implantada"),
})

function truncate(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

const SYSTEM = `Você ajuda gestores a redigir o motivo da não implementação de uma ideia interna.

Regras:
- Português brasileiro, tom profissional, respeitoso e claro para o autor da ideia.
- Baseie-se apenas no contexto fornecido; não invente fatos, políticas internas ou números.
- Texto compreensível, sem jargão desnecessário.
- Não use Markdown (sem **, #, listas com marcadores). Use parágrafos ou frases curtas.
- Incorpore e refine a justificativa do gestor quando fizer sentido.
- Se houver instruções adicionais do gestor, priorize-as desde que coerentes com o contexto.`

export type RejectionClarifyError = "model_unavailable"

export async function runClarifyRejectionReason(input: {
  ideaNumber: number
  contextBlock: string
  managerDraftReason: string
  userRefinementPrompt: string | null
}): Promise<{ result: z.infer<typeof clarifiedSchema> } | { error: RejectionClarifyError }> {
  const model = getAssistantChatModel()
  if (!model) {
    console.error("[rejection-clarify] modelo indisponível", {
      reason: getAssistantModelUnavailableReason() ?? "unknown",
    })
    return { error: "model_unavailable" }
  }

  const refinement = input.userRefinementPrompt?.trim()
    ? `\nInstruções adicionais do gestor para esta versão (obedeça quando compatível com o contexto):\n"""${truncate(input.userRefinementPrompt.trim(), 1500)}"""\n`
    : ""

  const draft =
    input.managerDraftReason.trim().length > 0
      ? truncate(input.managerDraftReason, 2000)
      : "(O gestor ainda não escreveu um rascunho — gere um texto fundamentado só no contexto.)"

  const userPrompt = `Ideia #${input.ideaNumber}

Contexto da avaliação (problema, solução, classificações, notas auxiliares — use para fundamentar a comunicação ao colaborador):
${input.contextBlock}

Justificativa / rascunho atual do gestor (ponto de partida):
"""${draft}"""
${refinement}
Tarefa: produza clarifiedReason com o texto que o colaborador deve receber como motivo da não implementação.`

  try {
    const { object } = await generateObject({
      model,
      mode: "auto",
      temperature: 1,
      schema: clarifiedSchema,
      schemaName: "RejectionReasonClarification",
      schemaDescription: "Motivo claro da não implementação para o autor da ideia",
      system: SYSTEM,
      prompt: userPrompt,
      providerOptions: {
        openai: {
          maxCompletionTokens: 2000,
        },
      },
    })

    return { result: object }
  } catch (e) {
    console.error("[rejection-clarify] generateObject falhou", {
      message: e instanceof Error ? e.message : String(e),
    })
    return { error: "model_unavailable" }
  }
}
