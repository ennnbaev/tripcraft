import 'maplibre-gl/dist/maplibre-gl.css'
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type ExpressionSpecification,
  type GeoJSONSource,
} from 'maplibre-gl'
// MapLibre builds its worker URL at runtime, which Vite can't see; bundle the worker explicitly
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import type { Feature, LineString } from 'geojson'
import { MapPin } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { categoryStyle, cssColor } from '../../lib/category'
import type { Activity } from '../../types/api'

setWorkerUrl(maplibreWorkerUrl)

// OpenFreeMap vector styles (free, no key): the counterparts of CARTO Positron / Dark Matter in the design
const STYLES = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

// Prefer English names over local scripts (e.g. Georgian), fall back to the local name
const ENGLISH_LABEL: ExpressionSpecification = ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']]

const PIN_PATH = 'M17 1C8.2 1 1 8 1 16.6 1 28 17 41 17 41s16-13 16-24.4C33 8 25.8 1 17 1z'

export type MapPoint = { n: number; activity: Activity; lat: number; lng: number }

type Props = {
  /** located stops of the selected day, in stop order */
  points: MapPoint[]
  /** where to look when the day has no located stops (e.g. the other days' stops) */
  fallback: { lat: number; lng: number }[]
  selected: number | null
  onPick: (n: number) => void
  head: string
  /** refit the view when this changes (another day, or the same day regenerated) */
  fitKey: string
  /** the place panel covers the right side of the map on desktop */
  panelOpen?: boolean
  /** overlays rendered on top of the map (selected-stop card, place details) */
  children?: ReactNode
}

const currentTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

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

function routeData(points: MapPoint[]): Feature<LineString> {
  const ordered = [...points].sort((a, b) => a.activity.time.localeCompare(b.activity.time) || a.n - b.n)
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: ordered.map((p) => [p.lng, p.lat]) },
  }
}

function addRoute(map: MapLibreMap, points: MapPoint[]) {
  if (map.getSource('route')) return
  map.addSource('route', { type: 'geojson', data: routeData(points) })
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    // near-zero dashes with round caps draw the dotted line from the design
    paint: { 'line-color': cssColor('var(--mint)'), 'line-width': 3, 'line-dasharray': [0.1, 2.4] },
  })
}

function pinElement(p: MapPoint, onPick: (n: number) => void) {
  const wrap = document.createElement('div')
  wrap.style.width = '0'
  wrap.style.height = '0'
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = `tc-pin tc-fg--${categoryStyle(p.activity.category).slug}`
  btn.setAttribute('aria-label', `${p.n}. ${p.activity.name}`)
  btn.setAttribute('aria-pressed', 'false')
  btn.innerHTML = `<svg viewBox="0 0 34 42" aria-hidden="true"><path d="${PIN_PATH}"></path></svg><b>${p.n}</b>`
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    onPick(p.n)
  })
  wrap.append(btn)
  return wrap
}

/** MapLibre map of one day: numbered teardrop pins in category colours and a dotted route in time order. */
export default function TripMap({ points, fallback, selected, onPick, head, fitKey, panelOpen, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Map<number, Marker>>(new Map())
  // latest values for map callbacks created once
  const pointsRef = useRef(points)
  const onPickRef = useRef(onPick)
  useEffect(() => {
    pointsRef.current = points
    onPickRef.current = onPick
  })

  // create the map once
  useEffect(() => {
    if (!containerRef.current) return
    const start = pointsRef.current[0] ?? fallback[0]
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLES[currentTheme()],
      center: start ? [start.lng, start.lat] : [0, 20],
      zoom: start ? 13 : 1.5,
      cooperativeGestures: true, // page scroll stays page scroll; Ctrl/⌘ + scroll zooms the map
      attributionControl: { compact: true },
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    // runs on the first load and after every theme switch (setStyle drops custom layers)
    map.on('style.load', () => {
      applyEnglishLabels(map)
      addRoute(map, pointsRef.current)
    })
    // the compact attribution starts expanded and would cover the stop card; keep it as the (i) button
    map.once('load', () =>
      map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show'),
    )
    mapRef.current = map

    // follow the app theme: html[data-theme] is the source of truth
    let theme = currentTheme()
    const observer = new MutationObserver(() => {
      const next = currentTheme()
      if (next === theme) return
      theme = next
      map.setStyle(STYLES[next])
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const markers = markersRef.current
    return () => {
      observer.disconnect()
      markers.forEach((m) => m.remove())
      markers.clear()
      map.remove()
      mapRef.current = null
    }
    // fallback only matters for the initial view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // pins and route for the current day
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const markers = markersRef.current
    markers.forEach((m) => m.remove())
    markers.clear()
    for (const p of points) {
      const marker = new Marker({ element: pinElement(p, (n) => onPickRef.current(n)) }).setLngLat([p.lng, p.lat]).addTo(map)
      markers.set(p.n, marker)
    }
    const source = map.getSource('route') as GeoJSONSource | undefined
    source?.setData(routeData(points))
  }, [points])

  // fit the view when the day changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const targets = points.length ? points : fallback
    if (targets.length === 0) return
    // room for the head chip, the stop card and the pin height above its point; tighter on the 300px phone map
    const small = map.getContainer().clientHeight < 400
    const padding = small ? { top: 96, bottom: 100, left: 28, right: 48 } : { top: 104, bottom: 136, left: 48, right: 64 }
    if (targets.length === 1) {
      map.easeTo({ center: [targets[0].lng, targets[0].lat], zoom: 14, duration: 500 })
      return
    }
    const bounds = new LngLatBounds()
    targets.forEach((p) => bounds.extend([p.lng, p.lat]))
    map.fitBounds(bounds, { padding, maxZoom: 15, duration: 600 })
    // refit when the day (or its stops) change, not on every new points array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])

  // highlight the selected pin
  useEffect(() => {
    markersRef.current.forEach((marker, n) => {
      const el = marker.getElement()
      const on = n === selected
      el.querySelector('button')?.setAttribute('aria-pressed', String(on))
      el.style.zIndex = on ? '2' : '1'
    })
  }, [selected, points])

  // keep the selected pin visible next to the place panel (desktop panel is 380px wide)
  useEffect(() => {
    const map = mapRef.current
    const p = points.find((x) => x.n === selected)
    if (!map || !panelOpen || !p || window.innerWidth <= 900) return
    const panel = Math.min(380, map.getContainer().clientWidth)
    if (map.project([p.lng, p.lat]).x < map.getContainer().clientWidth - panel - 32) return
    map.easeTo({ center: [p.lng, p.lat], offset: [-panel / 2, 0], duration: 400 })
  }, [selected, panelOpen, points])

  return (
    <div className="tc-map">
      {/* MapLibre makes its container position: relative, so the absolute layer is a separate wrapper */}
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <div className="tc-map__head">
        <MapPin className="tc-icon" aria-hidden />
        {head}
      </div>
      {children}
    </div>
  )
}
