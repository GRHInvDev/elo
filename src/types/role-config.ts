export type RolesConfig = {
  sudo: boolean; // Se true, dá acesso total ao sistema
  admin_pages: string[]; // Páginas admin permitidas (apenas para sudos)

  // SISTEMA SIMPLIFICADO: Apenas permissões de criação
  // Todos podem VISUALIZAR tudo, apenas alguns podem CRIAR
  can_create_form: boolean;    // Pode criar formulários
  can_create_event: boolean;   // Pode criar eventos
  can_create_flyer: boolean;   // Pode criar encartes
  can_create_booking: boolean; // Pode fazer agendamentos de salas
  can_locate_cars: boolean;    // Pode fazer agendamentos de carros
  can_create_solicitacoes: boolean; // Pode criar chamados/solicitações manualmente

  // Controle de visibilidade de formulários
  visible_forms?: string[];    // IDs dos formulários que o usuário pode ver (vazio = todos públicos)
  hidden_forms?: string[];     // IDs dos formulários que o usuário NÃO pode ver

  // Permissões específicas de administração
  can_view_dre_report: boolean; // Pode visualizar relatório DRE (Demonstrativo de Resultados do Exercício)
  can_manage_extensions?: boolean; // Pode alterar ramais de usuários
  can_manage_dados_basicos_users?: boolean; // Pode editar apenas dados básicos de usuários (sem permissões avançadas)
  can_manage_produtos?: boolean; // Pode gerenciar produtos da loja (criar, editar, deletar)
  can_manage_quality_management?: boolean; // Pode gerenciar a lista mestra de documentos de qualidade
  can_manage_emotion_rules?: boolean; // Pode gerenciar réguas de emoções (criar, editar, deletar, visualizar estatísticas)
  can_manage_new_users_hall?: boolean; // Pode gerenciar o Hall de entrada (novos colaboradores)
  can_manage_filial?: boolean; // Pode gerenciar filiais (criar, editar, deletar)
  can_view_answer_without_admin_access?: boolean; // Pode visualizar/responder mensagens e atualizar estados de pedidos sem acesso admin completo
  can_view_add_manual_ped?: boolean; // Pode visualizar e adicionar pedidos manuais de alimentação
  can_view_dados_privados?: boolean; // Pode visualizar e editar dados privados/LGPD de usuários (ex.: pré-cadastro Lojinha)

  isTotem?: boolean; // Para usuários TOTEM (acesso limitado)
}

/*
⠀⠀⠀⠀⠀⠀⣀⣤⣶⣶⣿⢿⣿⣿⣷⣶⣦⣤⡀⠀
⠀⠀⢾⡻⣶⣾⣿⣿⣛⣻⣮⡉⣿⣿⣿⠟⠋⠉⠀⠀
⠀⠀⢸⢿⢿⣿⡿⠁⣀⠀⢛⣿⣿⣿⣷⣦⣄⠀⠀⠀
⠀⠀⢸⠈⣿⣿⠁⠀⣿⡇⢸⡏⢻⣿⣿⣿⣿⣷⡄⠀
⠀⠀⢰⣦⣝⠁⡀⠀⢙⠡⠚⠣⣾⣿⡿⠿⠿⠿⢿⡄
⠀⠀⠀⠈⠡⡀⠀⠀⠀⠄⠚⣰⣿⣿⣷⡄⠀⠀⠀⠀
⠀⠀⠀⢀⡔⡈⡲⠂⠰⠶⢟⡉⠿⢿⣿⣧⠀⠀⠀⠀
⠀⠀⠀⠫⣓⠣⢀⡣⡀⠀⡔⣹⣧⠀⠉⠃⠀⠀⠀⠀
⠀⠀⠀⠀⠑⢄⣀⣀⣶⣶⠟⠛⠿⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣿⡏⢿⡏⠓⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢠⠉⠻⠏⣺⣷⠔⡄⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢀⣤⡒⢤⣀⡆⠀⠀⠀⢐⠀⠀⠀⠀⠀⠀⠀⠀
⢀⡾⣋⣵⣾⡀⣿⣿⣶⢂⡌⣍⠆⠀⠀⠀⠀⠀⠀⠀
⠘⠛⠛⠛⠛⠃⠉⠙⢏⣾⣧⢹⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀ ⠀⠀⠙⠿⣾⡏⠀⠀⠀⠀⠀⠀⠀
*/