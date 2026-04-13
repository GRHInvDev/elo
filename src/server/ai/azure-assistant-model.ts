import "server-only"

import { createAzure } from "@ai-sdk/azure"
import type { LanguageModelV1 } from "ai"

/**
 * Converte host ou URL parcial no prefixo esperado pelo `@ai-sdk/azure` v1:
 * `{baseURL}/{deploymentId}/chat/completions?...` → baseURL = `.../openai/deployments`
 */
function toAzureDeploymentsBaseURL(raw: string): string {
  const u = raw.replace(/\/$/, "")
  if (u.endsWith("/openai/deployments")) {
    return u
  }
  if (u.endsWith("/openai")) {
    return `${u}/deployments`
  }
  return `${u}/openai/deployments`
}

/**
 * Modelo de chat (Azure OpenAI deployment) para o assistente da intranet.
 * Usa `@ai-sdk/azure` **v1** (LanguageModelV1), compatível com **AI SDK 4** (`streamText` + tools).
 *
 * Variáveis esperadas (produção):
 * - `AZURE_OPENAI_API_KEY`
 * - `AZURE_OPENAI_ENDPOINT` (ex.: `https://{recurso}.openai.azure.com`)
 * - `AZURE_COGNITIVE_ENDPOINT` (fallback se `AZURE_OPENAI_ENDPOINT` não estiver definido)
 * - `AZURE_OPENAI_DEPLOYMENT_NAME`
 * - `AZURE_OPENAI_API_VERSION` (opcional; se omitido, o SDK Azure usa o default dele)
 *
 * Opcional: `AZURE_OPENAI_BASE_URL` — prefixo até `.../openai/deployments` (ou host; será normalizado).
 * Opcional: `AZURE_RESOURCE_NAME` / `AZURE_OPENAI_RESOURCE_NAME` se não houver endpoint.
 */
export function getAssistantChatModel(): LanguageModelV1 | null {
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim()
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME?.trim()

  if (!apiKey || !deployment) {
    return null
  }

  const explicitBase = process.env.AZURE_OPENAI_BASE_URL?.trim()
  const endpoint =
    process.env.AZURE_OPENAI_ENDPOINT?.trim() ?? process.env.AZURE_COGNITIVE_ENDPOINT?.trim()
  const resourceName =
    process.env.AZURE_RESOURCE_NAME?.trim() ?? process.env.AZURE_OPENAI_RESOURCE_NAME?.trim()

  let baseURL: string | undefined
  if (explicitBase) {
    baseURL = toAzureDeploymentsBaseURL(explicitBase)
  } else if (endpoint) {
    baseURL = toAzureDeploymentsBaseURL(endpoint)
  }

  const apiVersion = process.env.AZURE_OPENAI_API_VERSION?.trim()

  if (!baseURL && !resourceName) {
    return null
  }

  const azure = createAzure({
    apiKey,
    ...(baseURL ? { baseURL } : { resourceName: resourceName! }),
    ...(apiVersion ? { apiVersion } : {}),
  })

  return azure.chat(deployment)
}
