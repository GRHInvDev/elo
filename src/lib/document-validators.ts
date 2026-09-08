/**
 * Utilitários para validação e formatação de CPF e CNPJ.
 */

export function getDigits(value: string | null | undefined): string {
  if (!value) return ""
  return value.replace(/\D/g, "")
}

export function isValidCpf(cpf: string | null | undefined): boolean {
  const digits = getDigits(cpf)
  if (digits.length !== 11) return false

  if (/^(\d)\1{10}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  const digit1 = remainder >= 10 ? 0 : remainder

  if (digit1 !== parseInt(digits.charAt(9), 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  const digit2 = remainder >= 10 ? 0 : remainder

  return digit2 === parseInt(digits.charAt(10), 10)
}

export function isValidCnpj(cnpj: string | null | undefined): boolean {
  const digits = getDigits(cnpj)
  if (digits.length !== 14) return false

  if (/^(\d)\1{13}$/.test(digits)) return false

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits.charAt(i), 10) * weights1[i]!
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder

  if (digit1 !== parseInt(digits.charAt(12), 10)) return false

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits.charAt(i), 10) * weights2[i]!
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder

  return digit2 === parseInt(digits.charAt(13), 10)
}

export function formatCpf(value: string | null | undefined): string {
  const digits = getDigits(value).slice(0, 11)
  if (!digits) return ""
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

export function formatCnpj(value: string | null | undefined): string {
  const digits = getDigits(value).slice(0, 14)
  if (!digits) return ""
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

export function formatDocument(value: string | null | undefined): string {
  const digits = getDigits(value)
  if (digits.length > 11) {
    return formatCnpj(digits)
  }
  return formatCpf(digits)
}
