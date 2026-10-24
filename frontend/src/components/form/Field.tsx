import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  label: string
  htmlFor?: string
  /** id for the label element, for groups that use aria-labelledby */
  labelId?: string
  /** id of the help/error line, for aria-describedby on the control */
  messageId?: string
  /** small muted text after the label, e.g. "Optional" */
  labelNote?: string
  error?: string
  /** helper text under the control; replaced by the error when there is one */
  hint?: ReactNode
  /** right-aligned helper, e.g. a character counter; stays visible with an error */
  counter?: ReactNode
  className?: string
  children: ReactNode
}

export default function Field({
  label,
  htmlFor,
  labelId,
  messageId,
  labelNote,
  error,
  hint,
  counter,
  className = '',
  children,
}: Props) {
  const labelContent = (
    <>
      {label}
      {labelNote && <small>{labelNote}</small>}
    </>
  )
  return (
    <div className={`tc-field ${error ? 'tc-field--error' : ''} ${className}`}>
      {htmlFor ? (
        <label htmlFor={htmlFor} id={labelId} className="tc-field__label">
          {labelContent}
        </label>
      ) : (
        <span id={labelId} className="tc-field__label">
          {labelContent}
        </span>
      )}
      {children}
      {error ? (
        <div className="tc-field__help" id={messageId}>
          <span className="tc-field__error" role="alert">
            <CircleAlert className="tc-icon" aria-hidden />
            {error}
          </span>
          {counter && <span>{counter}</span>}
        </div>
      ) : (
        (hint || counter) && (
          <span className="tc-field__help" id={messageId}>
            <span>{hint}</span>
            {counter && <span>{counter}</span>}
          </span>
        )
      )}
    </div>
  )
}
