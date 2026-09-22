export function isSameUtcMonthDay(a: Date, b: Date): boolean {
  return a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate()
}

export function getUtcMonthDay(date: Date): { month: number; day: number } {
  return {
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  }
}

export function formatOrderDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const day = String(d.getUTCDate()).padStart(2, "0")
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}