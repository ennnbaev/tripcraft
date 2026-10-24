import { Calendar, ChevronRight, Clock, MapPin, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { todayIso, tripLength } from '../../lib/dates'
import { formatDateSpan, plural } from '../../lib/format'
import type { TripSummary } from '../../types/api'
import { shortName } from './tripName'

const TONES = ['coral', 'sky', 'sun', 'mint'] as const
const createdFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

type Props = {
  trip: TripSummary
  confirming: boolean
  onAsk: () => void
  onCancel: () => void
  onDelete: () => void
}

/** One saved trip; turns into an inline danger confirm while deleting. */
export default function TripListItem({ trip, confirming, onAsk, onCancel, onDelete }: Props) {
  const short = shortName(trip.destination)
  const deleteLabel = `Delete ${short} trip`

  if (confirming) {
    return (
      <div className="tc-trip tc-trip--confirm" role="alertdialog" aria-label={deleteLabel}>
        <div className="tc-confirm">
          <Trash2 className="tc-icon" aria-hidden />
          <div>
            <b>Delete {short} trip?</b>
            Its itinerary and packing list will be removed. AI usage stats stay. This can't be undone.
          </div>
          {/* autoFocus on the safe choice, like a dialog */}
          <button type="button" className="tc-btn tc-btn--secondary tc-btn--sm" onClick={onCancel} autoFocus>
            Keep
          </button>
          <button type="button" className="tc-btn tc-btn--danger tc-btn--sm" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    )
  }

  const tone = TONES[trip.id % TONES.length]
  const days = tripLength(trip.startDate, trip.endDate)
  const past = trip.endDate < todayIso()

  return (
    <div className="tc-trip">
      <div className="tc-trip__thumb" style={{ background: `var(--${tone}-tint)`, color: `var(--${tone}-ink)` }} aria-hidden>
        <MapPin className="tc-icon" />
      </div>
      <Link className="tc-trip__main" to={`/trips/${trip.id}`}>
        <h3>{trip.destination}</h3>
        <p>
          <span>
            <Calendar className="tc-icon" aria-hidden />
            {formatDateSpan(trip.startDate, trip.endDate)} · {plural(days, 'day')}
          </span>
          <span>
            <Clock className="tc-icon" aria-hidden />
            Created {createdFmt.format(new Date(trip.createdAt))}
          </span>
          {past && <span className="tc-cat tc-cat--other">Past trip</span>}
        </p>
      </Link>
      <div className="tc-trip__actions">
        <button type="button" className="tc-btn tc-btn--ghost tc-btn--icon tc-del" aria-label={deleteLabel} title={deleteLabel} onClick={onAsk}>
          <Trash2 className="tc-icon" aria-hidden />
        </button>
        <Link className="tc-btn tc-btn--secondary tc-btn--sm tc-trip__open" to={`/trips/${trip.id}`}>
          Open
          <ChevronRight className="tc-icon tc-icon-sm" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
