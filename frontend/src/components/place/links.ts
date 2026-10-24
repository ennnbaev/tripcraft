import type { Activity } from '../../types/api'

// Deep links into Google Maps / OpenStreetMap; no API key needed

export const hasLocation = (a: Activity) => typeof a.lat === 'number' && typeof a.lng === 'number'

export function googleMapsUrl(a: Activity, destination: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.name}, ${destination}`)}`
}

export function directionsUrl(a: Activity) {
  return `https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`
}

export function osmUrl(a: Activity, destination: string) {
  return hasLocation(a)
    ? `https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=17/${a.lat}/${a.lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${a.name}, ${destination}`)}`
}
