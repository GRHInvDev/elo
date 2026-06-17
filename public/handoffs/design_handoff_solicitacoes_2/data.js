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

// Usuário logado (visão cliente)
window.CURRENT_USER = { name: "Rafael Müller", sector: "Comercial", initials: "RM" };

// Solicitações do próprio usuário (visão cliente)
window.MY_REQUESTS = [
  {
    id: 1162, formId: "chamado-ti", form: "Chamado de atendimento de TI", sector: "TI",
    status: "IN_PROGRESS", assignee: "Equipe Dev", age: "há 3 horas", updated: "há 40 min", waiting: false,
    statusComment: "Técnico a caminho do galpão para verificar o ponto de rede.",
    fieldsData: [
      ["Categoria do atendimento", "Internet / Rede"],
      ["Local / estação", "Galpão 2 — baia 4"],
      ["Urgência", "Alta — operação parada"],
      ["Descrição", "O computador do recebimento parou de conectar na rede via cabo hoje cedo."],
    ],
    thread: [
      { who: "Rafael Müller", role: "Você", time: "08:12", msg: "Bom dia, o computador do recebimento parou de conectar na rede hoje cedo." },
      { who: "Equipe Dev", role: "Técnico", time: "08:40", msg: "Recebido, Rafael. Já estamos indo até o galpão verificar o cabeamento." },
    ],
  },
  {
    id: 1149, formId: "material", form: "Material de uso interno", sector: "Compras",
    status: "NOT_STARTED", assignee: null, age: "há 1 dia", updated: "há 1 dia", waiting: true,
    statusComment: "Aguardando aprovação do centro de custo informado.",
    fieldsData: [
      ["Categoria", "Escritório"],
      ["Item", "Papel sulfite A4 75g"],
      ["Quantidade", "5 resmas"],
      ["Centro de custo", "4.01 — Administrativo"],
    ],
    thread: [
      { who: "Rafael Müller", role: "Você", time: "Ontem 09:20", msg: "Acabou o papel A4 no financeiro, preciso de reposição." },
      { who: "Compras", role: "Setor", time: "Ontem 10:05", msg: "Para liberar precisamos confirmar o centro de custo. Pode validar com a gestão?" },
    ],
  },
  {
    id: 1131, formId: "mkt", form: "Solicitação ao Marketing", sector: "Marketing",
    status: "COMPLETED", assignee: "Caroline Doege", age: "há 4 dias", updated: "há 2 dias", waiting: false,
    statusComment: "Arte final entregue na pasta compartilhada do setor.",
    fieldsData: [
      ["Tipo de material", "Placa / sinalização"],
      ["Título da peça", "Sinalização de doca — Expedição"],
      ["Prazo desejado", "30/05/2026"],
    ],
    thread: [
      { who: "Rafael Müller", role: "Você", time: "12/05 14:02", msg: "Preciso de uma placa de sinalização nova para a doca de expedição." },
      { who: "Caroline Doege", role: "Marketing", time: "13/05 16:30", msg: "Arte aprovada e enviada para impressão. Arquivo final na pasta do setor." },
    ],
  },
  {
    id: 1175, formId: "infra", form: "Manutenção e/ou infraestrutura", sector: "Infraestrutura",
    status: "IN_PROGRESS", assignee: "Equipe Manutenção", age: "há 5 horas", updated: "há 2 horas", waiting: false,
    statusComment: "Peça solicitada ao fornecedor — prazo de 2 dias úteis.",
    fieldsData: [
      ["Tipo de serviço", "Elétrica"],
      ["Local", "Escritório central — sala 3"],
      ["Urgência", "Média"],
      ["Descrição", "Tomada da sala 3 sem energia, disjuntor desarmando."],
    ],
    thread: [
      { who: "Rafael Müller", role: "Você", time: "Hoje 09:10", msg: "A tomada da sala 3 está sem energia e o disjuntor desarma sozinho." },
      { who: "Equipe Manutenção", role: "Técnico", time: "Hoje 11:30", msg: "Identificamos o curto. Peça de reposição já solicitada ao fornecedor." },
    ],
  },
  {
    id: 1168, formId: "tec", form: "Implementação de tecnologia", sector: "TI",
    status: "NOT_STARTED", assignee: null, age: "há 2 dias", updated: "há 2 dias", waiting: false,
    statusComment: "Em análise de viabilidade pela equipe de tecnologia.",
    fieldsData: [
      ["Nome do sistema", "Painel de indicadores comerciais"],
      ["Origem", "Desenvolvimento interno"],
      ["Setores impactados", "Comercial, Financeiro"],
    ],
    thread: [
      { who: "Rafael Müller", role: "Você", time: "2 dias atrás", msg: "Gostaria de um painel para acompanhar indicadores do comercial em tempo real." },
    ],
  },
  {
    id: 1098, formId: "usuarios", form: "Usuários SIGIN / Windows / E-mails", sector: "TI",
    status: "COMPLETED", assignee: "Gilnei Wolf", age: "há 12 dias", updated: "há 11 dias", waiting: false,
    statusComment: "Usuário criado e credenciais enviadas por e-mail.",
    fieldsData: [
      ["Tipo de solicitação", "Criar usuário"],
      ["Colaborador", "Maria Eduarda Lopes"],
      ["Acessos", "Windows, E-mail, SIGIN"],
      ["Data de início", "26/05/2026"],
    ],
    thread: [
      { who: "Rafael Müller", role: "Você", time: "04/06 10:00", msg: "Nova colaboradora começa segunda, precisa dos acessos básicos." },
      { who: "Gilnei Wolf", role: "Técnico", time: "05/06 16:30", msg: "Usuário criado e credenciais enviadas. Qualquer coisa estou à disposição." },
    ],
  },
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

/* ============================================================
   Definição dos campos de cada formulário (visão responder)
   Espelha src/lib/form-types.ts:
   text | number | checkbox | formatted | combobox | file | textarea | dynamic
   ============================================================ */
const opt = (arr) => arr.map((v) => (typeof v === "string" ? { label: v, value: v } : v));

window.FORM_FIELDS = {
  "chamado-ti": [
    { name: "solicitante", type: "dynamic", dynamicType: "user_name", label: "Solicitante" },
    { name: "setor", type: "dynamic", dynamicType: "user_sector", label: "Setor" },
    { name: "categoria", type: "combobox", label: "Categoria do atendimento", required: true,
      placeholder: "Selecione a categoria",
      options: opt(["Internet / Rede", "Cabeamento", "Depósito", "Recebimento", "Setor de garantia", "Outro"]) },
    { name: "local", type: "text", label: "Local / estação de trabalho", required: true, placeholder: "Ex.: Galpão 2 — baia 4" },
    { name: "urgencia", type: "combobox", label: "Urgência", required: true, placeholder: "Selecione a urgência",
      options: opt(["Baixa", "Média", "Alta — operação parada"]) },
    { name: "descricao", type: "textarea", label: "Descreva o problema", required: true, rows: 4,
      placeholder: "Conte o que está acontecendo, desde quando, e o que já tentou.",
      helpText: "Quanto mais detalhes, mais rápido conseguimos resolver." },
    { name: "anexo", type: "file", label: "Anexar foto ou print", acceptedFileTypes: ".pdf,.jpg,.png", multipleFiles: true },
  ],
  mkt: [
    { name: "solicitante", type: "dynamic", dynamicType: "user_name", label: "Solicitante" },
    { name: "setor", type: "dynamic", dynamicType: "user_sector", label: "Setor" },
    { name: "tipo", type: "combobox", label: "Tipo de material", required: true, placeholder: "Selecione o tipo",
      options: opt(["Adesivo", "Placa / sinalização", "Organização de evento", "Brinde", "Arte para redes", "Outro"]) },
    { name: "titulo", type: "text", label: "Título da peça / evento", required: true, placeholder: "Ex.: Sinalização da nova doca" },
    { name: "briefing", type: "textarea", label: "Briefing", required: true, rows: 4,
      placeholder: "Objetivo, público, mensagem principal, formato e medidas." },
    { name: "prazo", type: "text", label: "Prazo desejado", required: true, placeholder: "dd/mm/aaaa" },
    { name: "referencias", type: "file", label: "Referências (opcional)", acceptedFileTypes: ".pdf,.jpg,.png", multipleFiles: true },
  ],
  material: [
    { name: "solicitante", type: "dynamic", dynamicType: "user_name", label: "Solicitante" },
    { name: "setor", type: "dynamic", dynamicType: "user_sector", label: "Setor" },
    { name: "categoria", type: "combobox", label: "Categoria", required: true, placeholder: "Selecione a categoria",
      options: opt(["Escritório", "Limpeza", "EPIs", "Eletrônicos", "Embalagens"]) },
    { name: "item", type: "text", label: "Item", required: true, placeholder: "Ex.: Papel sulfite A4 75g" },
    { name: "quantidade", type: "number", label: "Quantidade", required: true, min: 1, placeholder: "0" },
    { name: "unidade", type: "combobox", label: "Unidade", required: true, placeholder: "Selecione a unidade",
      options: opt(["Unidade", "Caixa", "Pacote", "Resma", "Litro", "Par"]) },
    { name: "centro", type: "text", label: "Centro de custo", placeholder: "Ex.: 4.01 — Administrativo" },
    { name: "justificativa", type: "textarea", label: "Justificativa", rows: 3, placeholder: "Para que será usado este material?" },
    { name: "urgente", type: "checkbox", label: "Compra urgente", placeholder: "Marcar como urgente (ruptura de estoque)" },
  ],
  tec: [
    { name: "solicitante", type: "dynamic", dynamicType: "user_name", label: "Solicitante" },
    { name: "setor", type: "dynamic", dynamicType: "user_sector", label: "Setor" },
    { name: "nome", type: "text", label: "Nome do app / sistema", required: true, placeholder: "Como o sistema deve se chamar?" },
    { name: "origem", type: "combobox", label: "Origem", required: true, placeholder: "Selecione a origem",
      options: opt(["Desenvolvimento interno", "Fornecedor externo", "Ainda não definido"]) },
    { name: "objetivo", type: "textarea", label: "Objetivo da implementação", required: true, rows: 4,
      placeholder: "Qual problema esse sistema resolve? Quem vai usar?" },
    { name: "setores", type: "combobox", label: "Setores impactados", multiple: true, placeholder: "Selecione os setores",
      options: opt(["TI", "Comercial", "Financeiro", "Expedição", "RH", "Compras", "Marketing"]) },
    { name: "meta", type: "text", label: "Prazo / meta", placeholder: "dd/mm/aaaa" },
  ],
  infra: [
    { name: "solicitante", type: "dynamic", dynamicType: "user_name", label: "Solicitante" },
    { name: "setor", type: "dynamic", dynamicType: "user_sector", label: "Setor" },
    { name: "tipo", type: "combobox", label: "Tipo de serviço", required: true, placeholder: "Selecione o tipo",
      options: opt(["Predial", "Elétrica", "Hidráulica", "Conserto de equipamento", "Outro"]) },
    { name: "local", type: "text", label: "Local", required: true, placeholder: "Unidade / setor / sala" },
    { name: "urgencia", type: "combobox", label: "Urgência", required: true, placeholder: "Selecione a urgência",
      options: opt(["Baixa", "Média", "Alta"]) },
    { name: "descricao", type: "textarea", label: "Descrição do problema", required: true, rows: 4,
      placeholder: "Descreva o que precisa de manutenção." },
    { name: "ramal", type: "formatted", formattedType: "phone", label: "Ramal / telefone para contato", placeholder: "(00) 00000-0000" },
    { name: "risco", type: "checkbox", label: "Risco à segurança", placeholder: "Há risco à segurança das pessoas" },
    { name: "foto", type: "file", label: "Foto do local (opcional)", acceptedFileTypes: ".jpg,.png", multipleFiles: true },
  ],
  usuarios: [
    { name: "solicitante", type: "dynamic", dynamicType: "user_name", label: "Solicitante" },
    { name: "tipo", type: "combobox", label: "Tipo de solicitação", required: true, placeholder: "Selecione o tipo",
      options: opt(["Criar usuário", "Ajustar acessos", "Desativar usuário", "Redefinir senha"]) },
    { name: "colaborador", type: "text", label: "Nome do colaborador", required: true, placeholder: "Nome completo" },
    { name: "cargo", type: "text", label: "Cargo / função", required: true, placeholder: "Ex.: Assistente financeiro" },
    { name: "acessos", type: "combobox", label: "Acessos necessários", multiple: true, placeholder: "Selecione os acessos",
      options: opt(["SIGIN", "Windows", "E-mail corporativo", "VPN"]) },
    { name: "setorColab", type: "text", label: "Setor do colaborador", required: true, placeholder: "Ex.: Financeiro" },
    { name: "inicio", type: "text", label: "Data de início", placeholder: "dd/mm/aaaa" },
  ],
};
