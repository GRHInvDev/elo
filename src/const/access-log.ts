/**
 * Parâmetros da trilha de acesso, compartilhados entre servidor e cliente.
 *
 * Ficam fora do router de propósito: a rota de cron e a tela de logs precisam
 * dos mesmos números sem arrastar o tRPC inteiro para dentro do bundle.
 */

/**
 * Limiar de lentidão de uma chamada de API.
 *
 * O middleware do tRPC só persiste chamadas a partir daqui (ou que falharam) —
 * gravar todas acrescentaria uma escrita por request no mesmo banco que se quer
 * diagnosticar. A tela usa o mesmo número para destacar durações.
 */
export const SLOW_CALL_THRESHOLD_MS = 800

/** Retenção da tabela access_logs, aplicada por /api/cron/access_logs. */
export const ACCESS_LOG_RETENTION_DAYS = 30
