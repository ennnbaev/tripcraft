import { useEffect, useId, useRef, type ReactNode } from 'react'
import Button from './Button'

type Props = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  confirmIcon?: ReactNode
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Modal confirm (danger action). Escape and the scrim cancel; focus starts on the safe button. */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmIcon,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="tc-scrim" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="tc-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        <p>{children}</p>
        <div className="tc-modal__actions">
          <button ref={cancelRef} type="button" className="tc-btn tc-btn--secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {confirmIcon}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
