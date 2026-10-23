import { formatMoney, formatUsd } from '../../lib/format'
import type { Itinerary } from '../../types/api'

export default function TripSummaryCard({ itinerary }: { itinerary: Itinerary }) {
  return (
    <section className="card p-5 sm:p-6">
      <p className="text-sm font-medium text-slate-500">Estimated total</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {formatMoney(itinerary.totalEstimatedCost, itinerary.currency)}
      </p>
      <p className="text-sm text-slate-500">~{formatUsd(itinerary.totalEstimatedCostUsd)}</p>

      {itinerary.tips.length > 0 && (
        <>
          <h2 className="mt-6 text-sm font-semibold text-slate-900">Practical tips</h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {itinerary.tips.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-sky-600">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Prices and details are approximate, check before you travel.
      </p>
    </section>
  )
}
