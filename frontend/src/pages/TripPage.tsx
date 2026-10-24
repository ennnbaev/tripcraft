import { MapPinOff, Trash2 } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../api/client'
import { useDeleteTrip, useRegenerateDay, useTrip } from '../api/trips'
import type { MapPoint } from '../components/map/TripMap'
import PlaceDetails from '../components/place/PlaceDetails'
import { hasLocation } from '../components/place/links'
import BudgetSummary from '../components/trip/BudgetSummary'
import DayCard from '../components/trip/DayCard'
import DayTabs from '../components/trip/DayTabs'
import PackingList from '../components/trip/PackingList'
import SelectedStopCard from '../components/trip/SelectedStopCard'
import TipsCard from '../components/trip/TipsCard'
import TripBand from '../components/trip/TripBand'
import Button, { ButtonLink } from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Notice from '../components/ui/Notice'
import Skeleton from '../components/ui/Skeleton'
import { plural } from '../lib/format'
import { cityOf } from '../lib/wiki'
import type { TripResponse } from '../types/api'

// MapLibre is heavy, so the map loads in its own chunk
const TripMap = lazy(() => import('../components/map/TripMap'))

const PANEL_ID = 'day-panel'

export default function TripPage() {
  const id = Number(useParams().id)
  const { data: trip, isLoading, error, refetch } = useTrip(id)

  if (!Number.isFinite(id) || (error instanceof ApiError && error.status === 404)) {
    return (
      <div className="tc-wrap">
        <EmptyState
          title="We couldn't find this trip"
          text="It may have been deleted, or the link is wrong."
          action={<ButtonLink to="/trips">Back to My trips</ButtonLink>}
        />
      </div>
    )
  }
  if (isLoading) return <TripSkeleton />
  if (error || !trip) {
    return (
      <div className="tc-wrap">
        <Notice
          tone="error"
          title="We couldn't load this trip"
          actions={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          }
        >
          {errorMessage(error)}
        </Notice>
      </div>
    )
  }
  // keyed so per-trip UI state (selected day, feedback, ticks) resets when switching trips
  return <TripView key={trip.id} trip={trip} />
}

