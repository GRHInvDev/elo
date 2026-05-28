/**
 * Histórico de novidades exibido no diálogo "Novidades" da intranet.
 * Lista apenas marcos **major** (quando existirem) e **minors** com impacto de produto — sem patches.
 * `APP_CURRENT_VERSION` segue o package.json (MMP completo).
 */
export const APP_CURRENT_VERSION = "1.28.0" as const

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
    version: "1.28.0",
    date: "Maio de 2026",
    items: [
      "**Almoços com novo design**: a página de pedidos de almoço ganhou uma aparência mais moderna e bonita — botões com efeitos, passo a passo mais claro, cores mais agradáveis, e tudo funciona melhor no celular.",
      "**Ajustes para mobile**: os almoços ficam mais fáceis de pedir no celular, com botões maiores, melhor espaçamento e navegação mais intuitiva.",
    ],
  },
  {
    version: "1.26.0",
    date: "Maio de 2026",
    items: [
      "**Restaurante por filial**: agora é possível vincular um restaurante a uma filial específica ao criar ou editar — facilitando a organização e os filtros por unidade.",
    ],
  },
  {
    version: "1.25.0",
    date: "Maio de 2026",
    items: [
      "**Empresas independentes para filiais**: agora é possível criar empresas personalizadas (como \"Box Teste\" ou \"Cristallux SP\") e vincular cada filial diretamente a uma delas — sem mais depender de categorias fixas do sistema.",
    ],
  },
  {
    version: "1.24.0",
    date: "Maio de 2026",
    items: [
      "**Régua de Emoções com pontuação por nível**: agora cada opção de resposta tem sua própria quantidade de pontos — quem responde \"Ótimo\" pode ganhar mais ou menos pontos do que quem responde \"Mal\", conforme configurado pelo administrador.",
      "**Nome personalizado nos níveis**: o administrador pode dar um nome próprio para cada nível da régua (como \"Muito Bem\" ou \"Arrasando!\") em vez do padrão \"Nível 0\", \"Nível 1\".",
    ],
  },
  {
    version: "1.23.0",
    date: "Maio de 2026",
    items: [
      "**Desativar usuários**: agora é possível desativar um colaborador diretamente na lista de usuários — ele perde o acesso ao sistema imediatamente, sem precisar excluí-lo. Um clique em 'Reativar' devolve o acesso quando necessário.",
    ],
  },
  {
    version: "1.21.0",
    date: "Maio de 2026",
    items: [
      "**Relatório DRE**: você pode filtrar por restaurante e por filial, e escolher se os números aparecem por empresa e setor, por restaurante ou por filial — para bater o rateio com o jeito que você prefere analisar.",
    ],
  },
  {
    version: "1.20.0",
    date: "Maio de 2026",
    items: [
      "**Filiais por empresa**: cada filial fica ligada à empresa certa; na hora de escolher a unidade, só aparecem as opções que combinam com o tipo de empresa do colaborador.",
      "**Cadastro de filiais**: quem administra informa a empresa da filial ao criar ou editar, para manter tudo organizado.",
    ],
  },
  {
    version: "1.19.0",
    date: "Abril de 2026",
    items: [
      "**Filiais no dia a dia**: agora o onboarding pede a filial logo no primeiro acesso, e o time de gestão pode organizar filiais e colaboradores em um só lugar.",
      "**Busca de colaboradores mais leve**: a lista de pessoas por filial ficou mais rápida para navegar, mesmo com muitos usuários.",
    ],
  },
  {
    version: "1.18.0",
    date: "Abril de 2026",
    items: [
      "**Gerenciamento de filiais**: nova página de administração para criar, editar e deletar filiais da empresa. Atribua usuários a filiais com facilidade e visualize os colaboradores por unidade.",
    ],
  },
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
