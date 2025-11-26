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