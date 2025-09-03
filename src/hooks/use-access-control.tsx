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

  const canViewForms = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode visualizar
    if (db_user.role_config.sudo) return true;

    // Verifica se pode visualizar formulários
    return Boolean(db_user.role_config.forms?.can_view_forms);
  };

  const canCreateForm = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode criar formulários
    if (db_user.role_config.sudo) return true;

    // Verifica se pode criar formulários
    return db_user.role_config.forms?.can_create_form ?? false;
  };

  const canViewEvents = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode visualizar
    if (db_user.role_config.sudo) return true;

    // Verifica se pode visualizar eventos
    return Boolean(db_user.role_config.content?.can_view_events);
  };

  const canViewFlyers = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode visualizar
    if (db_user.role_config.sudo) return true;

    // Verifica se pode visualizar encartes
    return Boolean(db_user.role_config.content?.can_view_flyers);
  };

  const canViewRooms = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode visualizar
    if (db_user.role_config.sudo) return true;

    // Verifica se pode visualizar salas
    return Boolean(db_user.role_config.content?.can_view_rooms);
  };

  const canViewCars = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode visualizar
    if (db_user.role_config.sudo) return true;

    // Verifica se pode visualizar carros
    return Boolean(db_user.role_config.content?.can_view_cars);
  };

  const canAccessForm = (formId: string): boolean => {
    if (!db_user?.role_config) return false; // Se não tem config, não pode acessar
    
    // Se é sudo, pode acessar qualquer formulário
    if (db_user.role_config.sudo) return true;
    
    // Primeiro verifica se tem permissão para visualizar formulários
    if (!db_user.role_config.forms?.can_view_forms) return false;
    
    // Se tem permissão para ver, verifica se não está na lista de ocultos
    const isHidden = db_user.role_config.forms?.hidden_forms?.includes(formId) ?? false;
    return !isHidden;
  };

  const getAccessibleForms = <T extends { id: string }>(forms: T[]): T[] => {
    if (!db_user?.role_config) return []; // Se não tem config, não mostra nenhum
    
    // Se é sudo, retorna todos os formulários
    if (db_user.role_config.sudo) return forms;
    
    // Se não tem permissão para ver formulários, retorna lista vazia
    if (!db_user.role_config.forms?.can_view_forms) return [];
    
    // Se tem permissão, filtra apenas os não ocultos
    return forms.filter(form => {
      const isHidden = db_user.role_config.forms?.hidden_forms?.includes(form.id) ?? false;
      return !isHidden;
    });
  };

  const canCreateEvent = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode criar eventos
    if (db_user.role_config.sudo) return true;

    // Primeiro verifica se pode visualizar eventos
    if (!db_user.role_config.content?.can_view_events) return false;

    // Se pode visualizar, verifica se pode criar
    return db_user.role_config.content?.can_create_event ?? false;
  };

  const canCreateFlyer = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode criar encartes
    if (db_user.role_config.sudo) return true;

    // Primeiro verifica se pode visualizar encartes
    if (!db_user.role_config.content?.can_view_flyers) return false;

    // Se pode visualizar, verifica se pode criar
    return db_user.role_config.content?.can_create_flyer ?? false;
  };

  const canCreateBooking = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode fazer agendamentos
    if (db_user.role_config.sudo) return true;

    // Primeiro verifica se pode visualizar salas
    if (!db_user.role_config.content?.can_view_rooms) return false;

    // Se pode visualizar, verifica se pode agendar
    return db_user.role_config.content?.can_create_booking ?? false;
  };

  const canLocateCars = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode fazer agendamentos de carros
    if (db_user.role_config.sudo) return true;

    // Primeiro verifica se pode visualizar carros
    if (!db_user.role_config.content?.can_view_cars) return false;

    // Se pode visualizar, verifica se pode agendar
    return db_user.role_config.content?.can_locate_cars ?? false;
  };

  return {
    db_user,
    hasAdminAccess,
    canViewForms,
    canCreateForm,
    canAccessForm,
    getAccessibleForms,
    canViewEvents,
    canCreateEvent,
    canViewFlyers,
    canCreateFlyer,
    canViewRooms,
    canCreateBooking,
    canViewCars,
    canLocateCars,
    isLoading: !db_user,
    isSudo: db_user?.role_config?.sudo ?? false,
  };
}
