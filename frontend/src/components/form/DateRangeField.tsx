import { CalendarDays } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { DayPicker, type DateRange, type Matcher } from 'react-day-picker'
import { addDaysIso, todayIso } from '../../lib/dates'
import { formatWeekdayDate } from '../../lib/format'

type Props = {
  id: string
  start: string
  end: string
  maxDays: number
  onChange: (start: string, end: string) => void
  invalid?: boolean
  describedBy?: string
}

// The form keeps local "YYYY-MM-DD" strings; DayPicker works with Date objects at local midnight
const toDate = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : undefined)
const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function useIsPhone() {
  const query = '(max-width: 720px)'
  const [phone, setPhone] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setPhone(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return phone
}

/** One trigger for both trip dates; opens a range calendar (two months on desktop, one on phones). */
export default function DateRangeField({ id, start, end, maxDays, onChange, invalid, describedBy }: Props) {
  const popId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  // range being edited in the popover; committed to the form when both ends are picked
  const [draft, setDraft] = useState<DateRange | undefined>()
  const phone = useIsPhone()

  const from = toDate(start)
  const to = toDate(end)

  const openPicker = () => {
    setDraft(from ? { from, to } : undefined)
    setOpen(true)
  }

  const close = (focusTrigger = true) => {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const today = toDate(todayIso())!
  // while only the start is picked, days beyond the 14-day limit can't be chosen as the end
  const disabled: Matcher[] = [{ before: today }]
  if (draft?.from && !draft.to) {
    disabled.push({ after: toDate(addDaysIso(toIso(draft.from), maxDays - 1))! })
  }

  const onSelect = (range: DateRange | undefined, clicked: Date) => {
    // a click after a complete range starts a new one, which reads more naturally than DayPicker's extend
    const next = draft?.from && draft.to ? { from: clicked, to: undefined } : range
    setDraft(next)
    if (next?.from && next.to) {
      onChange(toIso(next.from), toIso(next.to))
      close()
    }
  }

  const label =
    from && to ? (
      <>
        {formatWeekdayDate(start)} <span className="text-ink-subtle">→</span> {formatWeekdayDate(end)}
      </>
    ) : (
      <span className="text-ink-subtle">Choose dates</span>
    )

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`tc-input w-full cursor-pointer text-left ${invalid ? 'border-danger!' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? close() : openPicker())}
      >
        <CalendarDays className="tc-icon" aria-hidden />
        <span className="min-w-0 flex-1 truncate tabular-nums">{label}</span>
      </button>

      {open && (
        <div
          id={popId}
          role="dialog"
          aria-label="Choose trip dates"
          className="tc-calendar absolute top-full right-0 z-30 mt-2 w-max max-w-[calc(100vw-32px)] rounded-card border border-border bg-surface-raised p-4 shadow-lift max-[720px]:left-0"
        >
          <p className="mb-2 font-heading text-sm font-semibold text-ink">
            {draft?.from && !draft.to ? 'Now pick the last day' : 'Pick the first day'}
            <span className="ml-2 font-sans text-xs font-normal text-ink-muted">Up to {maxDays} days</span>
          </p>
          <DayPicker
            mode="range"
            selected={draft}
            onSelect={onSelect}
            disabled={disabled}
            excludeDisabled
            numberOfMonths={phone ? 1 : 2}
            defaultMonth={draft?.from ?? today}
            startMonth={today}
            weekStartsOn={1}
            showOutsideDays={false}
            autoFocus
          />
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="text-sm text-ink-muted tabular-nums">
              {draft?.from
                ? `${formatWeekdayDate(toIso(draft.from))}${draft.to ? ` → ${formatWeekdayDate(toIso(draft.to))}` : ' → …'}`
                : 'No dates yet'}
            </span>
            <button type="button" className="tc-btn tc-btn--ghost tc-btn--sm" onClick={() => close()}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
