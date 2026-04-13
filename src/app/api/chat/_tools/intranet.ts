import { api } from "@/trpc/server"
import type { Field } from "@/lib/form-types"
import type { Tool } from "ai"
import { z } from "zod"

function buildFormResponseRow(
  fields: Field[],
  summary: string,
  me: {
    firstName: string | null
    lastName: string | null
    email: string | null
    setor: string | null
  },
): Record<string, unknown> {
  const row: Record<string, unknown> = {}

  for (const field of fields) {
    if (field.type === "dynamic") {
      if (field.dynamicType === "user_name") {
        row[field.name] = me.firstName
          ? `${me.firstName}${me.lastName ? ` ${me.lastName}` : ""}`.trim()
          : (me.email ?? "")
      } else if (field.dynamicType === "user_sector") {
        row[field.name] = me.setor ?? "Não informado"
      }
      continue
    }

    if (field.type === "file") {
      if (field.required) {
        throw new Error(
          "Este formulário exige anexo. Conclua o envio em Formulários na intranet.",
        )
      }
      continue
    }

    if (field.type === "checkbox") {
      row[field.name] = field.required ? true : false
      continue
    }

    if (!field.required) {
      if (field.type === "number") {
        row[field.name] = undefined
      } else if (field.type === "combobox") {
        row[field.name] = field.multiple ? [] : ""
      } else {
        row[field.name] = ""
      }
      continue
    }

    if (field.type === "textarea" || field.type === "text") {
      row[field.name] = summary
    } else if (field.type === "formatted") {
      row[field.name] = summary.slice(0, 120)
    } else if (field.type === "number") {
      row[field.name] = 0
    } else if (field.type === "combobox" && field.options?.[0]) {
      row[field.name] = field.multiple ? [field.options[0].value] : field.options[0].value
    } else {
      row[field.name] = summary
    }
  }

  return row
}

export const getMySchedule: Tool = {
  description:
    "Lista as reservas de salas de reunião do usuário para um dia específico (início e fim do dia no fuso local do servidor). Se a data não for informada, usa o dia atual.",
  parameters: z.object({
    dateIso: z
      .string()
      .optional()
      .describe('Data no formato ISO (ex.: "2025-04-15T12:00:00Z"). Opcional.'),
  }),
  execute: async ({ dateIso }: { dateIso?: string }) => {
    try {
      const date = dateIso ? new Date(dateIso) : new Date()
      const bookings = await api.booking.listMineForDay({ date })
      if (bookings.length === 0) {
        return "Nenhuma reserva de sala encontrada para esse dia."
      }
      return bookings.map((b) => ({
        id: b.id,
        title: b.title,
        sala: b.room.name,
        inicio: b.start.toISOString(),
        fim: b.end.toISOString(),
      }))
    } catch (error) {
      return `Erro ao buscar agenda: ${JSON.stringify(error)}`
    }
  },
}

export const searchColleague: Tool = {
  description:
    "Busca colaboradores ativos pelo nome, email ou parte deles, para obter ramal e setor. Use pelo menos 2 caracteres.",
  parameters: z.object({
    query: z.string().min(2).describe("Trecho do nome ou email"),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      const users = await api.user.listForChat({ search: query })
      if (users.length === 0) {
        return "Nenhum colaborador encontrado com esse critério."
      }
      return users.slice(0, 15).map((u) => ({
        id: u.id,
        nome: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
        email: u.email,
        setor: u.setor,
        ramal: u.extension != null ? String(u.extension) : null,
      }))
    } catch (error) {
      return `Erro na busca: ${JSON.stringify(error)}`
    }
  },
}

export const listFormsForHelp: Tool = {
  description:
    "Lista formulários/solicitações disponíveis para o usuário (id e título), para abrir chamados ou pedidos internos.",
  parameters: z.object({}),
  execute: async () => {
    try {
      const forms = await api.form.list()
      return forms.slice(0, 40).map((f) => ({
        id: f.id,
        title: f.title,
      }))
    } catch (error) {
      return `Erro ao listar formulários: ${JSON.stringify(error)}`
    }
  },
}

