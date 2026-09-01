import "server-only";
import { redirect } from "next/navigation";
import { api } from "@/trpc/server";
import { hasAccessToAdminRoute } from "@/const/admin-routes";
import { canAccessForm } from "@/lib/access-control";

export async function checkAdminAccess(route: string) {
  const db_user = await api.user.me();

  if (!db_user?.role_config) {
    redirect("/dashboard");
  }

  // Se é sudo, tem acesso a tudo
  if (db_user.role_config.sudo) return db_user;

  // Para a rota /admin, verificar acesso de forma mais flexível
  if (route === "/admin") {
    const hasAdminPages = Array.isArray(db_user.role_config.admin_pages) && db_user.role_config.admin_pages.length > 0
    const hasAdminRoute = hasAdminPages && db_user.role_config.admin_pages.includes("/admin")
    const hasAnyAdminRoute = hasAdminPages && db_user.role_config.admin_pages.some((r: string) => r.startsWith("/admin"))
    const hasCanManageProducts = db_user.role_config.can_manage_produtos === true
    const hasCanManageQuality = db_user.role_config.can_manage_quality_management === true
    const hasCanManageEmotionRules = db_user.role_config.can_manage_emotion_rules === true
    const hasCanManageNewUsersHall = db_user.role_config.can_manage_new_users_hall === true
    const hasCanManageFilial = db_user.role_config.can_manage_filial === true

    const hasAccess =
      hasAdminRoute ||
      hasAnyAdminRoute ||
      hasCanManageProducts ||
      hasCanManageQuality ||
      hasCanManageEmotionRules ||
      hasCanManageNewUsersHall ||
      hasCanManageFilial
    
    if (!hasAccess) {
      redirect("/dashboard");
    }
    
    return db_user;
  }

  // Para outras rotas, verifica se tem acesso à rota específica usando a função centralizada
  // Mas também permite se tem permissões específicas
  if (route === "/admin/products" && db_user.role_config.can_manage_produtos === true) {
    return db_user;
  }

  if (route === "/admin/quality" && db_user.role_config.can_manage_quality_management === true) {
    return db_user;
  }

  if (route === "/admin/emotion-ruler" && db_user.role_config.can_manage_emotion_rules === true) {
    return db_user;
  }

  if (route === "/admin/hall-entrada" && db_user.role_config.can_manage_new_users_hall === true) {
    return db_user;
  }
  if (route === "/admin/filiais" && db_user.role_config.can_manage_filial === true) {
    return db_user;
  }

  if (!hasAccessToAdminRoute(
    db_user.role_config.admin_pages || [], 
    route,
    db_user.role_config.can_manage_produtos === true,
    db_user.role_config.can_manage_quality_management === true,
    db_user.role_config.can_manage_emotion_rules === true,
    db_user.role_config.can_manage_new_users_hall === true,
    db_user.role_config.can_manage_filial === true
  )) {
    redirect("/dashboard");
  }

  return db_user;
}

export async function checkFormAccess(formId: string) {
  const db_user = await api.user.me();

  if (!db_user?.role_config) {
    redirect("/dashboard");
  }

  // Buscar o formulário para verificar se é privado
  const form = await api.form.getById(formId);

  if (!form) {
    redirect("/forms");
  }

  const hasAccess = canAccessForm(
    db_user.role_config,
    formId,
    db_user.id,
    {
      userId: form.userId,
      isPrivate: form.isPrivate,
      allowedUsers: form.allowedUsers,
      allowedSectors: form.allowedSectors,
    },
    db_user.setor
  );

  if (!hasAccess) {
    redirect("/forms");
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

export async function checkFormEditAccess(formId: string) {
  const db_user = await api.user.me();

  if (!db_user?.role_config) {
    redirect("/dashboard");
  }

  if (db_user.role_config.isTotem) {
    redirect("/dashboard");
  }

  const form = await api.form.getById(formId);

  if (!form || !db_user.id) {
    redirect("/forms");
  }

  const canEdit =
    form.userId === db_user.id ||
    form.ownerIds?.includes(db_user.id) ||
    db_user.role_config.sudo ||
    db_user.role_config.can_create_form;

  if (!canEdit) {
    redirect("/forms");
  }

  return db_user;
}

