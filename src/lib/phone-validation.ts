/**
 * Utilitários de validação e formatação para números de celular do Brasil (+55).
 */

// Lista oficial de DDDs válidos no Brasil (ANATEL)
export const VALID_BRAZILIAN_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
  21, 22, 24,                         // RJ
  27, 28,                             // ES
  31, 32, 33, 34, 35, 37, 38,         // MG
  41, 42, 43, 44, 45, 46,             // PR
  47, 48, 49,                         // SC
  51, 53, 54, 55,                     // RS
  61,                                 // DF
  62, 64,                             // GO
  63,                                 // TO
  65, 66,                             // MT
  67,                                 // MS
  68,                                 // AC
  69,                                 // RO
  71, 73, 74, 75, 77,                 // BA
  79,                                 // SE
  81, 87,                             // PE
  82,                                 // AL
  83,                                 // PB
  84,                                 // RN
  85, 88,                             // CE
  86, 89,                             // PI
  91, 93, 94,                         // PA
  92, 97,                             // AM
  95,                                 // RR
  96,                                 // AP
  98, 99,                             // MA
]);

/**
 * Normaliza dígitos de telefone, removendo caracteres não numéricos e DDI +55 se presente.
 */
export function normalizePhoneDigits(value: string): string {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");

  // Se o usuário colou com +55 na frente (13 dígitos iniciando com 55)
  if (digits.length === 13 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  return digits.slice(0, 11);
}

/**
 * Valida se a string corresponde a um número de celular brasileiro válido:
 * - Exatamente 11 dígitos (2 dígitos de DDD + 9 dígitos de celular)
 * - Não pode ter todos os dígitos repetidos (ex: 11111111111)
 * - O DDD deve pertencer à lista de DDDs válidos da Anatel
 * - O terceiro dígito (primeiro após o DDD) deve ser obrigatoriamente '9'
 */
export function isValidBrazilianCellPhone(value: string): boolean {
  if (!value) return false;
  const digits = normalizePhoneDigits(value);

  // Celular brasileiro com DDD precisa ter exatamente 11 dígitos
  if (digits.length !== 11) return false;

  // Não pode ter todos os dígitos repetidos
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Valida o DDD
  const ddd = parseInt(digits.substring(0, 2), 10);
  if (!VALID_BRAZILIAN_DDDS.has(ddd)) return false;

  // Celular no Brasil obrigatoriamente inicia com '9' após o DDD
  if (digits.charAt(2) !== "9") return false;

  return true;
}

/**
 * Aplica máscara de celular brasileiro: (XX) 9XXXX-XXXX
 */
export function formatBrazilianPhone(value: string): string {
  if (!value) return "";
  const digits = normalizePhoneDigits(value);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  } else if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
}

/**
 * Gera link oficial para iniciar conversa no WhatsApp com DDI +55 automático.
 */
export function getWhatsAppLink(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  return `https://wa.me/55${digits}`;
}

export type PhoneTypeValue = "empresarial" | "pessoal";

export interface ParsedPhoneValue {
  phone: string;
  phoneType?: PhoneTypeValue;
}

function readPhoneObject(obj: Record<string, unknown>): ParsedPhoneValue {
  const rawPhone = obj.phone ?? obj.number;
  const rawType = obj.phoneType ?? obj.type;
  const phone =
    typeof rawPhone === "string" ? rawPhone : typeof rawPhone === "number" ? rawPhone.toString() : "";
  const phoneType: PhoneTypeValue | undefined =
    rawType === "empresarial" || rawType === "pessoal" ? rawType : undefined;
  return { phone, phoneType };
}

export function parsePhoneFieldValue(value: unknown): ParsedPhoneValue {
  if (value === null || value === undefined) return { phone: "" };

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        return readPhoneObject(parsed as Record<string, unknown>);
      }
    } catch {
    }
    return { phone: value };
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return readPhoneObject(value as Record<string, unknown>);
  }

  return { phone: "" };
}