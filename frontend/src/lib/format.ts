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

/** "MUSEUMS" -> "Museums" */
export function label(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll('_', ' ')
}
