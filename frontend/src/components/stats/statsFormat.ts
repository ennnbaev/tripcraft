// Number formatting for the AI usage page, matching the Stats prototype.

const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export const n0 = (v: number) => int.format(Math.round(v))

/** 412380 -> "412.4k" */
export const kilo = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))

/** 7164 -> "7.2 s" */
export const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`

/** 0.1149 -> "11.5%" */
export const percent = (v: number) => `${(v * 100).toFixed(1)}%`

const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const dayMonthFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/** "Today 13:31", "Yesterday 21:40", "22 Oct 09:15" (local time) */
export function requestTime(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const day =
    dayKey(d) === dayKey(now) ? 'Today' : dayKey(d) === dayKey(yesterday) ? 'Yesterday' : dayMonthFmt.format(d)
  return `${day} ${timeFmt.format(d)}`
}

/** Smallest "nice" axis max with 5 equal steps (1, 2, 3, 4, 5, 6, 8, 10, 20, ... per step) that fits the value. */
export function niceAxisMax(max: number): number {
  const steps = [1, 2, 3, 4, 5, 6, 8]
  for (let scale = 1; ; scale *= 10) {
    for (const s of steps) {
      if (s * scale * 5 >= max) return s * scale * 5
    }
  }
}
