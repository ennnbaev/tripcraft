import { RefreshCw } from 'lucide-react'
import { useId } from 'react'
import { ApiError, errorMessage } from '../../api/client'
import AiBadge from '../ui/AiBadge'
import Button from '../ui/Button'
import Notice from '../ui/Notice'

const MAX_FEEDBACK = 500

const SUGGESTIONS = ['More food, less walking', 'Fewer museums', 'Start later in the morning', 'Keep it cheaper', 'More time outdoors']

type Props = {
  dayNumber: number
  feedback: string
  onFeedback: (value: string) => void
  onRegenerate: () => void
  /** this day is being regenerated */
  busy: boolean
  /** another day is being regenerated; one at a time */
  blocked: boolean
  error: unknown
}

function errorCopy(error: unknown) {
  if (error instanceof ApiError && error.status === 429) {
    return { title: 'The free AI limit is reached', body: 'Please try again in a minute. Your trip is unchanged.' }
  }
  if (error instanceof ApiError && error.status === 502) {
    return {
      title: 'We couldn’t regenerate this day',
      body: 'The AI answer didn’t pass our checks. Your trip is unchanged. Please try again.',
    }
  }
  return { title: 'We couldn’t regenerate this day', body: `${errorMessage(error)} Your trip is unchanged.` }
}

/** Violet AI panel at the bottom of a day card: feedback, suggestion chips and the regenerate action. */
export default function RegenerateDay({ dayNumber, feedback, onFeedback, onRegenerate, busy, blocked, error }: Props) {
  const id = useId()
  const append = (suggestion: string) => {
    const current = feedback.trim()
    onFeedback((current ? `${current}, ${suggestion.toLowerCase()}` : suggestion).slice(0, MAX_FEEDBACK))
  }
  const err = error ? errorCopy(error) : null

  return (
    <section className="tc-regen" aria-labelledby={`${id}-title`}>
      <div className="tc-regen__head" id={`${id}-title`}>
        <RefreshCw className="tc-icon" aria-hidden />
        Regenerate day {dayNumber} with feedback
        <AiBadge />
      </div>
      <div className="tc-field">
        <label className="tc-field__label" htmlFor={`${id}-fb`}>
          What should change? <small>Optional</small>
        </label>
        <div className="tc-input tc-input--area" style={{ minHeight: 84 }}>
          <textarea
            id={`${id}-fb`}
            rows={2}
            maxLength={MAX_FEEDBACK}
            placeholder="For example: more food, less walking"
            value={feedback}
            onChange={(e) => onFeedback(e.target.value.slice(0, MAX_FEEDBACK))}
            aria-describedby={`${id}-help`}
            disabled={busy}
          />
        </div>
        <span className="tc-field__help" id={`${id}-help`}>
          <span>Only this day changes. We'll avoid places from your other days.</span>
          <span>
            {feedback.length} / {MAX_FEEDBACK}
          </span>
        </span>
      </div>
      <div className="tc-suggest" role="group" aria-label="Suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => append(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>
      {err && (
        <Notice tone="error" title={err.title} className="bg-surface-raised">
          {err.body}
        </Notice>
      )}
      <div className="tc-regen__foot">
        <span className="text-xs leading-4 text-ink-muted">
          {blocked ? 'Another day is being regenerated. One day at a time.' : 'Takes about 5–15 seconds.'}
        </span>
        <Button variant="ai-solid" onClick={onRegenerate} disabled={busy || blocked}>
          <RefreshCw className={`tc-icon ${busy ? 'tc-spin' : ''}`} aria-hidden />
          {busy ? 'Regenerating…' : 'Regenerate day'}
        </Button>
      </div>
    </section>
  )
}
