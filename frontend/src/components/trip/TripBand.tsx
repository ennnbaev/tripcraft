import { ArrowLeft, Calendar, Gauge, Languages, Trash2, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDateSpan, label, plural } from '../../lib/format'
import { cityOf } from '../../lib/wiki'
import type { TripResponse } from '../../types/api'
import AiBadge from '../ui/AiBadge'
import CategoryBadge from '../ui/CategoryBadge'

const stampFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

type Props = { trip: TripResponse; dayCount: number; updatedJustNow: boolean; onDelete: () => void }

/** Dark band at the top of the trip page: title, facts, interests and the delete action. */
export default function TripBand({ trip, dayCount, updatedJustNow, onDelete }: Props) {
  const created = new Date(trip.createdAt)
  const updated = new Date(trip.updatedAt)
  // the backend touches updatedAt on create too; only show it after a real change
  const wasUpdated = updatedJustNow || updated.getTime() - created.getTime() > 60_000

  return (
    <section className="tc-band tc-deep" aria-labelledby="trip-title">
      <div className="tc-band__inner">
        <div className="tc-band__top">
          <Link className="tc-band__back" to="/trips">
            <ArrowLeft className="tc-icon tc-icon-sm" aria-hidden />
            My trips
          </Link>
          <button type="button" className="tc-btn tc-btn--on-deep tc-btn--sm" onClick={onDelete}>
            <Trash2 className="tc-icon tc-icon-sm" aria-hidden />
            Delete trip
          </button>
        </div>
        <div>
          <h1 id="trip-title">
            {plural(dayCount, 'day')} in {cityOf(trip.destination)}
          </h1>
          <p className="tc-band__sub">{trip.destination}</p>
        </div>
        <div className="tc-band__meta">
          <span>
            <Calendar className="tc-icon" aria-hidden />
            {formatDateSpan(trip.startDate, trip.endDate)}
          </span>
          <span>
            <Users className="tc-icon" aria-hidden />
            {plural(trip.travelers, 'traveler')}
          </span>
          <span>
            <Wallet className="tc-icon" aria-hidden />
            {label(trip.budgetLevel)} budget
          </span>
          <span>
            <Gauge className="tc-icon" aria-hidden />
            {label(trip.pace)} pace
          </span>
          <span>
            <Languages className="tc-icon" aria-hidden />
            {trip.language}
          </span>
        </div>
        <div className="tc-band__tags">
          {trip.interests.map((i) => (
            <CategoryBadge key={i} category={i} />
          ))}
          <AiBadge>AI GENERATED</AiBadge>
          <span className="text-[13px] leading-[18px] text-on-deep-muted">
            Created {stampFmt.format(created)}
            {wasUpdated && ` · Updated ${updatedJustNow ? 'just now' : stampFmt.format(updated)}`}
          </span>
        </div>
        {trip.notes && (
          <p className="tc-band__notes">
            <b>Your notes:</b> {trip.notes}
          </p>
        )}
      </div>
    </section>
  )
}
