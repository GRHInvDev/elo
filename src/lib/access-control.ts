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

export async function checkFormAccess(_formId: string) {
  const db_user = await api.user.me();

  if (!db_user?.role_config) {
    redirect("/dashboard");
  }

  // SISTEMA SIMPLIFICADO: Todos podem acessar formulários, exceto TOTEMs
  if (db_user.role_config.isTotem) {
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
  if (!db_user.role_config.can_create_form) {
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

export function canAccessForm(roleConfig: RolesConfig | null, _formId: string): boolean {
  // SISTEMA SIMPLIFICADO: Todos podem acessar formulários, exceto TOTEMs
  if (!roleConfig) return false;
  return !roleConfig.isTotem;
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
