/* ============================================================
   Mock data — Módulo de Solicitações (Grupo R Henz / elo)
   Derivado das telas reais. Não é dado de produção.
   ============================================================ */

// Catálogo de tipos de solicitação (visão cliente)
window.FORMS = [
  {
    id: "mkt",
    title: "Solicitação ao Marketing",
    sector: "Marketing",
    fields: 7,
    sla: "2 dias úteis",
    open: 4,
    desc: "Solicitações diversas ao MKT: adesivo, placa, organização de eventos, etc.",
  },
  {
    id: "material",
    title: "Material de uso interno",
    sector: "Compras",
    fields: 9,
    sla: "3 dias úteis",
    open: 9,
    desc: "Compra de materiais para uso e consumo interno: escritório, limpeza, EPIs, eletrônicos, embalagens.",
  },
  {
    id: "tec",
    title: "Implementação de tecnologia",
    sector: "TI",
    fields: 7,
    sla: "5 dias úteis",
    open: 2,
    desc: "Solicitações para implementação de aplicativos de desenvolvimento interno ou de fornecedores externos.",
  },
  {
    id: "infra",
    title: "Manutenção e/ou infraestrutura",
    sector: "Infraestrutura",
    fields: 9,
    sla: "2 dias úteis",
    open: 6,
    desc: "Manutenção predial, elétrica, hidráulica e conserto de equipamentos.",
  },
  {
    id: "chamado-ti",
    title: "Chamado de atendimento de TI",
    sector: "TI",
    fields: 7,
    sla: "4 horas",
    open: 18,
    desc: "Atendimento de TI: internet, cabeamento, depósito, recebimento e setor de garantia.",
    popular: true,
  },
  {
    id: "usuarios",
    title: "Usuários SIGIN / Windows / E-mails",
    sector: "TI",
    fields: 7,
    sla: "1 dia útil",
    open: 3,
    desc: "Criação e ajuste de contas de usuário: SIGIN, Windows e e-mail corporativo.",
  },
];

// Solicitações do próprio usuário (visão cliente)
window.MY_REQUESTS = [
  { id: 1162, form: "Chamado de atendimento de TI", status: "IN_PROGRESS", assignee: "Equipe Dev", age: "há 3 horas", waiting: false },
  { id: 1149, form: "Material de uso interno", status: "NOT_STARTED", assignee: null, age: "há 1 dia", waiting: true },
  { id: 1131, form: "Solicitação ao Marketing", status: "COMPLETED", assignee: "Caroline Doege", age: "há 4 dias", waiting: false },
  { id: 1098, form: "Usuários SIGIN / Windows / E-mails", status: "COMPLETED", assignee: "Gilnei Wolf", age: "há 12 dias", waiting: false },
];

