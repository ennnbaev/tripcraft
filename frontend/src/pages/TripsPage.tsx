import { Plus, RefreshCw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useDeleteTrip, useTrips } from '../api/trips'
import TripListItem from '../components/trips/TripListItem'
import { shortName } from '../components/trips/tripName'
import { ButtonLink } from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Notice from '../components/ui/Notice'
import Skeleton from '../components/ui/Skeleton'
import { plural } from '../lib/format'
import type { TripSummary } from '../types/api'

type Result = { tone: 'success' | 'error'; text: string }

export default function TripsPage() {
  const { data: trips, isLoading, isError, refetch, isFetching } = useTrips()
  const deleteTrip = useDeleteTrip()
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const remove = (trip: TripSummary) => {
    const short = shortName(trip.destination)
    setConfirmId(null)
    setResult(null)
    // the row disappears at once (optimistic) and comes back if the request fails
    deleteTrip.mutate(trip.id, {
      onSuccess: () => setResult({ tone: 'success', text: `The ${short} trip was deleted.` }),
      onError: () => setResult({ tone: 'error', text: `We couldn't delete the ${short} trip. Please try again.` }),
    })
  }

  const hasList = !!trips && trips.length > 0
  const subtitle = isLoading
    ? 'Loading your trips…'
    : hasList
      ? `${plural(trips.length, 'saved trip')}, newest first`
      : isError
        ? 'Something went wrong'
        : 'Your saved plans will show up here'

  return (
    <div className="tc-wrap" style={{ maxWidth: 880 }}>
      <div className="tc-pagehead">
        <div>
          <h1>My trips</h1>
          <p>{subtitle}</p>
        </div>
        {hasList && (
          <ButtonLink to="/" variant="primary">
            <Plus className="tc-icon" aria-hidden />
            New trip
          </ButtonLink>
        )}
      </div>

      {result && (
        <Notice tone={result.tone} className="mb-3">
          {result.text}
        </Notice>
      )}

      {isLoading && (
        <div className="tc-triplist" role="status" aria-label="Loading your trips">
          {[1, 2, 3].map((k) => (
            <div key={k} className="tc-skelrow">
              <Skeleton style={{ width: 72, height: 72, borderRadius: 12 }} />
              <div className="grid gap-2">
                <Skeleton style={{ height: 16, width: '40%' }} />
                <Skeleton style={{ height: 12, width: '65%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && !trips && (
        <Notice
          tone="error"
          title="We couldn't load your trips"
          actions={
            <button
              type="button"
              className="tc-btn tc-btn--secondary tc-btn--sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`tc-icon tc-icon-sm ${isFetching ? 'tc-spin' : ''}`} aria-hidden />
              Try again
            </button>
          }
        >
          Check your connection and try again.
        </Notice>
      )}

      {hasList && (
        <ul className="tc-triplist m-0 list-none p-0">
          {trips.map((t) => (
            <li key={t.id}>
              <TripListItem
                trip={t}
                confirming={confirmId === t.id}
                onAsk={() => {
                  setConfirmId(t.id)
                  setResult(null)
                }}
                onCancel={() => setConfirmId(null)}
                onDelete={() => remove(t)}
              />
            </li>
          ))}
        </ul>
      )}

      {trips && trips.length === 0 && (
        <EmptyState
          title="No trips yet"
          text="Tell us where and when you're going, and your day-by-day plan will be saved here."
          action={
            <ButtonLink to="/" variant="primary">
              <Sparkles className="tc-icon" aria-hidden />
              Plan your first trip
            </ButtonLink>
          }
        />
      )}
    </div>
  )
}
