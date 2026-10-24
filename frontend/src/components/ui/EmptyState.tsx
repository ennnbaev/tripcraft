import type { ReactNode } from 'react'

type Props = { title: string; text?: ReactNode; action?: ReactNode; headingLevel?: 'h2' | 'h3' }

/** Dashed card with the brand "skyline" art, title, text and an optional action. */
export default function EmptyState({ title, text, action, headingLevel: H = 'h2' }: Props) {
  return (
    <section className="tc-empty">
      <div className="tc-empty__art" aria-hidden>
        <i style={{ width: 40, height: 56, background: 'var(--coral)' }} />
        <i style={{ width: 32, height: 32, background: 'var(--sun)', borderRadius: '50%' }} />
        <i style={{ width: 48, height: 72, background: 'var(--mint)' }} />
        <i style={{ width: 28, height: 44, background: 'var(--sky)' }} />
      </div>
      <H>{title}</H>
      {text && <p>{text}</p>}
      {action}
    </section>
  )
}
