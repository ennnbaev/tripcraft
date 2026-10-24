import {
  Bike,
  Bus,
  Camera,
  Castle,
  Ellipsis,
  Landmark,
  Moon,
  Mountain,
  Palette,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import type { Category, Slot } from '../types/api'

export type CategoryStyle = {
  label: string
  icon: LucideIcon
  /** token suffix: cat-<slug>, tc-cat--<slug>, tc-bg--<slug>, tc-fg--<slug> */
  slug: string
  /** CSS colour values that follow the theme */
  color: string
  tint: string
  ink: string
  /** light category colours need dark icons on top (tc-photo--light) */
  light: boolean
}

const defs: Record<Category, [label: string, icon: LucideIcon, light?: boolean]> = {
  FOOD: ['Food', Utensils],
  MUSEUMS: ['Museums', Landmark],
  NATURE: ['Nature', Mountain, true],
  NIGHTLIFE: ['Nightlife', Moon],
  SHOPPING: ['Shopping', ShoppingBag],
  HISTORY: ['History', Castle, true],
  ART: ['Art', Palette],
  SPORT: ['Sport', Bike],
  SIGHTSEEING: ['Sightseeing', Camera],
  TRANSPORT: ['Transport', Bus],
  OTHER: ['Other', Ellipsis],
}

/** The single source for category colours and icons: badges, pins, chips and photo fallbacks build on it. */
export function categoryStyle(category: Category): CategoryStyle {
  const [label, icon, light = false] = defs[category] ?? defs.OTHER
  const slug = (defs[category] ? category : 'OTHER').toLowerCase()
  return {
    label,
    icon,
    slug,
    color: `var(--cat-${slug})`,
    tint: `var(--cat-${slug}-tint)`,
    ink: `var(--cat-${slug}-ink)`,
    light,
  }
}

export const slotStyle: Record<Slot, { label: string; slug: string; color: string }> = {
  MORNING: { label: 'Morning', slug: 'morning', color: 'var(--slot-morning)' },
  AFTERNOON: { label: 'Afternoon', slug: 'afternoon', color: 'var(--slot-afternoon)' },
  EVENING: { label: 'Evening', slug: 'evening', color: 'var(--slot-evening)' },
}

/** Resolves a CSS variable to a concrete colour, for canvas/WebGL code (the map) that can't use var(). */
export function cssColor(value: string): string {
  const name = value.match(/var\((--[^)]+)\)/)?.[1]
  if (!name) return value
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return resolved.startsWith('var(') ? cssColor(resolved) : resolved
}
