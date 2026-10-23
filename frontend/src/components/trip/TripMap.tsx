import 'leaflet/dist/leaflet.css'
import { latLngBounds } from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { slotColors, slotLabels } from '../../lib/categories'
import { SLOTS, type Activity, type Day } from '../../types/api'

type Point = { activity: Activity; dayNumber: number; lat: number; lng: number }

function toPoints(days: Day[]): Point[] {
  return days.flatMap((day) =>
    day.activities
      .filter((a) => typeof a.lat === 'number' && typeof a.lng === 'number')
      .map((a) => ({ activity: a, dayNumber: day.dayNumber, lat: a.lat as number, lng: a.lng as number })),
  )
}

/** Map of activities with coordinates. Renders nothing when the model returned none. */
export default function TripMap({ days }: { days: Day[] }) {
  const allPoints = useMemo(() => toPoints(days), [days])
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all')
  const points = dayFilter === 'all' ? allPoints : allPoints.filter((p) => p.dayNumber === dayFilter)

  if (allPoints.length === 0) return null
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
      <div className="h-80 sm:h-96">
        <MapContainer center={[allPoints[0].lat, allPoints[0].lng]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />
          {points.map((p, i) => (
            <CircleMarker
              key={`${p.dayNumber}-${p.activity.time}-${i}`}
              center={[p.lat, p.lng]}
              radius={8}
              pathOptions={{ color: '#fff', weight: 2, fillColor: slotColors[p.activity.slot], fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{p.activity.name}</strong>
                <br />
                Day {p.dayNumber} · {p.activity.time}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-4 px-5 py-3 text-xs text-slate-500 sm:px-6">
        {SLOTS.map((slot) => (
          <span key={slot} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: slotColors[slot] }} />
            {slotLabels[slot]}
          </span>
        ))}
        <span className="ml-auto">Locations are approximate</span>
      </div>
    </section>
  )
}

function FitBounds({ points }: { points: Point[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14)
      return
    }
    map.fitBounds(latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [30, 30], maxZoom: 15 })
  }, [map, points])
  return null
}
