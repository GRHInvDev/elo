/**
 * Histórico de novidades exibido no diálogo "Novidades" da intranet.
 * Lista apenas marcos **major** (quando existirem) e **minors** com impacto de produto — sem patches.
 * `APP_CURRENT_VERSION` segue o package.json (MMP completo).
 */
export const APP_CURRENT_VERSION = "1.11.9" as const

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
    version: "1.11.0",
    date: "Abril de 2026",
    items: [
      "**Assistente de IA** na intranet: chat com ferramentas (salas, frota, pedido de refeição, cardápio, colegas, formulários e mais), fluxos guiados com confirmação e integração **Azure OpenAI**.",
      "**Experiência do chat**: atalhos rápidos, layout do painel, markdown e cartões de ferramentas; indicador de resposta e ajustes de uso no dia a dia.",
      "**Novidades do elo**: diálogo de release notes no app e celebração com confetti ao abrir.",
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
