import { useState } from 'react'
import { formatDateSpan } from '../../lib/format'
import type { Stats } from '../../types/api'
import { niceAxisMax } from './statsFormat'

type DayPoint = Stats['byDay'][number]

const weekdayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })
const dayMonthFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const longFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
const asDate = (iso: string) => new Date(`${iso}T00:00:00`)

/** 14 stacked bars (successful + errors) with a tooltip on hover, tap or focus. */
export default function RequestsChart({ days }: { days: DayPoint[] }) {
  const [selected, setSelected] = useState(days.length - 1)
  const max = niceAxisMax(Math.max(0, ...days.map((d) => d.requests)))
  const ticks = Array.from({ length: 6 }, (_, i) => (max / 5) * (5 - i))
  const last = days.length - 1

  return (
    <section className="tc-panel" style={{ gridColumn: 'span 8' }} aria-labelledby="byday-title">
      <div className="tc-panel__head">
        <div>
          <h2 id="byday-title">Requests by day</h2>
          <p>
            {days.length > 0 && `${formatDateSpan(days[0].date, days[last].date)} · `}tap a bar for details
          </p>
        </div>
        <div className="tc-legend">
          <span>
            <LegendDot color="var(--mint)" />
            Successful
          </span>
          <span>
            <LegendDot color="var(--danger)" />
            Errors
          </span>
        </div>
      </div>
      <div className="tc-chart">
        <div className="tc-chart__y" aria-hidden>
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="tc-chart__plot">
          <div className="tc-chart__grid" aria-hidden>
            {ticks.map((t) => (
              <i key={t} />
            ))}
          </div>
          {days.map((d, i) => {
            const date = asDate(d.date)
            const ok = d.requests - d.errors
            const isSel = selected === i
            // tooltip sits just above the bar and stays inside the plot at both edges
            const barTop = `calc(${(100 * d.requests) / max}% + 8px)`
            const x = i < 2 ? { left: 0, transform: 'none' } : i > last - 2 ? { right: 0, transform: 'none' } : { left: '50%', transform: 'translateX(-50%)' }
            const tipPos = { top: 'auto', bottom: barTop, ...x }
            return (
              <button
                key={d.date}
                type="button"
                className="tc-chart__col"
                aria-pressed={isSel}
                aria-label={`${longFmt.format(date)}: ${d.requests} requests, ${d.errors} errors`}
                onClick={() => setSelected(i)}
                onMouseEnter={() => setSelected(i)}
                onFocus={() => setSelected(i)}
              >
                {isSel && (
                  <span className="tc-chart__tip" style={tipPos}>
                    <b>
                      {weekdayFmt.format(date)} {dayMonthFmt.format(date)}
                    </b>
                    {d.requests} {d.requests === 1 ? 'request' : 'requests'} · {d.errors} {d.errors === 1 ? 'error' : 'errors'}
                  </span>
                )}
                {d.errors > 0 && <span className="tc-chart__err" style={{ height: `${(100 * d.errors) / max}%` }} />}
                {ok > 0 && <span className="tc-chart__ok" style={{ height: `${(100 * ok) / max}%` }} />}
              </button>
            )
          })}
        </div>
        <div className="tc-chart__x" aria-hidden>
          {days.map((d, i) => (
            <span key={d.date} className={i % 2 === 1 && i !== last ? 'tc-xl-odd' : ''}>
              {asDate(d.date).getDate()}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function LegendDot({ color }: { color: string }) {
  return <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden />
}
