import type { Field } from "@/lib/form-types"

/** Formata valor de resposta para célula de CSV/planilha, traduzindo opções e booleanos conforme o campo. */
export function formatSpreadsheetCell(value: unknown, field?: Field): string {
  if (value === null || value === undefined) return ""

  if (field) {
    if (field.type === "checkbox") {
      const isTrue =
        value === true ||
        value === "true" ||
        value === "Sim" ||
        value === "sim" ||
        value === "1" ||
        value === 1 ||
        value === "on"
      return isTrue ? "Sim" : "Não"
    }

    if (field.type === "combobox") {
      const options = field.options ?? []
      const getLabelForValue = (val: unknown): string => {
        if (val === null || val === undefined) return ""
        const strVal =
          typeof val === "string"
            ? val.trim()
            : typeof val === "number" || typeof val === "boolean" || typeof val === "bigint"
              ? String(val).trim()
              : ""
        if (!strVal) return ""
        const opt = options.find(
          (o) => o.value.trim() === strVal || o.label.trim() === strVal,
        )
        return opt ? opt.label : strVal
      }

      if (Array.isArray(value)) {
        return value.map((v: unknown) => getLabelForValue(v)).filter(Boolean).join("; ")
      }

      if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
        try {
          const parsed = JSON.parse(value) as unknown
          if (Array.isArray(parsed)) {
            return parsed.map((v: unknown) => getLabelForValue(v)).filter(Boolean).join("; ")
          }
        } catch {
          // ignora
        }
      }

      return getLabelForValue(value)
    }

    if (field.type === "file") {
      if (Array.isArray(value)) {
        return value
          .map((v: unknown) => {
            if (v && typeof v === "object" && "name" in v) {
              const nameVal = (v as Record<string, unknown>).name
              return typeof nameVal === "string" ? nameVal : ""
            }
            if (typeof v === "string") return v.split("/").pop() ?? v
            return ""
          })
          .filter(Boolean)
          .join("; ")
      }
      if (value && typeof value === "object" && "name" in value) {
        const nameVal = (value as Record<string, unknown>).name
        return typeof nameVal === "string" ? nameVal : ""
      }
      if (typeof value === "string" && (value.startsWith("http") || value.startsWith("/"))) {
        return value.split("/").pop() ?? value
      }
    }
  }

  // Fallback padrão
  if (typeof value === "boolean") return value ? "Sim" : "Não"
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : ""
  if (Array.isArray(value)) return value.map((v: unknown) => formatSpreadsheetCell(v)).join("; ")
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