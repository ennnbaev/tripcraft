const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const shortDateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(`${iso}T00:00:00`))
}

export function formatShortDate(iso: string): string {
  return shortDateFmt.format(new Date(`${iso}T00:00:00`))
}

export function formatDateRange(startIso: string, endIso: string): string {
  return startIso === endIso ? formatDate(startIso) : `${formatDate(startIso)} – ${formatDate(endIso)}`
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso))
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    // unknown currency code from the model
    return `${Math.round(amount).toLocaleString('en-US')} ${currency}`
  }
}

export function formatUsd(amount: number): string {
  return formatMoney(amount, 'USD')
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

/** Enums as words: "MUSEUMS" -> "Museums", "INVALID_JSON" -> "Invalid JSON" */
export function label(value: string): string {
  const words = value.toLowerCase().split('_')
  return words
    .map((w, i) => (w === 'json' || w === 'ai' || w === 'usd' ? w.toUpperCase() : i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

const intFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** Local currency in the design's style: "90 GEL". */
export function formatLocal(amount: number, currency: string): string {
  return `${intFmt.format(amount)} ${currency}`
}

/** "≈ $33" */
export function formatUsdApprox(amount: number): string {
  return `≈ $${intFmt.format(amount)}`
}

/** Cost parts for "90 GEL ≈ $33"; free = 0, shown as "Free" in mint-ink. */
export function costParts(amount: number, amountUsd: number, currency: string) {
  return { free: amount === 0, local: formatLocal(amount, currency), usd: formatUsdApprox(amountUsd) }
}

const dayMonthFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const weekdayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

const asDate = (iso: string) => new Date(`${iso}T00:00:00`)

/** "10–12 Nov 2026", "28 Nov – 2 Dec 2026", "30 Dec 2026 – 2 Jan 2027" */
export function formatDateSpan(startIso: string, endIso: string): string {
  const s = asDate(startIso)
  const e = asDate(endIso)
  if (startIso === endIso) return formatDate(startIso)
  if (s.getFullYear() !== e.getFullYear()) return `${formatDate(startIso)} – ${formatDate(endIso)}`
  if (s.getMonth() !== e.getMonth()) return `${dayMonthFmt.format(s)} – ${formatDate(endIso)}`
  return `${s.getDate()}–${formatDate(endIso)}`
}

/** "Tue 10 Nov" */
export function formatWeekdayDate(iso: string): string {
  const d = asDate(iso)
  return `${weekdayFmt.format(d)} ${dayMonthFmt.format(d)}`
}

/** "Tue 10 Nov 2026" */
export function formatWeekdayDateYear(iso: string): string {
  return `${formatWeekdayDate(iso)} ${asDate(iso).getFullYear()}`
}

/** "3 days", "1 stop" */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}
