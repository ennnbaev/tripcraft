import { ArrowLeft, CircleAlert, CircleCheck, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import AiBadge from '../ui/AiBadge'
import Button from '../ui/Button'
import Notice from '../ui/Notice'
import Orbit from '../ui/Orbit'
import Skeleton from '../ui/Skeleton'

const STEPS: [label: string, startsAtMs: number][] = [
  ['Reading your preferences', 0],
  ['Choosing places for each day', 1200],
  ['Checking timing and distances', 3400],
  ['Estimating prices in local currency and USD', 5800],
  ['Writing tips for your trip', 7800],
]

export type GenerationError = { title: string; body: string; code: string }

type Props = {
  /** "Planning 3 days in Tbilisi" */
  heading: string
  /** "Tbilisi, Georgia · 10–12 Nov 2026 · 2 travelers · Medium budget · Food, History" */
  summary: string
  error: GenerationError | null
  onCancel: () => void
  onRetry: () => void
  onEdit: () => void
}

/** Elapsed ms while running; starts again from 0 each time `running` turns on. */
function useElapsed(running: boolean) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!running) return
    const started = Date.now()
    const timer = setInterval(() => setElapsed(Date.now() - started), 200)
    return () => clearInterval(timer)
  }, [running])
  return elapsed
}

/**
 * Shown while POST /api/trips is pending. There is no streaming yet, so progress is a fake
 * asymptotic curve and the checklist advances on elapsed time.
 */
export default function GenerationLoading({ heading, summary, error, onCancel, onRetry, onEdit }: Props) {
  const elapsed = useElapsed(!error)
  const pct = Math.min(96, Math.round(100 * (1 - Math.exp(-elapsed / 4200))))
  const secs = Math.floor(elapsed / 1000)

  return (
    <div className="tc-wrap pt-16 max-[720px]:pt-8">
      {error ? (
        <section className="tc-loading" role="alert">
          <div className="tc-packempty__ic" style={{ background: 'var(--danger-tint)', color: 'var(--danger-ink)' }}>
            <CircleAlert className="tc-icon" aria-hidden />
          </div>
          <h2>{error.title}</h2>
          <p>{error.body}</p>
          <Notice tone="info" className="w-full text-left">
            No trip was created. Your answers in the form are kept.
          </Notice>
          <div className="tc-note__actions justify-center">
            <Button onClick={onRetry}>
              <RefreshCw className="tc-icon" aria-hidden />
              Try again
            </Button>
            <Button variant="secondary" onClick={onEdit}>
              <ArrowLeft className="tc-icon" aria-hidden />
              Edit trip
            </Button>
          </div>
          <p className="text-xs leading-4">{error.code}</p>
        </section>
      ) : (
        <section className="tc-loading" aria-live="polite" aria-busy="true">
          <Orbit />
          <AiBadge>AI is planning</AiBadge>
          <h2>{heading}</h2>
          <p>{summary}</p>
          <div
            className="tc-progress"
            role="progressbar"
            aria-label="Planning progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className="tc-progressmeta">
            <span>{secs} s elapsed</span>
            <span>Usually 5–30 seconds</span>
          </div>
          <ul className="tc-steps">
            {STEPS.map(([label, at], i) => {
              const next = STEPS[i + 1]?.[1] ?? 9200
              const state = elapsed >= next ? 'done' : elapsed >= at ? 'active' : 'todo'
              return (
                <li key={label} data-state={state}>
                  {state === 'done' && <CircleCheck className="tc-icon" aria-hidden />}
                  {state === 'active' && <RefreshCw className="tc-icon tc-spin" aria-hidden />}
                  {state === 'todo' && <span className="tc-steps__ring" aria-hidden />}
                  {label}
                  {state === 'done' && <span className="sr-only">(done)</span>}
                </li>
              )
            })}
          </ul>
          <p>You can keep this tab open. Your trip is saved as soon as it is ready.</p>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </section>
      )}

      <div className="tc-skelgrid" aria-hidden>
        {[0, 1, 2].map((d) => (
          <div key={d} className="tc-skelday">
            <div className="flex items-center gap-3">
              <Skeleton style={{ width: 48, height: 48, borderRadius: 10 }} />
              <div className="grid flex-1 gap-1.5">
                <Skeleton style={{ height: 16, width: '70%' }} />
                <Skeleton style={{ height: 12, width: '45%' }} />
              </div>
            </div>
            {[0, 1, 2].map((r) => (
              <div key={r} className="tc-skelcard">
                <Skeleton style={{ width: 72, height: 72, borderRadius: 12 }} />
                <div className="grid content-center gap-2">
                  <Skeleton style={{ height: 12, width: '40%' }} />
                  <Skeleton style={{ height: 16, width: '80%' }} />
                  <Skeleton style={{ height: 12, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
