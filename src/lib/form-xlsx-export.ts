import * as XLSX from "xlsx"

/**
 * Gera uma planilha .xlsx (codificada em base64) a partir de cabeçalhos + linhas.
 * Uso server-side (tRPC): o cliente decodifica o base64 num Blob para download.
 */
export function buildXlsxBase64FromRows(
  headers: string[],
  rows: string[][],
  sheetName = "Respostas",
): string {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const workbook = XLSX.utils.book_new()
  // Excel limita o nome da aba a 31 caracteres.
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31))
  return XLSX.write(workbook, { type: "base64", bookType: "xlsx" }) as string
}

/** Nome de arquivo seguro com extensão .xlsx. */
export function sanitizeXlsxFilename(name: string): string {
  const base = name.replace(/[^\w.\-() À-ɏ]+/g, "_").trim() || "formulario"
  return base.endsWith(".xlsx") ? base.slice(0, 120) : `${base.slice(0, 100)}.xlsx`
}
