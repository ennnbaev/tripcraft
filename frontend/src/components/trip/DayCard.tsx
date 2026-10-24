import { costParts, formatWeekdayDateYear, plural } from '../../lib/format'
import { slotStyle } from '../../lib/category'
import { SLOTS, type Day } from '../../types/api'
import Orbit from '../ui/Orbit'
import ActivityCard from './ActivityCard'
import RegenerateDay from './RegenerateDay'

type Props = {
  day: Day
  destination: string
  currency: string
  selectedStop: number | null
  onSelectStop: (n: number) => void
  /** 1 s mint ring after a successful regenerate */
  ring: boolean
  regen: {
    feedback: string
    onFeedback: (value: string) => void
    onRegenerate: () => void
    busy: boolean
    blocked: boolean
    error: unknown
  }
}

/** One day: number tile and summary, stops grouped by time slot, and the regenerate panel. */
export default function DayCard({ day, destination, currency, selectedStop, onSelectStop, ring, regen }: Props) {
  const total = costParts(day.dayEstimatedCost, day.dayEstimatedCostUsd, currency)
  // stop numbers follow the itinerary order, the same numbers as the map pins
  const numbered = day.activities.map((activity, i) => ({ activity, n: i + 1 }))
  const groups = SLOTS.map((slot) => ({ slot, items: numbered.filter((x) => x.activity.slot === slot) })).filter(
    (g) => g.items.length > 0,
  )

  return (
    <article className={`tc-day ${ring ? 'tc-day--ring' : ''}`} aria-busy={regen.busy}>
      <div className="tc-day__head">
        <div className="tc-day__num" aria-hidden>
          <small>DAY</small>
          <b>{day.dayNumber}</b>
        </div>
        <div className="tc-day__title">
          <h2>{day.title}</h2>
          <p>
            {formatWeekdayDateYear(day.date)} · {plural(day.activities.length, 'stop')} ·{' '}
            {total.free ? 'Free' : `${total.local} ${total.usd}`}
          </p>
        </div>
      </div>

      {groups.map(({ slot, items }) => {
        const s = slotStyle[slot]
        return (
          <section key={slot} className="tc-slotgroup" aria-label={s.label}>
            <div className={`tc-slot tc-slot--${s.slug}`}>
              <i aria-hidden />
              {s.label} <em>{plural(items.length, 'stop')}</em>
            </div>
            {items.map(({ activity, n }) => (
              <ActivityCard
                key={`${n}-${activity.name}`}
                activity={activity}
                n={n}
                destination={destination}
                currency={currency}
                selected={selectedStop === n}
                onSelect={() => onSelectStop(n)}
              />
            ))}
          </section>
        )
      })}

      <RegenerateDay dayNumber={day.dayNumber} {...regen} />

      {regen.busy && (
        <div className="tc-dayover" role="status">
          <Orbit />
          <h3>Regenerating day {day.dayNumber}</h3>
          <p>Keeping your other days as they are and avoiding places you already have.</p>
        </div>
      )}
    </article>
  )
}
