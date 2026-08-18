/**
 * Guarda de reload automático de recuperação.
 *
 * Recarregar a página conserta uma classe inteira de falhas — HTML preso a um
 * deploy antigo, chunk que saiu do ar, script que não desceu. O risco é o loop:
 * se o reload não resolver, a falha volta e pede outro reload.
 *
 * A janela de espera resolve isso. A tentativa fica registrada em
 * `sessionStorage`; se a mesma falha reaparecer dentro da janela, o reload é
 * negado e a interface mostra o caminho manual.
 */

/** Janela padrão entre duas tentativas da mesma origem. */
const DEFAULT_COOLDOWN_MS = 60_000

/**
 * Registra a tentativa e devolve se o reload pode acontecer agora.
 *
 * Sem `sessionStorage` — modo privado no Safari antigo, por exemplo — não há
 * como registrar a tentativa, então o reload automático fica desligado: melhor
 * exigir uma ação do usuário do que arriscar loop.
 *
 * @param key Chave que identifica a origem da falha. Cada origem tem a própria
 *   janela, para que uma não bloqueie a recuperação da outra.
 */
export function claimAutoReload(
  key: string,
  cooldownMs: number = DEFAULT_COOLDOWN_MS,
): boolean {
  try {
    const raw = window.sessionStorage.getItem(key)
    const lastAttempt = raw === null ? 0 : Number(raw)

    if (Number.isFinite(lastAttempt) && Date.now() - lastAttempt < cooldownMs) {
      return false
    }

    window.sessionStorage.setItem(key, String(Date.now()))
    return true
  } catch {
    return false
  }
}
