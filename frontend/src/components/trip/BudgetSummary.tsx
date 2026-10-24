import { Info } from 'lucide-react'
import { categoryStyle } from '../../lib/category'
import { formatLocal, plural } from '../../lib/format'
import type { Category, Itinerary } from '../../types/api'

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

/** Trip total, per-person share, a bar per day and the split by category. */
export default function BudgetSummary({ itinerary, travelers }: { itinerary: Itinerary; travelers: number }) {
  const { currency, days } = itinerary
  const maxDay = Math.max(1, ...days.map((d) => d.dayEstimatedCost))

  const byCategory = new Map<Category, number>()
  for (const d of days) {
    for (const a of d.activities) byCategory.set(a.category, (byCategory.get(a.category) ?? 0) + a.estimatedCost)
  }
  const split = [...byCategory.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category, value]) => ({ ...categoryStyle(category), value }))
  const splitLabel = `Spending by category: ${split.map((c) => `${c.label} ${formatLocal(c.value, currency)}`).join(', ')}`

  return (
    <section className="tc-card tc-budget tc-o-budget" style={{ gridColumn: 'span 6' }} aria-labelledby="budget-title">
      <span className="tc-kicker" id="budget-title">
        Estimated total for {plural(travelers, 'traveler')}
      </span>
      <div className="tc-budget__total">
        <b>{formatLocal(itinerary.totalEstimatedCost, currency)}</b>
        <span>≈ {usd(itinerary.totalEstimatedCostUsd)}</span>
      </div>
      <p className="tc-budget__per">
        {travelers > 1
          ? `About ${formatLocal(itinerary.totalEstimatedCost / travelers, currency)} per person, activities and meals only.`
          : 'Activities and meals only.'}
      </p>
      <div className="tc-bars">
        {days.map((d) => (
          <div key={d.dayNumber} className="tc-bar">
            <span className="font-heading text-sm font-semibold">Day {d.dayNumber}</span>
            <div className="tc-bar__track">
              <div className="tc-bar__fill" style={{ width: `${Math.round((100 * d.dayEstimatedCost) / maxDay)}%` }} />
            </div>
            <span className="tc-bar__val">
              {formatLocal(d.dayEstimatedCost, currency)}
              <small>≈ {usd(d.dayEstimatedCostUsd)}</small>
            </span>
          </div>
        ))}
      </div>
      {split.length > 0 && (
        <div className="grid gap-2">
          <span className="tc-kicker">By category</span>
          <div className="tc-split" role="img" aria-label={splitLabel}>
            {split.map((c) => (
              <span key={c.slug} className={`tc-bg--${c.slug}`} style={{ flex: `${c.value} 1 0` }} />
            ))}
          </div>
          <div className="tc-legend">
            {split.map((c) => (
              <span key={c.slug}>
                <i className={`tc-dot tc-bg--${c.slug}`} aria-hidden />
                {c.label} {formatLocal(c.value, currency)}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="tc-disclaimer">
        <Info className="tc-icon" aria-hidden />
        Prices and details are estimates. Check before you go.
      </p>
    </section>
  )
}
