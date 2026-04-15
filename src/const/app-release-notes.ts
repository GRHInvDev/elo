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
      "**Assistente de IA**: ferramentas **Ideias em ação** — listar suas ideias e status (**listMyIdeas**), ver detalhes pelo número (**getMyIdeaByNumber**) e **registrar nova ideia** com confirmação (**createMyIdea**), alinhado ao formulário da intranet.",
    ],
  },
  {
    version: "1.16.0",
    date: "Abril de 2026",
    items: [
      "**Gestão de ideias**: aba **Dashboard** ao lado de **Ideias** — visão por avaliador com gráficos (volume por status, distribuição por área), taxas de aprovação e de uso de IA (autores e Morrison), previsão simples por área (90 dias), total pago registrado e resumo Morrison por área.",
    ],
  },
  {
    version: "1.15.0",
    date: "Abril de 2026",
    items: [
      "**Gestão de ideias**: botão **Gerar KPIs (IA)** na seção de KPIs do modal — sugere indicadores de sucesso a partir da ideia completa, reutilizando KPIs ativos do catálogo ou criando novos quando fizer sentido.",
    ],
  },
  {
    version: "1.14.0",
    date: "Abril de 2026",
    items: [
      "**Gestão de ideias**: botão **Sugerir classificações (IA)** no modal de avaliação — preenche textos e notas 0–10 de Impacto, Capacidade e Esforço com base na ideia, nos rótulos cadastrados, no rascunho do gestor e nas últimas avaliações completas feitas por ele.",
    ],
  },
  {
    version: "1.13.0",
    date: "Abril de 2026",
    items: [
      "**Ideias em ação**: botão **Aprimorar com IA** no problema e na solução, com comparação lado a lado, ajuste por prompt e envio do texto original para auditoria.",
      "**Gestão de ideias**: etiquetas **Refinado com IA** e campo **Sugestão da ideia (Morrison)** com análise auxiliar para avaliadores (Azure OpenAI).",
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
