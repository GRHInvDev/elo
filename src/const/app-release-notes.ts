/**
 * Histórico de novidades exibido no diálogo "Novidades" da intranet.
 * Lista apenas marcos **major** (quando existirem) e **minors** com impacto de produto — sem patches.
 * `APP_CURRENT_VERSION` segue o package.json (MMP completo).
 */
export const APP_CURRENT_VERSION = "1.33.0" as const;

export interface AppReleaseNote {
  /** Versão semântica do marco (minor.0 ou major.0) */
  version: string;
  /** Data de referência (texto livre, pt-BR) */
  date: string;
  /** Destaques principais */
  items: string[];
}

/**
 * Ordem: mais recente primeiro.
 * Incluir somente releases **major** ou **minor** com entrega visível ao usuário.
 */
export const APP_RELEASE_NOTES: AppReleaseNote[] = [
  {
    version: "1.33.0",
    date: "Junho de 2026",
    items: [
      "**Lista de usuários mais prática**: a tela de Usuários agora mostra todo mundo em forma de lista (em vez de cartões grandes), com filtros por setor, empresa, filial e situação (ativos ou desativados). Para editar alguém, é só clicar em **Gerenciar** e abrir a janela com todos os detalhes.",
      "**Busca que entende acentos**: ao procurar por nome, não precisa se preocupar com acentuação — buscar por \"Maira\" encontra \"Máira\", \"Maíra\" e por aí vai.",
      "**Histórico de movimentações**: dentro de cada usuário há uma aba **Movimentações** que mostra tudo o que foi alterado no cadastro (dados, permissões, filial, ramal) e quando a pessoa foi desativada ou reativada — com data e quem fez a mudança.",
      "**Conta desativada sem acesso**: quem está com o cadastro desativado não consegue mais entrar nem visualizar nada na plataforma; ao tentar acessar, vê um aviso explicando a situação.",
      "**Relatório de almoços mais certo**: no relatório por empresa e setor, cada setor aparece agora em uma única linha por empresa — antes um mesmo setor (como Logística) podia aparecer dividido em duas linhas.",
    ],
  },
  {
    version: "1.32.0",
    date: "Junho de 2026",
    items: [
      "**DRE mostra a empresa de verdade**: o relatório de resultado passou a exibir o nome da empresa cadastrada (em vez da sigla antiga), deixando os agrupamentos mais claros.",
      "**Busca por e-mail nos pedidos**: a lista de pedidos ganhou um campo dedicado para buscar pelo e-mail do colaborador, separado da busca por nome.",
    ],
  },
  {
    version: "1.31.0",
    date: "Junho de 2026",
    items: [
      "**Empresa e filial juntas no cadastro**: ao completar o perfil e na tela de Usuários, agora você escolhe a empresa e, em seguida, a filial — o vínculo fica certinho automaticamente.",
    ],
  },
  {
    version: "1.30.0",
    date: "Junho de 2026",
    items: [
      "**Relatório DRE mais detalhado**: no relatório de resultado por empresa e setor, agora é só clicar em uma linha para abrir a lista das pessoas daquele grupo — com o nome, a empresa, o setor e o valor de cada pedido.",
      "**Vá direto ao pedido**: ao lado de cada pessoa há um botão que leva você direto para a aba de Pedidos já filtrada por aquela pessoa e data, facilitando achar o pedido exato.",
    ],
  },
  {
    version: "1.29.0",
    date: "Maio de 2026",
    items: [
      "**Solicitações com cara nova**: o módulo de Solicitações ganhou um visual moderno, mais leve e organizado — busca rápida pelo tipo de solicitação, filtros por setor e um painel lateral com as solicitações que você já abriu.",
      "**Veja os detalhes antes de abrir**: ao clicar em um tipo de solicitação, uma janela do lado direito mostra o que vai ser pedido, qual setor responde e quantos campos tem o formulário — sem precisar abrir e fechar a tela.",
      "**Central de chamados para quem atende**: um espaço novo para quem responde solicitações, com fila de chamados, conversa do lado e botões para mudar o andamento sem trocar de página. Acesse pelo botão **Central de chamados** no topo da página.",
      "**Liga e desliga o novo visual**: o botão **Novo layout** no canto superior direito troca entre o visual atualizado e o visual antigo. Cada pessoa escolhe o que prefere — começamos com o visual antigo ativado para todos.",
    ],
  },
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
      '**Empresas independentes para filiais**: agora é possível criar empresas personalizadas (como "Box Teste" ou "Cristallux SP") e vincular cada filial diretamente a uma delas — sem mais depender de categorias fixas do sistema.',
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
];
