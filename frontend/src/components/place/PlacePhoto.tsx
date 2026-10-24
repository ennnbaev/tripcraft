import { useState } from 'react'
import { categoryStyle } from '../../lib/category'
import { usePlaceInfo } from '../../lib/wiki'
import type { Activity } from '../../types/api'

type Props = {
  activity: Activity
  destination: string
  /** number disc in the corner (stop order) */
  n?: number
  /** use the larger image (details panel) */
  large?: boolean
  className?: string
}

/**
 * Square photo slot: Wikipedia/Wikimedia photo of the place when we find one,
 * otherwise the solid category colour with its icon. Never blocks rendering.
 */
export default function PlacePhoto({ activity, destination, n, large, className = '' }: Props) {
  const cat = categoryStyle(activity.category)
  const { data: info } = usePlaceInfo(activity.name, destination)
  const [broken, setBroken] = useState<string | null>(null)
  const src = (large ? info?.image : info?.thumbnail) ?? null
  const showImage = src && broken !== src
  const Icon = cat.icon

  return (
    <span
      className={`tc-photo tc-bg--${cat.slug} ${cat.light ? 'tc-photo--light' : ''} ${className}`}
      aria-hidden
    >
      <Icon className="tc-icon" />
      {showImage && (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBroken(src)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* the large photo sits under rounded panel corners, so its number moves inwards */}
      {n != null && <span className={`tc-photo__num ${large ? 'top-4 left-4' : ''}`}>{n}</span>}
    </span>
  )
}