function TripView({ trip }: { trip: TripResponse }) {
  const navigate = useNavigate()
  const itinerary = trip.itinerary
  const days = useMemo(() => itinerary?.days ?? [], [itinerary])

  const [dayNumber, setDayNumber] = useState(() => days[0]?.dayNumber ?? 1)
  const [stopByDay, setStopByDay] = useState<Record<number, number>>({})
  const [placeOpen, setPlaceOpen] = useState(false)
  const [feedbackByDay, setFeedbackByDay] = useState<Record<number, string>>({})
  const [ringDay, setRingDay] = useState<number | null>(null)
  const [updatedDay, setUpdatedDay] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const ringTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(ringTimer.current), [])

  const regenerate = useRegenerateDay(trip.id)
  const del = useDeleteTrip()

  const day = days.find((d) => d.dayNumber === dayNumber) ?? days[0]
  const stop = day ? Math.min(stopByDay[day.dayNumber] ?? 1, day.activities.length) : 1

  const points: MapPoint[] = useMemo(
    () =>
      day
        ? day.activities.flatMap((activity, i) =>
            hasLocation(activity) ? [{ n: i + 1, activity, lat: activity.lat as number, lng: activity.lng as number }] : [],
          )
        : [],
    [day],
  )
  const allLocated = useMemo(
    () => days.flatMap((d) => d.activities.filter(hasLocation).map((a) => ({ lat: a.lat as number, lng: a.lng as number }))),
    [days],
  )

  const dayKey = day?.dayNumber
  const selectStop = useCallback(
    (n: number) => {
      if (dayKey != null) setStopByDay((prev) => ({ ...prev, [dayKey]: n }))
    },
    [dayKey],
  )
  // a pin click selects the stop, brings its card into view and opens the place details
  const pickFromMap = useCallback(
    (n: number) => {
      selectStop(n)
      setPlaceOpen(true)
      document.querySelector(`[data-stop="${n}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    },
    [selectStop],
  )
  const closePlace = useCallback(() => setPlaceOpen(false), [])

  const selectDay = (n: number) => {
    setDayNumber(n)
    setPlaceOpen(false)
  }

  if (!itinerary || !day) {
    return (
      <>
        <TripBand trip={trip} dayCount={0} updatedJustNow={false} onDelete={() => setConfirmDelete(true)} />
        <div className="tc-wrap">
          <EmptyState title="No itinerary yet" text="This trip has no generated plan." />
        </div>
      </>
    )
  }

  const regenDay = regenerate.variables?.dayNumber
  const busy = regenerate.isPending && regenDay === day.dayNumber
  const runRegenerate = () => {
    const target = day.dayNumber
    setUpdatedDay(null)
    regenerate.mutate(
      { dayNumber: target, feedback: (feedbackByDay[target] ?? '').trim() },
      {
        onSuccess: () => {
          setFeedbackByDay((prev) => ({ ...prev, [target]: '' }))
          setStopByDay((prev) => ({ ...prev, [target]: 1 }))
          setUpdatedDay(target)
          setRingDay(target)
          clearTimeout(ringTimer.current)
          ringTimer.current = setTimeout(() => setRingDay(null), 1100)
        },
      },
    )
  }

  const selectedActivity = day.activities[stop - 1]
  const tripTitle = `${plural(days.length, 'day')} in ${cityOf(trip.destination)}`

  return (
    <>
      <TripBand
        trip={trip}
        dayCount={days.length}
        updatedJustNow={updatedDay != null}
        onDelete={() => setConfirmDelete(true)}
      />

      <div className="tc-wrap" style={{ paddingTop: 24 }}>
        {del.isError && (
          <Notice tone="error" title="We couldn't delete this trip" className="mb-4">
            {errorMessage(del.error)}
          </Notice>
        )}

        <DayTabs days={days} selected={day.dayNumber} onSelect={selectDay} panelId={PANEL_ID} />

        <div className="tc-triplayout">
          <div id={PANEL_ID} role="tabpanel" aria-label={`Day ${day.dayNumber}`} className="grid min-w-0 gap-4">
            {updatedDay === day.dayNumber && (
              <Notice tone="success" title={`Day ${day.dayNumber} is updated`}>
                Your other days didn't change, and the total is recalculated.
              </Notice>
            )}
            <DayCard
              day={day}
              destination={trip.destination}
              currency={itinerary.currency}
              selectedStop={stop}
              onSelectStop={selectStop}
              ring={ringDay === day.dayNumber}
              regen={{
                feedback: feedbackByDay[day.dayNumber] ?? '',
                onFeedback: (v) => setFeedbackByDay((prev) => ({ ...prev, [day.dayNumber]: v })),
                onRegenerate: runRegenerate,
                busy,
                blocked: regenerate.isPending && !busy,
                error: regenerate.isError && regenDay === day.dayNumber ? regenerate.error : null,
              }}
            />
          </div>

          <aside className="tc-mapcol" aria-label="Map of the day">
            {allLocated.length === 0 ? (
              <div className="tc-map grid place-content-center justify-items-center gap-2 p-6 text-center text-ink-muted">
                <MapPinOff size={28} aria-hidden />
                <p className="text-sm">The AI didn't return map locations for this trip.</p>
              </div>
            ) : (
              <Suspense fallback={<Skeleton className="tc-map" />}>
                <TripMap
                  points={points}
                  fallback={allLocated}
                  selected={stop}
                  onPick={pickFromMap}
                  fitKey={`${day.dayNumber}:${day.activities.map((a) => a.name).join('|')}`}
                  panelOpen={placeOpen}
                  head={`Day ${day.dayNumber} · ${points.length} of ${plural(day.activities.length, 'stop')} on the map`}
                >
                  {selectedActivity && (
                    <SelectedStopCard
                      activity={selectedActivity}
                      n={stop}
                      destination={trip.destination}
                      currency={itinerary.currency}
                      onOpen={() => setPlaceOpen(true)}
                    />
                  )}
                  {placeOpen && selectedActivity && (
                    <PlaceDetails
                      activity={selectedActivity}
                      n={stop}
                      destination={trip.destination}
                      currency={itinerary.currency}
                      onClose={closePlace}
                    />
                  )}
                </TripMap>
              </Suspense>
            )}
          </aside>
        </div>

        <div className="tc-overview">
          <BudgetSummary itinerary={itinerary} travelers={trip.travelers} />
          {itinerary.tips.length > 0 && <TipsCard tips={itinerary.tips} />}
          <PackingList trip={trip} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this trip?"
        confirmLabel="Delete trip"
        cancelLabel="Keep trip"
        confirmIcon={<Trash2 className="tc-icon" aria-hidden />}
        busy={del.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          del.mutate(trip.id, {
            onSuccess: () => navigate('/trips', { replace: true }),
            onError: () => setConfirmDelete(false),
          })
        }
      >
        {tripTitle} will be removed from My trips. This can't be undone.
      </ConfirmDialog>
    </>
  )
}

function TripSkeleton() {
  return (
    <div role="status" aria-label="Loading trip">
      <div className="tc-band">
        <div className="tc-band__inner">
          <Skeleton className="h-5 w-24 opacity-40" />
          <Skeleton className="h-10 w-72 max-w-full opacity-40" />
          <Skeleton className="h-4 w-96 max-w-full opacity-40" />
        </div>
      </div>
      <div className="tc-wrap" style={{ paddingTop: 24 }}>
        <div className="tc-daytabs">
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-[60px] w-[104px] flex-none" />
          ))}
        </div>
        <div className="tc-triplayout">
          <div className="grid gap-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="tc-skelcard">
                <Skeleton className="aspect-square" />
                <div className="grid content-start gap-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-11/12" />
                </div>
              </div>
            ))}
          </div>
          <div className="tc-mapcol">
            <Skeleton className="tc-map" />
          </div>
        </div>
      </div>
    </div>
  )
}
