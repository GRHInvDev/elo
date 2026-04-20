import type { RolesConfig } from "@/types/role-config"

export type AssistantQuickPrompt = {
  /** Chave estável para lista React */
  id: string
  label: string
  prompt: string
}

/** Mulberry32 — reprodutível por semente (varia a cada “nova sessão” no chat). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleWithRng<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = copy[i] as T
    copy[i] = copy[j] as T
    copy[j] = tmp
  }
  return copy
}

/** Combina semente numérica a partir de string (ex.: userId + contador). */
export function hashSeed(parts: string[]): number {
  let h = 2166136261
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) {
      h ^= p.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
  }
  return h >>> 0
}

const TOTEM_POOL: AssistantQuickPrompt[] = [
  {
    id: "rooms-read",
    label: "Salas disponíveis",
    prompt:
      "Quais salas de reunião estão livres agora? Quero apenas consultar a disponibilidade, sem criar ou alterar reservas.",
  },
  {
    id: "what-box",
    label: "O que é a Box?",
    prompt:
      "Em linguagem simples, o que é a Box Distribuidora e qual a relação dela com o Grupo R Henz?",
  },
  {
    id: "what-cristallux",
    label: "O que é a Cristallux?",
    prompt: "Em poucas frases, o que é a Cristallux e em que segmento ela atua?",
  },
  {
    id: "cafeteria-menu",
    label: "Cardápio do refeitório",
    prompt: "Qual é o cardápio do refeitório hoje? Só consulta.",
  },
  {
    id: "fleet-overview",
    label: "Frota de veículos",
    prompt: "Quais veículos temos na frota? Liste modelos e placas, sem registrar aluguel.",
  },
  {
    id: "cars-free-now",
    label: "Carros livres agora",
    prompt: "Há algum carro da frota disponível para uso neste momento? Apenas consulta.",
  },
  {
    id: "intranet-hint",
    label: "O que posso fazer aqui?",
    prompt:
      "Sou usuário do totem da intranet com acesso limitado. O que consigo consultar por aqui e o que devo fazer no meu usuário completo?",
  },
  {
    id: "hall-entrada",
    label: "Novos colaboradores",
    prompt: "Onde na intranet vejo as comunicações do hall de entrada (novos colaboradores)?",
  },
]

const COLLEAGUE_PROMPT: AssistantQuickPrompt = {
  id: "colleague-ramal",
  label: "Buscar colega",
  prompt: "Como localizo o ramal e o e-mail de um colega pelo nome?",
}

const LUNCH_ORDERED: AssistantQuickPrompt = {
  id: "lunch-today",
  label: "Almoço hoje",
  prompt: "Eu já pedi o almoço para hoje?",
}

const LUNCH_MENU_READ: AssistantQuickPrompt = {
  id: "lunch-menu-read",
  label: "Cardápio restaurantes",
  prompt: "Quais pratos estão disponíveis hoje nos restaurantes parceiros? Só quero ver o cardápio.",
}

const ROOMS_NOW: AssistantQuickPrompt = {
  id: "rooms-now",
  label: "Salas agora",
  prompt: "Quais salas estão disponíveis para uso agora?",
}

const ROOM_BOOKING: AssistantQuickPrompt = {
  id: "room-book",
  label: "Reservar sala",
  prompt: "Quero reservar uma sala de reunião. Me guie passo a passo.",
}

const CAR_RENT_FLOW: AssistantQuickPrompt = {
  id: "car-rent",
  label: "Carro para viagem",
  prompt: "Preciso alugar um carro da frota para uma viagem a trabalho. Por onde começo?",
}

const CAR_FREE_READ: AssistantQuickPrompt = {
  id: "car-free-read",
  label: "Carros livres",
  prompt: "Qual carro está à disposição para uso agora?",
}

const FORMS_HELP: AssistantQuickPrompt = {
  id: "forms-list",
  label: "Formulários / chamados",
  prompt: "Quais tipos de solicitação (formulários) posso abrir pela intranet?",
}

const IDEA_BOX: AssistantQuickPrompt = {
  id: "idea-box",
  label: "Caixa de ideias",
  prompt: "Como registro uma ideia na caixa de ideias da intranet?",
}

const SCHEDULE_TODAY: AssistantQuickPrompt = {
  id: "schedule-today",
  label: "Minha agenda hoje",
  prompt: "Quais reservas de sala eu tenho hoje?",
}

/**
 * Conjunto amplo de atalhos possíveis conforme permissões.
 * A UI sorteia um subconjunto a cada “nova conversa” no assistente.
 */
export function getQuickPromptCandidates(role: RolesConfig | null): AssistantQuickPrompt[] {
  if (!role) {
    return [ROOMS_NOW, COLLEAGUE_PROMPT]
  }

  if (role.isTotem) {
    return [...TOTEM_POOL]
  }

  const list: AssistantQuickPrompt[] = [ROOMS_NOW, COLLEAGUE_PROMPT, SCHEDULE_TODAY, FORMS_HELP]

  if (role.can_create_booking || role.sudo) {
    list.push(ROOM_BOOKING)
  }

  list.push(LUNCH_ORDERED, LUNCH_MENU_READ)

  if (role.can_locate_cars || role.sudo) {
    list.push(CAR_RENT_FLOW, CAR_FREE_READ)
  } else {
    list.push({
      id: "fleet-read",
      label: "Veículos da frota",
      prompt: "Quais veículos temos cadastrados na frota?",
    })
  }

  list.push(IDEA_BOX)

  return list
}

const DEFAULT_VISIBLE = 6

/**
 * Escolhe até `maxVisible` atalhos distintos para exibir, variando com `sessionSeed`.
 */
export function pickQuickPromptsForSession(
  candidates: readonly AssistantQuickPrompt[],
  sessionSeed: number,
  maxVisible: number = DEFAULT_VISIBLE,
): AssistantQuickPrompt[] {
  if (candidates.length === 0) return []
  const rng = mulberry32(sessionSeed)
  const shuffled = shuffleWithRng([...candidates], rng)
  const cap = Math.min(maxVisible, shuffled.length)
  return shuffled.slice(0, cap)
}
