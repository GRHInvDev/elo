/**
 * Regra de pedido de marmita pelo colaborador: apenas **hoje** ou **amanhã** (dia civil local).
 * Datas além de amanhã ou no passado são bloqueadas (configuração da intranet).
 */
export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

export type SelfServiceFoodOrderDateResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Valida a data do pedido para fluxo self-service (app + assistente).
 * @param orderDateNormalized — início do dia da data do pedido (já normalizado)
 */
export function checkSelfServiceFoodOrderDate(
  orderDateNormalized: Date,
  now: Date = new Date(),
): SelfServiceFoodOrderDateResult {
  const today = startOfLocalDay(now)
  const target = startOfLocalDay(orderDateNormalized)

  if (target.getTime() < today.getTime()) {
    return {
      ok: false,
      message: "Não é possível registrar pedido de marmita para data passada.",
    }
  }

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (target.getTime() !== today.getTime() && target.getTime() !== tomorrow.getTime()) {
    return {
      ok: false,
      message:
        "Não é possível realizar isso por conta do bloqueio interno de configuração: a intranet só permite pedir marmita para **hoje** ou para **amanhã** — não para datas posteriores (por exemplo, pedir a marmita da sexta estando na segunda).",
    }
  }

  return { ok: true }
}
