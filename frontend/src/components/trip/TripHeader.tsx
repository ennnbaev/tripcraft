import { Link } from 'react-router-dom'
import { tripLength } from '../../lib/dates'
import { formatDateRange, label } from '../../lib/format'
import type { TripResponse } from '../../types/api'

export default function TripHeader({ trip }: { trip: TripResponse }) {
  const days = tripLength(trip.startDate, trip.endDate)
  const facts = [
    `${days} day${days === 1 ? '' : 's'}`,
    `${trip.travelers} traveler${trip.travelers === 1 ? '' : 's'}`,
    `${label(trip.budgetLevel)} budget`,
    `${label(trip.pace)} pace`,
  ]
  return (
    <div>
      <Link to="/trips" className="text-sm font-medium text-slate-500 hover:text-slate-800">
        ← My trips
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{trip.itinerary?.destination ?? trip.destination}</h1>
      <p className="mt-1 text-slate-600">{formatDateRange(trip.startDate, trip.endDate)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {facts.map((f) => (
          <span key={f} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            {f}
          </span>
        ))}
        {trip.interests.map((i) => (
          <span key={i} className="rounded-full bg-sky-50 px-3 py-1 text-sm text-sky-700">
            {label(i)}
          </span>
        ))}
      </div>
      {trip.notes && <p className="mt-3 text-sm italic text-slate-500">“{trip.notes}”</p>}
    </div>
  )
}
