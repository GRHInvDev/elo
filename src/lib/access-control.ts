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
  
  // Verifica se pode criar eventos
  return roleConfig.content?.can_create_event ?? false;
}

export function canCreateFlyer(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;
  
  // Se é sudo, pode criar encartes
  if (roleConfig.sudo) return true;
  
  // Verifica se pode criar encartes
  return roleConfig.content?.can_create_flyer ?? false;
}

export function canCreateBooking(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;
  
  // Se é sudo, pode fazer agendamentos
  if (roleConfig.sudo) return true;
  
  // Verifica se pode fazer agendamentos
  return roleConfig.content?.can_create_booking ?? false;
}

export function canLocateCars(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;
  
  // Se é sudo, pode fazer agendamentos de carros
  if (roleConfig.sudo) return true;
  
  // Verifica se pode fazer agendamentos de carros
  return roleConfig.content?.can_locate_cars ?? false;
}

// Funções de visualização (acesso à página)
export function canViewCars(): boolean {
  // Todos podem visualizar a página de carros
  return true;
}

export function canViewEvents(): boolean {
  // Todos podem visualizar a página de eventos
  return true;
}

export function canViewFlyers(): boolean {
  // Todos podem visualizar a página de encartes
  return true;
}

export function canViewShop(): boolean {
  // Todos podem visualizar a página de shop
  return true;
}

export function canViewForms(roleConfig: RolesConfig | null): boolean {
  if (!roleConfig) return false;
  
  // Se é sudo, pode visualizar
  if (roleConfig.sudo) return true;
  
  // TODOS podem visualizar a página de formulários
  // A filtragem dos formulários específicos é feita no componente FormsList
  return true;
}

export function canAccessForm(roleConfig: RolesConfig | null, formId: string): boolean {
  if (!roleConfig) return true; // Se não tem config, pode acessar
  
  // Se é sudo, pode acessar qualquer formulário
  if (roleConfig.sudo) return true;
  
  // NOVA REGRA: Pode acessar qualquer formulário, exceto os hidden_forms
  const isHidden = roleConfig.forms?.hidden_forms?.includes(formId) ?? false;
  return !isHidden;
}

export function getAccessibleForms<T extends { id: string }>(
  roleConfig: RolesConfig | null,
  forms: T[]
): T[] {
  if (!roleConfig) return forms; // Se não tem config, mostra todos

  // Se é sudo, retorna todos os formulários
  if (roleConfig.sudo) return forms;

  // NOVA REGRA: Todos podem ver todos os formulários, exceto os hidden_forms
  return forms.filter(form => {
    const isHidden = roleConfig.forms?.hidden_forms?.includes(form.id) ?? false;
    return !isHidden;
  });
}
