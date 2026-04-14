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

/** Motivo pelo qual o assistente não pode inicializar (para logs em servidor; não enviar ao cliente). */
export type AssistantModelUnavailableReason =
  | "missing_azure_openai_api_key"
  | "missing_azure_openai_deployment_name"
  | "missing_azure_endpoint_or_resource"

/**
 * Indica por que o modelo não está disponível, ou `null` se a configuração mínima existe.
 * Não valida conectividade — só presença de variáveis de ambiente.
 */
export function getAssistantModelUnavailableReason(): AssistantModelUnavailableReason | null {
  if (!process.env.AZURE_OPENAI_API_KEY?.trim()) {
    return "missing_azure_openai_api_key"
  }
  if (!process.env.AZURE_OPENAI_DEPLOYMENT_NAME?.trim()) {
    return "missing_azure_openai_deployment_name"
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

  if (!baseURL && !resourceName) {
    return "missing_azure_endpoint_or_resource"
  }

  return null
}

/**
 * Modelo de chat (Azure OpenAI deployment) para o assistente da intranet.
 * Usa `@ai-sdk/azure` **v1** (LanguageModelV1), compatível com **AI SDK 4** (`streamText` + tools).
 *
 * Variáveis esperadas (produção):
 * - `AZURE_OPENAI_API_KEY`
 * - `AZURE_OPENAI_DEPLOYMENT_NAME`
 * - Uma forma de host: `AZURE_OPENAI_ENDPOINT` (ou `AZURE_COGNITIVE_ENDPOINT`), ou `AZURE_OPENAI_BASE_URL`, ou `AZURE_RESOURCE_NAME` / `AZURE_OPENAI_RESOURCE_NAME`
 * - `AZURE_OPENAI_API_VERSION` (opcional)
 */
export function getAssistantChatModel(): LanguageModelV1 | null {
  const reason = getAssistantModelUnavailableReason()
  if (reason) {
    return null
  }

  const apiKey = process.env.AZURE_OPENAI_API_KEY!.trim()
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!.trim()

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

  const azure = createAzure({
    apiKey,
    ...(baseURL ? { baseURL } : { resourceName: resourceName! }),
    ...(apiVersion ? { apiVersion } : {}),
  })

  return azure.chat(deployment)
}
