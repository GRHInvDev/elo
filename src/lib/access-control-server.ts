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

  // Verifica se tem acesso à rota específica usando a função centralizada
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

