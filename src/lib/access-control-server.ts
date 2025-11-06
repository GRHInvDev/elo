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
    
    const hasAccess = hasAdminRoute || hasAnyAdminRoute || hasCanManageProducts
    
    if (!hasAccess) {
      redirect("/dashboard");
    }
    
    return db_user;
  }

  // Para outras rotas, verifica se tem acesso à rota específica usando a função centralizada
  // Mas também permite se tem can_manage_produtos e a rota é /admin/products
  if (route === "/admin/products" && db_user.role_config.can_manage_produtos === true) {
    return db_user;
  }

  if (!hasAccessToAdminRoute(db_user.role_config.admin_pages || [], route)) {
    redirect("/dashboard");
  }

  return db_user;
}

export async function checkFormAccess(_formId: string) {
  const db_user = await api.user.me();

  if (!db_user?.role_config) {
    redirect("/dashboard");
  }

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

