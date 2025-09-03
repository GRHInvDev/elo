"use client";

import { api } from "@/trpc/react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type RolesConfig } from "@/types/role-config";

export function useAccessControl() {
  const { data: db_user } = api.user.me.useQuery();

  const hasAdminAccess = (route: string): boolean => {
    if (!db_user?.role_config) return false;
    
    // Se é sudo, tem acesso a tudo
    if (db_user.role_config.sudo) return true;
    
    // Verifica se a rota está nas páginas admin permitidas
    return Array.isArray(db_user.role_config.admin_pages) && db_user.role_config.admin_pages.includes(route);
  };

  const canCreateForm = (): boolean => {
    if (!db_user?.role_config) return false;
    
    // Se é sudo, pode criar formulários
    if (db_user.role_config.sudo) return true;
    
    // Verifica se pode criar formulários
    return db_user.role_config.forms?.can_create_form ?? false;
  };

  const canAccessForm = (formId: string): boolean => {
    if (!db_user?.role_config) return true; // Se não tem config, pode acessar
    
    // Se é sudo, pode acessar qualquer formulário
    if (db_user.role_config.sudo) return true;
    
    // NOVA REGRA: Pode acessar qualquer formulário, exceto os hidden_forms
    const isHidden = db_user.role_config.forms?.hidden_forms?.includes(formId) ?? false;
    return !isHidden;
  };

  const getAccessibleForms = <T extends { id: string }>(forms: T[]): T[] => {
    if (!db_user?.role_config) return forms; // Se não tem config, mostra todos
    
    // Se é sudo, retorna todos os formulários
    if (db_user.role_config.sudo) return forms;
    
    // NOVA REGRA: Todos podem ver todos os formulários, exceto os hidden_forms
    return forms.filter(form => {
      const isHidden = db_user.role_config.forms?.hidden_forms?.includes(form.id) ?? false;
      return !isHidden;
    });
  };

  const canCreateEvent = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode criar eventos
    if (db_user.role_config.sudo) return true;

    // Verifica se pode criar eventos
    return db_user.role_config.content?.can_create_event ?? false;
  };

  const canCreateFlyer = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode criar encartes
    if (db_user.role_config.sudo) return true;

    // Verifica se pode criar encartes
    return db_user.role_config.content?.can_create_flyer ?? false;
  };

  const canCreateBooking = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode fazer agendamentos
    if (db_user.role_config.sudo) return true;

    // Verifica se pode fazer agendamentos
    return db_user.role_config.content?.can_create_booking ?? false;
  };

  return {
    db_user,
    hasAdminAccess,
    canCreateForm,
    canAccessForm,
    getAccessibleForms,
    canCreateEvent,
    canCreateFlyer,
    canCreateBooking,
    isLoading: !db_user,
    isSudo: db_user?.role_config?.sudo ?? false,
  };
}
