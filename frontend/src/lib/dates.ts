// Dates are handled as local "YYYY-MM-DD" strings to avoid time zone shifts.

export function todayIso(): string {
  const d = new Date()
  return toIso(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return toIso(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

/** Inclusive number of days between two ISO dates (same day = 1). */
export function tripLength(startIso: string, endIso: string): number {
  const start = Date.parse(`${startIso}T00:00:00Z`)
  const end = Date.parse(`${endIso}T00:00:00Z`)
  return Math.round((end - start) / 86_400_000) + 1
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
