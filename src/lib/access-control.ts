import { type RolesConfig } from "@/types/role-config";
import { hasAccessToAdminRoute } from "@/const/admin-routes";

export function hasAdminAccess(roleConfig: RolesConfig | null, route: string): boolean {
  if (!roleConfig) return false;
  
  // Se é sudo, tem acesso a tudo
  if (roleConfig.sudo) return true;
  
  // Usa a função centralizada para verificar acesso
  return hasAccessToAdminRoute(roleConfig.admin_pages || [], route);
}

export function canCreateForm(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;
  
  // Se é sudo, pode criar formulários
  if (roleConfig.sudo) return true;
  
  // Verifica permissão específica de criação
  return roleConfig.can_create_form;
}

export function canCreateEvent(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode criar eventos
  if (roleConfig.sudo) return true;

  // Verifica permissão específica de criação
  return roleConfig.can_create_event;
}

export function canCreateFlyer(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode criar encartes
  if (roleConfig.sudo) return true;

  // Verifica permissão específica de criação
  return roleConfig.can_create_flyer;
}

export function canCreateBooking(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode fazer agendamentos
  if (roleConfig.sudo) return true;

  // Verifica permissão específica de criação
  return roleConfig.can_create_booking;
}

export function canLocateCars(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode fazer agendamentos de carros
  if (roleConfig.sudo) return true;

  // Verifica permissão específica de criação
  return roleConfig.can_locate_cars;
}

/** Gestão do Hall de entrada (comunicação de novos colaboradores) */
export function canManageNewUsersHall(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;
  if (roleConfig.sudo) return true;
  return roleConfig.can_manage_new_users_hall === true;
}

export function canCreateSolicitacoes(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode criar solicitações
  if (roleConfig.sudo) return true;

  // Verifica permissão específica
  return roleConfig.can_create_solicitacoes ?? false;
}

// SISTEMA SIMPLIFICADO: Todos podem visualizar tudo
export function canViewShop(): boolean {
  return true;
}

export function canViewForms(roleConfig: RolesConfig | null): boolean {
  // Todos podem visualizar formulários, exceto usuários TOTEM
  if (!roleConfig) return false;
  return !roleConfig.isTotem;
}

export function canViewEvents(roleConfig: RolesConfig | null): boolean {
  // Todos podem visualizar eventos, exceto usuários TOTEM
  if (!roleConfig) return false;
  return !roleConfig.isTotem;
}

export function canViewFlyers(roleConfig: RolesConfig | null): boolean {
  // Todos podem visualizar encartes, exceto usuários TOTEM
  if (!roleConfig) return false;
  return !roleConfig.isTotem;
}

export function canViewRooms(roleConfig: RolesConfig | null): boolean {
  // Todos podem visualizar salas, exceto usuários TOTEM
  if (!roleConfig) return false;
  return !roleConfig.isTotem;
}

export function canViewCars(roleConfig: RolesConfig | null): boolean {
  // Todos podem visualizar carros, exceto usuários TOTEM
  if (!roleConfig) return false;
  return !roleConfig.isTotem;
}

/**
 * Verifica se o usuário pode acessar um formulário específico
 * 
 * Um usuário pode acessar um formulário se:
 * 1. É o criador do formulário
 * 2. O formulário não é privado (todos podem ver, exceto TOTEMs)
 * 3. O formulário é privado mas o usuário está em allowedUsers ou allowedSectors
 * 4. O formulário não está na lista de hidden_forms do usuário
 * 
 * @param roleConfig - Configuração de roles do usuário
 * @param formId - ID do formulário
 * @param userId - ID do usuário
 * @param form - Dados do formulário (userId, isPrivate, allowedUsers, allowedSectors)
 * @param userSetor - Setor do usuário (opcional)
 * @returns true se o usuário pode acessar o formulário
 */
export function canAccessForm(
  roleConfig: RolesConfig | null,
  formId: string,
  userId: string | null | undefined,
  form: {
    userId: string;
    isPrivate?: boolean | null;
    allowedUsers?: string[] | null;
    allowedSectors?: string[] | null;
  },
  userSetor?: string | null
): boolean {
  if (!roleConfig || !userId) return false;

  // TOTEMs não podem acessar
  if (roleConfig.isTotem) return false;

  // Se é o criador do formulário, sempre tem acesso
  if (form.userId === userId) return true;

  // Se o formulário é privado, verificar permissões específicas
  if (form.isPrivate) {
    // Verificar se o formulário está na lista de ocultos
    if (roleConfig.hidden_forms?.includes(formId)) return false;

    // Verificar se o usuário está na lista de usuários permitidos
    const isAllowedUser = form.allowedUsers?.includes(userId) ?? false;

    // Verificar se o usuário está em um setor permitido
    const isAllowedSector = form.allowedSectors?.includes(userSetor ?? "") ?? false;

    // Se não tem acesso nem por usuário nem por setor, não pode acessar
    if (!isAllowedUser && !isAllowedSector) return false;
  }

  // Se passou por todas as verificações, pode acessar
  return true;
}

export function getAccessibleForms<T extends { id: string }>(
  roleConfig: RolesConfig | null,
  forms: T[]
): T[] {
  // SISTEMA SIMPLIFICADO: Todos podem ver todos os formulários, exceto TOTEMs
  if (!roleConfig) return [];
  if (roleConfig.isTotem) return [];
  return forms;
}

/**
 * Regra de negócio para edição de templates de formulário (segurança):
 * Apenas os seguintes perfis podem editar a estrutura de um formulário:
 * - Criador do formulário (userId do form)
 * - Usuários listados em ownerIds do formulário
 * - Usuários com role_config.sudo
 * - Usuários com role_config.can_create_form (admin de formulários)
 *
 * Ter acesso às respostas (allowedUsers/allowedSectors em formulário privado,
 * ou formulário público) NÃO concede permissão de edição do template.
 */

/**
 * Verifica se o usuário pode editar um formulário específico (template).
 *
 * Um usuário pode editar apenas se for: criador, owner explícito, sudo ou can_create_form.
 * Acesso às respostas (visibilidade/responder) não concede edição.
 *
 * @param roleConfig - Configuração de roles do usuário
 * @param userId - ID do usuário
 * @param formId - ID do formulário (usado apenas para consistência de assinatura; não afeta a regra endurecida)
 * @param form - Dados do formulário (userId, ownerIds)
 * @param _userSetor - Setor do usuário (não usado na regra de edição; mantido por compatibilidade)
 * @returns true se o usuário pode editar o formulário
 */
export function canEditForm(
  roleConfig: RolesConfig | null,
  userId: string | null | undefined,
  formId: string,
  form: {
    userId: string;
    ownerIds?: string[] | null;
    isPrivate?: boolean | null;
    allowedUsers?: string[] | null;
    allowedSectors?: string[] | null;
  },
  _userSetor?: string | null
): boolean {
  if (!roleConfig || !userId) return false;

  if (roleConfig.isTotem) return false;

  if (form.userId === userId) return true;
  if (form.ownerIds?.includes(userId)) return true;
  if (roleConfig.sudo || roleConfig.can_create_form) return true;

  return false;
}