export const submitHelpDeskTicket: Tool = {
  description:
    "Abre uma nova resposta em um formulário existente (chamado/solicitação). Use listFormsForHelp para obter o formId. O resumo vira o preenchimento dos campos de texto obrigatórios; formulários só com anexo obrigatório não podem ser enviados por aqui.",
  parameters: z.object({
    formId: z.string().describe("ID do formulário"),
    summary: z.string().min(3).describe("Resumo do pedido ou descrição do problema"),
  }),
  execute: async ({ formId, summary }: { formId: string; summary: string }) => {
    try {
      const form = await api.form.getById(formId)
      if (!form) {
        return "Formulário não encontrado ou sem permissão de acesso."
      }

      const raw = form.fields as unknown
      const fields = (Array.isArray(raw) ? raw : []) as Field[]
      const me = await api.user.me()

      const row = buildFormResponseRow(fields, summary, {
        firstName: me.firstName ?? null,
        lastName: me.lastName ?? null,
        email: me.email ?? null,
        setor: me.setor ?? null,
      })

      const created = await api.formResponse.create({
        formId,
        responses: [row],
      })

      return {
        ok: true,
        formResponseId: created.id,
        numero: created.number ?? null,
        mensagem:
          "Solicitação registrada. Acompanhe em Formulários na intranet ou pelas notificações.",
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      return `Não foi possível abrir a solicitação: ${msg}`
    }
  },
}

export const getMenuCafeteria: Tool = {
  description:
    "Obtém o cardápio do refeitório/restaurante para o dia informado (ou hoje). Opcionalmente filtre pelo nome do restaurante.",
  parameters: z.object({
    dateIso: z
      .string()
      .optional()
      .describe("Data ISO; se omitido, usa hoje."),
    restaurantNameContains: z
      .string()
      .optional()
      .describe("Parte do nome do restaurante, se houver vários cadastrados."),
  }),
  execute: async ({
    dateIso,
    restaurantNameContains,
  }: {
    dateIso?: string
    restaurantNameContains?: string
  }) => {
    try {
      const day = dateIso ? new Date(dateIso) : new Date()
      const restaurants = await api.restaurant.list({ active: true })
      if (restaurants.length === 0) {
        return "Nenhum restaurante ativo cadastrado."
      }

      let chosen = restaurants
      if (restaurantNameContains?.trim()) {
        const q = restaurantNameContains.trim().toLowerCase()
        chosen = restaurants.filter((r) => r.name.toLowerCase().includes(q))
      }

      if (chosen.length === 0) {
        return `Nenhum restaurante encontrado para "${restaurantNameContains}". Disponíveis: ${restaurants.map((r) => r.name).join(", ")}`
      }

      if (chosen.length > 1) {
        return {
          precisaEscolher: true,
          restaurantes: chosen.map((r) => ({ id: r.id, nome: r.name })),
          mensagem: "Há vários restaurantes; informe o nome com mais precisão ou use restaurantNameContains.",
        }
      }

      const restaurant = chosen[0]!
      const items = await api.menuItem.byRestaurant({
        restaurantId: restaurant.id,
        date: day,
      })

      if (items.length === 0) {
        return {
          restaurante: restaurant.name,
          data: day.toISOString(),
          itens: [],
          mensagem: "Nenhum item de cardápio disponível para esse dia da semana.",
        }
      }

      return {
        restaurante: restaurant.name,
        data: day.toISOString(),
        itens: items.map((it) => ({
          nome: it.name,
          categoria: it.category,
          descricao: it.description,
        })),
      }
    } catch (error) {
      return `Erro ao buscar cardápio: ${JSON.stringify(error)}`
    }
  },
}

export const notifyColleague: Tool = {
  description:
    "Envia uma notificação in-app a outro colaborador (use searchColleague para obter o id). Mensagem curta e profissional.",
  parameters: z.object({
    targetUserId: z.string().describe("ID do usuário destino"),
    message: z.string().min(1).max(1800).describe("Texto do recado"),
  }),
  execute: async ({ targetUserId, message }: { targetUserId: string; message: string }) => {
    try {
      await api.aiAssistant.notifyColleague({ targetUserId, message })
      return { ok: true, mensagem: "Notificação enviada ao colaborador." }
    } catch (error) {
      return `Erro ao notificar: ${JSON.stringify(error)}`
    }
  },
}
