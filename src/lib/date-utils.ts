export function isSameUtcMonthDay(a: Date, b: Date): boolean {
  return a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate()
}

export function getUtcMonthDay(date: Date): { month: number; day: number } {
  return {
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  }
}

