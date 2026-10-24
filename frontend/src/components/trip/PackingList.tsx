import { Luggage, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ApiError, errorMessage } from '../../api/client'
import { useGeneratePackingList } from '../../api/trips'
import { plural } from '../../lib/format'
import { cityOf } from '../../lib/wiki'
import type { TripResponse } from '../../types/api'
import Button from '../ui/Button'
import Notice from '../ui/Notice'
import Skeleton from '../ui/Skeleton'

const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long' })

// ticked items live in the browser only; the list itself is stored on the trip
const storageKey = (tripId: number) => `tc-pack:${tripId}`

function readChecked(tripId: number): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKey(tripId)) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function errorCopy(error: unknown) {
  if (error instanceof ApiError && error.status === 429) {
    return { title: 'The free AI limit is reached', body: 'Please try again in a minute.' }
  }
  return { title: 'We couldn’t make the packing list', body: errorMessage(error) }
}

export default function PackingList({ trip }: { trip: TripResponse }) {
  const generate = useGeneratePackingList(trip.id)
  const [checked, setChecked] = useState(() => readChecked(trip.id))
  const list = trip.packingList

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(trip.id), JSON.stringify([...checked]))
    } catch {
      // storage blocked: ticks just aren't remembered
    }
  }, [trip.id, checked])

  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const err = generate.isError ? errorCopy(generate.error) : null
  const month = monthFmt.format(new Date(`${trip.startDate}T00:00:00`))

  return (
    <section className="tc-packwrap" aria-labelledby="pack-title">
      <div className="tc-packhead">
        <div>
          <h2 id="pack-title">
            <Luggage className="tc-icon" style={{ width: 22, height: 22 }} aria-hidden />
            Packing list
          </h2>
          <p>Based on your dates, the weather and the places in your plan.</p>
        </div>
        {list && !generate.isPending && (
          <Button variant="ai" size="sm" onClick={() => generate.mutate()}>
            <RefreshCw className="tc-icon tc-icon-sm" aria-hidden />
            Regenerate list
          </Button>
        )}
      </div>

      {err && (
        <Notice tone="error" title={err.title} className="mb-4">
          {err.body}
        </Notice>
      )}

      {generate.isPending ? (
        <div className="tc-pack" role="status" aria-label="Generating packing list">
          {[1, 2, 3, 4].map((k) => (
            <section key={k} className="grid gap-3">
              <Skeleton style={{ height: 16, width: '50%' }} />
              <Skeleton style={{ height: 12, width: '85%' }} />
              <Skeleton style={{ height: 12, width: '70%' }} />
              <Skeleton style={{ height: 12, width: '78%' }} />
            </section>
          ))}
        </div>
      ) : list && list.categories.length > 0 ? (
        <div className="tc-pack">
          {list.categories.map((c) => (
            <section key={c.name}>
              <h4>
                {c.name}
                <span>{plural(c.items.length, 'item')}</span>
              </h4>
              <ul>
                {c.items.map((it) => {
                  const key = `${c.name}|${it.name}`
                  return (
                    <li key={key}>
                      <label className="tc-checkrow">
                        <input type="checkbox" checked={checked.has(key)} onChange={() => toggle(key)} />
                        <span>
                          {it.name}
                          {it.note && <small>{it.note}</small>}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="tc-packempty">
          <div className="tc-packempty__ic">
            <Luggage className="tc-icon" aria-hidden />
          </div>
          <p>
            <b>No packing list yet</b>
            We can suggest what to bring for {cityOf(trip.destination)} in {month}, grouped by category.
          </p>
          <Button variant="ai-solid" onClick={() => generate.mutate()}>
            <Sparkles className="tc-icon" aria-hidden />
            Generate packing list
          </Button>
        </div>
      )}
    </section>
  )
}
