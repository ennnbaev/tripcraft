import 'maplibre-gl/dist/maplibre-gl.css'
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type ExpressionSpecification,
} from 'maplibre-gl'
// MapLibre builds its worker URL at runtime, which Vite can't see; bundle the worker explicitly
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categoryStyle, slotColors, slotLabels } from '../../lib/categories'
import { SLOTS, type Activity, type Day } from '../../types/api'

setWorkerUrl(maplibreWorkerUrl)

// Vector basemap from OpenFreeMap: free, no API key, OpenStreetMap data
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

// Prefer English names over local scripts (e.g. Georgian), fall back to the local name
const ENGLISH_LABEL: ExpressionSpecification = ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']]

type Point = { activity: Activity; dayNumber: number; order: number; lat: number; lng: number }

function toPoints(days: Day[]): Point[] {
  return days.flatMap((day) =>
    day.activities
      .filter((a) => typeof a.lat === 'number' && typeof a.lng === 'number')
      .map((a, i) => ({ activity: a, dayNumber: day.dayNumber, order: i + 1, lat: a.lat as number, lng: a.lng as number })),
  )
}

function applyEnglishLabels(map: MapLibreMap) {
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol') continue
    const field = map.getLayoutProperty(layer.id, 'text-field')
    // only rewrite place/POI labels, not road shields that show "ref"
    if (field && JSON.stringify(field).includes('name')) {
      map.setLayoutProperty(layer.id, 'text-field', ENGLISH_LABEL)
    }
  }
}

function markerElement(p: Point): HTMLElement {
  const el = document.createElement('div')
  el.className =
    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md'
  el.style.background = slotColors[p.activity.slot]
  el.textContent = String(p.order)
  return el
}

function popupContent(p: Point): HTMLElement {
  const el = document.createElement('div')
  el.className = 'text-sm'
  const title = document.createElement('div')
  title.className = 'font-semibold text-slate-900'
  title.textContent = p.activity.name
  const meta = document.createElement('div')
  meta.className = 'mt-0.5 text-slate-500'
  meta.textContent = `${categoryStyle(p.activity.category).icon} Day ${p.dayNumber} · ${p.activity.time}`
  el.append(title, meta)
  return el
}

/** Map of activities with coordinates. Renders nothing when the model returned none. */
export default function TripMap({ days }: { days: Day[] }) {
  const allPoints = useMemo(() => toPoints(days), [days])
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all')
  const points = useMemo(
    () => (dayFilter === 'all' ? allPoints : allPoints.filter((p) => p.dayNumber === dayFilter)),
    [allPoints, dayFilter],
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const hasPoints = allPoints.length > 0

  useEffect(() => {
    if (!hasPoints || !containerRef.current) return
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: [allPoints[0].lng, allPoints[0].lat],
      zoom: 12,
      cooperativeGestures: true, // page scroll stays page scroll; Ctrl/⌘ + scroll zooms the map
      attributionControl: { compact: true },
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.on('style.load', () => applyEnglishLabels(map))
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // the map is created once per trip; points are synced in the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPoints])

  useEffect(() => {
    const map = mapRef.current
    if (!map || points.length === 0) return
    const markers = points.map((p) =>
      new Marker({ element: markerElement(p) })
        .setLngLat([p.lng, p.lat])
        .setPopup(new Popup({ offset: 16, closeButton: false }).setDOMContent(popupContent(p)))
        .addTo(map),
    )
    if (points.length === 1) {
      map.easeTo({ center: [points[0].lng, points[0].lat], zoom: 14 })
    } else {
      const bounds = new LngLatBounds()
      points.forEach((p) => bounds.extend([p.lng, p.lat]))
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 600 })
    }
    return () => markers.forEach((m) => m.remove())
  }, [points])

  if (!hasPoints) return null
  const daysWithPoints = days.filter((d) => allPoints.some((p) => p.dayNumber === d.dayNumber))

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-slate-900">Map</h2>
        <select
          aria-label="Day on map"
          className="input w-auto py-1.5"
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">All days</option>
          {daysWithPoints.map((d) => (
            <option key={d.dayNumber} value={d.dayNumber}>
              Day {d.dayNumber}
            </option>
          ))}
        </select>
      </div>
      <div ref={containerRef} className="h-80 sm:h-[28rem]" />
      <div className="flex flex-wrap gap-4 px-5 py-3 text-xs text-slate-500 sm:px-6">
        {SLOTS.map((slot) => (
          <span key={slot} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: slotColors[slot] }} />
            {slotLabels[slot]}
          </span>
        ))}
        <span className="ml-auto">Numbers show the order within a day · locations are approximate</span>
      </div>
    </section>
  )
}
