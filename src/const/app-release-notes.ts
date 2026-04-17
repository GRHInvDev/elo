/**
 * Histórico de novidades exibido no diálogo "Novidades" da intranet.
 * Lista apenas marcos **major** (quando existirem) e **minors** com impacto de produto — sem patches.
 * `APP_CURRENT_VERSION` segue o package.json (MMP completo).
 */
export const APP_CURRENT_VERSION = "1.17.2" as const

export interface AppReleaseNote {
  /** Versão semântica do marco (minor.0 ou major.0) */
  version: string
  /** Data de referência (texto livre, pt-BR) */
  date: string
  /** Destaques principais */
  items: string[]
}

/**
 * Ordem: mais recente primeiro.
 * Incluir somente releases **major** ou **minor** com entrega visível ao usuário.
 */
export const APP_RELEASE_NOTES: AppReleaseNote[] = [
  {
    version: "1.17.0",
    date: "Abril de 2026",
    items: [
      "**Assistente de IA**: ferramentas **Ideias em ação** — listar suas ideias e status, ver detalhes pelo número e registrar nova ideia com confirmação, alinhado ao formulário da intranet.",
    ],
  },
  {
    version: "1.16.0",
    date: "Abril de 2026",
    items: [
      "**Gestão de ideias**: aba **Dashboard** ao lado de **Ideias** — visão por avaliador com gráficos, taxas de aprovação e de uso de IA, previsão simples por área (90 dias), total pago registrado e resumo Morrison por área.",
    ],
  },
  {
    version: "1.15.0",
    date: "Abril de 2026",
    items: [
      "**Gestão de ideias**: novas funcionalidades com uso integrado de IA.",
    ],
  },
  {
    version: "1.14.0",
    date: "Abril de 2026",
    items: [
      "**Gestão de ideias**: novas funcionalidades com uso integrado de IA.",
    ],
  },
  {
    version: "1.13.0",
    date: "Abril de 2026",
    items: [
      "**Ideias em ação**: botão **Aprimorar com IA** no problema e na solução, com comparação lado a lado, ajuste por prompt e envio do texto original para auditoria.",
      "**Gestão de ideias**: novas funcionalidades com uso integrado de IA",
    ],
  },
  {
    version: "1.12.0",
    date: "Abril de 2026",
    items: [
      "**Hall de Entrada**: espaço para acompanhar contratações com **transparência dos times**.",
    ],
  },
  {
    version: "1.11.0",
    date: "Abril de 2026",
    items: [
      "**Assistente de IA** na intranet: chat com ferramentas (salas, frota, pedido de refeição, cardápio, colegas, formulários e mais)",
      "**Experiência do chat**: atalhos rápidos, layout do painel, markdown e cartões de ferramentas; indicador de resposta e ajustes de uso no dia a dia.",
      "**Novidades do elo**: diálogo de lançamentos e novidades no app.",
    ],
  },
  {
    version: "1.10.0",
    date: "2026",
    items: [
      "**Persistência da conversa** do assistente por usuário (sessão sincronizada com a base).",
      "**Chat flutuante** e painel integrados ao layout autenticado.",
    ],
  },
]
