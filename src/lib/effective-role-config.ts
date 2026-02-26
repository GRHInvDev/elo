import type { RolesConfig } from "@/types/role-config";

/**
 * Configuração de role efetiva para usuário TOTEM ou desativado.
 * Usada quando is_active === false para mascarar permissões sem alterar o role_config no banco.
 */
export const TOTEM_EFFECTIVE_ROLE_CONFIG: RolesConfig = {
  sudo: false,
  admin_pages: [],
  can_create_form: false,
  can_create_event: false,
  can_create_flyer: false,
  can_create_booking: false,
  can_locate_cars: false,
  can_view_dre_report: false,
  can_manage_extensions: false,
  can_create_solicitacoes: false,
  can_manage_quality_management: false,
  isTotem: true,
};

/**
 * Retorna o role_config efetivo do usuário.
 * Se o usuário está desativado (is_active === false), retorna config tipo TOTEM para que
 * o restante do app trate como acesso limitado (sem interação com funcionalidades).
 * Não altera o role_config persistido no banco.
 *
 * @param user - Usuário com is_active e role_config (do DB)
 * @returns RolesConfig efetivo para checagens de permissão
 */
export function getEffectiveRoleConfig(user: {
  is_active?: boolean | null;
  role_config?: unknown;
} | null): RolesConfig {
  if (!user) return TOTEM_EFFECTIVE_ROLE_CONFIG;
  if (user.is_active === false) return TOTEM_EFFECTIVE_ROLE_CONFIG;

  const raw = user.role_config as RolesConfig | null | undefined;
  if (!raw || typeof raw !== "object") return TOTEM_EFFECTIVE_ROLE_CONFIG;

  return {
    ...TOTEM_EFFECTIVE_ROLE_CONFIG,
    ...raw,
  };
}

/**
 * Indica se o usuário deve ser tratado como acesso limitado (TOTEM) por estar desativado.
 */
export function isUserDeactivated(user: { is_active?: boolean | null } | null): boolean {
  return user?.is_active === false;
}
