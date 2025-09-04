import { redirect } from "next/navigation";
import { api } from "@/trpc/server";
import { type RolesConfig } from "@/types/role-config";

export async function checkAdminAccess(route: string) {
  const db_user = await api.user.me();
  
  if (!db_user?.role_config) {
    redirect("/dashboard");
  }

  // Se é sudo, tem acesso a tudo
  if (db_user.role_config.sudo) return db_user;
  
  // Verifica se a rota está nas páginas admin permitidas
  if (!Array.isArray(db_user.role_config.admin_pages) || !db_user.role_config.admin_pages.includes(route)) {
    redirect("/dashboard");
  }

  return db_user;
}

export async function checkFormAccess(formId: string) {
  const db_user = await api.user.me();

  if (!db_user?.role_config) {
    redirect("/dashboard");
  }

  // Se é sudo, pode acessar qualquer formulário
  if (db_user.role_config.sudo) return db_user;

  // NOVA REGRA: Pode acessar qualquer formulário, exceto os hidden_forms
  const isHidden = db_user.role_config.forms?.hidden_forms?.includes(formId) ?? false;
  if (isHidden) {
    redirect("/dashboard");
  }

  return db_user;
}

export async function checkFormCreationAccess() {
  const db_user = await api.user.me();
  
  if (!db_user?.role_config) {
    redirect("/dashboard");
  }

  // Se é sudo, pode criar formulários
  if (db_user.role_config.sudo) return db_user;
  
  // Verifica se pode criar formulários
  if (!db_user.role_config.forms?.can_create_form) {
    redirect("/dashboard");
  }

  return db_user;
}

export function hasAdminAccess(roleConfig: RolesConfig | null, route: string): boolean {
  if (!roleConfig) return false;
  
  // Se é sudo, tem acesso a tudo
  if (roleConfig.sudo) return true;
  
  // Verifica se a rota está nas páginas admin permitidas
  return Array.isArray(roleConfig.admin_pages) && roleConfig.admin_pages.includes(route);
}

export function canCreateForm(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;
  
  // Se é sudo, pode criar formulários
  if (roleConfig.sudo) return true;
  
  // Verifica se pode criar formulários
  return roleConfig.forms?.can_create_form ?? false;
}

export function canCreateEvent(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode criar eventos
  if (roleConfig.sudo) return true;

  // Primeiro verifica se pode visualizar eventos
  if (!roleConfig.content?.can_view_events) return false;

  // Se pode visualizar, verifica se pode criar
  return roleConfig.content?.can_create_event ?? false;
}

export function canCreateFlyer(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode criar encartes
  if (roleConfig.sudo) return true;

  // Primeiro verifica se pode visualizar encartes
  if (!roleConfig.content?.can_view_flyers) return false;

  // Se pode visualizar, verifica se pode criar
  return roleConfig.content?.can_create_flyer ?? false;
}

export function canCreateBooking(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode fazer agendamentos
  if (roleConfig.sudo) return true;

  // Primeiro verifica se pode visualizar salas
  if (!roleConfig.content?.can_view_rooms) return false;

  // Se pode visualizar, verifica se pode agendar
  return roleConfig.content?.can_create_booking ?? false;
}

export function canLocateCars(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode fazer agendamentos de carros
  if (roleConfig.sudo) return true;

  // Primeiro verifica se pode visualizar carros
  if (!roleConfig.content?.can_view_cars) return false;

  // Se pode visualizar, verifica se pode agendar
  return roleConfig.content?.can_locate_cars ?? false;
}

// Funções de visualização (acesso às páginas)
export function canViewShop(): boolean {
  // Todos podem visualizar a página de shop
  return true;
}

export function canViewForms(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode visualizar
  if (roleConfig.sudo) return true;

  // Precisa ter a permissão específica para visualizar formulários
  return roleConfig.forms?.can_view_forms ?? false;
}

export function canViewEvents(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode visualizar
  if (roleConfig.sudo) return true;

  // Precisa ter a permissão específica para visualizar eventos
  return roleConfig.content?.can_view_events ?? false;
}

export function canViewFlyers(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode visualizar
  if (roleConfig.sudo) return true;

  // Precisa ter a permissão específica para visualizar encartes
  return roleConfig.content?.can_view_flyers ?? false;
}

export function canViewRooms(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode visualizar
  if (roleConfig.sudo) return true;

  // Precisa ter a permissão específica para visualizar salas
  return roleConfig.content?.can_view_rooms ?? false;
}

export function canViewCars(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;

  // Se é sudo, pode visualizar
  if (roleConfig.sudo) return true;

  // Precisa ter a permissão específica para visualizar carros
  return roleConfig.content?.can_view_cars ?? false;
}

export function canAccessForm(roleConfig: RolesConfig | null, formId: string): boolean {
  if (!roleConfig) return false; // Se não tem config, não pode acessar
  
  // Se é sudo, pode acessar qualquer formulário
  if (roleConfig.sudo) return true;
  
  // Primeiro verifica se tem permissão para visualizar formulárioss
  if (!roleConfig.forms?.can_view_forms) return false;
  
  // Se tem permissão para ver, verifica se não está na lista de ocultos
  const isHidden = roleConfig.forms?.hidden_forms?.includes(formId) ?? false;
  return !isHidden;
}

export function getAccessibleForms<T extends { id: string }>(
  roleConfig: RolesConfig | null,
  forms: T[]
): T[] {
  if (!roleConfig) return [];

  // Se é sudo, retorna todos os formulários
  if (roleConfig.sudo) return forms;

  // Se não tem permissão para ver formulários, retorna lista vazia
  if (!roleConfig.forms?.can_view_forms) return [];

  // Se tem permissão, filtra apenas os não ocultos
  return forms.filter(form => {
    const isHidden = roleConfig.forms?.hidden_forms?.includes(form.id) ?? false;
    return !isHidden;
  });
}
