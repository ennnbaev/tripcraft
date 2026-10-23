import { formatShortDate } from '../../lib/format'
import type { Stats } from '../../types/api'

/** Stacked bars per day: successful requests and errors. Plain CSS, no chart library. */
export default function RequestsChart({ data }: { data: Stats['byDay'] }) {
  const max = Math.max(1, ...data.map((d) => d.requests))
  return (
    <div>
      <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Requests per day">
        {data.map((d) => {
          const ok = d.requests - d.errors
          return (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${formatShortDate(d.date)}: ${d.requests} requests, ${d.errors} errors`}>
              <div className="flex flex-col justify-end overflow-hidden rounded-t" style={{ height: `${(d.requests / max) * 100}%` }}>
                {d.errors > 0 && <div className="bg-red-400" style={{ height: `${(d.errors / d.requests) * 100}%` }} />}
                {ok > 0 && <div className="flex-1 bg-sky-500" />}
              </div>
              <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-slate-900 px-1.5 py-0.5 text-xs whitespace-nowrap text-white group-hover:block">
                {d.requests}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1.5 text-[10px] text-slate-400">
        {data.map((d, i) => (
          <span key={d.date} className="flex-1 truncate text-center">
            {i % 2 === 0 || data.length <= 7 ? d.date.slice(5) : ''}
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" /> Successful
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Errors
        </span>
      </div>
    </div>
  )
}
