import { api } from "@/trpc/server"
import type { Tool } from "ai"
import { z } from "zod"

function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

export const listLunchRestaurants: Tool = {
  description: `
Lista todos os restaurantes ativos cadastrados no sistema de pedidos de refeição da intranet.

**Quando usar:**
- SEMPRE como primeira etapa do fluxo de pedido de almoço, antes de qualquer outra tool de food-order.
- Usuário quer pedir comida, fazer pedido de almoço, ou saber quais restaurantes existem.
- Para obter o restaurantId necessário para listLunchMenuItems e submitLunchOrder.

**O que retorna:**
- Lista com id, nome e cidade de cada restaurante ativo.
- Apresente os nomes ao usuário de forma clara (não exiba os IDs).

**Fluxo correto:**
1. listLunchRestaurants → usuário escolhe o restaurante.
2. listLunchMenuItems (com o restaurantId escolhido) → usuário escolhe o prato.
3. Coleta de opcionais (se houver) → confirmação.
4. submitLunchOrder.

**O que NÃO fazer:**
- Não pule esta etapa assumindo um restaurantId sem consultar.
- Não confunda com getMenuCafeteria — esta é a etapa de listagem para pedido, aquela é só leitura de cardápio.

**Problemas comuns:**
- Se retornar lista vazia, significa que não há restaurantes ativos no sistema — informe o usuário.
- Se houver apenas um restaurante, informe ao usuário e prossiga diretamente para listLunchMenuItems após confirmação.
`,
  parameters: z.object({}),
  execute: async () => {
    try {
      const list = await api.restaurant.list({ active: true })
      return list.map((r) => ({ id: r.id, name: r.name, city: r.city }))
    } catch (e) {
      return `Erro ao listar restaurantes: ${e instanceof Error ? e.message : String(e)}`
    }
  },
}

export const listLunchMenuItems: Tool = {
  description: `
Lista os pratos disponíveis no cardápio de um restaurante para o dia da semana correspondente à data informada.

**Quando usar:**
- Segunda etapa do fluxo de pedido — após o usuário escolher o restaurante via listLunchRestaurants.
- Para apresentar os pratos disponíveis no dia e coletar a escolha do usuário.

**Parâmetros:**
- restaurantId: ID do restaurante (obrigatório, obtido de listLunchRestaurants).
- dateIso (opcional): data em ISO para determinar o dia da semana do cardápio; padrão hoje.

**O que retorna por item:**
- id: identificador do prato (use em submitLunchOrder como menuItemId).
- name, category, price, description.
- options: lista de grupos de opcionais/adicionais. Cada grupo contém:
  - optionId, optionName: identificador e nome do grupo (ex.: "Acompanhamento", "Bebida").
  - required: se true, o usuário DEVE escolher ao menos uma opção deste grupo.
  - multiple: se true, pode escolher mais de uma opção no grupo.
  - choices: lista de opções disponíveis com choiceId, name e priceModifier (variação de preço).

**Como apresentar ao usuário:**
- Agrupe os pratos por categoria.
- Mostre nome, descrição e preço.
- Ao escolher um prato com opcionais, percorra CADA grupo: se required, pergunte obrigatoriamente; se opcional, ofereça.
- Colete os choiceIds das escolhas para passar ao submitLunchOrder.

**O que NÃO fazer:**
- Não pule grupos de opcionais obrigatórios (required: true) — o pedido pode ser rejeitado.
- Não use os IDs desta listagem como restaurantId — são menuItemIds diferentes.
- Não chame submitLunchOrder sem ter coletado todos os opcionais obrigatórios.

**Problemas comuns:**
- Cardápio varia por dia da semana (weekDay); se o usuário pedir para amanhã e não houver itens, informe.
- Pratos indisponíveis (available: false) são filtrados automaticamente — não aparecem na lista.
`,
  parameters: z.object({
    restaurantId: z.string().describe("ID do restaurante obtido via listLunchRestaurants"),
    dateIso: z
      .string()
      .optional()
      .describe("Data em ISO para determinar o dia da semana do cardápio; padrão: hoje."),
  }),
  execute: async ({ restaurantId, dateIso }: { restaurantId: string; dateIso?: string }) => {
    try {
      const date = dateIso ? new Date(dateIso) : new Date()
      const items = await api.menuItem.byRestaurant({
        restaurantId,
        date,
        includeUnavailable: false,
      })
      return items.map((it) => ({
        id: it.id,
        name: it.name,
        category: it.category,
        price: it.price,
        description: it.description,
        options: it.options?.map((opt) => ({
          optionId: opt.id,
          optionName: opt.name,
          required: opt.required,
          multiple: opt.multiple,
          choices: opt.choices
            ?.filter((c) => c.available)
            .map((c) => ({
              choiceId: c.id,
              name: c.name,
              priceModifier: c.priceModifier,
            })),
        })),
      }))
    } catch (e) {
      return `Erro ao listar cardápio: ${e instanceof Error ? e.message : String(e)}`
    }
  },
}

