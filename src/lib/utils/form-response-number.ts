/**
 * Formata o número do chamado para exibição
 * Exemplo: 1 -> "#01", 10 -> "#10", 100 -> "#100"
 * Retorna string vazia se o número for null (registros antigos)
 * 
 * @param number - Número sequencial do chamado (pode ser null)
 * @returns String formatada (ex: "#01") ou string vazia se null
 */
export function formatFormResponseNumber(number: number | null | undefined): string {
  if (number === null || number === undefined) {
    return ""
  }
  // Formata com zero à esquerda se necessário
  const formatted = number.toString().padStart(3, "0")
  return `#${formatted}`
}

