import { useQuery } from '@tanstack/react-query'

// City autocomplete via Photon (OpenStreetMap geocoder, free, no key, CORS enabled).
// This is a third-party service, so it is called directly instead of through our api() client.
const PHOTON_URL = 'https://photon.komoot.io/api/'

export type Place = {
  name: string
  country: string
  countryCode: string // ISO 3166-1 alpha-2, upper case
  region?: string
}

/** Destinations shown before the user types anything. */
export const POPULAR_PLACES: Place[] = [
  { name: 'Tbilisi', country: 'Georgia', countryCode: 'GE' },
  { name: 'Batumi', country: 'Georgia', countryCode: 'GE' },
  { name: 'Yerevan', country: 'Armenia', countryCode: 'AM' },
  { name: 'Istanbul', country: 'Türkiye', countryCode: 'TR' },
  { name: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE' },
  { name: 'Paris', country: 'France', countryCode: 'FR' },
  { name: 'Rome', country: 'Italy', countryCode: 'IT' },
  { name: 'Barcelona', country: 'Spain', countryCode: 'ES' },
  { name: 'Lisbon', country: 'Portugal', countryCode: 'PT' },
  { name: 'Prague', country: 'Czechia', countryCode: 'CZ' },
  { name: 'Tokyo', country: 'Japan', countryCode: 'JP' },
  { name: 'New York', country: 'United States', countryCode: 'US' },
]

/** "GE" -> 🇬🇪 (regional indicator symbols). */
export function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/[A-Z]/g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
}

export const placeLabel = (p: Place) => `${p.name}, ${p.country}`

type PhotonFeature = {
  properties: { name?: string; country?: string; countrycode?: string; state?: string }
}

async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q: query, limit: '10', lang: 'en' })
  // only cities and towns, otherwise villages with similar names crowd out real destinations
  params.append('osm_tag', 'place:city')
  params.append('osm_tag', 'place:town')
  const res = await fetch(`${PHOTON_URL}?${params}`, { signal })
  if (!res.ok) throw new Error(`Place search failed: ${res.status}`)
  const data = (await res.json()) as { features: PhotonFeature[] }

  const seen = new Set<string>()
  const places: Place[] = []
  for (const { properties: p } of data.features) {
    if (!p.name || !p.country || !p.countrycode) continue
    const place = { name: p.name, country: p.country, countryCode: p.countrycode.toUpperCase(), region: p.state }
    const key = placeLabel(place)
    if (seen.has(key)) continue
    seen.add(key)
    places.push(place)
  }
  return places.slice(0, 6)
}

export function usePlaceSearch(query: string) {
  const q = query.trim()
  return useQuery({
    queryKey: ['places', q.toLowerCase()],
    queryFn: ({ signal }) => searchPlaces(q, signal),
    enabled: q.length >= 2,
    staleTime: 60 * 60 * 1000,
    retry: false,
  })
}