export const getMyLunchOrderForDate: Tool = {
  description: `
Verifica se o usuário autenticado já possui um pedido de refeição registrado para uma data específica.

**Quando usar:**
- SEMPRE como PRIMEIRA ação quando o usuário inicia qualquer assunto sobre pedido de almoço (seja para pedir, ver ou cancelar).
- Usuário pergunta "já pedi o almoço?", "tenho pedido hoje?", "o que eu pedi para hoje?".
- Antes de iniciar o fluxo de submitLunchOrder — para evitar tentativas de duplicata.

**Parâmetros:**
- dateIso (opcional): data em ISO. Apenas a parte de data importa (dia/mês/ano); padrão: hoje.

**O que retorna:**
- hasOrder: true/false.
- Se hasOrder = true: orderId, status, nome do restaurante, nome do prato (dish), observações.
- Se hasOrder = false: mensagem indicando que não há pedido.

**Regra crítica:**
- O sistema permite apenas UM pedido por usuário por dia.
- Se hasOrder = true, informe o usuário sobre o pedido existente e NÃO inicie novo fluxo de pedido.
- Se o usuário quiser cancelar ou alterar, oriente-o a entrar em contato com o responsável ou use a intranet (não há tool de cancelamento de pedido de refeição no assistente).

**O que NÃO fazer:**
- Não pule esta verificação antes de submitLunchOrder — isso causará erro de duplicata.
- Não assuma que não há pedido sem consultar.

**Problemas comuns:**
- Status possíveis: PENDING (aguardando), CONFIRMED (confirmado), CANCELLED (cancelado) — informe o status ao usuário.
- Erros de conexão retornam string com prefixo "Erro ao consultar pedido:".
`,
  parameters: z.object({
    dateIso: z.string().optional().describe("Data em ISO; apenas o dia é considerado. Padrão: hoje."),
  }),
  execute: async ({ dateIso }: { dateIso?: string }) => {
    try {
      const d = dateIso ? new Date(dateIso) : new Date()
      const start = startOfDayLocal(d)
      const end = new Date(start)
      end.setHours(23, 59, 59, 999)
      const orders = await api.foodOrder.myOrders({ startDate: start, endDate: end })
      if (orders.length === 0) {
        return {
          hasOrder: false,
          message: "Não há pedido de refeição registrado para esta data.",
        }
      }
      const o = orders[0]!
      return {
        hasOrder: true,
        orderId: o.id,
        status: o.status,
        restaurant: o.restaurant?.name ?? null,
        dish: o.menuItem?.name ?? null,
        observations: o.observations ?? null,
      }
    } catch (e) {
      return `Erro ao consultar pedido: ${e instanceof Error ? e.message : String(e)}`
    }
  },
}

