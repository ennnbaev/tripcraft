import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  label: string
  htmlFor?: string
  /** small muted text after the label, e.g. "optional" */
  labelNote?: string
  error?: string
  /** helper text under the control; replaced by the error when there is one */
  hint?: ReactNode
  /** right-aligned helper, e.g. a character counter; stays visible with an error */
  counter?: ReactNode
  className?: string
  children: ReactNode
}

export default function Field({ label, htmlFor, labelNote, error, hint, counter, className = '', children }: Props) {
  const labelContent = (
    <>
      {label}
      {labelNote && <small>{labelNote}</small>}
    </>
  )
  return (
    <div className={`tc-field ${error ? 'tc-field--error' : ''} ${className}`}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="tc-field__label">
          {labelContent}
        </label>
      ) : (
        <span className="tc-field__label">{labelContent}</span>
      )}
      {children}
      {error ? (
        <div className="tc-field__help">
          <p className="tc-field__error" role="alert">
            <CircleAlert size={14} aria-hidden /> {error}
          </p>
          {counter && <span>{counter}</span>}
        </div>
      ) : (
        (hint || counter) && (
          <p className="tc-field__help">
            <span>{hint}</span>
            {counter && <span>{counter}</span>}
          </p>
        )
      )}
    </div>
  )
}
