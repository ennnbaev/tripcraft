import type { Category, Slot } from '../types/api'

type Style = { icon: string; badge: string }

const styles: Record<Category, Style> = {
  FOOD: { icon: '🍽️', badge: 'bg-orange-50 text-orange-700 ring-orange-200' },
  MUSEUMS: { icon: '🏛️', badge: 'bg-violet-50 text-violet-700 ring-violet-200' },
  NATURE: { icon: '🌿', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  NIGHTLIFE: { icon: '🌙', badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  SHOPPING: { icon: '🛍️', badge: 'bg-pink-50 text-pink-700 ring-pink-200' },
  HISTORY: { icon: '🏰', badge: 'bg-amber-50 text-amber-800 ring-amber-200' },
  ART: { icon: '🎨', badge: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200' },
  SPORT: { icon: '⚽', badge: 'bg-lime-50 text-lime-800 ring-lime-200' },
  SIGHTSEEING: { icon: '📸', badge: 'bg-sky-50 text-sky-700 ring-sky-200' },
  TRANSPORT: { icon: '🚌', badge: 'bg-slate-100 text-slate-700 ring-slate-200' },
  OTHER: { icon: '📍', badge: 'bg-slate-100 text-slate-700 ring-slate-200' },
}

export function categoryStyle(category: Category): Style {
  return styles[category] ?? styles.OTHER
}

export const slotLabels: Record<Slot, string> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  EVENING: 'Evening',
}

/** Marker colours on the map, one per slot. */
export const slotColors: Record<Slot, string> = {
  MORNING: '#f59e0b',
  AFTERNOON: '#0284c7',
  EVENING: '#7c3aed',
}
