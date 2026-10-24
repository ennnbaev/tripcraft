import type { LucideIcon } from 'lucide-react'

type Props = { label: string; icon: LucideIcon; value: string; note: string; tone?: 'mint' | 'danger' }

export default function StatTile({ label, icon: Icon, value, note, tone }: Props) {
  return (
    <div className="tc-stat">
      <span className="tc-stat__label" style={tone ? { color: `var(--${tone}-ink)` } : undefined}>
        <Icon className="tc-icon" aria-hidden />
        {label}
      </span>
      <b>{value}</b>
      <small>{note}</small>
    </div>
  )
}
