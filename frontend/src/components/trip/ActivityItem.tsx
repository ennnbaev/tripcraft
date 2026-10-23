import { categoryStyle } from '../../lib/categories'
import { formatDuration, formatMoney, formatUsd, label } from '../../lib/format'
import type { Activity } from '../../types/api'

export default function ActivityItem({ activity, currency }: { activity: Activity; currency: string }) {
  const style = categoryStyle(activity.category)
  const free = activity.estimatedCost === 0
  return (
    <li className="flex gap-4">
      <div className="w-12 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-slate-900">{activity.time}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-semibold text-slate-900">{activity.name}</p>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}>
            {style.icon} {label(activity.category)}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
        <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
          <span>⏱ {formatDuration(activity.durationMinutes)}</span>
          <span>
            💰 {free ? 'Free' : `${formatMoney(activity.estimatedCost, currency)} (~${formatUsd(activity.estimatedCostUsd)})`}
          </span>
        </p>
      </div>
    </li>
  )
}
