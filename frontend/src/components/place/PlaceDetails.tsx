import { Clock, ExternalLink, MapPinned, Navigation, Wallet, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { costParts, formatDuration } from '../../lib/format'
import { usePlaceInfo } from '../../lib/wiki'
import type { Activity } from '../../types/api'
import CategoryBadge from '../ui/CategoryBadge'
import Skeleton from '../ui/Skeleton'
import { directionsUrl, googleMapsUrl, hasLocation, osmUrl } from './links'
import PlacePhoto from './PlacePhoto'

type Props = {
  activity: Activity
  n: number
  destination: string
  currency: string
  onClose: () => void
}

/**
 * Place details, like tapping a place in Google Maps: a panel over the map on desktop, a bottom sheet on phones.
 * Facts come from the itinerary plus a Wikipedia summary; the buttons deep-link to Google Maps (no API key).
 */
export default function PlaceDetails({ activity: a, n, destination, currency, onClose }: Props) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [entered, setEntered] = useState(false)
  const { data: info, isLoading } = usePlaceInfo(a.name, destination)
  const cost = costParts(a.estimatedCost, a.estimatedCostUsd, currency)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    const frame = requestAnimationFrame(() => setEntered(true))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKey)
      previous?.focus({ preventScroll: true })
    }
  }, [onClose])

  return (
    <>
      {/* phones: scrim behind the bottom sheet */}
      <div
        className={`fixed inset-0 z-40 hidden bg-overlay transition-opacity max-[900px]:block ${entered ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden
      />
      <section
        role="dialog"
        aria-labelledby={titleId}
        className={[
          'z-50 flex flex-col overflow-y-auto bg-surface-raised text-ink shadow-lift transition-transform duration-200 ease-out',
          // desktop: slides over the map from the right
          'absolute inset-y-0 right-0 w-[min(380px,100%)]',
          entered ? 'translate-x-0' : 'translate-x-full',
          // phones: bottom sheet
          'max-[900px]:fixed max-[900px]:inset-x-0 max-[900px]:top-auto max-[900px]:bottom-0 max-[900px]:max-h-[85vh] max-[900px]:w-full max-[900px]:translate-x-0 max-[900px]:rounded-t-panel',
          entered ? 'max-[900px]:translate-y-0' : 'max-[900px]:translate-y-full',
        ].join(' ')}
      >
        <div className="relative">
          <PlacePhoto activity={a} destination={destination} n={n} large className="aspect-video w-full rounded-none" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="tc-btn tc-btn--secondary tc-btn--icon tc-btn--sm absolute top-3 right-3 w-8 shadow-soft"
            aria-label="Close place details"
          >
            <X size={18} aria-hidden />
          </button>
          <span className="absolute top-3 left-1/2 hidden h-1 w-10 -translate-x-1/2 rounded-full bg-on-deep/70 max-[900px]:block" aria-hidden />
        </div>

        <div className="grid gap-4 p-5">
          <div className="grid gap-2">
            <h2 id={titleId} className="font-heading text-xl leading-7 font-semibold">
              {a.name}
            </h2>
            <div>
              <CategoryBadge category={a.category} />
            </div>
          </div>

          <dl className="grid gap-2 text-sm text-ink-muted">
            <div className="flex items-center gap-2">
              <dt className="sr-only">Time</dt>
              <Clock size={16} aria-hidden />
              <dd>
                <span className="font-heading font-semibold text-ink tabular-nums">{a.time}</span> ·{' '}
                {formatDuration(a.durationMinutes)}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="sr-only">Estimated cost</dt>
              <Wallet size={16} aria-hidden />
              <dd className={`tc-cost ${cost.free ? 'tc-cost--free' : ''}`}>
                {cost.free ? 'Free' : cost.local}
                {!cost.free && <small>{cost.usd}</small>}
              </dd>
            </div>
            {!hasLocation(a) && (
              <div className="flex items-center gap-2">
                <dt className="sr-only">Location</dt>
                <MapPinned size={16} aria-hidden />
                <dd>No map location for this stop</dd>
              </div>
            )}
          </dl>

          <p className="text-[15px] leading-[22px]">{a.description}</p>

          {isLoading ? (
            <div className="grid gap-2" aria-label="Loading place facts">
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-10/12" />
              <Skeleton className="h-3 w-8/12" />
            </div>
          ) : (
            info && (
              <div className="grid gap-1.5 rounded-input bg-surface-sunken p-3">
                <span className="tc-kicker">About {info.title}</span>
                <p className="line-clamp-6 text-sm leading-5 text-ink-muted">{info.extract}</p>
                <a className="tc-link" href={info.url} target="_blank" rel="noopener noreferrer">
                  Read on Wikipedia <ExternalLink size={14} aria-hidden />
                </a>
              </div>
            )
          )}

          <div className="grid gap-2">
            <a className="tc-btn tc-btn--primary tc-btn--block" href={googleMapsUrl(a, destination)} target="_blank" rel="noopener noreferrer">
              <MapPinned size={18} aria-hidden />
              Open in Google Maps
            </a>
            {hasLocation(a) && (
              <a className="tc-btn tc-btn--secondary tc-btn--block" href={directionsUrl(a)} target="_blank" rel="noopener noreferrer">
                <Navigation size={18} aria-hidden />
                Directions
              </a>
            )}
            <a className="tc-btn tc-btn--ghost tc-btn--block" href={osmUrl(a, destination)} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={18} aria-hidden />
              Open in OpenStreetMap
            </a>
          </div>
          <p className="text-xs leading-4 text-ink-muted">
            Ratings, opening hours and reviews open in Google Maps. Times and prices here are estimates from your plan.
          </p>
        </div>
      </section>
    </>
  )
}
