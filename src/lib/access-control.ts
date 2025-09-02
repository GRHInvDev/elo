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
  if (!db_user.role_config.admin_pages?.includes(route)) {
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
  
  // Verifica se o formulário está na lista de desbloqueados
  if (!db_user.role_config.forms?.unlocked_forms.includes(formId)) {
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
  return roleConfig.admin_pages?.includes(route) ?? false;
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

export function canAccessForm(roleConfig: RolesConfig | null, formId: string): boolean {
  if (!roleConfig) return false;
  
  // Se é sudo, pode acessar qualquer formulário
  if (roleConfig.sudo) return true;
  
  // Verifica se o formulário está na lista de desbloqueados
  return roleConfig.forms?.unlocked_forms.includes(formId) ?? false;
}

export function getAccessibleForms<T extends { id: string }>(
  roleConfig: RolesConfig | null,
  forms: T[]
): T[] {
  if (!roleConfig) return [];

  // Se é sudo, retorna todos os formulários
  if (roleConfig.sudo) return forms;

  // Por padrão, mostra todos os formulários, mas oculta os da lista hidden_forms
  return forms.filter(form => {
    const isHidden = roleConfig.forms?.hidden_forms?.includes(form.id) ?? false;
    return !isHidden;
  });
}
