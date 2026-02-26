/**
 * Campos de pré-cadastro Lojinha (SIGIN) no usuário.
 * Usado para verificar se o perfil está completo antes de permitir pedido.
 */
export type LojinhaProfileFields = {
  lojinha_full_name?: string | null
  lojinha_cpf?: string | null
  lojinha_address?: string | null
  lojinha_neighborhood?: string | null
  lojinha_cep?: string | null
  lojinha_rg?: string | null
  lojinha_email?: string | null
  lojinha_phone?: string | null
}

const LOJINHA_FIELD_KEYS: (keyof LojinhaProfileFields)[] = [
  "lojinha_full_name",
  "lojinha_cpf",
  "lojinha_address",
  "lojinha_neighborhood",
  "lojinha_cep",
  "lojinha_rg",
  "lojinha_email",
  "lojinha_phone",
]

/**
 * Verifica se o usuário tem todos os dados de pré-cadastro Lojinha preenchidos.
 * Retorna true apenas se os 8 campos existirem e forem strings não vazias (após trim).
 */
export function hasCompleteLojinhaProfile(user: LojinhaProfileFields | null | undefined): boolean {
  if (!user) return false
  for (const key of LOJINHA_FIELD_KEYS) {
    const value = user[key]
    if (value == null || typeof value !== "string" || value.trim() === "") {
      return false
    }
  }
  return true
}
