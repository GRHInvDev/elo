/**
 * Metadados persistidos em `Suggestion.aiEnhancement` (JSON).
 */
export interface SuggestionAiEnhancement {
  description?: {
    collaboratorOriginal: string
    refinedWithAi: true
  }
  problem?: {
    collaboratorOriginal: string
    refinedWithAi: true
  }
  morrison?: {
    evaluatorNote: string
    generatedAt: string
  }
}

export function parseSuggestionAiEnhancement(raw: unknown): SuggestionAiEnhancement | null {
  if (!raw || typeof raw !== "object") return null
  return raw
}
