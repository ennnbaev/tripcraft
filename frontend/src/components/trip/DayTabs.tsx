import { useRef, type KeyboardEvent } from 'react'
import { formatWeekdayDate } from '../../lib/format'
import type { Day } from '../../types/api'

type Props = { days: Day[]; selected: number; onSelect: (dayNumber: number) => void; panelId: string }

/** Day switcher: ARIA tabs, arrow keys move between days. */
export default function DayTabs({ days, selected, onSelect, panelId }: Props) {
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = days.findIndex((d) => d.dayNumber === selected)
    const next =
      e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? days.length - 1 : -2
    if (next === -2) return
    e.preventDefault()
    const day = days[(next + days.length) % days.length]
    onSelect(day.dayNumber)
    listRef.current?.querySelector<HTMLButtonElement>(`[data-day="${day.dayNumber}"]`)?.focus()
  }

  return (
    <div ref={listRef} className="tc-daytabs" role="tablist" aria-label="Days" onKeyDown={onKeyDown}>
      {days.map((d) => {
        const on = d.dayNumber === selected
        return (
          <button
            key={d.dayNumber}
            type="button"
            role="tab"
            data-day={d.dayNumber}
            className="tc-daytab"
            aria-selected={on}
            aria-controls={panelId}
            tabIndex={on ? 0 : -1}
            onClick={() => onSelect(d.dayNumber)}
          >
            <b>Day {d.dayNumber}</b>
            <span>{formatWeekdayDate(d.date)}</span>
          </button>
        )
      })}
    </div>
  )
}
