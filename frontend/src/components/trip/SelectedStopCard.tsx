import { ChevronRight, ExternalLink } from 'lucide-react'
import { costParts, formatDuration } from '../../lib/format'
import type { Activity } from '../../types/api'
import { hasLocation, osmUrl } from '../place/links'
import PlacePhoto from '../place/PlacePhoto'

type Props = { activity: Activity; n: number; destination: string; currency: string; onOpen: () => void }

/** Card at the bottom of the map for the selected stop; opens the place details. */
export default function SelectedStopCard({ activity: a, n, destination, currency, onOpen }: Props) {
  const cost = costParts(a.estimatedCost, a.estimatedCostUsd, currency)
  return (
    <div className="tc-map__card">
      <PlacePhoto activity={a} destination={destination} />
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 cursor-pointer rounded-input text-left"
        aria-label={`Show details for ${a.name}`}
      >
        <h3 className="flex items-center gap-1">
          <span className="truncate">
            {n}. {a.name}
          </span>
          <ChevronRight size={16} className="flex-none text-ink-muted" aria-hidden />
        </h3>
        <p>
          {a.time} · {formatDuration(a.durationMinutes)} · {cost.free ? 'Free' : `${cost.local} ${cost.usd}`}
        </p>
      </button>
      {hasLocation(a) ? (
        <a
          className="tc-btn tc-btn--secondary tc-btn--icon"
          href={osmUrl(a, destination)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in OpenStreetMap"
        >
          <ExternalLink className="tc-icon" aria-hidden />
        </a>
      ) : (
        <span className="max-w-[90px] text-right text-xs leading-4 text-ink-muted">No location for this stop</span>
      )}
    </div>
  )
}