export const submitLunchOrder: Tool = {
  description: `
Finaliza e registra o pedido de refeição do usuário autenticado no sistema da intranet.

**Quando usar:**
- ÚLTIMA etapa do fluxo de pedido de almoço, após coletar e confirmar todas as informações.

**Pré-requisitos obrigatórios antes de chamar:**
1. getMyLunchOrderForDate confirmou que NÃO há pedido para a data (hasOrder: false).
2. listLunchRestaurants foi chamado e o usuário escolheu um restaurante (restaurantId confirmado).
3. listLunchMenuItems foi chamado e o usuário escolheu um prato (menuItemId confirmado).
4. Todos os grupos de opcionais com required: true foram perguntados e os choiceIds coletados.
5. Resumo completo foi apresentado ao usuário e ele confirmou explicitamente (ex.: "Sim", "Pode pedir").

**Parâmetros:**
- restaurantId: ID do restaurante escolhido (de listLunchRestaurants).
- menuItemId: ID do prato escolhido (de listLunchMenuItems).
- orderDateIso (opcional): data do pedido em ISO; padrão hoje (somente a data importa, não o horário).
- optionChoiceIds (opcional): array com os choiceIds dos opcionais selecionados pelo usuário.
- observations (opcional): observações livres do usuário (ex.: "sem cebola", "alergia a glúten").

**O que retorna:**
- ok: true, orderId, message e summary (descrição legível: "Prato — Restaurante").
- ok: false com campo error e hint quando há falha (ex.: pedido duplicado no dia).

**O que NÃO fazer:**
- NÃO chame sem confirmação explícita do usuário — pedidos registrados são definitivos.
- NÃO chame sem ter coletado opcionais obrigatórios.
- NÃO chame se getMyLunchOrderForDate retornou hasOrder: true.
- NÃO tente criar pedido para datas passadas (pode ser rejeitado).

**Problemas comuns:**
- Erro "pedido duplicado": significa que já existe pedido para o dia — use getMyLunchOrderForDate para verificar antes.
- Erro de validação de opcionais: algum grupo required não teve escolha informada — revise os choiceIds.
- Erro de restaurante/prato inválido: os IDs não correspondem ao cardápio do dia — refaça listLunchMenuItems.
`,
  parameters: z.object({
    restaurantId: z.string().describe("ID do restaurante (de listLunchRestaurants)"),
    menuItemId: z.string().describe("ID do prato escolhido (de listLunchMenuItems)"),
    orderDateIso: z
      .string()
      .optional()
      .describe("Data do pedido em ISO; padrão hoje (só o dia importa, não o horário)."),
    optionChoiceIds: z
      .array(z.string())
      .optional()
      .describe("Array com os choiceIds dos opcionais/adicionais selecionados pelo usuário."),
    observations: z.string().optional().describe("Observações livres (ex.: 'sem sal', 'alergia a amendoim')."),
  }),
  execute: async ({
    restaurantId,
    menuItemId,
    orderDateIso,
    optionChoiceIds,
    observations,
  }: {
    restaurantId: string
    menuItemId: string
    orderDateIso?: string
    optionChoiceIds?: string[]
    observations?: string
  }) => {
    try {
      const orderDate = orderDateIso
        ? startOfDayLocal(new Date(orderDateIso))
        : startOfDayLocal(new Date())
      const trimmedObservations = observations?.trim()
      const created = await api.foodOrder.create({
        restaurantId,
        menuItemId,
        orderDate,
        observations:
          trimmedObservations !== undefined && trimmedObservations.length > 0
            ? trimmedObservations
            : undefined,
        optionChoices:
          optionChoiceIds && optionChoiceIds.length > 0 ? optionChoiceIds : undefined,
      })
      return {
        ok: true as const,
        orderId: created?.id,
        message: "Pedido de refeição registrado com sucesso!",
        summary: `${created?.menuItem?.name ?? "Prato"} — ${created?.restaurant?.name ?? "Restaurante"}`,
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return {
        ok: false as const,
        error: msg,
        hint: "Se o erro indicar pedido duplicado no dia, o usuário já tem pedido para esta data (verifique com getMyLunchOrderForDate).",
      }
    }
  },
}
