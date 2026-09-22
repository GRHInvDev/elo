export function normalizeSearch(text: string | null | undefined): string {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function matchesSearch(
  query: string | null | undefined,
  ...targets: (string | null | undefined)[]
): boolean {
  const normalizedQuery = normalizeSearch(query)
  if (!normalizedQuery) return true

  const terms = normalizedQuery.split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true

  const combinedTarget = normalizeSearch(targets.filter(Boolean).join(" "))
  return terms.every((term) => combinedTarget.includes(term))
}