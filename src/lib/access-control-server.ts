import "server-only";
import { redirect } from "next/navigation";
import { api } from "@/trpc/server";
import { hasAccessToAdminRoute } from "@/const/admin-routes";

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
    
    const hasAccess = hasAdminRoute || hasAnyAdminRoute || hasCanManageProducts || hasCanManageQuality
    
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

  if (!hasAccessToAdminRoute(
    db_user.role_config.admin_pages || [], 
    route,
    db_user.role_config.can_manage_produtos === true,
    db_user.role_config.can_manage_quality_management === true
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

  if (db_user.role_config.isTotem) {
    redirect("/dashboard");
  }

  // Buscar o formulário para verificar se é privado
  const form = await api.form.getById(formId);

  if (!form) {
    redirect("/forms");
  }

  // Se não tem ID de usuário, redirecionar
  if (!db_user.id) {
    redirect("/forms");
  }

  // Se é o criador do formulário, sempre tem acesso
  if (form.userId === db_user.id) {
    return db_user;
  }

  // Se o formulário é privado, verificar se o usuário tem acesso
  if (form.isPrivate) {
    const roleConfig = db_user.role_config;
    
    // Verificar se o formulário está na lista de ocultos
    if (roleConfig.hidden_forms?.includes(formId)) {
      redirect("/forms");
    }

    // Verificar se o usuário está na lista de usuários permitidos
    const isAllowedUser = form.allowedUsers?.includes(db_user.id) ?? false;
    
    // Verificar se o usuário está em um setor permitido
    const isAllowedSector = form.allowedSectors?.includes(db_user.setor ?? "") ?? false;

    // Se não tem acesso nem por usuário nem por setor, redirecionar
    if (!isAllowedUser && !isAllowedSector) {
      redirect("/forms");
    }
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

  // Buscar o formulário para verificar permissões
  const form = await api.form.getById(formId);

  if (!form) {
    redirect("/forms");
  }

  if (!db_user.id) {
    redirect("/forms");
  }

  // Se é o criador do formulário, sempre tem acesso
  if (form.userId === db_user.id) {
    return db_user;
  }

  // Se está na lista de owners, tem acesso
  if (form.ownerIds?.includes(db_user.id)) {
    return db_user;
  }

  // Se tem permissão can_create_form, pode editar qualquer formulário
  if (db_user.role_config.sudo || db_user.role_config.can_create_form) {
    return db_user;
  }

  // Se tem acesso às respostas do formulário, pode editar
  // Verificar se o formulário é privado
  if (form.isPrivate) {
    const roleConfig = db_user.role_config;
    
    // Verificar se o formulário está na lista de ocultos
    if (roleConfig.hidden_forms?.includes(formId)) {
      redirect("/forms");
    }

    // Verificar se o usuário está na lista de usuários permitidos
    const isAllowedUser = form.allowedUsers?.includes(db_user.id) ?? false;
    
    // Verificar se o usuário está em um setor permitido
    const isAllowedSector = form.allowedSectors?.includes(db_user.setor ?? "") ?? false;

    // Se não tem acesso nem por usuário nem por setor, redirecionar
    if (!isAllowedUser && !isAllowedSector) {
      redirect("/forms");
    }
  }

  return db_user;
}

