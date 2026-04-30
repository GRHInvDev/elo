/** Formata valor de resposta para célula de CSV (sem aspas de escape). */
export function formatSpreadsheetCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "boolean") return value ? "Sim" : "Não"
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : ""
  if (Array.isArray(value)) return value.map((v) => formatSpreadsheetCell(v)).join("; ")
  if (typeof value === "object") return JSON.stringify(value)
  if (typeof value === "bigint") return value.toString()
  if (typeof value === "symbol") return value.description ?? ""
  if (typeof value === "string") return value.replace(/\r\n/g, "\n")
  if (typeof value === "function") return "[Function]"
  return ""
}

export function escapeCsvCell(cell: string): string {
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`
  }
  return cell
}

export function buildCsvFromRows(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(",")
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(","))
  return `\uFEFF${[headerLine, ...bodyLines].join("\n")}`
}

export function sanitizeExportFilename(name: string): string {
  const base = name.replace(/[^\w.\-() \u00C0-\u024F]+/g, "_").trim() || "formulario"
  return base.endsWith(".csv") ? base.slice(0, 120) : `${base.slice(0, 100)}.csv`
}
