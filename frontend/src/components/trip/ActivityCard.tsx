import { Clock } from 'lucide-react'
import { costParts, formatDuration } from '../../lib/format'
import type { Activity } from '../../types/api'
import PlacePhoto from '../place/PlacePhoto'
import { hasLocation } from '../place/links'
import CategoryBadge from '../ui/CategoryBadge'

type Props = {
  activity: Activity
  n: number
  destination: string
  currency: string
  selected: boolean
  onSelect: () => void
}

/** One stop of the day. Selecting it highlights its pin on the map (and the pin selects the card). */
export default function ActivityCard({ activity: a, n, destination, currency, selected, onSelect }: Props) {
  const cost = costParts(a.estimatedCost, a.estimatedCostUsd, currency)
  return (
    <button type="button" className="tc-activity" aria-pressed={selected} onClick={onSelect} data-stop={n}>
      <PlacePhoto activity={a} destination={destination} n={n} />
      <span className="tc-activity__body">
        <span className="tc-activity__meta">
          <span className="tc-activity__time">{a.time}</span>
          <span>
            <Clock className="tc-icon" aria-hidden />
            {formatDuration(a.durationMinutes)}
          </span>
          {!hasLocation(a) && <span>No map location</span>}
        </span>
        <span className="tc-activity__name">{a.name}</span>
        <span className="tc-activity__desc">{a.description}</span>
        <span className="tc-activity__foot">
          <CategoryBadge category={a.category} />
          <span className={`tc-cost ${cost.free ? 'tc-cost--free' : ''}`}>
            {cost.free ? 'Free' : cost.local}
            {!cost.free && <small>{cost.usd}</small>}
          </span>
        </span>
      </span>
    </button>
  )
}
