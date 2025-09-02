export type RolesConfig = {
  sudo: boolean;
  admin_pages: string[] | undefined;
  forms: {
    can_create_form: boolean;
    unlocked_forms: string[];
    hidden_forms?: string[];     // Formulários que devem ficar invisíveis
  } | undefined;
  content?: {
    can_create_event: boolean;    // Pode criar eventos
    can_create_flyer: boolean;    // Pode criar encartes
    can_create_booking: boolean;  // Pode fazer agendamentos
  };
  isTotem?: boolean; // Para usuários TOTEM (acesso limitado)
}