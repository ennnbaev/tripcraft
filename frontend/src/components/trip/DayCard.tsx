import { useIsMutating } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { errorMessage } from '../../api/client'
import { tripKeys, useRegenerateDay } from '../../api/trips'
import { slotLabels } from '../../lib/categories'
import { formatMoney, formatShortDate, formatUsd } from '../../lib/format'
import { SLOTS, type Day } from '../../types/api'
import Alert from '../Alert'
import Spinner from '../Spinner'
import ActivityItem from './ActivityItem'

const MAX_FEEDBACK = 500

type Props = { tripId: number; day: Day; currency: string }

export default function DayCard({ tripId, day, currency }: Props) {
  const regenerate = useRegenerateDay(tripId)
  // only one day is regenerated at a time, so the saved trip is never overwritten by a stale response
  const anyRegenerating = useIsMutating({ mutationKey: tripKeys.regenerate(tripId) }) > 0
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const busy = regenerate.isPending

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    regenerate.mutate(
      { dayNumber: day.dayNumber, feedback: feedback.trim() },
      {
        onSuccess: () => {
          setOpen(false)
          setFeedback('')
        },
      },
    )
  }

  return (
    <section className="card relative overflow-hidden" aria-busy={busy}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Day {day.dayNumber} · {formatShortDate(day.date)}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{day.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="font-semibold text-slate-900">{formatMoney(day.dayEstimatedCost, currency)}</p>
            <p className="text-xs text-slate-500">~{formatUsd(day.dayEstimatedCostUsd)}</p>
          </div>
          {!open && (
            <button
              type="button"
              className="btn-secondary px-3 py-2"
              onClick={() => setOpen(true)}
              disabled={anyRegenerating}
            >
              ↻ Regenerate day
            </button>
          )}
        </div>
      </header>

      {open && (
        <form onSubmit={onSubmit} className="space-y-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
          <label htmlFor={`feedback-${day.dayNumber}`} className="block text-sm font-medium text-slate-700">
            What should change? <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            id={`feedback-${day.dayNumber}`}
            rows={2}
            maxLength={MAX_FEEDBACK}
            className="input resize-y"
            placeholder="More food, less walking…"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={busy}
            autoFocus
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="mr-auto text-xs text-slate-500">
              {feedback.length}/{MAX_FEEDBACK}
            </span>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={anyRegenerating}>
              {busy ? (
                <>
                  <Spinner className="h-4 w-4" /> Regenerating…
                </>
              ) : (
                'Regenerate'
              )}
            </button>
          </div>
          {regenerate.isError && <Alert>{errorMessage(regenerate.error)}</Alert>}
        </form>
      )}

      <div className={`space-y-5 px-5 py-5 sm:px-6 ${busy ? 'opacity-40' : ''}`}>
        {SLOTS.map((slot) => {
          const activities = day.activities.filter((a) => a.slot === slot)
          if (activities.length === 0) return null
          return (
            <div key={slot}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{slotLabels[slot]}</h3>
              <ul className="space-y-4">
                {activities.map((a, i) => (
                  <ActivityItem key={`${a.time}-${a.name}-${i}`} activity={a} currency={currency} />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
