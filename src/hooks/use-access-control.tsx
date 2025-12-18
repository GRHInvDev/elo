"use client";

import { api } from "@/trpc/react";
import { hasAccessToAdminRoute } from "@/const/admin-routes";

export function useAccessControl() {
  const { data: db_user } = api.user.me.useQuery();

  const hasAdminAccess = (route: string): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, tem acesso a tudo
    if (db_user.role_config.sudo) return true;

    // Se tem permissão DRE, automaticamente ganha acesso aos painéis necessários
    if (db_user.role_config.can_view_dre_report) {
      // Garante acesso ao painel admin e food
      if (route === "/admin" || route === "/admin/food" || route === "/admin/food/dre") {
        return true;
      }
    }

    // Usa a função centralizada para verificar acesso
    return hasAccessToAdminRoute(
      db_user.role_config.admin_pages || [], 
      route,
      db_user.role_config.can_manage_produtos === true,
      db_user.role_config.can_manage_quality_management === true,
      db_user.role_config.can_manage_emotion_rules === true
    );
  };

  const canViewForms = (): boolean => {
    // SISTEMA SIMPLIFICADO: Todos podem ver, exceto TOTEMs
    if (!db_user?.role_config) return false;
    return !db_user.role_config.isTotem;
  };

  const canCreateForm = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode criar formulários
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica de criação
    return db_user.role_config.can_create_form;
  };

  const canViewEvents = (): boolean => {
    // SISTEMA SIMPLIFICADO: Todos podem ver, exceto TOTEMs
    if (!db_user?.role_config) return false;
    return !db_user.role_config.isTotem;
  };

  const canAccessChat = (): boolean => {
    // SISTEMA SIMPLIFICADO: Todos podem acessar o chat, exceto TOTEMs
    if (!db_user?.role_config) return false;
    return !db_user.role_config.isTotem;
  };

  const canViewFlyers = (): boolean => {
    // SISTEMA SIMPLIFICADO: Todos podem ver, exceto TOTEMs
    if (!db_user?.role_config) return false;
    return !db_user.role_config.isTotem;
  };

  const canViewRooms = (): boolean => {
    // SISTEMA SIMPLIFICADO: Todos podem ver, exceto TOTEMs
    if (!db_user?.role_config) return false;
    return !db_user.role_config.isTotem;
  };

  const canViewCars = (): boolean => {
    // SISTEMA SIMPLIFICADO: Todos podem ver, exceto TOTEMs
    if (!db_user?.role_config) return false;
    return !db_user.role_config.isTotem;
  };

  const canAccessForm = (_formId: string): boolean => {
    // SISTEMA SIMPLIFICADO: Todos podem acessar formulários, exceto TOTEMs
    if (!db_user?.role_config) return false;
    return !db_user.role_config.isTotem;
  };

  const getAccessibleForms = <T extends { id: string }>(forms: T[]): T[] => {
    // SISTEMA SIMPLIFICADO: Todos podem ver todos os formulários, exceto TOTEMs
    if (!db_user?.role_config) return [];
    if (db_user.role_config.isTotem) return [];
    return forms;
  };

  const canCreateEvent = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode criar eventos
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica de criação
    return db_user.role_config.can_create_event;
  };

  const canCreateFlyer = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode criar encartes
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica de criação
    return db_user.role_config.can_create_flyer;
  };

  const canCreateBooking = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode fazer agendamentos
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica de criação
    return db_user.role_config.can_create_booking;
  };

  const canLocateCars = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode fazer agendamentos de carros
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica de criação
    return db_user.role_config.can_locate_cars;
  };

  const canViewDREReport = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode visualizar relatório DRE
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica para relatório DRE
    return db_user.role_config.can_view_dre_report;
  };

  const canManageExtensions = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode gerenciar ramais
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica para gerenciar ramais
    return db_user.role_config.can_manage_extensions ?? false;
  };

  const canManageBasicUserData = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode gerenciar tudo
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica para gerenciar dados básicos
    return Boolean(db_user.role_config.can_manage_dados_basicos_users);
  };

  const canManageProducts = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode gerenciar produtos
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica para gerenciar produtos
    return db_user.role_config.can_manage_produtos ?? false;
  };

  const canManageQualityManagement = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode gerenciar qualidade
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica para gerenciar qualidade
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return db_user.role_config.can_manage_quality_management ?? false;
  };

  const canManageEmotionRules = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, pode gerenciar réguas de emoções
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica para gerenciar réguas de emoções
    return db_user.role_config.can_manage_emotion_rules ?? false;
  };

  const canViewAnswerWithoutAdminAccess = (): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, tem acesso
    if (db_user.role_config.sudo) return true;

    // Verifica permissão específica
    return db_user.role_config.can_view_answer_without_admin_access ?? false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!db_user?.role_config) return false;

    // Se é sudo, tem todas as permissões
    if (db_user.role_config.sudo) return true;

    // Verificar permissões específicas
    switch (permission) {
      case "can_manage_quality_management":
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return db_user.role_config.can_manage_quality_management ?? false;
      case "can_manage_produtos":
        return db_user.role_config.can_manage_produtos ?? false;
      case "can_manage_emotion_rules":
        return db_user.role_config.can_manage_emotion_rules ?? false;
      case "can_manage_extensions":
        return db_user.role_config.can_manage_extensions ?? false;
      case "can_manage_dados_basicos_users":
        return db_user.role_config.can_manage_dados_basicos_users ?? false;
      case "can_view_dre_report":
        return db_user.role_config.can_view_dre_report ?? false;
      default:
        return false;
    }
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
    canViewDREReport,
    canManageExtensions,
    canManageBasicUserData,
    canManageProducts,
    canManageEmotionRules,
    canManageQualityManagement,
    canViewAnswerWithoutAdminAccess,
    canAccessChat,
    hasPermission,
    isLoading: !db_user,
    isSudo: db_user?.role_config?.sudo ?? false,
  };
}
