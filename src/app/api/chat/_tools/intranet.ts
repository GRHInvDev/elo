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
  description: `
Lista as reservas de salas de reunião do usuário autenticado para um dia específico.

**Quando usar:**
- Usuário pergunta "o que tenho hoje?", "tenho reunião amanhã?", "qual minha agenda de salas?", "me mostra meus compromissos de hoje".
- Quando quiser um recorte diário das reservas, mais focado que listUserBooking (que retorna todas as datas).

**Parâmetros:**
- dateIso (opcional): data em ISO UTC. Se omitido, usa o dia atual do servidor.

**O que retorna:**
- Lista com id, título da reserva (title), nome da sala (sala), horário de início (inicio) e fim (fim) em ISO.
- Se não houver reservas no dia: mensagem "Nenhuma reserva de sala encontrada para esse dia."

**Diferença de listUserBooking:**
- getMySchedule filtra por um dia específico (preferível para "hoje" ou data concreta).
- listUserBooking retorna TODAS as reservas futuras e passadas sem filtro de data.

**Uso combinado:**
- Use os ids retornados para cancelar uma reserva com deleteBooking.

**Problemas comuns:**
- Se o usuário informa horário local, lembre-se da conversão UTC.
- "Hoje" deve considerar a data do servidor, que pode diferir do fuso do usuário.
`,
  parameters: z.object({
    dateIso: z
      .string()
      .optional()
      .describe('Data no formato ISO UTC (ex.: "2025-04-15T12:00:00Z"). Opcional — padrão: hoje.'),
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
  description: `
Busca colaboradores ativos na empresa pelo nome, email ou fragmento destes.

**Quando usar:**
- Usuário quer saber o ramal, email ou setor de um colega: "qual o ramal da Ana?", "me dá o email do João da TI".
- Antes de chamar notifyColleague — obrigatório para obter o targetUserId correto.
- Para confirmar que a pessoa existe antes de mencionar seus dados.

**Como usar:**
- Passe pelo menos 2 caracteres em query (nome parcial ou email parcial).
- Retorna até 15 resultados: id, nome, email, setor (departamento), ramal (extensão telefônica).

**O que NÃO fazer:**
- Não exiba o campo id para o usuário — é interno e serve apenas para notifyColleague.
- Não use com menos de 2 caracteres; retornará erro de validação.
- Não assuma o id de um colaborador sem consultar esta ferramenta primeiro.

**Problemas comuns:**
- Nomes com acentuação podem não bater exatamente; tente variações sem acento se não encontrar.
- Usuários inativos ou desligados não aparecem nos resultados.
- Retorna "Nenhum colaborador encontrado" se a busca não tiver correspondência — peça ao usuário mais detalhes (sobrenome, setor, etc.).

**Uso combinado:**
1. searchColleague → encontra o colaborador e o id.
2. notifyColleague → envia a notificação usando o id.
`,
  parameters: z.object({
    query: z.string().min(2).describe("Fragmento do nome ou email do colaborador (mínimo 2 caracteres)"),
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
  description: `
Lista todos os formulários/solicitações disponíveis na intranet que o usuário pode preencher e enviar.

**Quando usar:**
- Usuário quer abrir um chamado, pedido ou solicitação: "quero pedir manutenção", "como faço para solicitar equipamento?", "preciso abrir um chamado de TI".
- SEMPRE chame esta ferramenta PRIMEIRO para obter o formId correto antes de registerSolicitation.
- Para apresentar as opções de formulário ao usuário quando ele não souber qual escolher.

**O que retorna:**
- Lista com id e title de cada formulário (até 40 itens).
- Apresente como uma lista numerada com os títulos — não mostre os IDs para o usuário.

**Fluxo correto:**
1. listFormsForHelp → usuário escolhe o tipo de solicitação.
2. registerSolicitation com o formId correto e o resumo do pedido.

**O que NÃO fazer:**
- Não chame registerSolicitation sem ter o formId desta listagem.
- Não assuma qual formulário usar — sempre confirme com o usuário.

**Problemas comuns:**
- Se nenhum formulário parece adequado ao pedido, informe o usuário e oriente-o a criar manualmente na página de Formulários da intranet.
- Retorna até 40 formulários; se o usuário tiver muitas opções, ajude a filtrar pelo tipo de pedido descrito.
`,
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

export const registerSolicitation: Tool = {
  description: `
Registra uma nova solicitação interna (chamado) em um formulário existente da intranet.

**Quando usar:**
- Usuário confirma que quer abrir uma solicitação após ver a lista de listFormsForHelp.
- Pedidos que não exigem anexo obrigatório no formulário.

**Fluxo obrigatório antes de chamar:**
1. Use listFormsForHelp para obter o formId correto.
2. Colete do usuário um resumo claro e detalhado do pedido (summary).
3. Confirme com o usuário: "vou registrar a solicitação '[título do formulário]' com o seguinte resumo: [summary]. Confirma?"
4. Só então chame esta ferramenta.

**Como funciona internamente:**
- O summary preenche os campos de texto obrigatórios do formulário.
- Campos dinâmicos (nome, setor) usam os dados do usuário autenticado.
- Campos não obrigatórios ficam em branco ou com valor padrão.
- Anexo obrigatório não é suportado — oriente o usuário a usar a página de Formulários na intranet.

**O que retorna:**
- ok: true, formResponseId, número do chamado e mensagem de confirmação.
- Em caso de erro: mensagem descritiva com motivo.

**O que NÃO fazer:**
- Não envie sem confirmar o summary com o usuário.
- Não use para formulários que exigem anexo obrigatório.
- Não tente adivinhar o formId — sempre use listFormsForHelp.

**Problemas comuns:**
- Summary vago gera solicitações incompletas; peça mais detalhes.
- Se retornar erro de anexo obrigatório, redirecione para a intranet.
`,
  parameters: z.object({
    formId: z.string().describe("ID do formulário obtido via listFormsForHelp"),
    summary: z
      .string()
      .min(3)
      .describe("Resumo detalhado do pedido ou descrição do problema (conteúdo dos campos de texto obrigatórios)"),
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
      return `Não foi possível registrar a solicitação: ${msg}`
    }
  },
}

const contributionTypeSchema = z.enum([
  "IDEIA_INOVADORA",
  "SUGESTAO_MELHORIA",
  "SOLUCAO_PROBLEMA",
  "OUTRO",
])

export const createIdea: Tool = {
  description: `
Registra uma nova ideia na **caixa de ideias** do usuário (mesmo fluxo da intranet).

**Quando usar:**
- Usuário quer enviar sugestão, ideia de melhoria, solução para um problema ou proposta inovadora para a empresa.

**Fluxo obrigatório antes de chamar:**
1. Entenda o tipo da contribuição e mapeie para contributionType (IDEIA_INOVADORA, SUGESTAO_MELHORIA, SOLUCAO_PROBLEMA ou OUTRO).
2. Colete a **descrição** (solução proposta / ideia) — obrigatória.
3. Opcional: problema identificado (problem), nome/setor se o usuário quiser informar manualmente (submittedName, submittedSector).
4. Se contributionType for OUTRO e fizer sentido, preencha contributionOther com o rótulo da categoria.
5. Confirme o resumo com o usuário e só então execute.

**Parâmetros alinhados ao backend:**
- description: solução proposta (texto obrigatório).
- problem: problema identificado (opcional).
- contributionType + contributionOther: idem ao objeto contribution da API.

**O que retorna:**
- ok, numeroIdeia (número amigável para acompanhamento), mensagem.

**O que NÃO fazer:**
- Não invente detalhes — use o que o usuário disse.
- Usuários **Totem** não podem criar ideias (o servidor retornará erro — explique que deve usar outro perfil).

**Problemas comuns:**
- Texto muito curto ou vazio na descrição é rejeitado.
`,
  parameters: z.object({
    description: z
      .string()
      .min(1)
      .describe("Solução proposta / descrição da ideia (campo obrigatório no sistema)"),
    problem: z.string().optional().describe("Problema identificado (opcional)"),
    contributionType: contributionTypeSchema.describe(
      "Tipo: IDEIA_INOVADORA | SUGESTAO_MELHORIA | SOLUCAO_PROBLEMA | OUTRO",
    ),
    contributionOther: z
      .string()
      .optional()
      .describe("Texto complementar quando o tipo for OUTRO ou para detalhar a categoria"),
    submittedName: z.string().optional().describe("Nome informado manualmente pelo usuário (opcional)"),
    submittedSector: z.string().optional().describe("Setor informado manualmente pelo usuário (opcional)"),
  }),
  execute: async (input: {
    description: string
    problem?: string
    contributionType: z.infer<typeof contributionTypeSchema>
    contributionOther?: string
    submittedName?: string
    submittedSector?: string
  }) => {
    try {
      const problemTrim = input.problem?.trim()
      const otherTrim = input.contributionOther?.trim()
      const nameTrim = input.submittedName?.trim()
      const sectorTrim = input.submittedSector?.trim()
      const suggestion = await api.suggestion.create({
        description: input.description.trim(),
        problem: problemTrim && problemTrim.length > 0 ? problemTrim : undefined,
        contribution: {
          type: input.contributionType,
          other: otherTrim && otherTrim.length > 0 ? otherTrim : undefined,
        },
        submittedName: nameTrim && nameTrim.length > 0 ? nameTrim : undefined,
        submittedSector: sectorTrim && sectorTrim.length > 0 ? sectorTrim : undefined,
      })
      return {
        ok: true as const,
        numeroIdeia: suggestion.ideaNumber,
        mensagem: `Ideia #${suggestion.ideaNumber} registrada. Acompanhe em Minhas ideias na intranet.`,
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      return `Não foi possível registrar a ideia: ${msg}`
    }
  },
}

export const getMenuCafeteria: Tool = {
  description: `
Consulta e exibe o cardápio do refeitório/restaurante para uma data específica (padrão: hoje).

**Quando usar:**
- Usuário pergunta "o que tem no almoço hoje?", "qual é o cardápio?", "o que vai ter de comida amanhã?", "me mostra o menu do restaurante X".
- Para visualização do menu — NÃO use para fazer pedidos (use o fluxo de food-order para isso).

**Parâmetros:**
- dateIso (opcional): data desejada em ISO. Se omitido, usa hoje.
- restaurantNameContains (opcional): fragmento do nome do restaurante para filtrar quando há vários.

**O que retorna:**
- Nome do restaurante, data, e lista de itens com: nome, categoria e descrição.
- Se houver vários restaurantes e o filtro não for preciso o suficiente, a ferramenta perguntará qual escolher.
- Se não houver itens para o dia da semana: informa que não há cardápio disponível.

**Diferença de listLunchMenuItems:**
- getMenuCafeteria é para leitura/exibição do cardápio — não inclui IDs de itens nem opcionais.
- listLunchMenuItems é para o fluxo de pedido — inclui IDs, preços e grupos de opcionais para submitLunchOrder.

**O que NÃO fazer:**
- Não use para criar pedidos — apenas para consultar o menu.
- Não passe restaurantNameContains com o nome completo se quiser um match parcial — fragmentos funcionam melhor.

**Problemas comuns:**
- Cardápio varia por dia da semana; se o usuário pede "amanhã" e não há cardápio, informe que não foi cadastrado para aquele dia.
- Com múltiplos restaurantes e sem filtro, pode retornar ambiguidade — peça o nome ao usuário.
`,
  parameters: z.object({
    dateIso: z
      .string()
      .optional()
      .describe("Data em ISO UTC; se omitido, usa hoje."),
    restaurantNameContains: z
      .string()
      .optional()
      .describe("Parte do nome do restaurante para filtrar (quando houver vários cadastrados)."),
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
  description: `
Envia uma notificação in-app (mensagem interna) para outro colaborador da empresa.

**Quando usar:**
- Usuário quer avisar, notificar ou mandar um recado para um colega: "avisa a Maria que a reunião foi remarcada", "manda uma mensagem para o Pedro do RH".

**Fluxo obrigatório antes de chamar:**
1. Use searchColleague para buscar o colaborador e obter o targetUserId.
2. Confirme com o usuário: "vou notificar [Nome] com a mensagem: [message]. Confirma?"
3. Só então execute.

**Parâmetros:**
- targetUserId: ID interno do colaborador (obtido via searchColleague — nunca exiba para o usuário).
- message: texto da notificação (1 a 1800 caracteres). Deve ser profissional e conciso.

**O que retorna:**
- ok: true e confirmação de envio.
- Em caso de erro: mensagem descritiva.

**O que NÃO fazer:**
- Não envie sem confirmar destinatário e conteúdo com o usuário.
- Não inclua informações confidenciais, senhas, dados pessoais sensíveis ou conteúdo ofensivo.
- Não tente adivinhar o targetUserId — sempre use searchColleague.
- A notificação NÃO pode ser desfeita após o envio.

**Problemas comuns:**
- Se searchColleague retornar mais de um resultado com nomes similares, confirme com o usuário qual é o correto (via email ou setor).
- Mensagens muito longas (>1800 chars) são rejeitadas — resuma se necessário.
- O destinatário verá a notificação no painel de notificações da intranet.
`,
  parameters: z.object({
    targetUserId: z.string().describe("ID interno do usuário destinatário (obtido via searchColleague)"),
    message: z.string().min(1).max(1800).describe("Texto da mensagem/notificação (máximo 1800 caracteres)"),
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
