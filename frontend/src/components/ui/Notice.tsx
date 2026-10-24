import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type NoticeTone = 'info' | 'success' | 'warn' | 'error'

const icons: Record<NoticeTone, LucideIcon> = { info: Info, success: CircleCheck, warn: TriangleAlert, error: CircleAlert }

type Props = { tone?: NoticeTone; title?: ReactNode; children?: ReactNode; actions?: ReactNode; className?: string }

export default function Notice({ tone = 'info', title, children, actions, className = '' }: Props) {
  const Icon = icons[tone]
  return (
    <div className={`tc-note tc-note--${tone} ${className}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon className="tc-icon" aria-hidden />
      <div className="tc-note__body">
        {title && <b>{title}</b>}
        {children}
      </div>
      {actions && <div className="tc-note__actions">{actions}</div>}
    </div>
  )
}
