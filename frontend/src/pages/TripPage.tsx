import { useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useTrip } from '../api/trips'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import DayCard from '../components/trip/DayCard'
import PackingListCard from '../components/trip/PackingListCard'
import TripHeader from '../components/trip/TripHeader'
import TripMap from '../components/trip/TripMap'
import TripSummaryCard from '../components/trip/TripSummaryCard'
import NotFoundPage from './NotFoundPage'

export default function TripPage() {
  const id = Number(useParams().id)
  const { data: trip, isLoading, error, refetch } = useTrip(id)

  if (!Number.isFinite(id)) return <NotFoundPage />
  if (isLoading) return <LoadingState message="Loading trip…" />
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage what="trip" />
  if (error || !trip) return <ErrorState error={error} onRetry={() => refetch()} />

  const itinerary = trip.itinerary
  return (
    <div className="space-y-8">
      <TripHeader trip={trip} />

      {!itinerary || itinerary.days.length === 0 ? (
        <EmptyState title="No itinerary yet" text="This trip has no generated plan." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <TripMap days={itinerary.days} />
            {itinerary.days.map((day) => (
              <DayCard key={day.dayNumber} tripId={trip.id} day={day} currency={itinerary.currency} />
            ))}
          </div>
          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <TripSummaryCard itinerary={itinerary} />
            <PackingListCard tripId={trip.id} packingList={trip.packingList} />
          </aside>
        </div>
      )}
    </div>
  )
}
