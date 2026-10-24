import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { useDeleteTrip, useTrips } from '../api/trips'
import Alert from '../components/Alert'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { tripLength } from '../lib/dates'
import { formatDateRange, formatDateTime } from '../lib/format'
import type { TripSummary } from '../types/api'

export default function TripsPage() {
  const { data: trips, isLoading, error, refetch } = useTrips()
  const deleteTrip = useDeleteTrip()

  const onDelete = (trip: TripSummary) => {
    if (window.confirm(`Delete the trip to ${trip.destination}? This cannot be undone.`)) {
      deleteTrip.mutate(trip.id)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My trips</h1>
          <p className="mt-1 text-slate-600">Saved itineraries, newest first.</p>
        </div>
        <Link to="/" className="tc-btn tc-btn--primary">
          + New trip
        </Link>
      </div>

      {deleteTrip.isError && (
        <div className="mt-6">
          <Alert title="Couldn't delete the trip">{errorMessage(deleteTrip.error)}</Alert>
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <LoadingState message="Loading your trips…" />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !trips || trips.length === 0 ? (
          <EmptyState
            title="No trips yet"
            text="Plan your first trip and it will show up here."
            action={
              <Link to="/" className="tc-btn tc-btn--primary">
                Plan a trip
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {trips.map((trip) => {
              const days = tripLength(trip.startDate, trip.endDate)
              const deleting = deleteTrip.isPending && deleteTrip.variables === trip.id
              return (
                <li key={trip.id} className={`card flex flex-col p-5 transition ${deleting ? 'opacity-50' : 'hover:shadow-md'}`}>
                  <Link to={`/trips/${trip.id}`} className="group flex-1">
                    <p className="text-lg font-semibold text-slate-900 group-hover:text-sky-700">{trip.destination}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDateRange(trip.startDate, trip.endDate)} · {days} day{days === 1 ? '' : 's'}
                    </p>
                  </Link>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">Created {formatDateTime(trip.createdAt)}</span>
                    <div className="flex gap-1">
                      <Link to={`/trips/${trip.id}`} className="tc-btn tc-btn--ghost tc-btn--sm">
                        Open
                      </Link>
                      <button
                        type="button"
                        className="tc-btn tc-btn--ghost tc-btn--sm text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => onDelete(trip)}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