// Fila de chamados (visão técnico)
window.TICKETS = [
  {
    id: 1159, form: "Chamado de atendimento de TI", sector: "TI", status: "NOT_STARTED",
    priority: "high", requester: "Jozimar Daniel Haag", initials: "JH", assignee: null,
    age: "há 17 horas", sla: "Vence em 2h", slaRisk: true, isNew: true,
    summary: "Computador do recebimento não conecta na rede via cabo.",
    fieldsData: [
      ["Setor", "Recebimento — Depósito"],
      ["Equipamento", "Desktop Dell OptiPlex 3070"],
      ["Tipo de problema", "Sem internet via cabo"],
      ["Urgência", "Alta — operação parada"],
      ["Local", "Galpão 2, baia 4"],
    ],
    thread: [
      { who: "Jozimar Daniel Haag", role: "Solicitante", time: "08:12", msg: "Bom dia, o computador do recebimento parou de conectar na rede hoje cedo." },
    ],
  },
  {
    id: 1158, form: "Chamado de atendimento de TI", sector: "TI", status: "IN_PROGRESS",
    priority: "medium", requester: "Luana De Mello H", initials: "LM", assignee: "Equipe Dev",
    age: "há 19 horas", sla: "Dentro do prazo", slaRisk: false, isNew: true, tag: "Equipe Dev",
    summary: "Sistema de etiquetas travando ao gerar lote acima de 200 itens.",
    fieldsData: [
      ["Setor", "Expedição"],
      ["Sistema", "Gerador de etiquetas"],
      ["Comportamento", "Trava ao gerar lote > 200"],
      ["Frequência", "Diária"],
    ],
    thread: [
      { who: "Luana De Mello H", role: "Solicitante", time: "Ontem 14:02", msg: "O gerador trava quando o lote passa de 200 etiquetas." },
      { who: "Gilnei Wolf", role: "Equipe Dev", time: "Ontem 15:20", msg: "Conseguimos reproduzir aqui. Investigando o limite de memória do processo." },
    ],
  },
  {
    id: 1155, form: "Chamado de atendimento de TI", sector: "TI", status: "IN_PROGRESS",
    priority: "low", requester: "Gilnei Wolf", initials: "GW", assignee: "Gilnei Wolf",
    age: "há 1 dia", sla: "Dentro do prazo", slaRisk: false, tag: "Equipe Dev",
    summary: "Solicitação de acesso ao painel de relatórios de vendas.",
    fieldsData: [
      ["Setor", "Comercial"],
      ["Acesso", "Painel de relatórios de vendas"],
      ["Justificativa", "Acompanhamento de metas mensais"],
    ],
    thread: [
      { who: "Gilnei Wolf", role: "Solicitante", time: "Ontem 09:40", msg: "Preciso de acesso ao painel de relatórios para acompanhar metas." },
    ],
  },
  {
    id: 1156, form: "Usuários SIGIN / Windows / E-mails", sector: "TI", status: "COMPLETED",
    priority: "medium", requester: "Caroline Doege", initials: "CD", assignee: "Caroline Doege",
    age: "há 22 horas", sla: "Concluído", slaRisk: false, isNew: true,
    summary: "Criação de usuário Windows e e-mail para nova colaboradora.",
    fieldsData: [
      ["Colaborador", "Maria Eduarda Lopes"],
      ["Setor", "Financeiro"],
      ["Acessos", "Windows, E-mail, SIGIN"],
      ["Data de início", "26/05/2026"],
    ],
    thread: [
      { who: "Caroline Doege", role: "Solicitante", time: "Ontem 10:00", msg: "Nova colaboradora começa segunda, precisa dos acessos." },
      { who: "Equipe Dev", role: "Técnico", time: "Ontem 16:30", msg: "Usuário criado e credenciais enviadas. Chamado concluído." },
    ],
  },
  {
    id: 1154, form: "Chamado de atendimento de TI", sector: "TI", status: "COMPLETED",
    priority: "low", requester: "Caroline Doege", initials: "CD", assignee: "Caroline Doege",
    age: "há 1 dia", sla: "Concluído", slaRisk: false,
    summary: "Impressora do RH sem comunicação com o servidor de impressão.",
    fieldsData: [
      ["Setor", "RH"],
      ["Equipamento", "Impressora HP LaserJet"],
      ["Problema", "Sem comunicação com servidor"],
    ],
    thread: [
      { who: "Caroline Doege", role: "Solicitante", time: "2 dias atrás", msg: "A impressora do RH parou de imprimir." },
      { who: "Gilnei Wolf", role: "Técnico", time: "Ontem 11:15", msg: "Reinstalado driver e fila de impressão. Funcionando." },
    ],
  },
  {
    id: 1152, form: "Chamado de atendimento de TI", sector: "TI", status: "NOT_STARTED",
    priority: "medium", requester: "Lenilson Fonseca", initials: "LF", assignee: null,
    age: "há 1 dia", sla: "Vence em 6h", slaRisk: false,
    summary: "Telefone IP do setor de garantia sem linha.",
    fieldsData: [
      ["Setor", "Garantia"],
      ["Equipamento", "Telefone IP Grandstream"],
      ["Problema", "Sem linha / sem tom"],
    ],
    thread: [
      { who: "Lenilson Fonseca", role: "Solicitante", time: "Ontem 13:50", msg: "O telefone da garantia está sem linha desde ontem." },
    ],
  },
  {
    id: 1145, form: "Material de uso interno", sector: "Compras", status: "NOT_STARTED",
    priority: "low", requester: "Ana Beatriz Kunz", initials: "AK", assignee: null,
    age: "há 2 dias", sla: "Vence em 1 dia", slaRisk: false,
    summary: "Reposição de material de escritório para o setor financeiro.",
    fieldsData: [
      ["Setor", "Financeiro"],
      ["Itens", "Papel A4, canetas, grampeador"],
      ["Quantidade", "5 resmas, 2 cx canetas"],
    ],
    thread: [
      { who: "Ana Beatriz Kunz", role: "Solicitante", time: "2 dias atrás", msg: "Acabou o papel A4 no financeiro." },
    ],
  },
];

// Contadores de coluna (do kanban real)
window.BOARD_COUNTS = { NOT_STARTED: 18, IN_PROGRESS: 21, COMPLETED: 746 };

window.STATUS_META = {
  NOT_STARTED: { label: "Não iniciado", short: "Não iniciado", tone: "neutral" },
  IN_PROGRESS: { label: "Em progresso", short: "Em progresso", tone: "active" },
  COMPLETED: { label: "Concluído", short: "Concluído", tone: "done" },
};

window.PRIORITY_META = {
  high: { label: "Alta", tone: "high" },
  medium: { label: "Média", tone: "medium" },
  low: { label: "Baixa", tone: "low" },
};
